import {Model, state, stateModel, TransformedState} from "./mvc.js";

export function fromJson(initialValue = null) {
    return new TransformedState(request => request == null ? null : JSON.parse(request.responseText), initialValue)
}

export function fromText(initialValue = null) {
    return new TransformedState(request => request == null ? null : request.responseText, initialValue)
}

function observeRequest(method, uri, state, result) {
    let request = new XMLHttpRequest()
    state.set({state: XMLHttpRequest.UNSENT, loaded: 0, loading: false})
    request.onreadystatechange = () => {
        if(request.readyState === XMLHttpRequest.DONE) if(request.status === 200 || request.status === 0) try {
            result.set(request)
        } catch (error) {
            request.onerror(null)
        } else {
            request.onerror(null)
        }
    }
    request.onprogress = event => state.set({
        state: XMLHttpRequest.LOADING,
        total: event.total,
        loaded: event.loaded,
        loading: true
    })
    request.onerror = () => state.set({
        state: XMLHttpRequest.DONE,
        loading: false,
        request: request
    })
    request.open(method, uri.get())
    return request
}

export class Channel extends Model {

    constructor(uri) {
        super();
        this.uri = stateModel(uri)
        this.output = state(fromJson())
        this.setStateModel(state({state: XMLHttpRequest.UNSENT, loading: false}))
    }

    setOutput(output) {this.output = output;return this}
    request(method) {return observeRequest(method, this.uri, this.state, this.output)}
    setStateModel(stateModel) {this.state = stateModel;return this}
    set(newValue) {this.output.set(newValue);return this}
    get() {return this.output.get();}
    observe(observer) {this.output.observe(observer);return this}
    observeChanges(observer) {this.output.observeChanges(observer);return this}
    triggerOn(...input) {input.forEach(i => i.observe(() => this.trigger())); return this}
    triggerOnChanges(...input) {input.forEach(i => i.observeChanges(() => this.trigger())); return this}
}


class GetChannel extends Channel {
    constructor(uri) {super(uri);}
    trigger() {this.request("GET").send(); return this}
}

export function get(uri) {
    return new GetChannel(uri)
}

class PostChannel extends Channel {
    constructor(uri, body, format, contentType = 'application/json') {
        super(uri);
        this.body = stateModel(body);
        this.__format = format
        this.contentType = contentType
    }

    trigger() {
        let r = this.request("POST")
        if(this.contentType)
            r.setRequestHeader('Content-Type', this.contentType)
        r.send(this.__format(this.body.get()));
        return this
    }

}

export function post(uri, input, format = JSON.stringify) {
    return new PostChannel(uri, state(input), format)
}
