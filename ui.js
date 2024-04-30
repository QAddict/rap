import {
    a,
    captionBottom,
    captionTop,
    checkbox,
    div,
    each, form,
    HtmlBuilder, inputText,
    label,
    node, reset, set,
    span,
    state,
    stateModel, submit,
    table,
    tbody,
    td,
    th,
    thead,
    to,
    toggle,
    tr,
    transform,
    trigger,
    when
} from "./mvc.js";

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
    constructor(name, hidden = false) {this.__name = name;this.__hidden = hidden}
    getName() {return this.__name}
    renderHeader(th, columnPosition, table) {return this.getName()}
    renderCell(data, td, rowIndex, table) {return data?.[this.getName()]}
    hidden() {return this.__hidden}
    hide(value = true) {this.__hidden = value; return this}
    show(value = true) {return this.hide(!value)}
}

export class BasicColumn extends Column {
    constructor(name, get = data => data?.[name]) {super(name); this.__get = get}
    renderCell(data, td, index, table) {return this.__get(data);}
}

export function basicColumn(name, get = data => data?.[name]) {
    return new BasicColumn(name, get)
}

export class DataTransformingColumn extends Column {
    constructor(name, dataTransformingFunction) {super(name); this.renderCell = dataTransformingFunction}
}

export function transformingColumn(delegate, transformingFunction, isTreeColumn = false) {
    return new DataTransformingColumn(delegate, transformingFunction, isTreeColumn)
}

export class PositionColumn extends Column {
    constructor() {super("#");}
    renderCell(data, td, index) {return index}
}

export let position = new PositionColumn()

export function objectPath(name = '', get = o => o) {
    let c = new BasicColumn(name, get)
    return new Proxy(c, {
        get(target, property) {
            return c[property] !== undefined ? c[property] : objectPath(property, o => get(o)?.[property])
        }
    })
}

export let row = objectPath()

export class DataTable extends HtmlBuilder {

    constructor(dataModel, t = table()) {
        super(node(t));
        let columnMove = stateModel()
        this.columnsModel = state([])
        this.columnsModel.observe(trigger(dataModel))
        this.rowModel = (tr, data) => {}
        this.moveEnabled = false
        this.visibleColumnsModel = transform(this.columnsModel, cols => cols.filter(col => !col.hidden()))
        this.add(
            thead(tr(each(this.visibleColumnsModel, (column, index) => {
                let header = th()
                if(this.moveEnabled) header
                    .transfer(columnMove, index)
                    .receive(columnMove, from => this.moveColumn(from, index), 'rap-table-header-receiver', 'rap-table-header-drop')
                return header.add(column.renderHeader(header, index, this))
            }))),
            tbody(each(dataModel, (item, index) => tr().apply(this.rowModel, item).add(each(this.visibleColumnsModel, column => {
                let cell = td()
                return cell.add(column.renderCell(item, cell, index, this))
            }))))
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

    customizeRow(customizer) {
        this.rowModel = customizer
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

    captionTop(...args) {
        this.add(captionTop(...args).textLeft().nowrap())
        return this
    }

    captionBottom(...args) {
        this.add(captionBottom(...args).textLeft().nowrap().add())
        return this
    }

}

export function dataTable(result) {
    return new DataTable(result)
}

function pageNav(which, action, boundaryModel) {
    return a().setClass('rap-paging ' + which + '-page')
        .title('Go to ' + which + ' page')
        .color(transform(boundaryModel, to('silver')))
        .onClick(when(transform(boundaryModel, negate), action))
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
    return form().onSubmit(event => query.set(event.target.query.value)).onReset(set(query, '')).add(
        inputText('query').value(query),
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
        captionBottom().setClass('rap-paging').textLeft().nowrap().add(pageControls(page, result, searchCall.stateModel.loading))
    )
}
export function linearizeSimpleTree(treeModel, level = 0) {
    return transform(treeModel, items => items.flatMap(item => [{level: level, node: item}, ...(item.expanded ? linearizeSimpleTree(item.children, level + 1) : [])]))
}

export function linearizePageableTree(pagedTreeModel) {
    return transform(pagedTreeModel, page => {
        let l = page.content.map(item => null).flatMap(linearizePageableTree)
        if(!page.first) l.unshift(null)
        if(!page.last) l.push(null)
    })
}
