let test = require("ava");
let util = require("../generators/app/util/text.js");

/**
 * macro tobe used at ava test for multiple
 * parametres.
 * @param {test} t
 * @param {array} input
 * @param {array} expect
 */
let processArray = (t, input, expect) => {
  t.timeout(20000);
  Array.from(input).forEach((str, index) =>
    t.is(util.beautify(str), expect[index])
  );
};
// Most of the methods listed in the test.js file depends
// directly on the imported function without further
// modifications of the input. so testing those
// methods would be trivial and redundant.
// some tests listed here are only for
// testing needs.

test("should return variables appended to url", (t) => {
  t.timeout(20000);
  let pacName = "package";
  let url = util.createpath`http://www.example.com/${pacName}`;
  t.is(url, "http://www.example.com/package");
});

test(
  "should return strings camel cased if it contains two explicit words",
  processArray,
  ["one", "one-two"],
  ["one", "oneTwo"]
);

test(
  "should return camel cased string redacting unwanted symbols",
  processArray,
  ["one-two", "three/four", "@five/six"],
  ["oneTwo", "threeFour", "fiveSix"]
);
