let camelCase = require('lodash.camelcase');
var strip = require("strip-ansi");

/**
 * characters like [@'"/-] will be stripped and
 * the first charactor of the second word
 * delimetered by abover characters
 * will be capitalized
 * 
 * @param {name of the package to be beautified} name 
 * @returns string
 */
let beautify = name => camelCase(name);

/**
 * This method is made in awear of 
 * tagged template literals
 * strings
 */
let createpath = (xpath, package) => xpath[0].concat(package)

/**
 * strip out ansi-colors
 * from the input text
 */
let ansiStrip = input => strip(input);

module.exports.beautify = beautify;
module.exports.ansiStrip = ansiStrip;
module.exports.createpath = createpath;