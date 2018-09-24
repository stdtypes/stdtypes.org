yaml2json = require "js-yaml"
fs = require "fs"
semver = require "semver"
glob = require "glob"
path = require "path"


copy = (from, to) ->
  fs.createReadStream from
    .pipe fs.createWriteStream to


options =
  encoding: "utf8"

previews = {}

###
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
###

translateLib = (lib) =>
  previews = {}

  for file in glob.sync lib+"/**/*@*.yaml"

    basename = path.basename file, ".yaml"
    console.log "[#{lib}] #{file} > .json"

    yaml = fs.readFileSync file, options
    pack = yaml2json.safeLoad yaml,
      filename: file

    [packName, version]  = basename.split "@"

    if packName of previews
      preview = previews[packName]
      preview.versions.push version
      if ! preview.versions.find (v) => semver.gt v, version
        preview.name = pack.name
        preview.tags = pack.tags
        if pack.symbols
          preview.symbols = pack.symbols
            .map (sym) => sym.name
            .filter (name) => name && !name.startsWith "operator::"
    else
      preview = previews[packName] =
        versions: [version]
        name: pack.name
        tags: pack.tags
      if pack.symbols
        preview.symbols = pack.symbols
          .map (sym) => sym.name
          .filter (name) => name && !name.startsWith "operator::"

    json = JSON.stringify pack, null, 2
    fs.writeFileSync path.dirname(file) + "/" + basename + ".json", json

    preview.versions.sort semver.lt
    latest = path.dirname(file)+"/"+packName+"@"+preview.versions[0]+".json"
    copy latest, path.dirname(file)+"/"+packName+".json"

  console.log "[#{lib}] (all previews) > #{ lib }.json"
  fs.writeFileSync lib+".json", JSON.stringify previews, null, 2
  # console.log "(all) > #{ path }.yaml"
  # fs.writeFileSync path+".yaml", all2yaml()


translateLib "go"
translateLib "js"
