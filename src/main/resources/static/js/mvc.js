//region <Model>
/**
 * Observable represents a value, which notifies observers about its changes.
 */
export class Observable {
    constructor(name = "") {this.setName(name)}
    setName(name) {this.__name = name; return this}
    getName() {return this.__name}
    get() {throw new Error("Undeclared method Observable.get()")}
    observeChanges(observer) {throw new Error("Undeclared method Observable.observeChanges(observer)")}
    observe(observer) {observer(this.get()); return this.observeChanges(observer)}
    trigger() {throw new Error("Undeclared method trigger()")}
    routeTo(model) {return this.observe(value => model.set(value))}
}

export function isObservable(object) {
    return object instanceof Observable
}

export class ObservableTransformer extends Observable {
    constructor(parent, transform) {super(); this.__parent = parent; this.__transform = transform}
    get() {return this.__transform(this.__parent.get());}
    observe(observer) {this.__parent.observe(value => observer(this.__transform(value))); return this}
    observeChanges(observer) {this.__parent.observeChanges(value => observer(this.__transform(value))); return this}
    trigger() {this.__parent.trigger(); return this}
}

export function transform(observable, transformer) {
    return new ObservableTransformer(observable, transformer)
}

export class Model extends Observable {
    constructor(name) {super(name);}
    set(newValue) {throw new Error("Undeclared method Model.set(newValue)");}
    update(aFunction) {return this.set(aFunction(this.get()))}
}

export class StateModel extends Model {
    constructor(initialValue) {super();this.__value = initialValue;this._observers = []}
    get() {return this.__value;}
    observeChanges(observer) {this._observers.push(observer); return this}
    trigger() {this._observers.forEach(observer => observer(this.__value)); return this}
    set(newValue) {this.__value = newValue; return this.trigger()}
}

export function stateModel(value = null) {
    return isObservable(value) ? value : new StateModel(value)
}

export class AttachedModel extends Model {
    constructor(object, name) {super(name);this.__object = object;this._observers = []}
    get() {return this.__object[this.__name];}
    observeChanges(observer) {this._observers.push(observer); return this}
    trigger() {this._observers.forEach(observer => observer(this.get())); return this}
    set(newValue) {this.__object[this.__name] = newValue; return this.trigger()}
}

export function attach(object) {
    return new Proxy({}, {
        get(target, name) {return target[name] === undefined ? new AttachedModel(object, name) : target[name]}
    })
}

export class PropertyModel extends Model {
    constructor(parent, name) {super(name); this.__parent = parent;}
    set(newValue) {this.__parent.get()[this.__name] = newValue; return this.trigger()}
    get() {return this.__parent.get()?.[this.__name];}
    observeChanges(observer) {this.__parent.observeChanges(value => observer(value?.[this.__name])); return this}
    trigger() {this.__parent.trigger(); return this}
    getName() {return this.__name;}
}

export class DependencyModel extends PropertyModel {
    constructor(parent, name, deps) {super(parent, name); this._deps = deps}
    set(value) {this._deps(this.get(), value); return super.set(value)}
}

export let stateProxyHandler = {
    get(target, name) {return (target[name] === undefined) ? target[name] = state(new PropertyModel(target, name)) : target[name]}
}

export function state(stateOrValue = null, proxyHandler = stateProxyHandler) {
    return new Proxy(stateModel(stateOrValue), proxyHandler)
}

export class TransformedState extends StateModel {
    constructor(transformation, initialValue = null) {super(transformation(initialValue));this._transformation = transformation}
    set(newValue) {return super.set(this._transformation(newValue));}
}

//endregion

//region <Model transforming functions>
export function argumentsModel(...modelsAndValues) {
    let value = modelsAndValues.map((v, i) => isObservable(v) ? v.observeChanges(x => {value[i] = x; model.trigger()}).get() : v)
    let model = state(value)
    return model
}

export function functionModel(f, ...args) {
    return transform(argumentsModel(...args), v => f(...v))
}

export function join(glue, array) {
    return transform(argumentsModel(...array), a => a.join(glue))
}

export function concat(...args) {
    return join('', args)
}

export function to(trueValue, falseValue = null) {
    return value => value ? trueValue : falseValue
}

export function falseTo(falseValue) {
    return to(null, falseValue)
}

export let negate = value => !value

export let invert = value => -value

export function runEitherOr(trueCommand, falseCommand) {
    return value => value ? trueCommand() : falseCommand()
}

