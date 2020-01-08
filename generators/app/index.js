'use strict';
const path = require("path");

const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const ask = require('inquirer');
const ora = require('ora');
const globby = require('globby');

module.exports = class extends Generator {
  async initializing() {
    let config = require("./yo.config").bind(this);
    this.prompts = await config();
    this.answers = {};
  }

  async prompting() {
    this.log(yosay(`Welcome to the ${chalk.red('Rich Web App')} generator!`));
    let answers = await ask.prompt(this.prompts);
    let previous = answers['previous'];
    if (!!previous && previous) {
      answers = this.config.getAll();
    }
    Object.assign(this.answers, answers);
  }

  async configuring() {
    let name = this.answers['name'];
    let dest = path.join(process.cwd(), `/${name}`);

    this.log('\n');
    this.log(`********* configuring ${chalk.red(name)} *********`);
    this.destinationRoot(dest);

    this.config.set("name", this.answers.name);
    this.config.set("description", this.answers.description);
    this.config.set("site", this.answers.site);

    this.config.set("gulp", this.answers.gulp);
    this.config.set("gulpVersion", this.answers.gulp_version);
    this.config.set("babelCore", this.answers.babelCore);
    this.config.set("babelCoreVersion", this.answers.babel_core_version);
    this.config.set("bower", this.answers.bower);
    this.config.set("bowerVersion", this.answers.bower_version);
    this.config.set("eslint", this.answers.eslint);
    this.config.set("eslintVersion", this.answers.eslint_version);
    this.config.set("postcss", this.answers.postcss);
    this.config.set("postcssVersion", this.answers.postcss_version);
    this.config.set("rollup", this.answers.rollup);
    this.config.set("rollupVersion", this.answers.rollup_version);
    this.config.save();
  }

  writing() {
    // # initialize git repository

    // ora.promise(Promise.reject(), {text: "hii"});
    let spinner = ora({
      text: "\nprepairing git repository"
    }).start();
    this.spawnCommand("git", ["init", "--quiet"], {
      stdio: 'inherit'
    });
    spinner.succeed("git repository initialized");

    // # initialize npm repository
    spinner.start("prepairing project metadata");
    let packagejson = this.fs.readJSON(this.templatePath('_package.json'));

    delete packagejson['dependencies'];
    delete packagejson['devDependencies'];
    delete packagejson['name'];
    delete packagejson['version'];
    packagejson['name'] = this.answers.name;
    packagejson['version'] = "1.0.0";
    packagejson['description'] = this.answers.description;
    packagejson['main'] = "scripts/index.js";

    packagejson['author'] = {
      name: "",
      email: ""
    };
    packagejson['author']['name'] = this.user.git.name();
    packagejson['author']['email'] = this.user.git.email();
    this.fs.writeJSON(this.destinationPath('package.json'), packagejson);
    spinner.succeed("project metadata prepaired");

    // # initialize bower configuration
    spinner.start("configuring bower");
    let bowerjson = this.fs.readJSON(this.templatePath("_bower.json"));

    delete bowerjson['dependencies'];
    delete bowerjson['devDependencies'];
    delete bowerjson['name'];
    delete bowerjson['version'];
    bowerjson['name'] = this.answers.name;
    bowerjson['version'] = "1.0.0";
    this.fs.writeJSON(this.destinationPath("bower.json"), bowerjson);
    spinner.succeed("bower successfully configured");

    // # initialize eslint configuration (optional)
    // # initialize editorconfig (optional)

    spinner.start("prepairing tool configurations\n");

    //process all '_' prefixed files
    let paths = globby.sync(['_*', 'config/_*', '!_bower.json', '!_package.json'], {
      cwd: this.templatePath()
    });
    Array.from(paths).forEach(element => {
      let original = element.replace('_', '');
      if (original.indexOf("deploy") !== -1) {
        let project_name = this.answers.name.toLowerCase().replace(" ", "");
        let opts = {
          deploy: {
            base: "C:/wamp64/www",
            path: this.answers.name
          },
          project: {
            name: project_name
          }
        }

        this.fs.copyTpl(this.templatePath(element), this.destinationPath(original), opts);
      } else if (original.indexOf("license") !== -1) {
        let opts = {
          owener: {
            name: this.answers.name,
            company: this.answers.name,
            email: this.user.git.email()
          },
          date() {
            let date = new Date;
            return {
              month: date.getUTCMonth(),
              year: date.getUTCFullYear()
            }
          }
        }
        this.fs.copyTpl(this.templatePath(element), this.destinationPath(original), opts);
      } else if(original.indexOf(".htaccess") !== -1) {
        let opts = {
          site : {
            url: this.answers.site
          }
        }
        this.fs.copyTpl(this.templatePath(element), this.destinationPath(original), opts);
      } else if(original.indexOf('gulp.config.js') !== -1) {
        let project_name = this.answers.name.toLowerCase().replace(" ", "");
        let options= {
          project: {
            name: project_name,
            site: this.answers.site
          }
        }
        this.fs.copyTpl(this.templatePath(element), this.destinationPath(original), options);
      } else {
        this.fs.copy(this.templatePath(element), this.destinationPath(original));
      }
    });

    //process all source files under app
    spinner.succeed("tools configured successfully");
    let app = globby.sync(['server/**', 'app/**', '!app/**/_*'], {
      cwd: this.templatePath()
    });
    Array.from(app).forEach(source=> 
      this.fs.copy(this.templatePath(source), this.destinationPath(source)));
    spinner.start("Processing source files");

    spinner.succeed("source files processed");
    this.log(`********* configuration saved *********`);
    spinner.stop();
  }

  async install() {
    let util = require('./util/text');

    let project = this.fs.readJSON(this.templatePath('_package.json'));

    let npm_prod = Object.keys(project['dependencies']);

    let npm_dev = Object.keys(project['devDependencies']);

    let bower = this.fs.readJSON(this.templatePath('_bower.json'));

    let bower_prod = Object.keys(bower['dependencies'])

    this.log("");
    this.log("::::: Start installing Development & Production Dependcancies :::::")
    this.log("");

    var npm_prod_install = Array.from(npm_prod)
      .map(e => {
        return this.npmInstall(`${e}@latest`, {
          "save": true
        })
      });

    // linking gulp-html-inject
    // future this will be changed to npm install -g gulp-html-inject
    var npm_link_plugin = new Promise((resolve, reject)=> {
      let npm = this.spawnCommand("npm", ["link", "gulp-html-inject"], {stdio: 'inherit'});
      npm.on('error', reject);
      npm.on('close', resolve);
    });

    let npm_dev_install = Array.from(npm_dev)
      .map(e => {
        var version;
        if (this.answers[e]) {
          var pack = util.replace(e);
          version = this.answers[`${pack}Version`] || "latest";
        } else {
          version = 'latest';
        }
        return this.npmInstall(`${e}@${version}`, {"save-dev": true});
      });

    let bower_prod_install = Array.from(bower_prod)
      .map(e => {
        var pack = util.replace(e);
        var version = this.answers[`${pack}Version`] || "latest";
        return this.bowerInstall(`${e}@${version}`, [{
          "save": true
        }]);
      })
    Promise.all([...npm_prod_install, npm_link_plugin, ...npm_dev_install, ...bower_prod_install])
      .then(e => this.log("::::: Development & Production Dependcancies Installed :::::"))
  }

  end() {
    //prepare for deploy and open it on VSCode
    var spinner = ora({
      text: "Compiling necessary resources"
    }).start();
    this.spawnCommandSync("gulp", ['serve:dev'])
    spinner.succeed();
    spinner.start("Deploying Resources");
    var root = this.destinationPath("deploy.bat");
    this.spawnCommandSync(`${root}`, ["--production"]);
    spinner.succeed("Resources deployied successfully");
    this.log(yosay("happy coding !!!"));
  }
};
