
const
  fs = require("fs"),
  joinup = require("../lib/joinup");

var input = fs.readFileSync(process.argv[2], {encoding: "utf8"});
var project = JSON.parse(input);

joinup(project);
