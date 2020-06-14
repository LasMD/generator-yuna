"use strict";
const path = require("path");

const Generator = require("yeoman-generator");
const chalk = require("chalk");
const yosay = require("yosay");
const ora = require("ora");
const globby = require("globby");
const crypto = require("crypto-random-string");
const pair = require("lodash.topairs");
const series = require("p-series");

const config = require("./yo.config.js");
const dependancyList = require("./data/dependancies.js");
const maps = require("./data/configToTokens.js");

module.exports = class extends Generator {
  async initializing() {
    this.prompts = await config(this.config);
    this.answers = {};
    this.metadata = {};
  }

  async prompting() {
    try {
      this.log(yosay(`Welcome to the ${chalk.red("Rich Web App")} generator!`));
      let answers = await this.prompt(this.prompts);
      let previous = answers["previous"];
      if (!!previous && previous) {
        answers = this.config.getAll();
      }
      Object.assign(this.answers, answers);
    } catch (err) {
      console.log(err);
    }
  }

  async configuring() {
    let name = this.answers["name"];
    let baseFolder = path.basename(process.cwd());
    let dest = process.cwd();
    if (baseFolder !== name) {
      dest = path.join(process.cwd(), `/${name}`);
    }
    this.log("\n");
    this.log(`********* configuring ${chalk.red(name)} *********`);
    this.destinationRoot(dest);

    for (let answer in this.answers) {
      if (answer === "previous") continue;
      this.config.set(answer, this.answers[answer]);
    }
    this.config.save();
  }

  writing() {
    //getting the domain name out of the url if
    //subdomain name exists in the url
    let self = this;
    let domain = this.answers.site;
    let captSub = /(admin\.|portal\.)([\w-\.]+)/;
    let matches = captSub.exec(domain);
    if (matches && matches.length > 1) this.answers["fqn"] = matches[2];

    // # initialize git repository

    let gitinit = function () {
      let { error } = self.spawnCommandSync("git", ["init", "--quiet"], {
        stdio: "inherit",
      });
      if (error) return error;
    };

    // TODO: # initialize npm repository

    let pack = function () {
      let packagejson = self.fs.readJSON(self.templatePath("_package.json"));
      let pack = {
        ...packagejson,
        name: self.answers.name,
        version: "1.0.0",
        license: "private",
        description: self.answers.description,
        main: "scripts/index.js",
        author: {
          name: self.user.git.name(),
          email: self.user.git.email(),
        },
      };

      self.metadata = { ...pack };
      self.fs.writeJSON(self.destinationPath("package.json"), pack);
    };

    // TODO: # initialize eslint configuration (optional)
    // TODO: # initialize editorconfig (optional)

    let mainConfig = function () {
      //process all '_' prefixed files and source files
      let paths = globby.sync(
        ["_*", "server/**", "app/**", "config/_*", "!_package.json"],
        {
          cwd: self.templatePath(),
        }
      );
      let context = {
        project: {
          name: self.answers.name,
          site: self.answers.site,
        },
        owner: {
          name: self.metadata.author.name,
          company: self.metadata.name,
          email: self.metadata.author.email,
        },
        deploy: {
          base: process.env.SERVER_ROOT,
          path: self.metadata.name,
        },
        date() {
          let date = new Date();
          return {
            month: date.getUTCMonth(),
            year: date.getUTCFullYear(),
          };
        },
        site: {
          fqn: self.answers.fqn,
          url: self.answers.site,
        },
        file: {
          salt: crypto({ length: 10, type: "base64" }),
        },
        answers: { ...self.answers },
      };
      Array.from(paths)
        .map((element) => {
          let isStyle = /.sass|.scss$/.test(element);
          let template = !isStyle ? element.replace("_", "") : element;
          let cleanName = template.replace(".tmpl", "");
          return { raw: element, name: cleanName, template };
        })
        //filter for config file which user chooses not to include
        .filter(({ name }) => {
          let token = maps.get(name) || "";
          if (token in self.answers) {
            return self.answers[token];
          }
          return true;
        })
        .forEach(({ raw, name, template }) => {
          if (template.indexOf("tmpl") !== -1) {
            self.fs.copyTpl(
              self.templatePath(raw),
              self.destinationPath(name),
              context
            );
          } else {
            self.fs.copy(self.templatePath(raw), self.destinationPath(name));
          }
        });
    };
    ora.promise(
      series([gitinit, pack, mainConfig]),
      "Preparing necessary configurations for project"
    );
  }

  async install() {
    let tokens = Object.keys(dependancyList); //list with package names only

    this.log("");
    this.log("::::: Start installing Dependcancies :::::");
    this.log("");

    let dependancySet = Array.from(tokens)
      .filter((token) => token === "general" || this.answers[token])
      .reduce((dependancies, token) => {
        let tools = dependancyList[token];
        let answer = this.answers[token];
        let version = this.answers[`${token}Version`];

        let iTools = Array.from(tools);
        //only to make sure the dependancy was added to the final list
        //and to manage the version at the final list
        let tempDeps = new Set();
        if (token === "general") {
          //there is no version appended to this dependancy
          //let npm choose which version to install
          iTools.forEach((dependancy) => dependancies.add(dependancy));
        } else if (answer && typeof answer === "boolean") {
          //the respected answer given by the developer is boolean implies
          //the tool required is not a choise selected from the list
          //but selected what was given at the prompt
          iTools.forEach((dependancy) => {
            // there are two scenarios which can be happened
            // 1.the dependancy could be optional and acts as a top level dependancy if there is only one item listed
            // 2.the dependancy act as a peer dependancy to the dependancy refered by the token if there are many listed items
            if (iTools.length === 1) {
              //1
              dependancies.add(`${dependancy}@${version}`);
              tempDeps.add(dependancy);
            } else {
              //2
              if (typeof dependancy === "string") {
                dependancies.add(`${dependancy}@latest`);
              } else {
                //dependancies listed as a hash
                //prepairing the map to be iterrated
                let depsMap = new Map(pair(dependancy));
                let [plugin, dependers] = depsMap.entries().next().value;
                //since the approval for this token was given by the developer
                //their is no point of checking the depender whether if it is
                //included in the final dependancy list if it is the only
                //depender listed for the plugin
                if (dependers.length === 1) {
                  //check whether the depender is already at the tempDeps list
                  let depender = dependers[0];

                  dependancies.add(`${depender}@${version}`);
                  dependancies.add(plugin);
                  tempDeps.add(depender);
                } else {
                  //adding the plugin with #dependers> 1 should follow a proper
                  //checking whether the enlisted dependers were enlisted in
                  //the final dependancy list. if one of the dependers isn't
                  //presented in the list means that this plugin shouldn't
                  //includes in the final dependancy list. so every depender
                  //enlisted in the array should be included in the final
                  //dependancies because it is already included in
                  //previous steps. its a design idea to make the
                  //flow more flexible when the development of
                  //the generator.
                  let approved = Array.from(dependers).every((depender) =>
                    tempDeps.has(depender)
                  );
                  if (approved) {
                    dependancies.add(plugin);
                  }
                }
              }
            }
          });
        } else if (typeof answer === "string") {
          //developer chooses which tool to be included as the final
          //modules from the list given as options

          //this iteration assumes that there is no dependers for any
          //libraries listed at the choises given to the developer
          //so there is no point of searching the library in
          //dependancyList.

          //this will be changed in the future as the dependancy will be searched
          //instead adding answer directly from the dependancy tree against the
          //choosed tool by the developer
          dependancies.add(`${answer}@${version}`);
        }
        return dependancies;
      }, new Set());
    dependancySet.forEach((dependancy) =>
      this.npmInstall(`${dependancy}`, { "save-dev": true })
    );
  }

  end() {
    //prepare for deploy and open it on VSCode
    let hasBuilder = Boolean(this.answers["builder"]);
    let run = function () {
      if (hasBuilder) {
        let { error } = this.spawnCommandSync("gulp", ["serve:dev"]);
        if (error) return error;
      }
    }.bind(this);

    let deploy = function () {
      var root = this.destinationPath("deploy.bat");
      let { error } = this.spawnCommandSync(`${root}`, ["development"]);
      if (error) return error;
    }.bind(this);

    let sequence = series([run, deploy]);
    ora.promise(sequence, "Finalizing project environment");
    this.log(yosay("happy coding !!!"));
  }
};
