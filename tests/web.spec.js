let test = require("ava");
let nock = require("nock");
let { get } = require("../generators/app/util/web.js");

test.before(async t => {
  let babResp = get("@babel/core");
  let unResp = get("unexisisted");

  t.context = {
    exist: babResp ,
    unexist: unResp 
  }
});

test("should return a promise", async t => {
  //testing for an existing package
  let { exist, unexist } = t.context;
  t.is(exist.toString(), "[object Promise]");

  //testing for an unexisting package
  t.is(unexist.toString(), "[object Promise]");

});

test("should return data", async t => {
  let { exist } = t.context;
  let { data, error } = await exist;
  t.is(error, 0);
  let json = JSON.parse(data);
  t.is(json['_id'], "@babel/core");

});

test("should return with error", async t => {
  let { unexist } = t.context;
  let { error } = await unexist;
  t.is(error, 1);
});

test("should return empty data when criticle server error", async t=> {
  nock("http://registry.npmjs.com")
  .get("/@babel/core")
  .reply(500, {
    code: "INTERNAL_SERVER_ERROR",
    message: "criticle server error occured"
  });
  let response = await get("@babel/core");
  t.truthy(response.data);
  t.truthy(response.error);
  t.deepEqual(response.data, {});
  t.is(response.error, -1);
  nock.restore();
})