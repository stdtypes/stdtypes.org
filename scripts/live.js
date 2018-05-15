var contentTypes, fs, http, path, port, server, url;

http = require("http");

url = require("url");

fs = require("fs");

path = require("path");

contentTypes = {
  ".html": "text/html",
  ".json": "application/json",
  ".js": "text/javascript",
  ".css": "text/css",
  ".coffee": "application/vnd.coffeescript",
  ".scss": "application/octet-stream",
  ".map": "application/octet-stream",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".svg": "image/svg+xml",
  ".png": "image/png"
};

server = http.createServer(function(req, res) {
  var contentType, ext, file, stream;
  file = (url.parse(req.url)).pathname.slice(1);
  if (!file || file.endsWith("/")) {
    file += "index.html";
  }
  file = path.join(file);
  ext = path.extname(file);
  contentType = contentTypes[ext];
  if (!contentType) {
    console.log(`${req.socket.remoteAddress} 404 ${file}`);
    res.statusCode = 404;
    res.end();
    return;
  }
  stream = fs.createReadStream("www/" + file);
  stream.pipe(res);
  stream.on("error", function() {
    console.log(`${req.socket.remoteAddress} 404 ${file}`);
    res.statusCode = 404;
    return res.end();
  });
  return stream.on("open", function() {
    console.log(`${req.socket.remoteAddress} 200 ${file}`);
    return res.writeHead(200, {
      "Content-Type": contentType
    });
  });
});

port = parseInt(process.argv[2]) || 80;

server.listen({port}, function() {
  return console.log("Up and running!\n" + `Listening on port ${port}.\n` + `See http://localhost${(port === 80 ? "" : ":" + port)} in your browser!\n` + "Served HTTP requests will appear below:\n" + "--------------------------------------------");
});
