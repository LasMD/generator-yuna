"use strict"

var util = require("./text.js");
var web = require("./web.js");

let cachedInquirer = {};

/**
 * compute the processor and fromNPM back
 * the current version for the given
 * library from npm
 * 
 * @param {string} field:- field name to check as for the previous value
 * @param {string | function} func:- function or string value for the field
 * @return string current libraryversion
 */
let getVersionQuestion = async function ({field, processor}) {
  if(typeof processor === 'function') {
    processor = processor(cachedInquirer);
  }
  
  let versions = await web.get(processor);
  let {data, error} = versions;
  
  let tags;
  if(error === 0 ) {
    tags = JSON.parse(data)['dist-tags'];
  } else {
    return void 0;
  }

  var beautifiedName = util.beautify(processor);
  // retuning the question from abstracted data from npm registry
  return {
    when: (inquirer) => inquirer[field],
    type: "list",
    name: field + "Version",
    message: _ => `Which ${beautifiedName} version would you preffer?`,
    choices: inquirer => { //inquirer object
      cachedInquirer = inquirer;
      return Object.keys(tags)
        .map(key => {
          return {
            name: "v" + tags[key],
            value: tags[key],
            short: tags[key]
          }
        });
    }
  }
};

module.exports.getVersionQuestion = getVersionQuestion;
