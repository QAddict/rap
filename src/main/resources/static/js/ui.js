import {addTo, attach, ctrlKey, each, falseTo, isObservable, node, render, set, state, stateModel, to, toggle, transform, trigger, uri, when} from "./mvc.js";
import {a, captionBottom, captionTop, checkbox, div, form, HtmlBuilder, inputText, label, reset, span, submit, table, tbody, td, th, thead, tr} from "./html.js";
import {get} from "./io.js"

export function expander(model, enabled = stateModel(true)) {
    return span()
        .display('inline-block')
        .cursor('pointer')
        .transition('transform .2s ease-in-out')
        .transform(transform(model, to('rotate(90deg)')))
        .color(transform(enabled, falseTo('silver')))
        .add('\u25B6')
        .onClick(when(enabled, toggle(model)))
}

export class Column {
    constructor(name, renderCell) {this.__name = name; this.__hidden = false; if(renderCell) this.renderCell = renderCell; }
    getName() {return this.__name}
    getValue(data) {return data?.[this.getName()]}
    renderHeader(th, columnPosition, table) {return this.getName()}
    renderCell(data, td, rowIndex, table) {return this.getValue(data)}
    hidden() {return this.__hidden}
    hide(value = true) {this.__hidden = value; return this}
    show(value = true) {return this.hide(!value)}
}

export let position = new Column('#', (data, td, index) => index)

export function objectPath(name = '', get = o => o) {
    let c = new Column(name, get)
    return new Proxy(c, {
        get(target, property) {
            return c[property] !== undefined ? c[property] : objectPath(property, o => get(o)?.[property])
        }
    })
}

export let row = objectPath()

function detectSource(model) {
    return transform(model, value => value == null ? []
        : Array.isArray(value) ? value
            : Array.isArray(value.content) ? value.content
                : embeddedSource(value._embedded))
}

function embeddedSource(data) {
    let listEntries = Object.entries(data).filter(([key]) => key.endsWith('List'))
    if(listEntries.length === 1) return listEntries[0][1]
    return []
}

function detectPaging(model) {
    return transform(model, data => data?.page ? {
        ...data.page
    } : null)
}

function detectSearch(model) {
    return transform(model, data => data?._links?.search)
}

export class DataTable extends HtmlBuilder {

    constructor(dataModel, t = table()) {
        super(node(t));
        if(!isObservable(dataModel))
            dataModel = get(uri(dataModel, {}))
        let columnMove = stateModel()
        this.rowCustomizers = []
        this.columnsModel = state([])
        this.columnsModel.observe(trigger(dataModel))
        this.moveEnabled = false
        this.visibleColumnsModel = transform(this.columnsModel, cols => cols.filter(col => !col.hidden()))
        this.add(
            render(detectSearch(dataModel), href => captionTop(searchControls(dataModel.uri, href))),
            thead(tr(each(this.visibleColumnsModel, (column, index) => {
                let header = th()
                if(this.moveEnabled) header
                    .transfer(columnMove, index)
                    .receive(columnMove, from => this.moveColumn(from, index), 'rap-table-header-receiver', 'rap-table-header-drop')
                return header.add(column.renderHeader(header, index, this))
            }))),
            tbody(each(detectSource(dataModel), (item, index) => tr().apply((tr, data) => this.rowCustomizers.forEach(c => c(tr, data)), item).add(each(this.visibleColumnsModel, column => {
                let cell = td()
                return cell.add(column.renderCell(item, cell, index, this))
            })))),
            render(detectPaging(dataModel), page => captionBottom(
                form().onSubmit(event => page.set(parseInt(event.target.page.value) - 1)).add(
                    pageNav('first', set(page, 0)).add('\u226A'),
                    pageNav('previous', set(page, page.number - 1)).add('<'),
                    //span().setClass('paging current-page').add('Page: ', input('page').width(2, 'em').value(transform(result, v => v.numberOfElements > 0 ? v.number + 1 : 0)), ' of ', result.totalPages, ' (rows ', result.pageable.offset.map(v => v + 1), ' - ', functionModel((a, b) => a + b, result.pageable.offset, result.numberOfElements), ' of ', result.totalElements, ')'),
                    pageNav('next', set(page, page.number + 1)).add('>'),
                    pageNav('last', set(page, page.totalPages - 1)).add('\u226B'),
                    //a().setClass('paging reload-page', transform(loading, to(' data-loading'))).add('\u21BB').title('Reload page').onClick(trigger(page))
            )))
        )
    }

    repaint() {
        this.columnsModel.trigger()
        return this
    }

    enableColumnMove() {
        this.moveEnabled = true
        return this.repaint()
    }

    enableColumnFiltering() {
        let vis = state(false)
        this.add(
            captionTop().position('relative').add(
                div().setClass('rap-columns').position('absolute').right('0', '').top('0', '').marginLeft('-0.5', 'em').add(
                    a('⋮').setClass('rap-columns-toggle').onClick(toggle(vis)),
                    div().setClass('rap-columns-visibility').display(vis).position('absolute').textLeft().whiteSpace('nowrap').right(0).add(
                        each(this.columnsModel, column => div().add(
                            checkbox(column.getName()).checked(column.hidden() ? null : 'checked').onChange(() => {column.hide(!column.hidden()); this.columnsModel.trigger()}, true),
                            label(column.getName())
                        ))
                    )
                )
            )
        )
        return this
    }

