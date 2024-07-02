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
    set(newValue) {throw new Error("Undeclared method Model.set(newValue)");}
    update(aFunction) {return this.set(aFunction(this.get()))}
    trigger() {throw new Error("Undeclared method trigger()")}
}

export function isObservable(object) {
    return object instanceof Observable
}

export class ObservableTransformer extends Observable {
    constructor(parent, transform, name = "") {super(name); this.__parent = parent; this.__transform = transform}
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

export class StateModel extends Observable {
    constructor(initialValue) {super();this.__value = initialValue;this._observers = []}
    get() {return this.__value;}
    observeChanges(observer) {this._observers.push(observer); return this}
    trigger() {this._observers.forEach(observer => observer(this.__value)); return this}
    set(newValue) {this.__value = newValue; return this.trigger()}
}

export function stateModel(value = null) {
    return isObservable(value) ? value : new StateModel(value)
}

export class AttachedModel extends Observable {
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

export class PropertyModel extends ObservableTransformer {
    constructor(parent, name) {super(parent, v => v?.[name], name); this.__parent = parent; this.__name = name}
    set(newValue) {this.__parent.get()[this.__name] = newValue; return this.trigger()}
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

export function restTemplate(template) {
    let parts = template.split(/\{([^{]+)}/g)
    let values = Array.from(parts)
    return function(value) {
        for(let i = 1; i < values.length; i += 2) values[i] = parts[i] + "=" + encodeURIComponent(value)
        return values.join('')
    }
}

export function restParameter(href, uriModel) {
    let parts = href.split(/\{&([^{]+)}/g)
    let f = restTemplate(href)
    let i = uriModel.get().split(parts[1] + '=')[1]?.split('&')[0]
    return state(i&&decodeURIComponent(i)).observeChanges(v => uriModel.set(f(v)))
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

export function locationEncoded() {
    let data = state()
    data.set({...Object.fromEntries(document.location.search.substring(1).split('&').map(i => i.split('=').map(decodeURIComponent)))})
    //let uriState = uri(document.location.pathname, data)
    let a = true
    let f = usingUriTemplate(document.location.pathname)
    let f2 = properties(encodeURIComponent)
    data.observeChanges(v => a && window.history.pushState(v, "", f(f2(v))))
    window.addEventListener('popstate', event => {
        a = false
        data.set(event.state)
        a = true
    })
    return data
}

//endregion

//region <HTML View>
export class Content {
    constructor(node) {this.__node = node}
    get() {return this.__node}
    remove() {if(this.__node.parentNode) this.__node.parentNode.removeChild(this.__node); return this}
    replace(replacement) {if(this.__node.parentNode) this.__node.parentNode.replaceChild(node(replacement), this.__node); return this}
    prepend(...content) {if(this.__node.parentNode) content.forEach(i => this.__node.parentNode.insertBefore(node(i), this.__node)); return this}
}

export function content(node) {
    return new Content(node)
}

export function node(value) {
    return (value instanceof Content) ? value.get() : (value instanceof Node) ? value : isObservable(value) ? observableTextNode(value) : document.createTextNode(value)
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
    set(...args) {this.clear(); return this.add(...args)}
}

export function dynamicFragment(start = text(), end = text()) {
    return new DynamicFragmentBuilder(start, end)
}

export class ElementBuilder extends Content {
    constructor(node) {super(node);}
    add(...args) {for(let i = 0; i < args.length; i++) if(args[i] != null) this.get().appendChild(node(args[i]));return this}
    clear() {let node = this.get(); while(node.firstChild) node.removeChild(node.firstChild); return this}
    apply(f, ...args) {f(this, ...args); return this}

    _manipulate(f, args) {
        if(args.length === 0) return this
        let value = args.length === 1 ? args[0] : concat(...args)
        if(isObservable(value)) value.observe(f)
        else f(value)
        return this
    }

    set(name, ...args) {return this._manipulate(value => value == null ? this.get().removeAttribute(name) : this.get().setAttribute(name, value), args)}
    css(property, ...args) {return this._manipulate(value => value == null ? this.get().style.removeProperty(property) : this.get().style.setProperty(property, value), args)}
    setProperty(name, ...args) {return this._manipulate(value => this.get()[name] = (value == null) ? null : value, args)}

    on(event, handler, bubble) {
        this.get().addEventListener(event, bubble ? e => handler(this, e) : e => {handler(this, e); e.preventDefault(); return false})
        return this
    }
}

//endregion

//region <HTML entries>

export function range(start, model, itemDisplayFunction = item => item, end = text()) {
    let f = dynamicFragment(start, end)
    model.observe(value => f.set(...(Array.isArray(value) ? value : null == value ? [] : [value]).map((item, index) => itemDisplayFunction(item, index))))
    return f
}

export function each(model, itemDisplayFunction = item => item, end = text()) {
    return range(text(), model, itemDisplayFunction, end)
}

export function render(model, itemDisplayFunction = item => item) {
    return each(transform(model, v => v ? [v] : null), itemDisplayFunction)
}

export function produce(model, itemDisplayFunction = item => item, end = text()) {
    let f = dynamicFragment(text(), end)
    model.observe(item => f.add(item == null ? null : itemDisplayFunction(item)))
    return f
}

//endregion

//region <Commands>
export function set(model, value) {
    return isObservable(value) ? () => model.set(value.get()) : () => model.set(value)
}

export function update(model, withFunction) {
    return () => model.update(withFunction)
}

export function addTo(arrayModel, item) {
    return update(arrayModel, a => a.push(item))
}

export function toggle(model) {
    return () => model.set(!model.get())
}

export function when(condition, command) {
    return () => condition.get() && command()
}

export function ctrlKey(ctrlHandler, defaultHandler) {
    return (content, event) => event.ctrlKey ? ctrlHandler(content, event) : defaultHandler(content, event)
}

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
    return (typeof dialog === 'string') ? () => document.getElementById(dialog).showModal() : () => dialog.get().showModal()
}

//endregion
