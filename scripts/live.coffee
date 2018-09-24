http = require "http"
url = require "url"
fs = require "fs"
path = require "path"

contentTypes =
  ".html": "text/html"
  ".json": "application/json"
  ".js": "text/javascript"
  ".css": "text/css"
  ".coffee": "application/vnd.coffeescript"
  ".scss": "application/octet-stream"
  ".map": "application/octet-stream"
  ".comp": "application/vnd.adjutant.component"
  ".ttf": "font/ttf"
  ".woff": "font/woff"
  ".woff2": "font/woff2"
  ".svg": "image/svg+xml"
  ".png": "image/png"
  ".ico": "image/x-icon"

server = http.createServer (req, res) ->

  file = (url.parse req.url).pathname[1..]
  if ! file or file.endsWith "/"
    file += "index.html"
  file = path.join file

  ext = path.extname file
  contentType = contentTypes[ext]

  if ext == ".json"
    res.setHeader "Access-Control-Allow-Origin", "*"

  if not contentType
    console.log "#{ req.socket.remoteAddress } 404 #{ file }"
    res.statusCode = 404
    res.end()
    return

  stream = fs.createReadStream file
  stream.pipe res
  stream.on "error", () ->
    console.log "#{ req.socket.remoteAddress } 404 #{ file }"
    res.statusCode = 404
    res.end()
  stream.on "open", () ->
    console.log "#{ req.socket.remoteAddress } 200 #{ file }"
    res.writeHead 200,
     "Content-Type": contentType

port = parseInt(process.argv[2]) || 80
server.listen { port }, () ->
  console.log "Up and running!\n"+
    "Listening on port #{ port }.\n"+
    "See http://localhost#{ if port == 80 then "" else ":"+port } in your browser!\n"+
    "Served HTTP requests will appear below:\n"+
    "--------------------------------------------"
