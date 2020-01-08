var resolve = require('rollup-plugin-node-resolve');
var common = require('rollup-plugin-commonjs');
var fsize = require('rollup-plugin-filesize');
var uglify = require('rollup-plugin-uglify');
var babel = require('rollup-plugin-babel');
var hash = require('rollup-plugin-hash');

var path = require('path');

var babel_config = require('./babel.config');
let development = function () {

  let input = {
		external: ["jquery"]
  }

  let output = {
    format: "umd",
    globals: {
			"jquery": "$"
    }
  }

  return {
    input,
    output
  }
}

let libraries = function () {
	let input = {}

	// some libraries depends on other libraries
	// should declare them as external even
	// to the current build
	let external = ["@google/maps"];
	let globals = {
		"@google/maps": "google"
	};

  let output = {
    format: "umd"
	}
	
	let paths = {
		"google":"https://www.google.com"
	}

  return {
    input,
		output,
		external,
		globals,
		paths,
    plugins: [
      common(),
      resolve({
        main: true,
        browser: true,
        jsnext: true,
        module: true
      }),
    ]
  }
}

let production = function (minify) {
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
      (minify) ? uglify() : "",
      hash({
        replace: true,
        dest: "main.[hash:10].js"
      })
    ]
  }
}


module.exports = {
  development,
  production,
  libraries
}
