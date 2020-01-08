// generated on 2018-08-17 using generator-webapp 3.0.1
var path = require('path');
var exec = require('child_process').spawnSync;

const gulp = require('gulp');
const bower = require('bower');

const File = require('vinyl');
const through = require('through2');
const lazypipe = require("lazypipe");
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const rollup = require('rollup');
const favicon = require('favicons').stream;
const P = gulpLoadPlugins({
  lazy: true
});

let prod = false;
const {development, production, libraries} = require('./rollup.config');
const config = require('./gulp.conf');
const reload = browserSync.reload;


//UTILITIES SECTION
let js_source = ['components', 'utils', 'lib'].join(',');
let css_source = ['components', 'views'].join(',');

let before = function (watch, path) {
  return lazypipe()
    .pipe(function () {
      return P.if(watch, P.changed(path))
    })
    .pipe(() => P.plumber())
    .pipe(() => P.print.default());
};

let fetch_resources = function (list = [''], proc = "npm", ext) {
  return new Promise((resolve, reject) => {
    if (proc === "npm") {
      var paths = list.filter((pac) => require.resolve(pac).match(`\.(?:${ext})$`))
        .map((pac) => require.resolve(pac));
      resolve(Array.from(paths));
    } else if (proc === "bower") {
      bower
        .commands
        .list({
          paths: true,
          json: true
        })
        .on('error', (error) => reject(error))
        .on('end', (result) => {
          var pacs = JSON.parse(JSON.stringify(result));
          var paths = list.filter((pac) => !pac.startsWith('!') && pacs[pac].match(`\.(?:${ext})$`))
            .map((pac) => path.join(__dirname, pacs[pac]));
          resolve(Array.from(paths));
        });
    }
  });
}

/**
 * ===============================
 *        JS RELATED TASKS
 * ===============================
 */
let js_fetch_libs = async function () {
  var paths = await fetch_resources(["ky", "page"], "npm", "js");
  return new Promise((resolve, reject) => {
    gulp.src(paths, {cwd: process.cwd()})
      .pipe(before(true, config.js.destination.dev + "/lib")())
      .pipe(through.obj(function (file, enc, callback) {
        let stats = path.parse(file.path);
        let dir = path.dirname(stats.dir);
        let name = path.relative(dir, stats.dir);
        let res = `${name}${stats.ext}`;
        let base = path.join(process.cwd(), '/app/scripts/lib');

        let pass = new File({
          cwd: './',
          base: './app/scripts/',
          contents: file.contents,
          path: `${base}/${res}`
        });
        this.push(pass);
        callback();
      }))
      .pipe(gulp.dest(`${config.js.destination.dev}`))
      .on('error', reject)
      .on('end', resolve);
  });
}

let js_process = () => {
  //prepairing library files to behave as normal browser modules
  //because module.exports or export default won't
  //support when using browser
  return new Promise((resolve, reject) => {
    gulp.src(`${config.js.destination.dev}{${js_source}}/*.js`, {read: false})
      .pipe(before(true, `${config.js.destination.temp}/`)())
      //no need to check whether if it is development or not because
      //js_process isn't included in production build
      //pipeline
      .pipe(through.obj(async function (file, enc, callback) {
        let ref = path.relative(file.cwd, file.path);
        var cfg = libraries(ref);
        let bundle = await rollup.rollup({
          input: cfg.input.file,
          plugins: cfg.plugins
        });
        let {output} = await bundle.generate({
          name: cfg.output.name,
          format: cfg.output.format,
          exports: 'named'
        })
        let code = output[0]['code']
        file.contents = Buffer.from(code.toString());
        this.push(file);
        callback();
      }))
      .pipe(gulp.dest(`${config.js.destination.temp}`))
      .on('end', resolve)
      .on('error', reject);
  });
};

