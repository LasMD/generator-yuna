"use strict"

let util = require("./text");
let http = require("http");


/**
 * fetch the library version from npm registry
 * @param {name of the library which the version is inquired} name 
 * @returns Promise
 */
let get = name => new Promise(resolve => {
  let finaldata = "";
  http.get(util.createpath`http://registry.npmjs.com/${name}`, (response) => {

    response.setEncoding("utf-8");
    let { statusCode } = response;
    let result = {};
    response
      .on('data', (data) => finaldata = finaldata.concat(data))
      .on('end', () => {
        if (statusCode === 200) {
          result['data'] = finaldata
          result['error'] = 0;
        } else if (statusCode === 404) {
          result['data'] = {};
          result['error'] = 1
        } else {
          //for network related errors
          //5xx, 3xx
          result['data'] = {};
          result['error'] = -1;
        }
        resolve(result);
      });
  });
});

module.exports.get = get;