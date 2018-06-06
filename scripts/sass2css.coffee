sass = require "node-sass"
fs = require "fs"

options =
  encoding: "utf8"

translatePath = (path) ->

  files = fs.readdirSync path
  for file in files

    name = path + "/" + file

    stat = fs.statSync name

    if stat.isDirectory()
      searchPath name

    else if stat.isFile()

      if file.endsWith ".sass"

        console.log name+" > "+ name[..-5] + "min.css"

        data = fs.readFileSync name, options

        result = sass.renderSync
          data: data
          file: name
          outputStyle: "compressed"
          indentedSyntax: true

        fs.writeFileSync name[..-5] + "min.css", result.css

translatePath "css"
