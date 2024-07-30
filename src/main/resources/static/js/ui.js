import {addTo, attach, ctrlKey, each, falseTo, node, render, restParameter, set, state, stateModel, to, toggle, transform, trigger, when} from "./rap.js";
import {a, captionBottom, captionTop, checkbox, div, form, HtmlBuilder, input, inputText, label, reset, span, submit, table, tbody, td, th, thead, tr} from "./html.js";
import {get, isChannel} from "./io.js"

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
                : value._embedded == null ? []
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
        let columnMove = stateModel()
        this.rowCustomizers = []
        this.columnsModel = state([])
        this.columnsModel.observe(trigger(dataModel))
        this.moveEnabled = false
        this.visibleColumnsModel = transform(this.columnsModel, cols => cols.filter(col => !col.hidden()))
        this.add(
            thead(tr(each(this.visibleColumnsModel, (column, index) => {
                let header = th().resizeHorizontal().overflowHidden()
                if(this.moveEnabled) header
                    .transfer(columnMove, index)
                    .receive(columnMove, from => this.moveColumn(from, index), 'rap-table-header-receiver', 'rap-table-header-drop')
                return header.add(column.renderHeader(header, index, this))
            }))),
            tbody(each(detectSource(dataModel), (item, index) => tr().apply((tr, data) => this.rowCustomizers.forEach(c => c(tr, data)), item).add(each(this.visibleColumnsModel, column => {
                let cell = td()
                return cell.add(column.renderCell(item, cell, index, this))
            })))),
        )
    }

    repaint() {this.columnsModel.trigger(); return this}

    enableColumnMove() {this.moveEnabled = true; return this.repaint()}

    enableColumnFiltering() {
        let vis = state(false)
        this.add(
            captionTop().position('relative').add(
                div().setClass('rap-columns').position('absolute').right('0', '').top('0', '').marginLeft('-0.5', 'em').add(
                    a('⋮').setClass('rap-columns-toggle').onClick(toggle(vis)),
                    div().setClass('rap-columns-visibility').display(vis).position('absolute').textLeft().whiteSpace('nowrap').right(0).add(
                        each(this.columnsModel, column => div().add(
                            checkbox(column.getName()).checked(column.hidden() ? null : 'checked').id(column.getName()).onChange(() => {column.hide(!column.hidden()); this.columnsModel.trigger()}, true),
                            label(column.getName()).set('for', column.getName())
                        ))
                    )
                )
            )
        )
        return this
    }

    withSelection(selectionModel, selectedClass = 'selected') {
        return this.customizeRow((tr, data) => tr.onClick(ctrlKey(addTo(selectionModel, data), set(selectionModel, [data]))).addClass(transform(selectionModel, selection => selection.includes(data) ? selectedClass : null)))
    }

    transferItems(slot) {
        return this.customizeRow((tr, data) => tr.transfer(slot, data))
    }
    
    customizeRow(customizer) {
        this.rowCustomizers.push(customizer)
        return this.repaint()
    }

    columns(...defs) {
        this.columnsModel.get().push(...defs)
        return this.repaint()
    }

    moveColumn(from, to) {
        let f = this.columnsModel.get().splice(from, 1)
        this.columnsModel.get().splice(to, 0, ...f)
        return this.repaint()
    }
}

export function dataTable(dataSource) {
    let ds = typeof dataSource === "string" ? get(dataSource).triggerOnUri() : stateModel(dataSource)
    return isChannel(ds)
        ? new DataTable(ds.output, table(render(detectSearch(ds), link => captionTop(searchControls(restParameter(link.href, ds.uri)))))).add(
            render(detectPaging(ds), page => captionBottom(
                div(form().onSubmit(event => ds.uri.set(parseInt(event.target.page.value) - 1)).add(
                    nav(ds, 'first').add('\u226A'),
                    nav(ds, 'prev').add('<'),
                    span('Page: ', input('page').width(2, 'em').value(page.number), ' of ', page.totalPages, ' (rows ', (page.number * page.size), ' - ', (page.number * page.size), ' of ', page.totalElements, ')').setClass('rap-paging'),
                    nav(ds, 'next').add('>'),
                    nav(ds, 'last').add('\u226B'),
                    //a().setClass('paging reload-page', transform(loading, to(' data-loading'))).add('\u21BB').title('Reload page').onClick(trigger(page))
                ).auto(), form(
                    ...Object.entries(ds.get()._links).filter(([key]) => key.startsWith('size')).map(([key]) => nav(ds, key).add(key.substring(4))),
                )).flexRow()
            ).textLeft())
        )
        : new DataTable(ds)
}

function nav(channel, link) {
    let l = a().setClass('rap-paging ', link + '-page').title('Go to ' + link + ' page')
    if(channel.output.get()._links?.[link])
        l.onClick(set(channel.uri, channel.output.get()._links?.[link]?.href))
    else
        l.color('silver')
    return l
}


export function searchControls(query) {
    return form().flexRow().onSubmit(b => query.set(b.get().query.value)).onReset(set(query, '')).add(
        inputText('query').value(query).auto().placeholder('Search '),
        submit('🔎').title('Search'),
        reset('⌫').title('Reset the query')
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
    return new Column(name, (data, td) => {
        td.paddingLeft(data.level, 'em')
        if(data.node.children)
            td.add(expander(attach(data.node).expanded.observeChanges(trigger(original))))
        return " " + data.node.name
    })
}

export function resizeableColumns(leftColumnContent, rightColumnContent, leftWidth = stateModel('49%')) {
    let start = state(0)
    return div(
        leftColumnContent.width(leftWidth),
        div().setClass('resizer-x').draggable(true).onDragstart((b, e) => {
            start.set(e.clientX - leftColumnContent.get().clientWidth);
            e.dataTransfer.setDragImage(new Image(), 0, 0)
        }).onDrag((b, e) => leftWidth.set((e.clientX - start.get()) + 'px')),
        rightColumnContent.auto()
    ).flexRow().alignItems('flex-start')
}
