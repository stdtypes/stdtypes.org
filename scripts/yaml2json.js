var all, all2yaml, fs, options, searchPath, translatePath, yaml2json;

yaml2json = require("js-yaml");

fs = require("fs");

options = {
  encoding: "utf8"
};

all = {};

searchPath = function(path) {
  var file, files, i, id, json, len, name, opject, results, stat, yaml;
  files = fs.readdirSync(path);
  results = [];
  for (i = 0, len = files.length; i < len; i++) {
    file = files[i];
    name = path + "/" + file;
    stat = fs.statSync(name);
    if (stat.isDirectory()) {
      results.push(searchPath(name));
    } else if (stat.isFile()) {
      if (file.endsWith(".yaml")) {
        id = name.slice(name.indexOf("/") + 1, -5);
        console.log(name + " > " + name.slice(0, -5) + ".json");
        yaml = fs.readFileSync(name, options);
        opject = yaml2json.safeLoad(yaml, {
          filename: file
        });
        if (!opject.name) {
          console.warn("file did not export a .name field!");
          continue;
        }
        all[id] = {
          desc: opject.desc,
          tags: opject.tags,
          time: opject.time,
          version: opject.version,
          stability: opject.stability
        };
        if (opject.symbols) {
          all[id].symbols = opject.symbols.map((sym) => {
            return sym.name;
          }).filter((name) => {
            return name && !name.startsWith("operator::");
          });
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

all2yaml = (sym) => {
  return Object.keys(all).map((key) => {
    sym = all[key];
    return `${key}:\n` + `  desc: ${sym.desc}\n` + `  version: ${sym.version}\n` + `  stability: ${sym.stability}\n` + `  time: ${sym.time.toJSON()}\n` + `  tags: [${sym.tags.join(", ")}]\n` + `  symbols: [${(sym.symbols ? sym.symbols.join(", ") : "")}]`;
  }).join("\n");
};

translatePath = (path) => {
  all = {};
  searchPath(path);
  console.log(`(all) > ${path}.json`);
  fs.writeFileSync(path + ".json", JSON.stringify(all, null, 2));
  console.log(`(all) > ${path}.yaml`);
  return fs.writeFileSync(path + ".yaml", all2yaml());
};

translatePath("go");

translatePath("std");