let js_build = async () => {
  let minify = process.argv ? (process.argv[2] === "-m" || process.argv[2] === "--minify") : false;
  let resources = new Promise((resolve, reject) => {
    if (!prod) {
      gulp.src([`${config.js.destination.temp}/{${js_source}}/*.js`])
        .pipe(before(true, `${config.js.destination.build}/`)())
        .pipe(gulp.dest(`${config.js.destination.build}/`))
        .on('end', resolve)
        .on('error', reject);
    } else {
      resolve();
    }
  });

  let main = new Promise((resolve, reject) => {
    gulp.src(`${config.js.destination.dev}/main.js`)
      .pipe(before(false, `${config.js.destination.build}/`)())
      .pipe(P.if(!prod,
        through.obj(async function (file, enc, callback) {
          let ref = path.relative(file.cwd, file.path);
          let rconf = development();
          let bundle = await rollup.rollup({
            input: ref,
            external: rconf.input.external,
            inlineDynamicImports: true
          });
          let {output} = await bundle.generate({
            format: rconf.output.format,
            name: rconf.output.name,
            globals: rconf.output.globals
          });
          let code = output[0].code;
          file.contents = Buffer.from(code.toString());
          this.push(file);
          callback();
        }),
        through.obj(async function (file, enc, callback) {
          let ref = path.relative(file.cwd, file.path);
          let rconf = production(minify);
          let bundle = await rollup.rollup({
            input: ref,
            plugins: rconf.plugins,
            inlineDynamicImports: true
          });
          let {output} = await bundle.generate({
            format: rconf.output.format,
            name: rconf.output.name,
          });
          let code = output[0]['code'];
          file.contents = Buffer.from(code.toString());
          this.push(file);
          callback();
        })
      ))
      .pipe(gulp.dest(`${config.js.destination.build}`))
      .on('error', reject)
      .on('end', resolve);
  });
  return Promise.all([resources, main]);
};

/**
 * ===============================
 *        CSS RELATED TASKS
 * ===============================
 */

let css_purge_libs = async () => {
  var pacs = ["!bootstrap", "bulma", "animate.css"];
  var paths = await fetch_resources(pacs, "bower", "css|sass");
  return new Promise((resolve, reject) => {
    gulp.src(paths)
      .pipe(before(true, config.css.destination.temp + "/lib")())
      .pipe(P.if(/\.sass$/gm, P.sass().on('error', P.sass.logError)))
      .pipe(gulp.dest(config.css.destination.temp + "/lib"))
      .on('error', reject)
      .on('end', resolve)
  });
};

let css_process = () => {
  return new Promise((resolve, reject) => {
    gulp.src(config.css.destination.temp + "/lib/*.css")
      .pipe(before(true, config.css.destination.build + "/lib")())
      .pipe(gulp.dest(config.css.destination.build + "/lib"))
      .on('error', reject)
      .on('end', resolve)
  });
}

let css_build = () => {
  let paths = [`${config.css.destination.dev}main.scss`];
  return gulp.src(paths)
    .pipe(before(true, `${config.css.destination.build}/`)())
    .pipe(P.if(/\.sass|scss$/gm, P.sass().on('error', P.sass.logError)))
    .pipe(P.postcss(config.css.postcss.plugins))
    .pipe(P.if(prod, P.sourcemaps.init()))
    .pipe(P.if(prod, P.cssnano()))
    .pipe(P.if(prod, P.concat("main.css")))
    .pipe(P.if(prod, P.rev()))
    .pipe(P.if(prod, P.sourcemaps.write(".")))
    .pipe(gulp.dest(config.css.destination.build));

}

/**
 * ===============================
 *   STATIC FILE PROCESSING TASKS
 * ===============================
 */
let html_minify = () => {
  return gulp.src(`${config.dev}/*.html`)
    .pipe(before(true, `${config.build}/`)())
    .pipe(P.htmlmin({
      collapseWhitespace: true,
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
    }))
    .pipe(gulp.dest(config.build));
};

/**
 * ===============================
 *     LOGO AND IMAGE TASKS
 * ===============================
 */
let generate_logo = () => {
  return gulp.src(config.images.logo.dev)
    .pipe(before(true, config.images.logo.watch)())
    .pipe(gulp.dest(config.images.logo.watch))
    .pipe(favicon({
      "icons": {
        "android": false,
        "appleIcon": true,
        "appleStartup": false,
        "coast": false,
        "favicons": true,
        "firefox": false,
        "windows": false,
        "yandex": false
      }
    }))
    .pipe(gulp.dest(config.images.logo.build));
}

let images_retinate = () => { //generate quality images from HD
  return new Promise((resolve, reject) => {
    gulp.src(config.images.source + "/assets/*.{jpg,png,jpeg}")
      .pipe(before(true, config.images.build + "/assets")())
      .pipe(P.retinate(config.images.retina))
      .pipe(gulp.dest(config.images.build + "/assets"))
      .on('error', reject)
      .on('end', resolve);
  });
}

let images_process = () => { //minify images for web
  return new Promise((resolve, reject) => {
    gulp.src(config.images.build + "/**/*.{jpg, png, jpeg}")
      .pipe(before(true, `${ config.images.build}/`)())
      .pipe(P.imagemin())
      .pipe(gulp.dest(config.images.build))
      .on('error', reject)
      .on('end', resolve);
  });
};

