import {ElementBuilder, isObservable, join, transform, set, stateModel, to} from "./rap.js";

//region <HTML builder>

export class HtmlBuilder extends ElementBuilder {
    constructor(node) {super(node);this.__class = []}
    setClass(...value) {return this.set('class', join(' ', this.__class = value))}
    addClass(...value) {return this.setClass(...this.__class.concat(...value))}
    id(...value) {return this.set('id', ...value)}
    name(...value) {return this.set('name', ...value)}
    title(...value) {return this.set('title', ...value)}
    href(...value) {return this.set('href', ...value)}
    type(...value) {return this.set('type', ...value)}
    readonly(...value) {return this.set('readonly', ...value)}
    placeholder(...value) {return this.set('placeholder', ...value)}
    pattern(...value) {return this.set('pattern', ...value)}
    action(...value) {return this.set('action', ...value)}
    target(...value) {return this.set('target', ...value)}
    method(...value) {return this.set('method', ...value)}
    size(...value) {return this.set('size', ...value)}
    src(...value) {return this.set('src', ...value)}
    alt(...value) {return this.set('alt', ...value)}
    draggable(...value) {return this.set('draggable', ...value)}
    rel(...value) {return this.set('rel', ...value)}
    colspan(...value) {return this.set('colspan', ...value)}
    rowspan(...value) {return this.set('rowspan', ...value)}
    autocomplete(...value) {return this.set('autocomplete', ...value)}
    disabled(value) {return this.set('disabled', isObservable(value) ? transform(value, to(true)) : value)}
    content(...value) {return this.set('content', ...value)}
    selected(value) {return this.set('selected', value)}
    contenteditable(value) {return this.set('contenteditable', value)}
    max(value) {return this.set('max', value)}
    min(value) {return this.set('min', value)}
    high(value) {return this.set('high', value)}
    low(value) {return this.set('low', value)}
    step(...value) {return this.set('step', ...value)}

