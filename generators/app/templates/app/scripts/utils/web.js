import ky from "ky";

export const controller = new AbortController();
export const {signal} = controller.signal;

/**
 * factory function to enclose ky object so that there is no 
 * need to ask for the specific api.
 * @param {ky|Object} http 
 * @param {String|get} method 
 */
export const createRequest = (http, method = "get")=> {
    let request = http[method];
    return async url=> {
        return await request(url, {signal});
    }
}

export let GET = createRequest(ky);
export let POST = createRequest(ky, "post");