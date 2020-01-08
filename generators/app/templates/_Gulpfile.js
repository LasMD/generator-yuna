// generated on 2018-08-17 using generator-webapp 3.0.1
var path = require('path');
var exec = require('child_process').spawnSync;

const gulp = require('gulp');
const bower = require('bower');

const sharp = require('sharp');

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

// custom Written Plugins
const htmlInject = require('./node_modules/gulp-html-inject');

let prod = false;
const {
  development,
  production,
  libraries
} = require('./rollup.config');
const config = require('./gulp.conf');
const reload = browserSync.reload;


//UTILITIES SECTION
let js_source = ['lib', 'utils'].join(',');
let css_source = ['components', 'views'].join(',');

let before = function (watch, path) {
  return lazypipe()
    .pipe(function () {
      return P.if(_=> {
				if(typeof watch === 'boolean') {
					return watch;
				} else if( typeof watch === 'function') {
					if(process.argv['configuration'] !== undefined) {
						let {configuration} = process.argv;
						return watch(configuration);
					}
					return watch({partials: false});
					
				}
			}, P.changed(path))
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
  var paths = await fetch_resources(["jquery", "jquery-ui", "jquery-zoom", "jquery.nicescroll", "slicknav", "owl.carousel", "bootstrap"], "npm", "js");
  return new Promise((resolve, reject) => {
    gulp.src(paths)
      .pipe(before(true, config.js.destination.dev + "/lib")())
      .pipe(through.obj(function (file, enc, callback) {
        let stats = path.parse(file.path);
        let name = stats.name;
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
    gulp.src(`app/scripts/{${js_source}}/*.js`)
      .pipe(before(true, `${config.js.destination.temp}/`)())
      //no need to check whether if it is development or not because
      //js_process isn't included in production build
      //pipeline
      .pipe(P.if((file)=> {
				// conditional function for filter 3rd Party libraries
				let stats = path.parse(file.path);
				return !/lib/.test(stats.dir);
			},through.obj(async function (file, enc, callback) {
				let relativeName = path.relative(process.cwd(), file.path);
				let filename = path.parse(file.path).name;
				var cfg = libraries();
        let bundle = await rollup.rollup({
					input: relativeName,
					plugins: cfg.plugins,
					external: cfg.external
        });
        let { output } = await bundle.generate({
          name: filename,
					format: cfg.output.format,
					paths: cfg.paths,
					globals: cfg.globals
        })
        let code = output[0]['code']
        file.contents = Buffer.from(code.toString());
        this.push(file);
        callback();
      })))
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
    // define if multiple entries are needed
    gulp.src([`${config.js.destination.dev}/main.js`])
      .pipe(before(true, `${config.js.destination.build}/`)())
      .pipe(P.if(!prod,
        through.obj(async function (file, enc, callback) {
          let ref = path.relative(file.cwd, file.path);

          // resource filename should be the file name of the build resource
          // in development mode. There is no point of compressing
          // files into one resource in dev mode.
          let filename = path.parse(file.path).name;

          let rconf = development();
          let bundle = await rollup.rollup({
            input: ref,
            external: rconf.input.external
          });
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
          let ref = path.relative(file.cwd, file.path);
          let rconf = production(minify);
          let bundle = await rollup.rollup({
            input: ref,
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
  return Promise.all([resources, main]);
};

/**
 * ===============================
 *        CSS RELATED TASKS
 * ===============================
 */

let css_purge_libs = async () => {
  // var pacs = ["!bootstrap", "bulma", "animate.css"];
	// var paths = await fetch_resources(pacs, "npm", "css|sass");
	let path = `${config.css.destination.dev}/vendor/*.css`;
  return new Promise((resolve, reject) => {
    gulp.src(path)
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
  return new Promise((resolve, reject) => {
    gulp.src(paths)
      .pipe(before(false, `${config.css.destination.build}/`)())
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
let html_inject_partials = () => {
  return gulp.src([`${config.html.source}/*.html`, `!${config.html.source}partials/*.html`])
    .pipe(before(configurations=> {
			let {partials} = configurations;
			return !partials;
		}, `${config.temp}`)())
    .pipe(htmlInject({
      partialDir: "app/partials",
      type: 'html'
    }))
    .pipe(gulp.dest(`${config.temp}`));
}

let html_process = () => {
  return gulp.src(`${config.temp}/*.html`)
    .pipe(before(true, `${config.build}/`)())
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

let generate_thumb = () => {
	let source = `${config.images.thumbs.source}/*.jpg`;
	let destination = `${config.images.thumbs.dest}/thumbs/`
	return gulp.src(source)
	.pipe(before(true, destination)())
	.pipe(through.obj(async function (file, enc, next) {
		let {data} = await sharp(file.contents)
		// .resize(116,116)
		.toBuffer({resolveWithObject: true});
		file.contents = Buffer.from(data);
		this.push(file)
		next(null);
	}))
	.pipe(P.rename({
		suffix: ".thumb"
	}))
	.pipe(gulp.dest(destination));
}

let images_retinate = () => { //generate quality images from HD
	let path = `${config.images.source}/**/*.{jpg,png,jpeg}`;
  return new Promise((resolve, reject) => {
    gulp.src(path)
      .pipe(before(true, config.images.build)())
      .pipe(P.retinate(config.images.retina))
      .pipe(gulp.dest(config.images.build))
      .on('error', reject)
      .on('end', resolve);
  });
}

let images_process = () => { //minify images for web
	let path = `${config.images.build}/**/*.{jpg, png, jpeg}`;
  return new Promise((resolve, reject) => {
    gulp.src(path)
      .pipe(before(true, config.images.build)())
      .pipe(P.imagemin())
      .pipe(gulp.dest(config.images.build))
      .on('error', reject)
      .on('end', resolve);
  });
};


/**
 * ===============================
 *       	FONT TASKS
 * ===============================
 */
let fonts_process = ()=> {
	let path = `${config.fonts.source}/**/*`;
	return gulp.src(path)
		.pipe(before(true, `${config.fonts.build}`)())
		.pipe(gulp.dest(`${config.fonts.build}`))
};

/**
 * ===============================
 *       INJECTION TASKS
 * ===============================
 */
let inject = () => {
  var jsstream = gulp.src([`${config.js.destination.build}/lib/jquery.js`,`${config.js.destination.build}/{${js_source}}/*.js`, `${config.js.destination.build}/*.js`], {
    read: false
  })
  var cssstream = gulp.src([`${config.css.destination.build}/lib/*.css`, `${config.css.destination.build}/**/*.css`], {
    read: false
  })

	// dev contains html which is not include common html code snippets
	let paths = `${config.temp}**/*.html`;
  return gulp.src(paths)
    .pipe(before(true, `${config.build}/`)())
    .pipe(P.inject(jsstream, config.js.inject))
    .pipe(P.inject(cssstream, config.css.inject))
    .pipe(gulp.dest(config.build));
};

/**
 * ===============================
 *       CONFIGURATION TASKS
 * ===============================
 */
let generate_sitemap = ()=> {
	return gulp.src([`${config.build}/*.html`])
	.pipe(P.sitemap(config.seo.sitemap))
	.pipe(gulp.dest(`${config.build}`));
}

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
    .pipe(before(true, `${config.build}/`)())
    .pipe(gulp.dest(config.build));
};

/**
 * ===============================
 *        SERVER CODE TASKS
 * ===============================
 */
let server_process = () => {
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
      let {stderr} = exec(link, ["development"], {stdio: "inherit"});
      if (stderr) {
        reject(stderr);
      }
      // reload();
      resolve();
    });
  };
  await handler();

	// browserSync.init(options);
	let htmlRes = [config.html.source + "*.html", config.html.source + "partials/*.html"];
	gulp.watch(htmlRes, gulp.series('html:inject', 'inject', handler))
	.on("change", (filePath, _)=> {
		let segments = path.parse(filePath);
		let hasPartialChanged = /partials/g;
		let changed = hasPartialChanged.test(segments.dir);
		process.argv['configuration'] = {
			'partials': changed
		};
	});
  //css libraries and source  code handler for app
  gulp.watch([`${config.css.destination.temp}/lib/*.css`], gulp.series("css:process", handler));
  //css source file compilation
  gulp.watch([`${config.css.destination.dev}**/*.scss`, `!${config.css.destination.dev}/shame/*`], gulp.series("css:build", handler));
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
gulp.task('gen:thumbs', generate_thumb);
gulp.task('images:retinate', images_retinate);
gulp.task('images:process', images_process);

gulp.task('fonts:process', fonts_process);

gulp.task('html:inject', html_inject_partials);
gulp.task('html:process', html_process);

gulp.task("inject", inject);

gulp.task("config:sitemap", generate_sitemap);

gulp.task('extras', process_extras);
gulp.task('server:process', server_process);

gulp.task('clean', clean);

gulp.task('start-server', start_wamp);
gulp.task('start-app:dev', start_dev);
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
    'start-app:dev'
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
    'start-app:dev'
  ));
