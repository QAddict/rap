import {state} from "./StateModel.js";
import {usingTemplate} from "./functions.js";
import {Channel, fromJson} from "./Channel.js";

/**
 * POST channel.
 */
class PostChannel extends Channel {

    constructor(uri, input, output) {
        super(usingTemplate(uri), input, output);
    }

    trigger() {
        let post = this.request("POST")
        post.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
        post.send(JSON.stringify(this.input.get()))
        return this
    }

}

export function postChannel(uri, input, result = fromJson()) {
    return new PostChannel(uri, state(input), state(result))
}
