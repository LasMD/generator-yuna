// generated on 2018-08-17 using generator-webapp 3.0.1
var path = require('path');
var exec = require('child_process').spawnSync;

const through = require('through2');
const browserSync = require('browser-sync').create();
const del = require('del');
const favicon = require('favicons').stream;

const rollup = require('rollup');
const { development, production } = require('./rollup.config');

const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const P = gulpLoadPlugins({ lazy: true });
const config = require('./gulp.conf');

const reload = browserSync.reload;

let prod = false;

//UTILITIES SECTION
let js_source = ['lib', 'utils'].join(',');
let css_source = ['components', 'views'].join(',');

/**
 * ===============================
 *        JS RELATED TASKS
 * ===============================
 */

let js_build = async () => {
  let remote = process.env.NODE_ENV === "production" ? true : false;
  let main = new Promise((resolve, reject) => {
    // define if multiple entries are needed
    gulp.src([`${config.js.destination.dev}/main.js`])
      .pipe(P.before(true, `${config.js.destination.build}/`)())
      .pipe(P.if(!prod,
        through.obj(async function (file, enc, callback) {
          let input = path.relative(file.cwd, file.path);

          // resource filename should be the file name of the build resource
          // in development mode. There is no point of compressing
          // files into one resource in dev mode.
          let filename = path.parse(file.path).name;

          let rconf = development();
          let bundle = await rollup.rollup({ input });
          let {
            output
          } = await bundle.generate({
            format: rconf.output.format,
            name: filename,
            globals: rconf.output.globals
          });
          let code = output[0].code;
          file.contents = Buffer.from(code.toString());
          this.push(file);
          callback();
        }),
        through.obj(async function (file, enc, callback) {
          let input = path.relative(file.cwd, file.path);
          let rconf = production(remote);
          let bundle = await rollup.rollup({
            input,
            plugins: rconf.plugins,
          });
          let {
            output
          } = await bundle.generate({
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
  return Promise.resolve(main);
};

/**
 * ===============================
 *        CSS RELATED TASKS
 * ===============================
 */

let css_vendor_libs = async () => {
  let path = `${config.css.destination.dev}/vendor/*.css`;
  return new Promise((resolve, reject) => {
    gulp.src(path)
      .pipe(P.before(true, config.css.destination.temp + "/lib")())
      .pipe(P.if(/\.sass$/gm, P.sass().on('error', P.sass.logError)))
      .pipe(gulp.dest(config.css.destination.temp + "/lib"))
      .on('error', reject)
      .on('end', resolve)
  });
};

let css_process = () => {
  return new Promise((resolve, reject) => {
    gulp.src(config.css.destination.temp + "/lib/*.css")
      .pipe(P.before(true, config.css.destination.build + "/lib")())
      .pipe(gulp.dest(config.css.destination.build + "/lib"))
      .on('error', reject)
      .on('end', resolve)
  });
}

let css_build = () => {
  let paths = [`${config.css.destination.dev}main.scss`];
  return new Promise((resolve, reject) => {
    gulp.src(paths)
      .pipe(P.before(false, `${config.css.destination.build}/`)())
      .pipe(P.if(/\.sass|scss$/gm, P.sass().on('error', P.sass.logError)))
      .pipe(P.postcss(config.css.postcss.plugins))
      .pipe(P.if(prod, P.sourcemaps.init()))
      .pipe(P.if(prod, P.cssnano()))
      .pipe(P.if(prod, P.concat("main.css")))
      .pipe(P.if(prod, P.rev()))
      .pipe(P.if(prod, P.sourcemaps.write(".")))
      .pipe(gulp.dest(config.css.destination.build))
      .on('error', reject)
      .on('end', resolve);
  });
}

/**
 * ===============================
 *   STATIC FILE PROCESSING TASKS
 * ===============================
 */

let html_process = () => {
  return gulp.src(`${config.temp}/*.html`)
    .pipe(P.before(true, `${config.build}/`)())
    .pipe(P.if(prod, P.htmlmin(config.html.minify)))
    .pipe(gulp.dest(config.build));
};

/**
 * ===============================
 *     LOGO AND IMAGE TASKS
 * ===============================
 */
let generate_logo = () => {
  return gulp.src(config.images.logo.dev)
    .pipe(P.before(true, config.images.logo.watch)())
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

/**
 * ===============================
 *       	FONT TASKS
 * ===============================
 */
let fonts_process = () => {
  let path = `${config.fonts.source}/**/*`;
  return gulp.src(path)
    .pipe(P.before(true, `${config.fonts.build}`)())
    .pipe(gulp.dest(`${config.fonts.build}`))
};

/**
 * ===============================
 *       INJECTION TASKS
 * ===============================
 */
let inject = () => {
  var jsstream = gulp.src([/* add necessary js resources */], {
    read: false
  })
  var cssstream = gulp.src([/* add necessary css resources */], {
    read: false
  })

  // dev contains html which is not include common html code snippets
  let paths = `${config.temp}**/*.html`;
  return gulp.src(paths)
    .pipe(P.before(true, `${config.build}/`)())
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
  return gulp.src([config.dev + '/*.*', `!${config.dev}/*.html`], {
    dot: true
  })
    .pipe(P.before(true, `${config.build}/`)())
    .pipe(gulp.dest(config.build));
};

/**
 * ===============================
 *        SERVER CODE TASKS
 * ===============================
 */
let server_process = () => {
  return gulp.src([`${config.server.source}`])
    .pipe(P.before(true, `${config.server.destination}`)())
    .pipe(gulp.dest([`${config.server.destination}`]));
}

/**
 * ===============================
 *        SERVE TASKS
 * ===============================
 */
// this will be change as intergrate other web servers which can work with
// resources. further support will be added in the future
let start_wamp = () => {
  let wamp = new Promise((resolve, reject) => {
    let {
      stdout,
      stderr
    } = exec("net", ["start", "wampapache64"], {
      stdio: 'inherit'
    });
    if (stderr) reject(stderr);
    resolve(stdout);
  });

  let mysql = new Promise((resolve, reject) => {
    let {
      stdout,
      stderr
    } = exec("net", ["start", "wampmysqld64"], {
      stdio: 'inherit'
    });
    if (stderr) reject(stderr);
    resolve(stdout);
  });
  return Promise.all([wamp, mysql]).catch(err => console.log(err));
}

let start_dev = async () => {
  // let options = config.configurations.browserSync.dev;
  let handler = () => {
    return new Promise((resolve, reject) => {
      let link = path.join(__dirname, "deploy.bat");
      let { stderr } = exec(link, ["development"], { stdio: "inherit" });
      if (stderr) {
        reject(stderr);
      }
      // reload();
      resolve();
    });
  };
  await handler();

  // browserSync.init(options);
  let htmlRes = [config.html.source + "*.html"];
  gulp.watch(htmlRes, gulp.series('inject', handler));
  //css libraries and source  code handler for app
  gulp.watch([`${config.css.destination.temp}/lib/*.css`], gulp.series("css:process", handler));
  //css source file compilation
  gulp.watch([`${config.css.destination.dev}**/*.scss`, `!${config.css.destination.dev}/shame/*`], gulp.series("css:build", handler));
  //js libraries and source code handler for app
  gulp.watch([`${config.js.destination.dev}**/*.js`], gulp.series("js:build", handler));
};

let serve_prod = () => {

};

/**
 * ===============================
 *        TASK DEFINITIONS
 * ===============================
 */
//JS SECTION
gulp.task('js:build', js_build);

// CSS SECTION 
gulp.task('css:vendor-libs', css_vendor_libs); //unique task which only executed when postinstall bower prehook
gulp.task('css:process', css_process);
gulp.task('css:build', css_build);

//Image section
gulp.task('gen:logo', generate_logo);

gulp.task('fonts:process', fonts_process);

gulp.task('html:process', html_process);

gulp.task("inject", inject);

gulp.task('extras', process_extras);
gulp.task('server:process', server_process);

gulp.task('clean', clean);

gulp.task('start-server', start_wamp);
gulp.task('start-app:dev', start_dev);

gulp.task("env:dev", () => Promise.resolve(process.env.NODE_ENV = "development"));
gulp.task("env:prod", () => Promise.resolve(process.env.NODE_ENV = "production"));

gulp.task("serve:dev",
  gulp.series(
    'clean',
    "env:dev",
    gulp.parallel(
      gulp.series('js:build'),
      gulp.series('css:vendor-libs', 'css:build'),
      gulp.series('gen:logo')
    ),
    'inject',
    'start-server',
    'start-app:dev'
  ));

gulp.task("serve:prod",
  gulp.series(
    'clean',
    "env:prod",
    gulp.parallel(
      gulp.series('js:build'),
      gulp.series('css:vendor-libs', 'css:build')
    ),
    'inject',
    'html:process',
    'start-server',
    'start-app:dev'
  ));