    display(value) {return this.css('display', isObservable(value) ? transform(value, v => v === false ? 'none' : v === true ? null : v) : value)}
    textAlign(value) {return this.css('text-align', value)}
    textLeft() {return this.textAlign('left')}
    textRight() {return this.textAlign('right')}
    textCenter() {return this.textAlign('center')}
    verticalAlign(value) {return this.css('vertical-align', value)}
    width(...args) {return this.css('width', ...args)}
    height(...args) {return this.css('height', ...args)}
    top(...args) {return this.css('top', ...args)}
    bottom(...args) {return this.css('bottom', ...args)}
    left(...args) {return this.css('left', ...args)}
    right(...args) {return this.css('right', ...args)}
    resize(value) {return this.css('resize', value)}
    resizeHorizontal() {return this.resize('horizontal')}
    resizeVertical() {return this.resize('vertical')}
    color(value) {return this.css('color', value)}
    fontSize(...args) {return this.css('font-size', ...args)}
    fontStyle(...args) {return this.css('font-style', ...args)}
    fontWeight(...args) {return this.css('font-weight', ...args)}
    visibility(value) {return this.css('visibility', value)}
    opacity(...args) {return this.css('opacity', ...args)}
    background(...args) {return this.css('background', ...args)}
    backgroundColor(value) {return this.css('background-color', value)}
    backgroundImage(...args) {return this.css('background-image', ...args)}
    backgroundRepeat(...args) {return this.css('background-repeat', ...args)}
    backgroundSize(...args) {return this.backgroundRepeat('no-repeat').css('background-size', ...args)}
    linearGradient(value) {return this.backgroundImage('linear-gradient(', value, ')')}
    position(value) {return this.css('position', value)}
    float(value) {return this.css('float', value)}
    padding(...args) {return this.css('padding', ...args)}
    paddingLeft(...args) {return this.css('padding-left', ...args)}
    paddingRight(...args) {return this.css('padding-right', ...args)}
    paddingTop(...args) {return this.css('padding-top', ...args)}
    paddingBottom(...args) {return this.css('padding-bottom', ...args)}
    margin(...args) {return this.css('margin', ...args)}
    marginLeft(...args) {return this.css('margin-left', ...args)}
    marginRight(...args) {return this.css('margin-right', ...args)}
    marginTop(...args) {return this.css('margin-top', ...args)}
    marginBottom(...args) {return this.css('margin-bottom', ...args)}
    border(...args) {return this.css('border', ...args)}
    borderTop(...args) {return this.css('border-top', ...args)}
    borderBottom(...args) {return this.css('border-bottom', ...args)}
    borderLeft(...args) {return this.css('border-left', ...args)}
    borderRight(...args) {return this.css('border-right', ...args)}
    borderRadius(...args) {return this.css('border-radius', ...args)}
    cursor(value) {return this.css('cursor', value)}
    transition(...value) {return this.css('transition', ...value)}
    transform(...value) {return this.css('transform', ...value)}
    rotate(...value) {return this.transform('rotate(', ...value, ')')}
    overflow(...value) {return this.css('overflow', ...value)}
    overflowHidden() {return this.overflow('hidden')}
    overflowX(...value) {return this.css('overflow-x', ...value)}
    overflowY(value) {return this.css('overflow-y', value)}
    flex(...args) {return this.css('flex', ...args)}
    auto() {return this.flex("auto")}
    flexDirection(...args) {return this.css('flex-direction', ...args)}
    flexRow() {return this.display('flex').flex('row')}
    flexColumn() {return this.display('flex').flex('column')}
    flexShrink(...args) {return this.css('flex-shrink', ...args)}
    flexGrow(...args) {return this.css('flex-grow', ...args)}
    alignItems(...args) {return this.css('align-items', ...args)}
    gap(...args) {return this.css('gap', ...args)}
    captionSide(...args) {return this.css('caption-side', ...args)}
    whiteSpace(...args) {return this.css('white-space', ...args)}
    nowrap() {return this.whiteSpace('nowrap')}
    boxSizing(value) {return this.css('box-sizing', value)}
    borderBox() {return this.boxSizing('border-box')}
    value(...args) {return this.setProperty('value', ...args)}
    checked(value) {return this.setProperty('checked', value)}
    onClick(handler, bubble) {return this.on('click', handler, bubble)}
    onSubmit(handler, bubble) {return this.on('submit', handler, bubble)}
    onReset(handler, bubble) {return this.on('reset', handler, bubble)}
    onInput(handler, bubble) {return this.on('input', handler, bubble)}
    onChange(handler, bubble) {return this.on('change', handler, bubble)}
    onMouseOver(handler) {return this.on('mouseover', handler, true)}
    onMouseOut(handler) {return this.on('mouseout', handler, true)}
    onKeyPress(handler) {return this.on('keypress', handler, true)}
    onKeyDown(handler) {return this.on('keydown', handler, true)}
    onKeyUp(handler) {return this.on('keyup', handler, true)}
    onDragstart(handler) {return this.on('dragstart', handler, true)}
    onDrag(handler) {return this.on('drag', handler, true)}
    onDrop(handler) {return this.on('drop', handler, true)}
    onDragend(handler) {return this.on('dragend', handler, true)}
    onDragover(handler) {return this.on('dragover', handler, true)}
    onDragleave(handler) {return this.on('dragleave', handler, true)}

    transfer(channel, data) {
        return this.draggable(true).cursor('grab').onDragstart(set(channel, data)).onDragend(set(channel, null))
    }

    receive(channel, action, dragStartClass, dragOverClass) {
        return this
            .onDragover((_, e) => null !== channel.get() && e.preventDefault())
            .onDrop(() => null != channel.get() && action(channel.get()))
            .receivingClasses(channel, dragStartClass, dragOverClass)
    }

    receiving(channel, model) {
        channel.observe(value => value || model.set(false))
        return this.onDragover(() => channel.get() && model.set(true)).onDragleave(set(model, false))
    }

