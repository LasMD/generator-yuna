/**
 * Method for parsing npm package names stripping out
 * @, /, - signs from the given string
 * and returns
 */

let upper = require('lodash.upperfirst');
let stripname = function (xname) {
  const regex = /^[@]?([a-zA-Z]+)[\/-]/;
  let m;
  if ((m = regex.exec(xname)) !== null) {
    return m[1];
  } else {
    return xname;
  }
};

let replace = function (xname) {
  var name = "";
  var fracts = xname.replace("@", "").split(/\//);
  var package = fracts[0];
  var core = fracts[1];
  name = name.concat(package);

  if (fracts.length > 1) {
    name = name.concat(upper(core));
  }
  return name;
}

/**
 * This method is made in awear of 
 * tagged template literals
 * strings
 */
let createpath = function (xpath, package) {
  return xpath[0].concat(package);
}

module.exports.stripname = stripname;
module.exports.replace = replace;
module.exports.createpath = createpath;