/**
 * ===============================
 *       INJECTION TASKS
 * ===============================
 */
let inject = () => {
  var jsstream = gulp.src([`${config.js.destination.build}/{${js_source}}/*.js`, `${config.js.destination.build}/*.js`], {read: false})
  var cssstream = gulp.src([`${config.css.destination.build}/lib/*.css`, `${config.css.destination.build}/**/*.css`], {read: false})

  return gulp.src(`${config.dev}**/*.html`)
    .pipe(before(false, `${config.build}/`)())
    .pipe(P.inject(jsstream, config.js.inject))
    .pipe(P.inject(cssstream, config.css.inject))
    .pipe(gulp.dest(config.build));
};


/**
 * ===============================
 *        UTILITY TASKS
 * ===============================
 */
let clean = async () => {
  return new Promise((resolve, reject) => {
    del(['.tmp', 'build'])
      .then(r => resolve())
      .catch(e => reject());
  });
}

let process_extras = () => {
  return gulp.src([config.dev + '/*.*', `!${config.dev}/*.html`], {dot: true})
    .pipe(before(true, `${config.build}/`)())
    .pipe(gulp.dest(config.build));
};

/**
 * ===============================
 *        SERVER CODE TASKS
 * ===============================
 */
let server_process = ()=> {
  return gulp.src([`${config.server.source}`])
    .pipe(before(true, `${config.server.destination}`)())
    .pipe(gulp.dest([`${config.server.destination}`]));
}

/**
 * ===============================
 *        SERVE TASKS
 * ===============================
 */
let start_wamp = () => {
  let wamp = new Promise((resolve, reject) => {
    let {stdout, stderr} = exec("net", ["start", "wampapache64"], {stdio: 'inherit'});
    if (stderr) reject(stderr);
    resolve(stdout);
  });

  let mysql = new Promise((resolve, reject) => {
    let {stdout, stderr} = exec("net", ["start", "wampmysqld64"], {stdio: 'inherit'});
    if (stderr) reject(stderr);
    resolve(stdout);
  });
  return Promise.all([wamp, mysql]).catch(err => console.log(err));
}

let serve_dev = async () => {
  let options = config.configurations.browserSync.dev;
  let handler = () => {
    return new Promise((resolve, reject) => {
      // let link = path.join(__dirname, "deploy.bat");
      // let {stderr} = exec(link, ["development"], {stdio: "inherit"});
      // if (stderr) {
      //   reject(stderr);
      // }
      // reload();
      resolve();
    });
  };
  await handler();

  // browserSync.init(options);
  gulp.watch([`${config.presentation.html.main}`, `${config.presentation.html.res}`], gulp.series('css:process', handler));
  //css libraries and source code handler for app
  gulp.watch([`${config.css.destination.temp}/lib/*.css`], gulp.series("css:process", "css:build", handler));
  //css source file compilation
  gulp.watch([`${config.css.destination.dev}**/*.{css, sass, scss}`], gulp.series("css:build", handler));
  //js libraries and source code handler for app
  gulp.watch([`${config.js.destination.dev}**/*.js`], gulp.series("js:process", "js:build", handler));
};

let serve_prod = () => {

};

/**
 * ===============================
 *        TASK DEFINITIONS
 * ===============================
 */
//JS SECTION
gulp.task('js:fetch-libs', js_fetch_libs); //unique task which only executed when postinstall node prehook
gulp.task('js:process', js_process);
gulp.task('js:build', js_build);

// CSS SECTION 
gulp.task('css:purge-libs', css_purge_libs); //unique task which only executed when postinstall bower prehook
gulp.task('css:process', css_process);
gulp.task('css:build', css_build);

//Image section
gulp.task('gen:logo', generate_logo);
gulp.task('images:retinate', images_retinate);
gulp.task('images:process', images_process);
gulp.task("inject", inject);
gulp.task('html:minify', html_minify);

gulp.task('extras', process_extras);
gulp.task('server:process', server_process);

gulp.task('clean', clean);

gulp.task('start-server', start_wamp);
gulp.task('serve-app:dev', serve_dev);
gulp.task("serve:dev",
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series('js:fetch-libs', 'js:process', 'js:build'),
      gulp.series(css_purge_libs, css_build),
      gulp.series('gen:logo', 'images:retinate', 'images:process')
    ),
    'inject',
    'start-server',
    'serve-app:dev'
  ));

gulp.task("serve:prod",
  gulp.series(
    'clean',
    gulp.parallel(
      gulp.series('js:build'),
      gulp.series(css_purge_libs, css_build)
    ),
    'inject',
    'start-server',
    'serve-app:dev'
  ));