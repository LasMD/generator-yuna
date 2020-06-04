let map = new Map();
//each key for the map should be an absolute path
//considerting the root as the templates
//directory and values be the token
//names given to each categorized
//dependancies
map.set(".eslintignore", "linter");
map.set(".eslintrc", "linter");
map.set("babel.config.js", "transpiler");
map.set("gulp.conf.js", "builder");
map.set("Gulpfile.js", "builder");
map.set("rollup.config.js", "bundler");
module.exports = map;