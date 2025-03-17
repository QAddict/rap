/*
 * Copyright (c) 2024-2024 Ondrej Fischer
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import {Observable, state, stateModel, transform, TransformedState} from "./mvc.js";

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

    triggerOnUriChanges() {
        return this.triggerOnChanges(this.uri)
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
                request.onerror(null)
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
        return this
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
