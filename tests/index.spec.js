const path = require("path");
const test = require("ava");
const ora = require("ora");
const sinon = require("sinon");

const yt = require("yeoman-test");
const ya = require("yeoman-assert");

let cwd = process.cwd();
//every prompts for the generator under the test
let hashPrompts = {
  name: "dummyproject",
  site: "examplesite.com",
  description: "dummyDesc",
  frontendLibrary: "lit-html",
  frontendLibraryVersion: "1.0.0",
  state: true,
  stateManagement: "redux",
  stateManagementVersion: "1.0.0",
  transpiler: true,
  transpilerVersion: "1.0.0",
  builder: true,
  builderVersion: "1.0.0",
  linter: true,
  linterVersion: "1.0.0",
  cssPreprocessor: true,
  cssPreprocessorVersion: "1.0.0",
  bundler: true,
  bundlerVersion: "1.0.0",
};

let _generateId = () => Math.round(Math.random() * 1000);
/**
 * healper function to refactore reused generator configuration
 * code which happens before each tests.
 *  @param {context} t
 */
let _runner = async function ({
  prompts = {},
  options = { force: true },
  args = undefined,
  overrides = {},
  special = false,
}) {
  let generatorPrompts;
  if (special) generatorPrompts = { ...prompts };
  else generatorPrompts = { ...hashPrompts, ...prompts };

  let runner = yt.run(path.join(__dirname, "../generators/app"), {
    compatibility: true,
  });
  if (args) {
    runner = runner.withArguments(args);
  }
  if (options) {
    runner = runner.withOptions(options);
  }
  runner
    .withPrompts(generatorPrompts)
    //at each run, the cwd stays tangled to previous base folder
    //we have to state the cwd explcitely to overcome this
    // .cd(cwd)
    .inDir("test-workspace");
  runner.on("ready", (generator) => {
    let genProt = Object.getPrototypeOf(generator);
    for (let override in overrides) {
      if (override in genProt) {
        Object.defineProperty(genProt, override, {
          configurable: true,
          enumerable: true,
          writable: true,
          value: overrides[override],
        });
      } else {
        continue;
      }
    }

    //this is necessary unless the generator itself uses the process.cwd() as the
    //current directory which is the root directory of the project
    generator.destinationRoot(path.join(__dirname, "../test-workspace"));
  });
  return [runner, await runner.toPromise()];
};
test.before((t) => {
  let settings = {
    tmpdir: false,
    namespace: "yuna:generators:app",
    resolved: path.join(__dirname, "../generators/app"),
  };

  let sora = sinon.stub(ora, "promise");
  sora.withArgs(Promise.resolve(), "").resolves();
  t.context = { settings };
});

//assumes that there is no previous saved yeoman configurations under the cwd
test.serial("should contans dummy 18 inquirer questions", async (t) => {
  t.timeout(8000);
  let overrides = {
    install: () => {},
    end: () => {},
  };
  let [runner] = await _runner({ overrides });
  t.is(Object.keys(runner.generator.answers).length, 18);
});

test.serial("should contain a .git folder", async (t) => {
  t.timeout(8000);
  let overrides = {
    install: () => {},
    end: () => {},
  };
  await _runner({ overrides });
  ya.file(".git");
});

test.serial(
  "should not include respective config files if user preffer not to include the tool",
  async (t) => {
    t.timeout(8000);
    let id = _generateId();
    let prompts = {
      name: `dummyproject-${id}`,
      linter: false,
      transpiler: true,
      builder: true,
      bundler: false,
    };

    let overrides = {
      install: () => {},
      end: () => {},
    };

    await _runner({ prompts, overrides });
    ya.noFile(".eslintrc");
    ya.noFile(".eslintignore");
    ya.file("babel.config.js");
    ya.file("gulp.conf.js");
    ya.file("Gulpfile.js");
    ya.noFile("rollup.config.js");
  }
);

test.serial("should separate FQN from given project url", async (t) => {
  t.timeout(8000);
  //.htaccess,
  let id = _generateId();
  let name = `dummyproject-${id}`;
  let site = `admin.${name}.test`;
  let fqn = `${name}.test`;

  let overrides = {
    install: () => {},
    end: () => {},
  };

  let [runner] = await _runner({ prompts: { name, site }, overrides });
  let address = `admin.${name}.test`;

  t.is(runner.generator.answers.name, name);
  t.is(runner.generator.answers.fqn, fqn);
  t.is(runner.generator.answers.site, address);

  //testing .htaccess configurations
  ya.file("config/.htaccess");
  ya.fileContent("config/.htaccess", `RewriteCond %{HTTP_HOST} !^${site}$`);
  ya.fileContent(
    "config/.htaccess",
    `RewriteCond %{HTTP_REFERER} !^https?://(admin\\.|portal\\.)?${fqn}`
  );

  //testing deploy script configurations

  ya.file("deploy.bat");
  ya.fileContent("deploy.bat", `${name}`);
  //this assumes that (for the development purpose) the developer configures
  //the server root of the web server used for the development and its
  //server root path into a registry key as SERVER_ROOT
  let SERVER_ROOT = "C:/wamp64/www";
  ya.fileContent("deploy.bat", SERVER_ROOT);
  // ya.fileContent("deploy.bat", `${SERVER_ROOT}/${name}`);

  //testing for gulp.conf.js file
  ya.file("gulp.conf.js");
  ya.fileContent("gulp.conf.js", `${fqn}`);

  //testing core gulp build file
  ya.file("Gulpfile.js");

  //testing for the license file
  ya.file("license.txt");
  ya.fileContent("license.txt", name);

  //testing bundling configuration file
  ya.file("rollup.config.js");
});

test("should functional and utility styles servive the template copy step", async (t) => {
  t.timeout(8000);
  let overrides = {
    install: () => {},
    end: () => {},
  };
  let id = _generateId();
  let prompts = {
    name: `dummyproject-${id}`,
  };
  await _runner({ prompts, overrides });
  ya.file("app/styles");
  ya.file("app/styles/main.scss");

  ya.file("app/styles/abstract/_functions.scss");
  ya.file("app/styles/abstract/_mixins.scss");
  ya.file("app/styles/abstract/_placeholders.scss");
  ya.file("app/styles/abstract/_variables.scss");

  ya.file("app/styles/base/_reset.scss");
});

test("should contain front end scripts", async (t) => {
  let id = _generateId();
  let prompts = {
    name: `dummyproject-${id}`,
  };
  await _runner({ prompts });
  ya.file("app/scripts/main.js");
  ya.file("app/scripts/utils/web.js");
});

//assumes that there is previous saved yeoman configurations under the cwd
// test("should load answers from file if previous yo-rc.json was found at cwd", async t => {
//   //this test is pretty much uncomplete
// index.js#L28-L31

//   t.timeout(8000);
//   let overrides = {
//     "writing": () => { },
//     "install": () => { },
//     "end": () => { }
//   }
//   let firstPrompts = {
//     name: "dummyproject-007"
//   }
//   //first invoke to simulate a previously existing project
//   await _runner({ prompts: firstPrompts, overrides });

//   let secondPrompts = {
//     name: "dummyproject-007",
//     previous: true
//   }
//   await _runner({ prompts: secondPrompts, overrides, special: true });
//   t.pass();
// });
