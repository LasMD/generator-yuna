let test = require("ava");
let sin = require("sinon");
let metadata = require("../generators/app/util/metadata.js");
let web = require("../generators/app/util/web.js");

let get;
test.beforeEach(t => {
  let epack = "@babel/core";
  let npack = "unexisted";
  let field = "transpiler";
  let data = {
    "data": JSON.stringify({
      "_id": epack,
      "dist-tags": {
        "latest": "7.8.4",
        "release": "6.0.0-bridge.1"
      }
      //other data were redacted for clarity
    }),
    "error": 0
  }

  //stubing the HTTP get method of web.js with fake 
  //object 'withArgs' and 'withReturns'

  // issue submitted under
  // https://github.com/sinonjs/sinon/issues/1572
  // https://github.com/sinonjs/sinon/blob/6197ff34eefd021faa0ba14b05a4a543dcd407bc/lib/sinon/stub.js#L118-L132
  // stub retains references to the fakes even after restore
  // restore at each 'afterEach' clauses isn't enouth
  get && get.restore()
  get = sin.stub(web, "get");
  get.withArgs(epack).resolves(data);

  t.context = {
    "epack": epack,
    "npack": npack,
    "field": field
  }
});

//eslint-disable-next-line no-unused-vars
test.afterEach(t=> {
  get.restore();
});

test("should call predicate if it is given a function", t => {
  let field = t.context.field;
  let epack = t.context.epack;
  let processor = sin.stub().returns(epack);
  metadata.getVersionQuestion({ field, processor });
  t.true(processor.called);
  t.true(get.called);
});

test("should produce question object for exisisting package", async t => {
  let field = t.context.field;
  let processor = t.context.epack;
  let question = await metadata.getVersionQuestion({ field, processor });
  t.true(get.called);
  t.is(question.type, "list");
  t.is(question.name, "transpilerVersion");

  let fakeInquirer = { [field]: processor };
  t.truthy(question.when(fakeInquirer));
  t.is(question.message(fakeInquirer), "Which babelCore version would you preffer?");

  //check the object data for the choises
  let choices = question.choices(fakeInquirer);
  t.is(choices.length, 2);
  t.deepEqual(choices[0], { name: "v7.8.4", value: "7.8.4", short: "7.8.4" });
  t.deepEqual(choices[1], { name: "v6.0.0-bridge.1", value: "6.0.0-bridge.1", short: "6.0.0-bridge.1" });
});

test('should produce a blank result if the package is an unexisted package', async t => {
  sin.restore();

  let getUnexist = sin.stub(web, "get");
  getUnexist.withArgs(t.context.npack).resolves({ data: {}, error: 1 });

  let field = t.context.field;

  let processor = "unexisted";
  let result = await metadata.getVersionQuestion({ field, processor });
  getUnexist.restore();
  t.falsy(result);
});