    withSelection(selectionModel, selectedClass = 'selected') {
        return this.customizeRow((tr, data) => tr.onClick(ctrlKey(addTo(selectionModel, data), set(selectionModel, [data])))
            .addClass(transform(selectionModel, selection => selection.includes(data) ? 'selected' : null)))
    }

    transferItems(slot) {
        return this.customizeRow((tr, data) => tr.transfer(slot, data))
    }
    
    customizeRow(customizer) {
        this.rowCustomizers.push(customizer)
        return this.repaint()
    }

    column(...defs) {
        this.columnsModel.get().push(...defs)
        return this.repaint()
    }

    moveColumn(from, to) {
        let f = this.columnsModel.get().splice(from, 1)
        this.columnsModel.get().splice(to, 0, ...f)
        return this.repaint()
    }

}

export function dataTable(result) {
    return new DataTable(result)
}

function pageNav(which, action, boundaryModel) {
    return a().setClass('rap-paging ' + which + '-page')
        .title('Go to ' + which + ' page')
        //.color(transform(boundaryModel, to('silver')))
        .onClick(action)
}

export function pageControls(page, result, loading) {
    return form().onSubmit(event => page.set(parseInt(event.target.page.value) - 1)).add(
        pageNav('first', set(page, 0), result.first).add('\u226A'),
        pageNav('previous', set(page, transform(result.number, v => v - 1)), result.first).add('<'),
        span().setClass('paging current-page').add('Page: ', input('page').width(2, 'em').value(transform(result, v => v.numberOfElements > 0 ? v.number + 1 : 0)), ' of ', result.totalPages, ' (rows ', result.pageable.offset.map(v => v + 1), ' - ', functionModel((a, b) => a + b, result.pageable.offset, result.numberOfElements), ' of ', result.totalElements, ')'),
        pageNav('next', set(page, transform(result.number, v => v + 1)), result.last).add('>'),
        pageNav('last', set(page, transform(result.totalPages, v => v - 1)), result.last).add('\u226B'),
        a().setClass('paging reload-page', transform(loading, to(' data-loading'))).add('\u21BB').title('Reload page').onClick(trigger(page)),
        //span().setClass('paging load-timer').add(transform(loading, to(' loading ', ' loaded in ')), timer(loading), ' ms.')
    )
}

export function pageTable(pageCall, page = pageCall.input.page) {
    pageCall = state(pageCall)
    return dataTable(pageCall.map(v => v.content), pageCall.pageable.offset)
        .captionTop(pageCall.error)
        .captionBottom(pageControls(page, pageCall, pageCall.loading))
}

export function searchControls(query) {
    return form().flexRow().onSubmit((b, event) => query.set(b.get()[query.getName()].value)).onReset(set(query, '')).add(
        inputText(query.getName()).value(query).auto(),
        submit('Search'),
        reset('Clear')
    )
}

export function searchTable(searchCall, page = searchCall.input.page, query = searchCall.input.query, result = searchCall.output) {
    // This line is currently causing duplicate rest call with intermediate state.
    // query.onChange(() => page.set(0), false, false)
    return dataTable(result.content, result.pageable.offset).add(
        captionTop().setClass('rap-search').textLeft().nowrap().add(searchControls(query)),
        captionTop().setClass('rap-error').textLeft().nowrap().add(searchCall.error),
        captionBottom().setClass('rap-paging').textLeft().nowrap().add(pageControls(page, result, searchCall.state.loading))
    )
}
export function linearizeSimpleTree(items, level = 0) {
    return items.flatMap(item => [{level: level, node: item}, ...(item.expanded && item.children ? linearizeSimpleTree(item.children, level + 1) : [])])
}

export function linearizeSimpleTreeModel(model) {
    return transform(model, linearizeSimpleTree)
}

export function linearizePageableTree(pagedTreeModel) {
    return transform(pagedTreeModel, page => {
        let l = page.content.map(item => null).flatMap(linearizePageableTree)
        if(!page.first) l.unshift(null)
        if(!page.last) l.push(null)
    })
}

export function treeColumn(name, original) {
    return new DataTransformingColumn(name, (data, td, index, table) => {
        td.paddingLeft(data.level, 'em')
        if(data.node.children)
            td.add(expander(attach(data.node).expanded.observeChanges(trigger(original))))
        return " " + data.node.name
    })
}

export function resizeableColumns(leftColumnContent, rightColumnContent, leftWidth = stateModel('49%')) {
    let start = state({start: 0, width: 0})
    return div(
        div(leftColumnContent).width(leftWidth),
        div().setClass('resizer-x').draggable(true).onDragstart((b, e) => start.set({start: e.clientX, width: b.get().previousSibling.clientWidth})).onDrag((b, e) => {
            leftWidth.set((start.get().width + e.clientX - start.get().start) + 'px')
        }),
        div(rightColumnContent).auto()
    ).flexRow()
}
