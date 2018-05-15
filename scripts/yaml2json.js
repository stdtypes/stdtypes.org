var all, all2yaml, fs, options, searchPath, yaml2json;

yaml2json = require("js-yaml");

fs = require("fs");

options = {
  encoding: "utf8"
};

all = {};

searchPath = function(path) {
  var file, files, i, json, len, name, opject, results, stat, yaml;
  files = fs.readdirSync(path);
  results = [];
  for (i = 0, len = files.length; i < len; i++) {
    file = files[i];
    name = path + "/" + file;
    if (name === "www/all.yaml") {
      continue;
    }
    stat = fs.statSync(name);
    if (stat.isDirectory()) {
      results.push(searchPath(name));
    } else if (stat.isFile()) {
      if (file.endsWith(".yaml")) {
        console.log(name + " > " + file.substring(0, file.length - 4) + "json");
        yaml = fs.readFileSync(name, options);
        opject = yaml2json.safeLoad(yaml, {
          filename: file
        });
        if (!opject.name) {
          console.warn("file did not export a .name field!");
          continue;
        }
        all[opject.name] = {
          desc: opject.desc,
          tags: opject.tags,
          time: opject.time,
          version: opject.version,
          stability: opject.stability
        };
        if (opject.symbols) {
          all[opject.name].symbols = opject.symbols.map((sym) => {
            return sym.name;
          }).filter((name) => {
            return name && !name.startsWith("operator::");
          });
        }
        if (opject.meta.impl) {
          all[opject.name].impl = opject.meta.impl;
        }
        json = JSON.stringify(opject, null, 2);
        results.push(fs.writeFileSync(name.substring(0, name.length - 4) + "json", json));
      } else {
        results.push(void 0);
      }
    } else {
      results.push(void 0);
    }
  }
  return results;
};

searchPath("www");

all2yaml = (sym) => {
  return Object.keys(all).map((key) => {
    sym = all[key];
    return `${key}:\n` + `  desc: ${sym.desc}\n` + `  version: ${sym.version}\n` + `  stability: ${sym.stability}\n` + `  time: ${sym.time}\n` + `  tags: [${sym.tags.join(", ")}]\n` + `  symbols: [${(sym.symbols ? sym.symbols.join(", ") : "")}]\n` + `  impl: [${(sym.impl ? sym.impl.join(", ") : "")}]`;
  }).join("\n");
};

console.log("(all) > www/all.json");

fs.writeFileSync("www/all.json", JSON.stringify(all, null, 2));

console.log("(all) > www/all.yaml");

fs.writeFileSync("www/all.yaml", all2yaml());