    receivingClasses(channel, dragStartClass, dragOverClass) {
        let indication = stateModel(false)
        if (dragStartClass) this.addClass(transform(channel, to(dragStartClass)))
        if (dragOverClass) this.addClass(transform(indication, to(" " + dragOverClass)))
        return this.receiving(channel, indication)
    }

    dragTo(item, target) {
        return this.transfer(channelOf(target), data)
    }

    dropTo(target) {
        return this.receive(channelOf(target), item => target.update(a => a.push(item)))
    }
    
    /*
     Special binding
     */
    edit(model) {
        this.name(model.getName())
        if(this.get().type === "checkbox")
            return this.checked(model).onChange(() => model.set(this.get().checked))
        if(this.get().type === "radio")
            return this.checked(model.get() === this.get().value).onChange(() => this.get().checked && model.set(this.get().value))
        return this.value(model).onChange(() => model.set(this.get().value))
    }

}
//endregion

//region <HTML entries>
export function builder(node, ...content) {
    if (node instanceof Node) return new HtmlBuilder(node).add(...content)
    throw new ReferenceError("Provided value must be instance of Node. Got: " + node);
}

export function body(...content) {return builder(document.body, ...content)}
export function head(...content) {return builder(document.head, ...content)}
export function byId(id) {return builder(document.getElementById(id))}
export function element(name, ...content) {return builder(document.createElement(name), ...content)}
export function meta() {return element('meta')}
export function base() {return element('base')}
export function div(...content) {return element('div', ...content)}
export function span(...content) {return element('span', ...content)}
export function img(...src) {return element('img').src(...src)}
export function link(rel) {return element('link').rel(rel)}
export function a(...content) {return element('a', ...content)}
export function h1(...content) {return element('h1', ...content)}
export function h2(...content) {return element('h2', ...content)}
export function h3(...content) {return element('h3', ...content)}
export function h4(...content) {return element('h4', ...content)}
export function h5(...content) {return element('h5', ...content)}
export function h6(...content) {return element('h6', ...content)}
export function p(...content) {return element('p', ...content)}