export function usingTemplate(template) {
    let parts = template.split(/\{([^{]+)}/g)
    let values = Array.from(parts)
    return function(value) {
        for(let i = 1; i < values.length; i += 2) values[i] = value[parts[i]]
        return values.join('')
    }
}

export function usingUriTemplate(template) {
    let fileFunction = usingTemplate(template)
    return function(raw) {
        let value = {}
        if(raw != null) Object.getOwnPropertyNames(raw).forEach(name => value[name] = raw[name])
        let params = Object.getOwnPropertyNames(value).filter(n => n && !template.includes('{' + n + '}'))
        let file = fileFunction(value)
        if(params.length > 0) {
            file += (file.includes('?') ? '&' : '?') + params.map(n => n + '=' + value[n]).join('&')
        }
        return file
    }
}

export function properties(map) {
    return function(object) {
        return object == null ? null : Object.fromEntries(Object.entries(object).map(([name, value]) => [name, map(value)]))
    }
}

export function uri(template, model) {
    return transform(transform(state(model), properties(encodeURIComponent)), usingUriTemplate(template))
}

export function path(template, model) {
    return transform(transform(model, properties(encodeURIComponent)), usingTemplate(template))
}

function locationEncoded(initialState = {}) {
    let data = state(initialState)
    data.set(Object.fromEntries(document.location.search.substring(1).split('&').map(i => i.split('=').map(uriComponentDecode))))
    let uriState = uri(document.location.pathname, data)
    let a = true
    uriState.observeChanges(v => a && window.history.pushState(data.get(), "", v))
    window.addEventListener('popstate', event => {
        a = false
        data.set(event.state)
        a = true
    })
}

//endregion

//region <HTML View>
export class Content {
    constructor(node) {this.__node = node}
    get() {return this.__node}
    remove() {if(this.__node.parentNode) this.__node.parentNode.removeChild(this.__node); return this}
    replace(replacement) {if(this.__node.parentNode) this.__node.parentNode.replaceChild(node(replacement), this.__node); return this}
    prepend(content) {if(this.__node.parentNode) this.__node.parentNode.insertBefore(node(content), this.__node); return this}
}

export function content(node) {
    return new Content(node)
}

export function node(value) {
    if(value instanceof Content) return value.get()
    if(value instanceof Node) return value
    if(isObservable(value)) return observableTextNode(value)
    return document.createTextNode(value)
}

function observableTextNode(observable) {
    let n = document.createTextNode(observable.get())
    observable.observe(value => n.nodeValue = value, false)
    return n
}

export function text(value = '') {
    return content(isObservable(value) ? observableTextNode(value) : document.createTextNode(value))
}

export class DynamicFragmentBuilder extends Content {
    constructor(start, end) {super(document.createDocumentFragment()); this.get().appendChild((this.__start = start).get()); this.get().appendChild((this.__end = end).get())}
    add(...args) {this.__end.prepend(...args); return this}
    clear() {while(this.__start.get().nextSibling && this.__start.get().nextSibling !== this.__end.get()) content(this.__start.get().nextSibling).remove(); return this}
}

export function dynamicFragment(start = text(), end = text()) {
    return new DynamicFragmentBuilder(start, end)
}

export class ElementBuilder extends Content {
    constructor(node) {super(node);}
    add(...args) {
        for(let i = 0; i < args.length; i++) if(args[i] != null) this.get().appendChild(node(args[i]))
        return this
    }

    clear() {
        let node = this.get()
        while(node.firstChild) node.removeChild(node.firstChild)
        return this
    }

    _manipulate(f, args) {
        if(args.length === 0) return this
        let value = args.length === 1 ? args[0] : concat(...args)
        if(isObservable(value)) value.observe(f)
        else f(value)
        return this
    }

    set(name, ...args) {
        return this._manipulate(value => {
            if(value == null) this.get().removeAttribute(name)
            else this.get().setAttribute(name, value)
        }, args)
    }

    css(property, ...args) {
        return this._manipulate(value => {
            if(value == null) this.get().style.removeProperty(property)
            else this.get().style.setProperty(property, value)
        }, args)
    }

    setProperty(name, ...args) {
        return this._manipulate(value => {
            if(value == null) this.get()[name] = null
            else this.get()[name] = value
        }, args)
    }

    /*
     Dealing with events
     */
    on(event, handler, bubble) {
        this.get().addEventListener(event, bubble ? e => handler(this, e) : e => {
            handler(this, e)
            e.preventDefault()
            return false
        })
        return this
    }

    apply(f, ...args) {
        f(this, ...args)
        return this
    }

}

//endregion

//region <HTML entries>

/**
 * Space with start and end boundary, which will be populated dynamically as reaction to model change, using its display
 * function.
 * On any change of the model, the space is re-rendered using the display function.
 * It can handle following situation.
 * If model value is an array, every item will be rendered using the display function and inserted into the space.
 * If model value is null, space stays empty.
 * Otherwise, the value itself is rendered using the display function.
 *
 * This function will always re-render all items newly on model change. That means, that any state in the previously
 * rendered item view may be lost.
 * For rendering, which re-uses previously rendered items, if they remain, see function `refresh()`.
 *
 * @param start Start element of the space.
 * @param model Model (state), driving the content.
 * @param itemDisplayFunction Function used to render an item. The function accepts the item value, and an index, and
 *        must return appendable content.
 * @param end Optional end element, which is used as an anchor of the space, so all rendered content is prepended before
 *        this element. If not provided, artificial empty text node is created for that purpose.
 * @returns {Content} Fragment builder.
 */
export function range(start, model, itemDisplayFunction = item => item, end = text()) {
    let f = dynamicFragment(start, end)
    model.observe(value => {
        f.clear();
        (Array.isArray(value) ? value : null == value ? [] : [value]).forEach((item, index) => f.add(itemDisplayFunction(item, index)))
    })
    return f
}

/**
 * Space which will be populated dynamically as reaction to model change, using its display function.
 * On any change of the model, the space is re-rendered using the display function.
 * It can handle following situation.
 * If model value is an array, every item will be rendered using the display function and inserted into the space.
 * If model value is null, space stays empty.
 * Otherwise, the value itself is rendered using the display function.
 *
 * This function will always re-render all items newly on model change. That means, that any state in the previously
 * rendered item view may be lost.
 * For rendering, which re-uses previously rendered items, if they remain, see function `refresh()`.
 *
 * @param model Model (state), driving the content.
 * @param itemDisplayFunction Function used to render an item. The function accepts the item value, and an index, and
 *        must return appendable content.
 * @param end Optional end element, which is used as an anchor of the space, so all rendered content is prepended before
 *        this element. If not provided, artificial empty text node is created for that purpose.
 * @returns {Content} Fragment builder.
 */
export function each(model, itemDisplayFunction = (item, index) => item, end = text()) {
    return range(text(), model, itemDisplayFunction, end)
}


export function produce(model, itemDisplayFunction = item => item, end = text()) {
    let f = dynamicFragment(text(), end)
    model.observe(item => f.add(item == null ? null : itemDisplayFunction(item)))
    return f
}

//endregion

//region <Commands>
/**
 * Create command which sets a model to fixed value or actual value of another model.
 *
 * @param model Model to set.
 * @param value Value to set the model to.
 * @returns {{(): *, (): *}}
 */
export function set(model, value) {
    return isObservable(value) ? () => model.set(value.get()) : () => model.set(value)
}

export function update(model, withFunction) {
    return () => model.update(withFunction)
}

export function addTo(arrayModel, item) {
    return update(arrayModel, a => a.push(item))
}

/**
 * Create command to toggle value of provided model to its negation.
 *
 * @param model Model to negate.
 * @returns {function(): *}
 */
export function toggle(model) {
    return () => model.set(!model.get())
}

export function when(condition, command) {
    return () => condition.get() && command()
}

export function ctrlKey(ctrlHandler, defaultHandler) {
    return (content, event) => event.ctrlKey ? ctrlHandler(content, event) : defaultHandler(content, event)
}

/**
 * Create command to trigger provided model.
 * This command is mainly used to trigger call or remote data.
 * @param model Model to trigger.
 * @returns {function(): *}
 */
export function trigger(model) {
    return () => model.trigger()
}

export function increment(model, by = 1) {
    return () => model.set(model.get() + by)
}

export function decrement(model, by = 1) {
    return increment(model, -by)
}

/*export function invert(model) {
    return () => model.set(-model.get())
}*/

export function remove(content) {
    return () => content.remove()
}

export function clear(content) {
    return () => content.clear()
}

export function show(dialog) {
    if(typeof dialog == 'string')
        return () => document.getElementById(dialog).showModal()
    return () => dialog.get().showModal()
}

//endregion
