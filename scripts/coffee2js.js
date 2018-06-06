const CoffeeScript = require("coffeescript");
const fs = require("fs");

const options = {
  encoding: "utf8"
}

function translatePath(path) {

  for (file of fs.readdirSync(path)) {

    var name = path + "/" + file;
    var stat = fs.statSync(name);
    if (stat.isDirectory()) {

      searchPath(name);

    } else if (stat.isFile()) {
      if (file.endsWith(".coffee")) {

        console.log(name + " > " + name.slice(0, -6) + "js");

        var cf = fs.readFileSync(name, options);
        cf = CoffeeScript.compile(cf, {
          bare: true
        });

        fs.writeFileSync(name.slice(0, -6) + "js", cf);

      }
    }
  }
};

translatePath("js");
translatePath("scripts");
