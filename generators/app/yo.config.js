var chalk = require('chalk');
var util = require("./util/text.js");
var metadata = require("./util/metadata.js");

async function YeomanConfiguration(config) {
  var answers = config.getAll();
  let prompts = [];
  let flag = false;
  if (Object.keys(answers).length > 0) {
    
    var confirm = {
      when: !flag,
      type: "confirm",
      name: "previous",
      message: "? Detected a previous saved configs for this project. Shall I load it?",
      default: true
    };
    prompts.push(confirm);
    flag = true;
    return prompts;
  }
  let name = {
    when: !flag,
    type: 'input',
    name: 'name',
    message: 'suggest a name for the application?',
    default: "proj-alpha-rc-01",
    filter: util.ansiStrip
  }
  prompts.push(name);

  let site = {
    when: !flag,
    type: 'input',
    name: 'site',
    message: 'What is your site URL?',
    default: chalk.cyan('example.com'),
    filter: util.ansiStrip
  }
  prompts.push(site);

  let description = {
    when: !flag,
    name: 'description',
    type: 'input',
    message: 'Describe your application purpose?',
    default: chalk.cyan('This is a web applicaiton'),
    filter: util.ansiStrip
  }
  prompts.push(description);

  let library = {
    when: !flag,
    type: "list",
    name: "frontendLibrary",
    message: "Which library would you like to include?",
    choices: [
      {name: 'JQuery',value: 'jquery'}, 
      {name: 'Lit Html', value: 'lit-html'}, 
      {name: 'React', value: 'react'}, 
      {name: 'Vue', value: 'vue'}, 
      {name: 'Svelt', value: 'svelt'}],
    default: false
  }
  prompts.push(library);
  let libQuestion = await metadata.getVersionQuestion({field: "frontendLibrary", processor: inquirer=> inquirer['frontendLibrary']});
  prompts.push(libQuestion);

  // choose whether to include a state management library
  let state = {
    when: !flag,
    type: "confirm",
    name: "state",
    message: "Would you like to intergrate a state management library?",
    default: false
  }

  prompts.push(state);

  //choose which state managment library to included
  let stateManagement = {
    type: "list",
    name: "stateManagement",
    when: inquirer=> !flag && inquirer["state"],
    message: "Which state management library would you prefer?",
    choices: [
      {name: "Redux", value: 'redux'}, 
      {name: "Beedle", value: 'beedle'}],
    default: false
  }

  prompts.push(stateManagement);
  let sQuestion = await metadata.getVersionQuestion({field: "stateManagement", processor: inquirer=>inquirer["stateManagement"]});
  prompts.push(sQuestion);

  let babel = {
    when: !flag,
    type: 'confirm',
    name: 'transpiler',
    message: ' Would you like to include babel?',
    default: false,
  };
  prompts.push(babel);
  let bquestion = await metadata.getVersionQuestion({field: "transpiler", processor: "@babel/core"});
  prompts.push(bquestion);

  let gulp = {
    when: !flag,
    type: "confirm",
    name: "builder",
    message: " Would you like to include gulp?",
    default: false
  };
  prompts.push(gulp);
  let gquestion = await metadata.getVersionQuestion({field: "builder", processor: "gulp"});
  prompts.push(gquestion);

  let eslint = {
    when: !flag,
    type: "confirm",
    name: "linter",
    message: " Would you like to include eslint?",
    default: false
  };
  prompts.push(eslint);
  let equestion = await metadata.getVersionQuestion({field: "linter", processor: "eslint"});
  prompts.push(equestion);

  let postcss = {
    when: !flag,
    type: "confirm",
    name: "cssPreprocessor",
    message: " Would you like to include postcss?",
    default: false
  };
  prompts.push(postcss);
  let pquestion = await metadata.getVersionQuestion({field: "cssPreprocessor", processor: "postcss"});
  prompts.push(pquestion);

  let rollup = {
    when: !flag,
    type: "confirm",
    name: "bundler",
    message: " Would you like to include rollup?",
    default: false
  };
  prompts.push(rollup);
  let rquestion = await metadata.getVersionQuestion({field: "bundler", processor: "rollup"});
  prompts.push(rquestion);

  return prompts;
}

module.exports = YeomanConfiguration;
