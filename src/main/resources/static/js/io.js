import {Observable, state, stateModel, transform, TransformedState} from "./rap.js";

export function fromJson(initialValue = null) {
    return new TransformedState(request => request == null ? null : JSON.parse(request.responseText), initialValue)
}

export function fromText(initialValue = null) {
    return new TransformedState(request => request == null ? null : request.responseText, initialValue)
}

/**
 * Represents a Channel for making HTTP requests.
 * @extends Observable
 */
export class Channel extends Observable {

    constructor(method, uri, headers = {}) {
        super();
        this.method = method
        this.uri = stateModel(uri)
        this.output = state(fromJson())
        this.setBodyModel({})
        this.headers = headers
        this.setStateModel(state({state: XMLHttpRequest.UNSENT, loading: false}))
    }

    setOutputModel(output) {
        this.output = output;
        return this
    }

    setStateModel(stateModel) {
        this.state = stateModel;
        return this
    }

    set(newValue) {
        this.output.set(newValue);
        return this
    }

    setState(newValue) {
        this.state.set(newValue);
        return this
    }

    setBodyModel(model) {
        this.body = state(model);
        return this
    }

    get() {
        return this.output.get();
    }

    observe(observer) {
        this.output.observe(observer);
        return this
    }

    observeChanges(observer) {
        this.output.observeChanges(observer);
        return this
    }

    triggerOn(...input) {
        input.forEach(i => i.observe(() => this.trigger()));
        return this
    }

    triggerOnUri() {
        return this.triggerOn(this.uri)
    }

    triggerOnChanges(...input) {
        input.forEach(i => i.observeChanges(() => this.trigger()));
        return this
    }

    trigger() {
        let request = new XMLHttpRequest()
        this.setState({state: XMLHttpRequest.UNSENT, loaded: 0, loading: false})
        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE) if (request.status === 200 || request.status === 0) try {
                this.set(request)
            } catch (error) {
                request.onerror(null)
            }
            else {
                request.onerror(null)
            }
        }
        request.onprogress = event => this.setState({
            state: XMLHttpRequest.LOADING,
            total: event.total,
            loaded: event.loaded,
            loading: true
        })
        request.onerror = () => this.setState({state: XMLHttpRequest.DONE, loading: false, request: request})
        request.open(this.method, this.uri.get())
        Object.entries(this.headers).forEach(([key, value]) => request.setRequestHeader(key, value))
        request.send(this.body.get())
        return request
    }

}

export function isChannel(object) {
    return object instanceof Channel
}

/**
 * Creates a new Channel object for making HTTP GET requests.
 *
 * @param {string} uri - The uri to send the GET request to.
 * @returns {Channel} - The newly created Channel object.
 */
export function get(uri) {
    return new Channel("GET", uri)
}

/**
 * Sends a POST request to the specified URI with the input data in JSON format.
 *
 * @param {string} uri - The URI to send the request to.
 * @param {object} input - The input data to send in JSON format.
 * @returns {Channel} - The Channel object used for the request.
 */
export function postJson(uri, input) {
    return new Channel("POST", uri, {'Content-Type': 'application/json'}).setBodyModel(transform(input, JSON.stringify))
}

/**
 * Sends a POST request with form data to the specified URI.
 *
 * @param {string} uri - The URI to send the request to.
 * @param {object} input - The form data to send with the request.
 * @returns {Channel} - A new instance of the Channel class representing the POST request.
 */
export function postForm(uri, input) {
    return new Channel("POST", uri).setBodyModel(input)
}
