var GolangInternals, std;

std = {};

//###################
std.Path = class Path {
  constructor(path) {
    var match, splitLeft, splitRight, symbol, templates;
    if (!path) {
      this.variadic = false;
      this.which = 0;
      this.version = null;
      this.package = "";
      this.symbols = [];
      this.templates = {};
      return;
    }
    splitLeft = function(del) {
      var i, r;
      i = path.indexOf(del);
      if (i === -1) {
        return null;
      }
      r = path.slice(i + del.length);
      path = path.slice(0, +(i - 1) + 1 || 9e9);
      return r;
    };
    splitRight = function(del) {
      var i, r;
      i = path.indexOf(del);
      if (i === -1) {
        return null;
      }
      r = path.slice(0, +(i - 1) + 1 || 9e9);
      path = path.slice(i + del.length);
      return r;
    };
    templates = splitLeft("<");
    this.variadic = path.endsWith("...");
    if (this.variadic) {
      path = path.slice(0, -3);
    }
    match = path.match(/(.*)\[(\d+)\]$/);
    if (match) {
      this.which = parseInt(match[2]);
      path = match[1];
    } else {
      this.which = 0;
    }
    symbol = splitLeft("#");
    this.version = splitLeft("@");
    this.package = path;
    this.symbols = symbol ? symbol.split(/(?<!\.|^)\./) : [];
    this.templates = templates ? std.parseTemplates(templates.slice(0, -1)) : {};
  }

  fullPackage() {
    return this.package + (this.version ? "@" + this.version : "");
  }

  fullSymbols() {
    return (this.symbols.join(".")) + (this.which !== 0 ? `[${this.which}]` : "") + (this.variadic ? "..." : "");
  }

  toString() {
    return this.fullPackage() + "#" + this.fullSymbols();
  }

};

//###################
std.parseTemplates = function(path) {
  var e, getType, name, o, templates;
  templates = {};
  o = 0;
  getType = function() {
    var a, b, j, m, n, q, type, types;
    if (path[o] === "[") {
      types = [];
      o++;
      while (true) {
        if (path[o] === "]") {
          break;
        }
        types.push(getType());
        if (path[o] !== ",") {
          break;
        }
        o++;
      }
      return types;
    } else {
      a = path.indexOf("]", o);
      b = path.indexOf(",", o);
      if (a === -1 && b === -1) {
        type = path.slice(o);
        o = path.length;
        return type;
      }
      m = a === -1 ? b : b === -1 ? a : Math.min(a, b);
      j = path.indexOf("<", o);
      if (j < m && j !== -1 && m !== -1) {
        n = 1;
        q = j + 1;
        while (true) {
          a = path.indexOf("<", q);
          b = path.indexOf(">", q);
          if (a < b && a !== -1) {
            n++;
            q = a + 1;
          } else {
            n--;
            q = b + 1;
            if (n === 0) {
              type = path.slice(o, +b + 1 || 9e9);
              o = b + 1;
              return type;
            }
          }
        }
      } else {
        type = path.slice(o, +(m - 1) + 1 || 9e9);
        o = m;
        return type;
      }
    }
  };
  while (true) {
    e = path.indexOf("=", o);
    name = path.slice(o, +(e - 1) + 1 || 9e9);
    o = e + 1;
    templates[name] = getType();
    if (path[o] !== ",") {
      break;
    }
    o++;
  }
  return templates;
};

//###################

// Join paths from symbols.
// A symbol can have a 'type' (-property) with a path that this symbol is refering to.
// But the path can be relative (to the package this symbol comes from) or can
// lack a package version (which means the owners package version is used).
std.resolveReference = function(parent, symbol, ref) {
  var path, pkg;
  if (ref[0] === "#") {
    path = new std.Path;
    pkg = parent ? parent.getPackage() : symbol;
    path.package = pkg.name;
    path.version = pkg.version;
    ref = new std.Path(ref);
    path.symbols = ref.symbols;
    path.templates = ref.templates;
    return path.toString();
  }
  // if (ref.startsWith "./") || (ref.startsWith "../")
  return ref;
};

/*
pathA = symbol.path
if ! (pathB.startsWith "./") && ! (pathB.startsWith "../") && !(pathB[0] == "#")

  for group in templates
    for template in group
      if template.name == pathB
        template.symbols.push symbol
        symbol.template = template
        return null

  return pathB

entA = std.parsePath pathA

if pathB[0] == "#"
 * other symbol in same package
  return entA.package + pathB

path = entA.package.split "/"
path.pop() # (package name)

 * other package (but same packager)
loop
  if pathB.startsWith "./"
    pathB = pathB[2..]
    continue
  if pathB.startsWith "../"
    pathB = pathB[3..]
    path.pop()
    continue

  return (
    (if entA.packager then entA.packager + "?" else "") +
    (path.join "/") +
    pathB)
 */