/**
 * Create new DOM Element 'pre' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function pre(...content) {
    return element('pre', ...content)
}

/**
 * Create new DOM Element 'code' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function code(...content) {
    return element('code', ...content)
}

/**
 * Create new DOM Element 'ul' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function ul(...content) {
    return element('ul', ...content)
}

/**
 * Create new DOM Element 'ol' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function ol(...content) {
    return element('ol', ...content)
}

/**
 * Create new DOM Element 'li' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function li(...content) {
    return element('li', ...content)
}

/**
 * Create new DOM Element 'small' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function small(...content) {
    return element('small', ...content)
}

/**
 * Create new DOM Element 'strong' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function strong(...content) {
    return element('strong', ...content)
}

/**
 * Create new DOM Element 'em' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function em(...content) {
    return element('em', ...content)
}

/**
 * Create new DOM Element 'abbr' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function abbr(...content) {
    return element('abbr', ...content)
}

/**
 * Create new DOM Element 'time' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function time(...content) {
    return element('time', ...content)
}

/**
 * Create new DOM Element 'form' and wrap it with a builder.
 * @param content Elements to be appended to the element.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function form(...content) {
    return element('form', ...content)
}

export function dialogForm(...content) {
    return form(...content).method('dialog')
}

export function textarea(name) {
    return element('textarea').name(name)
}

export function input(name, type = 'text') {
    let i = element('input').type(type)
    return isObservable(name) ? i.name(name.getName()).edit(name) : i.name(name)
}

export function inputText(name) {
    return input(name)
}

export function inputNumber(name) {
    return input(name, 'number')
}

export function hidden(name) {
    return input(name, 'hidden')
}

export function password(name) {
    return input(name, 'password')
}

export function checkbox(name) {
    return input(name, 'checkbox')
}

export function radio(name) {
    return input(name, 'radio')
}

export function submit(value) {
    return input(value, 'submit').value(value)
}

export function reset(value) {
    return input(value, 'reset').value(value)
}

export function inputDate(name) {
    return input(name, 'date')
}

export function inputDateTime(name) {
    return input(name, 'datetime-local')
}

export function inputFile(name) {
    return input(name, 'file')
}

export function select(...content) {
    return element('select', ...content)
}

export function option(...content) {
    return element('option', ...content)
}

export function button(...content) {
    return element('button', ...content)
}

export function label(...content) {
    return element('label', ...content)
}

export function fieldset(...content) {
    return element('fieldset', ...content)
}

export function legend(...content) {
    return element('legend', ...content)
}

/**
 * Create new DOM Element 'dd' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function dd(...content) {
    return element('dd', ...content)
}

/**
 * Create new DOM Element 'dl' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function dl(...content) {
    return element('dl', ...content)
}

/**
 * Create new DOM Element 'dt' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function dt(...content) {
    return element('dt', ...content)
}

/**
 * Create new DOM Element 'dfn' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function dfn(...content) {
    return element('dfn', ...content)
}

/**
 * Create new DOM Element 'table' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function table(...content) {
    return element('table', ...content)
}

/**
 * Create new DOM Element 'tbody' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function tbody(...content) {
    return element('tbody', ...content)
}

/**
 * Create new DOM Element 'thead' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function thead(...content) {
    return element('thead', ...content)
}

/**
 * Create new DOM Element 'tfoot' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function tfoot(...content) {
    return element('tfoot', ...content)
}

/**
 * Create new DOM Element 'tr' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function tr(...content) {
    return element('tr', ...content)
}

/**
 * Create new DOM Element 'td' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function td(...content) {
    return element('td', ...content)
}

/**
 * Create new DOM Element 'th' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function th(...content) {
    return element('th', ...content)
}

/**
 * Create new DOM Element 'caption' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function caption(...content) {
    return element('caption', ...content)
}

export function captionTop(...content) {
    return caption(...content).captionSide('top')
}

export function captionBottom(...content) {
    return caption(...content).captionSide('bottom')
}

/**
 * Create new DOM Element 'sub' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function sub(...content) {
    return element('sub', ...content)
}

/**
 * Create new DOM Element 'sup' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function sup(...content) {
    return element('sup', ...content)
}

/**
 * Create new DOM Element 'details' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function details(...content) {
    return element('details', ...content)
}

/**
 * Create new DOM Element 'summary' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function summary(...content) {
    return element('summary', ...content)
}

/**
 * Create new DOM Element 'del' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function del(...content) {
    return element('del', ...content)
}

/**
 * Create new DOM Element 'ins' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function ins(...content) {
    return element('ins', ...content)
}

/**
 * Create new DOM Element 'hr' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function hr() {
    return element('hr')
}

/**
 * Create new DOM Element 'br' and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function br() {
    return element('br')
}

export function q(...content) {
    return element('q', ...content)
}

export function blockquote(...content) {
    return element('blockquote', ...content)
}

export function address(...content) {
    return element('address', ...content)
}

export function cite(...content) {
    return element('cite', ...content)
}

export function iframe(...src) {
    return element('iframe').src(src)
}

export function dialog(...content) {
    return element('dialog', ...content)
}

export function title(...content) {
    builder(document).setProperty('title', ...content)
}

export function progress(...content) {
    return element('progress', ...content)
}

export function meter(...content) {
    return element('meter', ...content)
}

export function menu(...content) {
    return element('menu', ...content)
}

export function nav(...content) {
    return element('nav', ...content)
}

/**
 * Create new DOM Fragment with provided content and wrap it with a builder.
 * @returns {HtmlBuilder} New XBuilder instance.
 */
export function fragment(...args) {
    return builder(document.createDocumentFragment()).add(...args)
}

//endregion
