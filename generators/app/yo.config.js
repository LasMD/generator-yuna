var path = require('path');
var chalk = require('chalk');
var http = require("http");
var util = require("./util/text");
var strip = require("strip-ansi");

async function YeomanConfiguration() {
  var answers = this.config.getAll();
  let prompts = [];
  let flag = false;

  if (Object.keys(answers).length > 0) {
    var confirm = {
      when: !flag,
      type: "confirm",
      name: "previous",
      message: "? We detect a previous saved configs. Shall I load it?",
      default: true
    };
    prompts.push(confirm);
    flag = true;
  }

  let filter = input => strip(input);

  let getVersionQuestion = async function (name) {
    let fetch = new Promise(function (resolve, reject) {
      let finaldata = "";
      http.get(util.createpath `http://registry.npmjs.com/${name}`, (response) => {
        response.setEncoding("utf-8");
        response
          .on('data', (data) => finaldata = finaldata.concat(data))
          .on('end', () => resolve(finaldata))
          .on('error', reject);
      });
    });
    let versions = await fetch;
    let tags = JSON.parse(versions)['dist-tags'];

    // retuning the question from abstracted data from npm registry
    return {
      when: (inquirer) => inquirer[util.replace(name)],
      type: "list",
      name: util.replace(name) + "Version",
      message: inquirer => {
        var stripped = util.stripname(name);
        return ` Which ${stripped} version would you preffer?`
      },
      filter,
      choices: inquirer => {
        return Object.keys(tags)
          .map(key => {
            return {
              name: "v" + tags[key],
              value: tags[key],
              short: tags[key]
            }
          });
      }
    }
  };

  let name = {
    when: !flag,
    type: 'input',
    name: 'name',
    message: 'suggest a name for the application?',
    default: "proj-alpha-rc-01",
    filter
  }
  prompts.push(name);

  let site = {
    when: !flag,
    type: 'input',
    name: 'site',
    message: 'What is your site URL?',
    default: chalk.cyan('example.com'),
    filter
  }
  prompts.push(site);

  let description = {
    when: !flag,
    name: 'description',
    type: 'input',
    message: 'describe your application purpose?',
    default: chalk.cyan('This is a web applicaiton'),
    filter
  }
  prompts.push(description);

  let babel = {
    when: !flag,
    type: 'confirm',
    name: 'babelCore',
    message: ' Would you like to include babel?',
    default: answers['babelCore'] || true,
  };
  prompts.push(babel);
  let bquestion = await getVersionQuestion("@babel/core");
  prompts.push(bquestion);

  let gulp = {
    when: !flag,
    type: "confirm",
    name: "gulp",
    message: " Would you like to include gulp?",
    default: answers['gulp'] || true
  };
  prompts.push(gulp);
  let gquestion = await getVersionQuestion("gulp");
  prompts.push(gquestion);

  let bower = {
    when: !flag,
    type: "confirm",
    name: "bower",
    message: " Would you like to include bower?",
    default: answers['bower'] || true
  };
  prompts.push(bower);
  let boquestion = await getVersionQuestion("bower");
  prompts.push(boquestion);

  let eslint = {
    when: !flag,
    type: "confirm",
    name: "eslint",
    message: " Would you like to include eslint?",
    default: answers['eslint'] || true
  };
  prompts.push(eslint);
  let equestion = await getVersionQuestion("eslint");
  prompts.push(equestion);

  let postcss = {
    when: !flag,
    type: "confirm",
    name: "postcss",
    message: " Would you like to include postcss?",
    default: answers['postcss'] || true
  };
  prompts.push(postcss);
  let pquestion = await getVersionQuestion("postcss");
  prompts.push(pquestion);

  let rollup = {
    when: !flag,
    type: "confirm",
    name: "rollup",
    message: " Would you like to include rollup?",
    default: answers['rollup'] || true
  };
  prompts.push(rollup);
  let rquestion = await getVersionQuestion("rollup");
  prompts.push(rquestion);

  return prompts;
}

module.exports = YeomanConfiguration;