//###################
std.match = function(type, other) {
  var match;
  match = type.match(/^\{(\w+)\}$/);
  if (match) {
    return {
      [match[1]]: other
    };
  }
  return null;
};

std.template = function(type, templates = {}, numv = 0) {
  var match, template;
  if (type.endsWith("...")) {
    match = type.match(/^\{(\w+)\}\.\.\.$/);
    if (match) {
      template = match[1];
      if (template in templates) {
        return templates[template][numv] || "*";
      }
    }
    return "*";
  } else {
    return type.replace(/\{(\w+)\}/g, (_, t) => {
      return templates[t] || "*";
    });
  }
};

//###################
std.Language = class Language {
  constructor(name1, link, logo) {
    this.name = name1;
    this.link = link;
    this.logo = logo;
    this.libs = [];
    this.cache = {};
  }

  addLib(lib) {
    return this.libs.push(lib);
  }

  async fetch(type) {
    var path, pck;
    path = !(type instanceof std.Path) ? new std.Path(type) : type;
    if (type === "*") {
      // the 'any type' symbol
      return new std.Symbol(this, "", {
        name: "*",
        symbols: []
      });
    }
    pck = (await this.fetchPackage(path));
    if (path.symbols.length === 0) {
      return pck;
    }
    return pck.find(path.symbols, path.which);
  }

  fetchPackage(path) { // async
    var fetch, fullPackage;
    fullPackage = path.fullPackage();
    if (fullPackage in this.cache) {
      // a cached package
      return this.cache[fullPackage];
    }
    // we set the cached pkg to the promise that resolved the lib
    // to another fetch while this one
    fetch = async() => {
      var k, len, lib, pkg, ref1;
      ref1 = this.libs;
      for (k = 0, len = ref1.length; k < len; k++) {
        lib = ref1[k];
        pkg = (await lib.fetchPackage(path));
        if (!pkg) {
          continue;
        }
        return this.cache[fullPackage] = pkg;
      }
      throw new Error(`No package with name '${path.toString()}'.`);
    };
    return this.cache[fullPackage] = fetch(); // returns the Promise!
  }

  /*
  fetchPackages: () ->

  if ! @libs.length
  return Promise.resolve {}

  packs = await @libs[0].fetchPackages()

  for lib in @libs[1..]
  npacks = await lib.fetchPackages()
  for key of npacks
    packs[key] = npacks[key]
  return packs
  */
  clearCache() {
    return this.cache = {};
  }

  resolve(symbol, templates, numv) {
    if (symbol.type) {
      return this.fetch(std.template(symbol.type, templates, numv));
    }
    return symbol;
  }

};

//###################
std.Library = class Library {
  constructor(name1, link, logo, url1) {
    this.name = name1;
    this.link = link;
    this.logo = logo;
    this.url = url1;
    if (this.url.endsWith("/")) {
      this.url = this.url.slice(0);
    }
  }

  async fetchPackage(path) {
    var def, resp, url, version;
    if (path.package.includes(".")) {
      // internal packages never contain a dot in the package name
      return null;
    }
    version = url = this.url + "/" + path.package + (path.version ? "@" + path.version : "") + ".json";
    resp = (await window.fetch(url));
    if (!resp.ok) {
      throw new Error(`Server response for '${path.fullPackage()}' was not ok: ${resp.status} ${resp.statusText}`);
    }
    def = (await resp.json());
    return new std.Package(this, def, []);
  }

  async fetchPackages() {
    var key, packs, resp;
    resp = (await fetch(this.url + ".json"));
    if (!resp.ok) {
      throw new Error(`Server response for '${path.fullPackage()}' was not ok: ${resp.status} ${resp.statusText}`);
    }
    packs = (await resp.json());
    for (key in packs) {
      packs[key] = new std.Preview(packs[key]);
    }
    return packs;
  }

  absPath(pkg, path) {
    var name;
    if (path.startsWith("http:" || path.startsWith("https:"))) {
      return path;
    }
    if (path.startsWith("/")) {
      return this.url + path;
    }
    // trim the package name from the package path
    name = pkg.name.split("/");
    name.pop();
    name = name.join("/");
    return this.url + "/" + (name ? name + "/" : "") + path;
  }

};

