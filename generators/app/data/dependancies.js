/**
 * todo: find and alternative way to get rid of
 * unwanted dependancies installed out to
 * the final repository
 *
 * frontend ops modules
 * favicons, sharp => general module
 * gulp-imagemin, gulp-retinate, gulp-sitemap => builder module
 */
module.exports = {
  general: [
    "autoprefixer",
    "browser-sync",
    "del",
    "ky",
    "include-media",
    "favicons",
  ],

  linter: ["eslint"],

  transpiler: [
    { "@babel/plugin-external-helpers": ["@babel/core"] },
    { "@babel/plugin-transform-runtime": ["@babel/core"] },
    { "@babel/preset-env": ["@babel/core"] },
    { "@babel/register": ["@babel/core"] },
    { "@babel/runtime": ["@babel/core"] },
  ],
  cssPreprocessor: [
    { "postcss-flexbugs-fixes": ["postcss"] },
    { "postcss-utilities": ["postcss"] },
  ],
  builder: [
    "vinyl",
    "through2",
    { "gulp-autoprefixer": ["gulp"] },
    { "gulp-changed": ["gulp"] },
    { "gulp-concat": ["gulp"] },
    { "gulp-cssnano": ["gulp"] },
    { "gulp-htmlmin": ["gulp"] },
    { "gulp-if": ["gulp"] },
    { "gulp-inject": ["gulp"] },
    { "gulp-load-plugins": ["gulp"] },
    { "gulp-plumber": ["gulp"] },
    { "gulp-print": ["gulp"] },
    { "gulp-rename": ["gulp"] },
    { "gulp-rev": ["gulp"] },
    { "gulp-sass": ["gulp"] },
    { "gulp-sourcemaps": ["gulp"] },
    { "gulp-uglify": ["gulp"] },
    { "gulp-before": ["gulp"] },
    { "gulp-postcss": ["gulp", "postcss"] },
  ],
  bundler: [
    { "rollup-plugin-commonjs": ["rollup"] },
    { "rollup-plugin-filesize": ["rollup"] },
    { "rollup-plugin-hash": ["rollup"] },
    { "rollup-plugin-node-resolve": ["rollup"] },
    { "rollup-plugin-uglify": ["rollup"] },
    { "rollup-plugin-babel": ["rollup", "babel"] },
  ],
  frontendLibrary: ["lit-html", "react", "vue", "svelt", "jquery"],
  stateManagement: ["beedle", "redux"],
};
