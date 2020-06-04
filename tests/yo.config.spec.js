let test = require("ava");
let metadata = require("../generators/app/util/metadata.js");
let conf = require("../generators/app/yo.config.js");
let sin = require("sinon");

/**
 * Possible test cases
 * 
 * 1. what happens if there is no saved yeoman configurations available 😃
 * 2. what happens if ther is saved config                              😃
 *  3. # of configs in the stream                                       😃
 *  4. configuration keys                               - @main
 *  5. Check for the 'when' clause execution            - @main
 *  6. test for the state management library inclusion  - @main
 */

let inquirer = { 'state': false };
let pollInquirer = (inquire) => inquire['transpiler'];

let verQueStub;
let getAllReturnsData;
let getAllReturnsEmpty;

// eslint-disable-next-line no-unused-vars
test.serial.beforeEach(t => {
  let question = {
    name: "testName",
    type: "list",
    when: pollInquirer(inquirer),
    message: "dummy message",
    choises: [{}, {}]
  }
  verQueStub && verQueStub.restore();
  verQueStub = sin.stub(metadata, "getVersionQuestion");
  verQueStub.withArgs({ field: "transpiler", processor: "@babel/core" })
    .resolves(question);

  getAllReturnsData = sin.fake.returns({
    "linter": true,
    "transpiler": true
  });

  getAllReturnsEmpty = sin.fake.returns({});
});

// eslint-disable-next-line no-unused-vars
test.serial.afterEach(t => {
  //sin.match => research
  verQueStub.restore();
});

test.serial("Should contain a prompt for 'load previous configs'", async t => {

  let result = await conf({ getAll: getAllReturnsData });
  t.true(getAllReturnsData.called);
  t.false(verQueStub.called);
  let wrapper = Array.from(result);
  let preConf = wrapper.find(prompt => prompt["name"] === "previous");
  t.truthy(preConf);
  t.is(wrapper.length, 1);
});

test.serial("Should not contain a prompt for 'load previous configs'", async t => {
  
  let result = await conf({ getAll: getAllReturnsEmpty });
  t.true(getAllReturnsEmpty.called);
  t.true(verQueStub.called);

  let preConf = Array.from(result)
    //need to filter this because sinon stab the function considering
    //deep equality of the arguments of the original function
    //because of that there will be undefined values could
    //exists in returned result
    .filter(p => p !== undefined)
    .find(prompt => prompt["name"] === "previous");
  t.falsy(preConf);
});

test.serial("Should contain 18 question items when there is no previous saved configs", async t=> {
  let result = await conf({getAll: getAllReturnsEmpty});
  t.true(getAllReturnsEmpty.called);
  t.true(verQueStub.called);
  let itemcount = Array.from(result).length;
  t.is(itemcount, 18);
});