//###################
/*
class std.Packager

  constructor: (@name, @link, @logo) ->

  search: (query) ->
#TODO implement
Promise.resolve
  "github.com/j-forster/waziup-mqtt": new std.Package
    name: "Waziup MQTT"
    symbols: []
    tags: [ "Networking", "MQTT", "Waziup" ]
    versions: [ "1.0.0" ]
  "github.com/j-forster/mqtt":  new std.Package
    name: "J. Forster - MQTT"
    symbols: []
    tags: [ "Networking", "MQTT" ]
    versions: [ "1.0.0" ]

  fetch: (path) ->

path = if path instanceof Object then path else std.parsePath path

pack = new std.Symbol this, path.packager+"?github.com/j-forster/waziup-mqtt@1.0.0",
  name: "Waziup MQTT"
  version: "1.0.0"
  doc: "This is MQTT!"

return Promise.resolve pack
 */
//###################
std.Type = class Type {
  constructor(parent, conf) {
    this.name = conf.name;
    this.doc = conf.doc || null;
    // @template = null
    this.type = conf.type ? std.resolveReference(parent, this, conf.type) : null;
    this.meta = conf.meta || {};
  }

  /*
  for group in templates
    for template in group
      if template.name == conf.type
        @template = template
        return
  */
  isTemplated() {
    return this.type !== null && (this.type.indexOf("{")) !== -1;
  }

  isMember() {
    return this.name.startsWith(".");
  }

  getMemberName() {
    return this.name.slice(1);
  }

  isOperator() {
    return this.name.startsWith("operator::");
  }

  isVariadic() {
    var ref1;
    return (ref1 = this.type) != null ? ref1.endsWith("...") : void 0;
  }

  variadicType() {
    return this.type.slice(0, -3);
  }

};

std.Symbol = class Symbol extends std.Type {
  constructor(parent, conf) {
    var counter;
    super(parent, conf);
    this.parent = parent;
    this.which = conf.which || 0;
    this.templates = conf.templates && !conf.type ? conf.templates.map((conf) => {
      return new std.Template(conf);
    }) : null;
    this.symbols = conf.symbols ? (counter = {}, conf.symbols.map((conf) => {
      var index;
      index = conf.name in counter ? ++counter[conf.name] : counter[conf.name] = 0;
      conf.which = index;
      if (conf.name.startsWith("operator::")) {
        return new std.Operator(this, conf);
      } else {
        return new std.Symbol(this, conf);
      }
    })) : (conf.in || conf.out) && !conf.name.startsWith("operator::") ? [
      new std.Operator(this,
      {
        name: "operator::()",
        templates: conf.templates,
        params: conf.params,
        returns: conf.returns,
        in: conf.in,
        out: conf.out
      })
    ] : [];
    return;
  }

  find(symbols, which = 0) {
    var symbol;
    if (symbols.length === 1) {
      return this.symbols.find(function(symbol) {
        return symbol.name === symbols[0] && symbol.which === which;
      });
    } else {
      symbol = this.symbols.find(function(symbol) {
        return symbol.name === symbols[0];
      });
      return symbol != null ? symbol.find(symbols.slice(1), which) : void 0;
    }
  }

  isPackage() {
    return false;
  }

  isClass() {
    var ref1;
    return (ref1 = this.symbols) != null ? ref1.find((sym) => {
      return sym.name === "operator::new";
    }) : void 0;
  }

  isFunction() {
    var ref1;
    return (ref1 = this.symbols) != null ? ref1.find((sym) => {
      return sym.name === "operator::()";
    }) : void 0;
  }

  isObject() {
    var ref1;
    return (ref1 = this.symbols) != null ? ref1.find((sym) => {
      return sym.name !== "operator::()";
    }) : void 0;
  }

  isPureFunction() {
    return this.isFunction() && !this.isObject();
  }

  isPureObject() {
    return this.isObject() && !this.isFunction();
  }

  getPackage() {
    var pkg;
    pkg = this;
    while (pkg.parent) {
      pkg = pkg.parent;
    }
    return pkg;
  }

  get package() { return this.getPackage() };

  absPath(path) {
    return this.package.absPath(path);
  }

  getPath() {
    var path;
    if (this.parent) {
      path = this.parent.getPath();
      path.symbols.push(this.name);
      return path;
    } else {
      path = new std.Path;
      path.package = this.name;
      path.version = this.version;
      return path;
    }
  }

};

//###################
std.Operator = class Operator extends std.Symbol {
  constructor(parent, conf) {
    super(parent, conf);
    this.inputs = conf.in ? conf.in.map((conf) => {
      return new std.Type(this, conf);
    }) : null;
    this.outputs = conf.out ? conf.out.map((conf) => {
      return new std.Type(this, conf);
    }) : null;
    this.params = conf.params ? conf.params.map((conf) => {
      return new std.Type(this, conf);
    }) : null;
    this.returns = conf.returns ? conf.returns.map((conf) => {
      return new std.Type(this, conf);
    }) : null;
  }

};

