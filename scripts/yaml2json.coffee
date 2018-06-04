yaml2json = require "js-yaml"
fs = require "fs"

options =
  encoding: "utf8"

all = {}

searchPath = (path) ->
  files = fs.readdirSync path
  for file in files

    name = path + "/" + file

    stat = fs.statSync name

    if stat.isDirectory()
      searchPath name

    else if stat.isFile()
      if file.endsWith ".yaml"

        id = name[name.indexOf("/")+1..-6]

        console.log name + " > " + name[..-6] + ".json"

        yaml = fs.readFileSync name, options
        opject = yaml2json.safeLoad yaml,
          filename: file

        if !opject.name
          console.warn "file did not export a .name field!"
          continue

        all[id] =
          desc: opject.desc
          tags: opject.tags
          time: opject.time
          version: opject.version
          stability: opject.stability
        if opject.symbols
          all[id].symbols = opject.symbols
            .map (sym) => sym.name
            .filter (name) => name && !name.startsWith "operator::"

        json = JSON.stringify opject, null, 2
        fs.writeFileSync name.substring(0 , name.length - 4) + "json", json




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


translatePath = (path) =>
  all = {}

  searchPath path

  console.log "(all) > #{ path }.json"
  fs.writeFileSync path+".json", JSON.stringify all, null, 2
  console.log "(all) > #{ path }.yaml"
  fs.writeFileSync path+".yaml", all2yaml()


translatePath "go"
translatePath "std"
