/**
 * Interface Observable
 * Defines API to register listeners, which will be invoked on any change of the value held / wrapped by the observer
 * implementation.
 */
export class Observable {

    /**
     * Constructor allows initial setup of name.
     * @param {string} name Name of the observer. It may be helpful for identification, but also for description of the observer
     *             regardless of the current value.
     */
    constructor(name = "") {
        this.setName(name)
    }

    /**
     * Set observer name. It may be helpful for identification, but also for description of the observer
     * regardless of the current value, as it can provide access to a field.
     * @param {string} name Name of the observer.
     */
    setName(name) {
        this.__name = name;
        return this
    }

    /**
     * Get observer name.
     * @returns {string}
     */
    getName() {
        return this.__name
    }

    /**
     * Get actual value, the observer wraps.
     */
    get() {
        throw new Error("Undeclared method Observable.get()")
    }

    /**
     * Observe changes to the value by invoking of provided observer function. Current value is not causing invocation,
     * only future changes.
     * @param {function(value)} observer
     * @returns {Observable} this observable.
     */
    observeChanges(observer) {
        throw new Error("Undeclared method Observable.observeChanges(observer)")
    }

    /**
     * Observe the value by invoking provided observer function. It gets invoked immediately witch current value and for
     * every future change.
     * @param {function(value)} observer
     * @returns {Observable} this observable.
     */
    observe(observer) {
        observer(this.get());
        return this.observeChanges(observer)
    }

    /**
     * Sets new value, which is wrapped by this observable. It will properly trigger any registered listeners.
     * @param newValue New value to be set.
     * @returns {Observable} this observable.
     */
    set(newValue) {
        throw new Error("Undeclared method Model.set(newValue)");
    }

    /**
     * Updates the value with provided function.
     * @param aFunction
     * @returns {Observable} this observable.
     */
    update(aFunction) {
        return this.set(aFunction(this.get()))
    }

    /**
     * Explicitly trigger registered listeners, even if the wrapped value didn't change.
     * @returns {Observable} this observable.
     */
    trigger() {
        throw new Error("Undeclared method trigger()")
    }
}

/**
 * Simple model os a state represented by value held directly by this model.
 * The methods set and update directly set the value, and others directly return / receive the value.
 */
export class StateModel extends Observable {
    constructor(initialValue) {
        super();
        this.__value = initialValue;
        this._observers = []
    }

    get() {
        return this.__value;
    }

    observeChanges(observer) {
        this._observers.push(observer);
        return this
    }

    trigger() {
        this._observers.forEach(observer => observer(this.__value));
        return this
    }

    set(newValue) {
        this.__value = newValue;
        return this.trigger()
    }
}

/**
 * Observable transformer depends on it's parent, and applies transformation function on the parent value before returning
 * result of the get() method, or before passing it to the observer registered via this instance (but observer is actually
 * registered at the parent).
 */
export class ObservableTransformer extends Observable {
    constructor(parent, transform, name = "") {
        super(name);
        this.__parent = parent;
        this.__transform = transform
    }

    get() {
        return this.__transform(this.__parent.get());
    }

    observe(observer) {
        this.__parent.observe(value => observer(this.__transform(value)));
        return this
    }

    observeChanges(observer) {
        this.__parent.observeChanges(value => observer(this.__transform(value)));
        return this
    }

    trigger() {
        this.__parent.trigger();
        return this
    }
}

/**
 * Model, that can be used to directly observe properties of existing object.
 * Just keep in mind, that observers will be triggered only if the value is changed via this AttachedModel calls of set()
 * or update() methods (or explicit trigger()). Other changes aren't observable.
 */
export class AttachedModel extends Observable {
    constructor(object, name) {
        super(name);
        this.__object = object;
        this._observers = []
    }

    get() {
        return this.__object[this.__name];
    }

    observeChanges(observer) {
        this._observers.push(observer);
        return this
    }

    trigger() {
        this._observers.forEach(observer => observer(this.get()));
        return this
    }

    set(newValue) {
        this.__object[this.__name] = newValue;
        return this.trigger()
    }
}

/**
 * PropertyModel is the key wrapper used to deal with structured data. It depends on a parent observable, and refers to
 * a property of the object wrapped by the parent. So you can use in your view a property model to display a property,
 * and it will get properly updated whenever the parent object updates (e.g. loaded via Ajax).
 * This concept can be also used recursively.
 */
export class PropertyModel extends ObservableTransformer {
    constructor(parent, name) {
        super(parent, v => v?.[name], name);
        this.__parent = parent;
        this.__name = name
    }

    set(newValue) {
        this.__parent.get()[this.__name] = newValue;
        return this.trigger()
    }
}

export class DependencyModel extends PropertyModel {
    constructor(parent, name, deps) {
        super(parent, name);
        this._deps = deps
    }