// isVariadic: () -> @params[@params.length-1]?.path.endsWith "..."
// isTemplate: () -> @type && @type.includes ".templates."

// concrete: (type) ->

//###################
std.Template = class Template {
  constructor(conf) {
    this.type = conf.type;
    this.variadic = conf.variadic;
  }

};

// @doc = conf.doc || null
// @path = path
// @variadic = conf.type.endsWith "..."
// @type = conf.type
// if @variadic
//   @type = @type[..-4]
// @name = conf.name

//###################
std.Package = class Package extends std.Symbol {
  constructor(lib1, conf) {
    super(null, conf, []);
    this.lib = lib1;
    this.version = conf.version || null;
  }

  absPath(path) {
    return this.lib.absPath(this, path);
  }

};

//###################
std.Preview = class Preview {
  constructor(conf) {
    this.name = conf.name;
    this.symbols = conf.symbols;
    this.tags = conf.tags;
    this.versions = conf.versions;
  }

  get latest() { return this.versions[0]; };

  get group() { return this.tags[0]; };

};

//###################
GolangInternals = class GolangInternals extends std.Library {
  constructor() {
    super("Golang Internals", null, null, "");
    this.cache = {
      ".loop": new std.Package(this, {
        name: ".loop",
        templates: [
          {
            name: "mirrors",
            type: "*..."
          }
        ],
        symbols: [
          {
            name: "operator::()",
            in: [],
            out: [
              {
                name: "mirrors",
                type: "{mirrors}...",
                meta: {
                  name: ""
                }
              }
            ],
            params: [],
            returns: [
              {
                name: "mirrors",
                type: "{mirrors}...",
                meta: {
                  name: ""
                }
              }
            ],
            meta: {
              is: "group",
              color: "#89b0d4"
            }
          }
        ]
      }),
      ".ite": new std.Package(this, {
        name: ".ite",
        templates: [
          {
            name: "mirrors",
            type: "*...",
            variadic: true
          }
        ],
        symbols: [
          {
            name: "operator::()",
            in: [
              {
                name: "cond",
                type: "bool"
              }
            ],
            out: [
              {
                name: "mirrors",
                type: "{mirrors}...",
                meta: {
                  name: ""
                }
              }
            ],
            params: [],
            returns: [
              {
                name: "mirrors",
                type: "{mirrors}...",
                meta: {
                  name: ""
                }
              }
            ],
            meta: {
              is: "group",
              color: "#eadb1b"
            }
          }
        ]
      })
    };
  }

  fetchPackage(path) {
    return this.cache[path.package];
  }

  fetchPackages() {
    return [];
  }

};

//###################
std.of = function(lang) {
  switch (lang) {
    case "go":
      lang = new std.Language("go", "https://golang.org/index.html?go", "img/lang-Go.svg");
      lang.addLib(new GolangInternals);
      lang.addLib(new std.Library("stdtypes.org Go", "http://localhost/index.html?go", "img/stdtypes_192px.svg", "http://localhost/go"));
      return lang;
    case "js":
      return new std.Language({
        name: "js",
        link: "https://golang.org/index.html?js",
        logo: "img/lang-JavaScript.svg"
      }, [
        new std.Library({
          name: "stdtypes.org JavaScript",
          link: "http://localhost/index.html?js",
          logo: "img/stdtypes_192px.svg",
          url: "http://localhost/js"
        })
      ], {
        go: new std.Packager({
          name: "NPM",
          link: "https://golang.org/npm/",
          logo: "img/pkg-npm.svg"
        })
      });
    default:
      /*
      when "js"

      if ! std.langs.js
      std.langs.js = new std.Language "js", [
        new std.Library "stdtypes.org JS", "http://localhost/js"
      ], [
        new std.Packager "npm", "http://localhost/npm"
      ]
      return std.langs.js

      when "node"

      if ! std.langs.node

      std.langs.node = new std.Language "node", [
        new std.Library "stdtypes.org JS", "http://localhost/js"
        new std.Library "stdtypes.org Node.js", "http://localhost/node"
      ], [
        new std.Packager "npm", "http://localhost/npm"
      ]
      return std.langs.node
      */
      throw new Error(`Lang ${lang} unknown.`);
  }
};

//###############################################################################
/*
lang = std.of "go"
console.log lang

lang.fetchPackages()
.then (packs) =>

  console.log packs

lang.fetch "Geolocation@1.0.0#.Latitude"
.then (symbol) =>

  console.log symbol

lang.fetch "Geolocation@2.0.0#operator::new[0]"
.then (symbol) =>

  console.log symbol
*/
