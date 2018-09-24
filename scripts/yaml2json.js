
/*
all2yaml = (sym) =>
  Object.keys(all)
    .map (key) =>
      sym = all[key]
      "#{key}:\n"+
      "  desc: #{sym.desc}\n"+
      "  version: #{sym.version}\n"+
      "  stability: #{sym.stability}\n"+
      "  time: #{sym.time.toJSON()}\n"+
      "  tags: [#{sym.tags.join(", ")}]\n"+
      "  symbols: [#{if sym.symbols then sym.symbols.join(", ") else ""}]"
    .join "\n"
*/
var copy, fs, glob, options, path, previews, semver, translateLib, yaml2json;

yaml2json = require("js-yaml");

fs = require("fs");

semver = require("semver");

glob = require("glob");

path = require("path");

copy = function(from, to) {
  return fs.createReadStream(from).pipe(fs.createWriteStream(to));
};

options = {
  encoding: "utf8"
};

previews = {};

translateLib = (lib) => {
  var basename, file, i, json, latest, len, pack, packName, preview, ref, version, yaml;
  previews = {};
  ref = glob.sync(lib + "/**/*@*.yaml");
  for (i = 0, len = ref.length; i < len; i++) {
    file = ref[i];
    basename = path.basename(file, ".yaml");
    console.log(`[${lib}] ${file} > .json`);
    yaml = fs.readFileSync(file, options);
    pack = yaml2json.safeLoad(yaml, {
      filename: file
    });
    [packName, version] = basename.split("@");
    if (packName in previews) {
      preview = previews[packName];
      preview.versions.push(version);
      if (!preview.versions.find((v) => {
        return semver.gt(v, version);
      })) {
        preview.name = pack.name;
        preview.tags = pack.tags;
        if (pack.symbols) {
          preview.symbols = pack.symbols.map((sym) => {
            return sym.name;
          }).filter((name) => {
            return name && !name.startsWith("operator::");
          });
        }
      }
    } else {
      preview = previews[packName] = {
        versions: [version],
        name: pack.name,
        tags: pack.tags
      };
      if (pack.symbols) {
        preview.symbols = pack.symbols.map((sym) => {
          return sym.name;
        }).filter((name) => {
          return name && !name.startsWith("operator::");
        });
      }
    }
    json = JSON.stringify(pack, null, 2);
    fs.writeFileSync(path.dirname(file) + "/" + basename + ".json", json);
    preview.versions.sort(semver.lt);
    latest = path.dirname(file) + "/" + packName + "@" + preview.versions[0] + ".json";
    copy(latest, path.dirname(file) + "/" + packName + ".json");
  }
  console.log(`[${lib}] (all previews) > ${lib}.json`);
  return fs.writeFileSync(lib + ".json", JSON.stringify(previews, null, 2));
};

// console.log "(all) > #{ path }.yaml"
// fs.writeFileSync path+".yaml", all2yaml()
translateLib("go");

translateLib("js");