    set(value) {
        this._deps(this.get(), value);
        return super.set(value)
    }
}

export class TransformedState extends StateModel {
    constructor(transformation, initialValue = null) {
        super(transformation(initialValue));
        this._transformation = transformation
    }

    set(newValue) {
        return super.set(this._transformation(newValue));
    }
}

export function isObservable(object) {
    return object instanceof Observable
}

/**
 * If the input is an observable, then it creates observable transformer. Otherwise, it directly transforms the value
 * and returns result.
 * @param observableOrValue Input to the transformer function.
 * @param {function} transformer Transforming function.
 * @returns New transformed observable, or transformed value.
 */
export function transform(observableOrValue, transformer) {
    return isObservable(observableOrValue) ? new ObservableTransformer(observableOrValue, transformer) : transformer(observableOrValue)
}

/**
 * Create new state model using provided value. In case, that the value is already an Observable, then it's just returned,
 * so this can also be used to ensure to have Observable.
 * @param value Initial value, or existing Observable.
 * @returns {Observable|StateModel}
 */
export function stateModel(value = null) {
    return isObservable(value) ? value : new StateModel(value)
}

export let stateProxyHandler = {
    get(target, name) {
        return (target[name] === undefined) ? target[name] = state(new PropertyModel(target, name)) : target[name]
    }
}

/**
 * Create proxy based mirror structure of models allowing access to the hierarchy of underlying wrapped object as simple
 * as accessing a property. This makes the library very powerful.
 * E.g. Your model representation looks like:
 * {
 *     firstName: "John",
 *     lastName: "Doe"
 * }
 * You can build your view without the representation, just using this state mirror:
 *
 * let person = state()
 * div(person.firstName, ' ', person.lastName)
 *
 * Then when the value is set:
 *
 * person.set({firstName: "John", lastName: "Doe"})
 *
 * Your view will be updated accordingly.
 * @param stateOrValue
 * @param proxyHandler
 * @returns {Observable|StateModel}
 */
export function state(stateOrValue = null, proxyHandler = stateProxyHandler) {
    return new Proxy(stateModel(stateOrValue), proxyHandler)
}

export function attach(object) {
    return new Proxy({}, {
        get(target, name) {
            return target[name] === undefined ? new AttachedModel(object, name) : target[name]
        }
    })
}

/**
 * This function allows observing independently multiple observables, and react on change of value in any of them.
 * The result is another model, which holds an array of current values of all inputs. If any of them changed, it will
 * trigger its observers.
 * The parameters can be observables, but also any other objects, which will then remain static.
 * @param modelsAndValues Array of inputs, being either observables (then the resulting observable will register reaction
 *                        on their changes) or other values, which are stored in the resulting array as-is.
 * @returns {StateModel} State model holding an array of current states of the inputs. If an observer is registered to it,
 *                       it will receive an update on change of any of the input observables.
 */
export function argumentsModel(...modelsAndValues) {
    let value = modelsAndValues.map((v, i) => isObservable(v) ? v.observeChanges(x => {
        value[i] = x;
        model.trigger()
    }).get() : v)
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
    return value => {
        for (let i = 1; i < values.length; i += 2) values[i] = value[parts[i]];
        return values.join('')
    }
}

