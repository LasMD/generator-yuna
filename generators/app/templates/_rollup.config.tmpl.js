var resolve = require('rollup-plugin-node-resolve');
var common = require('rollup-plugin-commonjs');
var fsize = require('rollup-plugin-filesize');
var uglify = require('rollup-plugin-uglify');
var babel = require('rollup-plugin-babel');
var hash = require('rollup-plugin-hash');

var babel_config = require('./babel.config');
let development = function () {

  let input = {}

  let output = {
    format: "umd"
  }

  return {
    input,
    output
  }
}

// minify will be happen as the last step of the bundling process.
// before shipped out to production environment, there are
// certain checks needs to be done hence a minify check
// is necessary
let production = function (remote) {
  let input = {}
  let output = {
    format: "iife",
    name: "main"
  }

  return {
    input,
    output,
    plugins: [
      resolve({
        jsnext: true,
        main: true,
        browser: true,
        module: true
      }),
      common({
        include: 'node_modules/**'
      }),
      babel({ ...babel_config,
        runtimeHelpers: true,
        sourceMaps: false,
        babelrc: false,
        exclude: [/core-js/, /runtime/]
      }),
      fsize(),
      (remote) ? uglify() : "", 
      (remote) ? hash({
        replace: true,
        dest: "main.[hash:10].js"
      }): ""
    ]
  }
}


module.exports = {
  development,
  production,
  libraries
}
