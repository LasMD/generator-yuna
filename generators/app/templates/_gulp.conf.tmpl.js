const dev = "app/";
const styles = dev + "styles/";
const js = dev + "scripts/";
const temp = ".tmp/";
const build = "build/";
const assets = "assets/"


//postcss plugin declarations
let autoprefixplugin = require("autoprefixer");
let flexbugs = require("postcss-flexbugs-fixes");
let cssutils = require("postcss-utilities");

//utilities
let browsers = ['last 5 versions', '> 5%'];
module.exports = {
  dev,
  temp,
  build,
  css: {
    source: styles + "/*.scss",
    destination: {
      temp: temp + "styles",
      dev: styles,
      build: build + "styles"
    },
    postcss: {
      plugins: [
        cssutils(),
        autoprefixplugin(browsers),
        flexbugs()
      ]
    },
    inject: {
      starttag: "<!-- inject:css -->",
      endtag: "<!-- endinject -->",
      ignorePath: "/build/"
    },
  },
  js: {
    source: js + "**/*.js",
    destination: {
      temp: temp + "js",
      dev: js,
      build: build + "js"
    },
    inject: {
      starttag: "<!-- inject:js -->",
      endtag: "<!-- endinject -->",
      ignorePath: "/build/"
    },
  },
  images: {
    logo: {
      watch: `${temp}${assets}/images/`,
      dev: `${dev}${assets}images/logo.svg`,
      build: build
    },
    source: `${dev}${assets}/images`,
    build: `${build}/images`
  },
  fonts: {
    source: `${dev}${assets}{fonts,icon-fonts}`,
    build: `${build}/styles/`
    // if needed
    // configure font related configuration here
  },
  server: {
    source: "server/**/*.php",
    destination: `${build}/server`
  },
  html: {
		source: dev,
		minify: {
      collapseWhitespace: true,
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
		}
  },
  configurations: {
    browserSync: {
      dev: {
        notify: true,
        proxy: "http://<%=project.name%>.test",
        ghostMode: {
          clicks: true,
          scroll: true,
          forms: true
        },
        injectChanges: true,
        reloadDelay: 1
      },
      prod: {
        notify: false,
        proxy: 'http://<%=project.name%>.test',
        reloadDelay: 1
      }
    }
	},
};