export function restTemplate(template) {
    let parts = template.split(/\{([^{]+)}/g)
    let values = Array.from(parts)
    return function (value) {
        for (let i = 1; i < values.length; i += 2) values[i] = parts[i] + "=" + encodeURIComponent(value)
        return values.join('')
    }
}

export function restParameter(href, uriModel) {
    let parts = href.split(/\{&([^{]+)}/g)
    let f = restTemplate(href)
    let i = uriModel.get().split(parts[1] + '=')[1]?.split('&')[0]
    return state(i && decodeURIComponent(i)).observeChanges(v => uriModel.set(f(v)))
}

export function usingUriTemplate(template) {
    let fileFunction = usingTemplate(template)
    return function (raw) {
        let value = {}
        if (raw != null) Object.getOwnPropertyNames(raw).forEach(name => value[name] = raw[name])
        let params = Object.getOwnPropertyNames(value).filter(n => n && !template.includes('{' + n + '}'))
        let file = fileFunction(value)
        if (params.length > 0) {
            file += (file.includes('?') ? '&' : '?') + params.map(n => n + '=' + value[n]).join('&')
        }
        return file
    }
}

export function properties(map) {
    return function (object) {
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

/**
 * Base class for the DOM based View layer.
 * It wraps a DOM Node instance, and provides basic fluent interface for dealing with it.
 */
export class Content {
    constructor(node) {
        this.__node = node
    }

    /**
     * Return the node itself.
     * @returns {*}
     */
    get() {
        return this.__node
    }

    /**
     * Remove this node from the document (from parent node).
     * @returns {Content}
     */
    remove() {
        if (this.__node.parentNode) this.__node.parentNode.removeChild(this.__node);
        return this
    }

    /**
     * Replace this node in the parent one with replacement.
     * @param replacement
     * @returns {Content}
     */
    replace(replacement) {
        if (this.__node.parentNode) this.__node.parentNode.replaceChild(node(replacement), this.__node);
        return this
    }

    /**
     * Prepend (insert before) before this node additional content.
     * @param content
     * @returns {Content}
     */
    prepend(...content) {
        if (this.__node.parentNode) content.forEach(i => this.__node.parentNode.insertBefore(node(i), this.__node));
        return this
    }
}

/**
 * Create a DOM TextNode, whose content displays value of an observable. It means, that the displayed content will
 * get updated whenever the observable value changes. You can think of it as a placeholder for observable value.
 * This very simple solution allows building a view, which properly reflects a model, keeping the dynamic content
 * properly placed in the document, allowing to separate the dynamic data to be displayed from the presentation, how
 * they should be displayed.
 * @param observable
 * @returns {*} Text node.
 */
function observableTextNode(observable) {
    let n = document.createTextNode(observable.get())
    observable.observe(value => n.nodeValue = value, false)
    return n
}

/**
 * Dynamic fragment builder is again a placeholder, but used for more complex dynamic content. Typically, presentation
 * of arrays, but in fact it serves as placeholder for any "generated" content. E.g. you have to apply a function on the
 * value in order to create proper presentation, every time the value changes.
 * The builder in fact inserts 2 bounding empty text nodes into a document (or initially into a document fragment, because
 * it's not yet appended to the document), and then on change removes everything between the boundaries, and generates
 * new content (in between).
 * This is another very powerful principle in this library.
 */
export class DynamicFragmentBuilder extends Content {
    constructor(start, end) {
        super(document.createDocumentFragment());
        this.get().appendChild((this.__start = start).get());
        this.get().appendChild((this.__end = end).get())
    }

    add(...args) {
        this.__end.prepend(...args);
        return this
    }

    clear() {
        while (this.__start.get().nextSibling && this.__start.get().nextSibling !== this.__end.get()) content(this.__start.get().nextSibling).remove();
        return this
    }

    set(...args) {
        this.clear();
        return this.add(...args)
    }
}

/**
 * Element builder is an extension of Content (View) adding more methods to manipulate specifically DOM Element. It adds
 * methods to manipulate attributes, CSS styles, and also simple object properties.
 * Each of them can accept vararg parameters containing mix of direct values and observables, which makes the View dynamic
 * also in these aspects, and allows very simple separation of data and view via models.
 */
export class ElementBuilder extends Content {
    constructor(node) {
        super(node);
    }

    add(...args) {
        for (let i = 0; i < args.length; i++) if (args[i] != null) this.get().appendChild(node(args[i]));
        return this
    }

    clear() {
        let node = this.get();
        while (node.firstChild) node.removeChild(node.firstChild);
        return this
    }

    apply(f, ...args) {
        f(this, ...args);
        return this
    }

    _manipulate(f, args) {
        if (args.length === 0) return this
        let value = args.length === 1 ? args[0] : concat(...args)
        if (isObservable(value)) value.observe(f)
        else f(value)
        return this
    }

    set(name, ...args) {
        return this._manipulate(value => value == null ? this.get().removeAttribute(name) : this.get().setAttribute(name, value), args)
    }

    css(property, ...args) {
        return this._manipulate(value => value == null ? this.get().style.removeProperty(property) : this.get().style.setProperty(property, value), args)
    }

    setProperty(name, ...args) {
        return this._manipulate(value => this.get()[name] = (value == null) ? null : value, args)
    }

    on(event, handler, bubble) {
        this.get().addEventListener(event, bubble ? e => handler(this, e) : e => {
            handler(this, e);
            e.preventDefault();
            return false
        });
        return this
    }
}

export function content(node) {
    return new Content(node)
}

export function node(value) {
    return (value instanceof Content) ? value.get() : (value instanceof Node) ? value : isObservable(value) ? observableTextNode(value) : document.createTextNode(value)
}

export function text(value = '') {
    return content(isObservable(value) ? observableTextNode(value) : document.createTextNode(value))
}

export function dynamicFragment(start = text(), end = text()) {
    return new DynamicFragmentBuilder(start, end)
}

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
    let f = dynamicFragment(text(), end);
    model.observe(item => f.add(item == null ? null : itemDisplayFunction(item)));
    return f
}



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

/*export function invert(model) {    return () => model.set(-model.get())}*/
export function remove(content) {
    return () => content.remove()
}

export function clear(content) {
    return () => content.clear()
}

export function show(dialog) {
    return (typeof dialog === 'string') ? () => document.getElementById(dialog).showModal() : () => dialog.get().showModal()
}
