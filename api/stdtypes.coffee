

std = {}

####################

class std.Path
  constructor: (path) ->

    if ! path
      @variadic = false
      @which = 0
      @version = null
      @package = ""
      @symbols = []
      @templates = {}
      return

    splitLeft = (del) ->
      i = path.indexOf del
      if i == -1 then return null
      r = path[i+del.length..]
      path = path[0..i-1]
      return r

    splitRight = (del) ->
      i = path.indexOf del
      if i == -1 then return null
      r = path[0..i-1]
      path = path[i+del.length..]
      return r

    templates = splitLeft "<"

    @variadic = path.endsWith "..."
    if @variadic
      path = path[..-4]

    match = path.match /(.*)\[(\d+)\]$/
    if match
      @which = parseInt match[2]
      path = match[1]
    else
      @which = 0

    symbol = splitLeft "#"
    @version = splitLeft "@"
    @package = path
    @symbols = if symbol then symbol.split /(?<!\.|^)\./ else []
    @templates = if templates then std.parseTemplates templates[..-2] else {}

  fullPackage: () ->
    @package +
    (if @version then "@" + @version else "")

  fullSymbols: () ->
    (@symbols.join ".") +
    (if @which != 0 then "[#{@which}]" else "") +
    (if @variadic then "..." else "")

  toString: () -> @fullPackage() + "#" + @fullSymbols()

####################

std.parseTemplates = (path) ->

  templates = {}
  o = 0

  getType = () ->
    if path[o] == "["
      types = []
      o++
      loop
        if path[o] == "]"
          break
        types.push getType()
        if path[o] != ","
          break
        o++
      return types
    else
      a = path.indexOf "]", o
      b = path.indexOf ",", o
      if a == -1 && b == -1
        type = path[o..]
        o = path.length
        return type

      m = if a == -1 then b else if b == -1 then a else Math.min a, b
      j = path.indexOf "<", o

      if j < m && j != -1 && m != -1
        n = 1
        q = j+1
        loop
          a = path.indexOf "<", q
          b = path.indexOf ">", q
          if a < b && a != -1
            n++
            q = a+1
          else
            n--
            q = b+1
            if n == 0
              type = path[o..b]
              o = b+1
              return type
      else
        type = path[o..m-1]
        o = m
        return type

  loop
    e = path.indexOf "=", o
    name = path[o..e-1]
    o = e+1

    templates[name] = getType()
    if path[o] != ","
      break
    o++

  return templates

####################

# Join paths from symbols.
# A symbol can have a 'type' (-property) with a path that this symbol is refering to.
# But the path can be relative (to the package this symbol comes from) or can
# lack a package version (which means the owners package version is used).
std.resolveReference = (parent, symbol, ref) ->

  if ref[0] == "#"

    path = new std.Path
    pkg = if parent then parent.getPackage() else symbol
    path.package = pkg.name
    path.version = pkg.version
    ref = new std.Path ref
    path.symbols = ref.symbols
    path.templates = ref.templates
    return path.toString()


  # if (ref.startsWith "./") || (ref.startsWith "../")


  return ref

  ###
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
    # other symbol in same package
    return entA.package + pathB

  path = entA.package.split "/"
  path.pop() # (package name)

  # other package (but same packager)
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
  ###


####################


std.match = (type, other) ->

  match = type.match /^\{(\w+)\}$/
  if match
    return [match[1]]: other

  return null


std.template = (type, templates={}, numv=0) ->

  if type.endsWith "..."
    match = type.match /^\{(\w+)\}\.\.\.$/
    if match
      template = match[1]
      if template of templates
        return templates[template][numv] || "*"
    return "*"
  else
    return type.replace /\{(\w+)\}/g, (_, t) => templates[t] || "*"


####################


class std.Language

  constructor: (@name, @link, @logo) ->

    @libs = []
    @cache = {}

  addLib: (lib) -> @libs.push lib

  fetch: (type) ->

    path = if not (type instanceof std.Path)
        new std.Path type
      else
        type

    if type == "*"
      # the 'any type' symbol
      return new std.Symbol this, "", {name: "*", symbols: []}

    pck = await @fetchPackage path
    if path.symbols.length == 0
      return pck

    return pck.find path.symbols, path.which


  fetchPackage: (path) -> # async

    fullPackage = path.fullPackage()
    if fullPackage of @cache
      # a cached package
      return @cache[fullPackage]

    # we set the cached pkg to the promise that resolved the lib
    # to another fetch while this one
    fetch = () =>
      for lib in @libs
        pkg = await lib.fetchPackage path
        if ! pkg then continue
        return @cache[fullPackage] = pkg
      throw new Error "No package with name '#{path.toString()}'."

    return @cache[fullPackage] = fetch() # returns the Promise!

  ###
  fetchPackages: () ->

    if ! @libs.length
      return Promise.resolve {}

    packs = await @libs[0].fetchPackages()

    for lib in @libs[1..]
      npacks = await lib.fetchPackages()
      for key of npacks
        packs[key] = npacks[key]
    return packs
  ###

  clearCache: () ->

    @cache = {}

  resolve: (symbol, templates, numv) ->

    if symbol.type
      return @fetch std.template symbol.type, templates, numv

    return symbol

####################


class std.Library

  constructor: (@name, @link, @logo, @url) ->

    if @url.endsWith "/"
      @url = @url[..-1]


  fetchPackage: (path) ->

    if path.package.includes "."
      # internal packages never contain a dot in the package name
      return null

    version =
    url = @url + "/" + path.package + (if path.version then "@" + path.version else "") + ".json"

    resp = await window.fetch url
    if !resp.ok then throw new Error "Server response for '#{path.fullPackage()}' was not ok: #{resp.status} #{resp.statusText}"

    def = await resp.json()

    return new std.Package this, def, []


  fetchPackages: () ->

    resp = await fetch @url+".json"
    if !resp.ok then throw new Error "Server response for '#{path.fullPackage()}' was not ok: #{resp.status} #{resp.statusText}"

    packs = await resp.json()
    for key of packs
      packs[key] = new std.Preview packs[key]

    return packs

  absPath: (pkg, path) ->

    if path.startsWith "http:" || path.startsWith "https:"
      return path

    if path.startsWith "/"
      return @url + path

    # trim the package name from the package path
    name = pkg.name.split "/"
    name.pop()
    name = name.join "/"

    return @url + "/" + (if name then name+"/" else "")  + path


####################

###
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
###

####################

class std.Type

  constructor: (parent, conf) ->

    @name = conf.name
    @doc = conf.doc || null
    # @template = null
    @type = if conf.type then std.resolveReference parent, this, conf.type else null
    @meta = conf.meta || {}

    ###
    for group in templates
      for template in group
        if template.name == conf.type
          @template = template
          return
    ###

  isTemplated: () -> @type != null && (@type.indexOf "{") != -1
  isMember: () -> @name.startsWith "."
  getMemberName: () -> @name[1..]
  isOperator: () -> @name.startsWith "operator::"
  isVariadic: () -> @type?.endsWith "..."
  variadicType: () -> @type[..-4]


class std.Symbol extends std.Type

  constructor: (parent, conf) ->
    super parent, conf
    @parent = parent

    @which = conf.which || 0


    @templates = if conf.templates and !conf.type
        conf.templates.map (conf) => new std.Template conf
      else
        null

    @symbols = if conf.symbols

      counter = {}
      conf.symbols.map (conf) =>
        index = if conf.name of counter
          ++counter[conf.name]
        else
          counter[conf.name] = 0
        conf.which = index

        if conf.name.startsWith "operator::"
          new std.Operator this, conf
        else
          new std.Symbol this, conf

    else if (conf.in || conf.out) && ! conf.name.startsWith "operator::"
      [
        new std.Operator this,
            name: "operator::()"
            templates: conf.templates
            params: conf.params
            returns: conf.returns
            in: conf.in
            out: conf.out
      ]

    else []

    return

  find: (symbols, which=0) ->
    if symbols.length == 1
      return @symbols.find (symbol) -> symbol.name == symbols[0] && symbol.which == which
    else
      symbol = @symbols.find (symbol) -> symbol.name == symbols[0]
      return symbol?.find symbols[1..], which

  isPackage: () -> false
  isClass: () -> @symbols?.find (sym) => sym.name == "operator::new"
  isFunction: () -> @symbols?.find (sym) => sym.name == "operator::()"
  isObject: () -> @symbols?.find (sym) => sym.name != "operator::()"
  isPureFunction: () -> @isFunction() && !@isObject()
  isPureObject: () -> @isObject() && !@isFunction()

  getPackage: () ->
    pkg = this
    while pkg.parent
      pkg = pkg.parent
    return pkg

  `get package() { return this.getPackage() }`

  absPath: (path) -> @package.absPath path

  getPath: () ->
    if @parent
      path = @parent.getPath()
      path.symbols.push @name
      return path
    else
      path = new std.Path
      path.package = @name
      path.version = @version
      return path

####################

class std.Operator extends std.Symbol

  constructor: (parent, conf) ->
    super parent, conf

    @inputs = if conf.in then conf.in.map (conf) => new std.Type this, conf else null
    @outputs = if conf.out then conf.out.map (conf) => new std.Type this, conf else null

    @params = if conf.params then conf.params.map (conf) => new std.Type this, conf else null
    @returns = if conf.returns then conf.returns.map (conf) => new std.Type this, conf else null

  # isVariadic: () -> @params[@params.length-1]?.path.endsWith "..."
  # isTemplate: () -> @type && @type.includes ".templates."

  # concrete: (type) ->

####################


class std.Template

  constructor: (conf) ->
    @type = conf.type
    @variadic = conf.variadic

    # @doc = conf.doc || null
    # @path = path
    # @variadic = conf.type.endsWith "..."
    # @type = conf.type
    # if @variadic
    #   @type = @type[..-4]
    # @name = conf.name

####################


class std.Package extends std.Symbol

  constructor: (@lib, conf) ->
    super null, conf, []

    @version = conf.version || null

  absPath: (path) -> @lib.absPath this, path

####################


class std.Preview

  constructor: (conf) ->
    @name = conf.name
    @symbols = conf.symbols
    @tags = conf.tags
    @versions = conf.versions

  `get latest() { return this.versions[0]; }`
  `get group() { return this.tags[0]; }`

####################

class GolangInternals extends std.Library
  constructor: () ->
    super "Golang Internals", null, null, ""
    @cache =
      ".loop": new std.Package this,
        name: ".loop"
        templates: [
          name: "mirrors"
          type: "*..."
        ]
        symbols: [
          name: "operator::()"
          in: []
          out: [
            name: "mirrors"
            type: "{mirrors}..."
            meta:
              name: ""
          ]
          params: []
          returns: [
            name: "mirrors"
            type: "{mirrors}..."
            meta:
              name: ""
          ]
          meta:
            is: "group"
            color: "#89b0d4"
        ]

      ".ite": new std.Package this,
        name: ".ite"
        templates: [
          name: "mirrors"
          type: "*..."
          variadic: true
        ]
        symbols: [
          name: "operator::()"
          in: [
            name: "cond"
            type: "bool"
          ]
          out: [
            name: "mirrors"
            type: "{mirrors}..."
            meta:
              name: ""
          ]
          params: []
          returns: [
            name: "mirrors"
            type: "{mirrors}..."
            meta:
              name: ""
          ]
          meta:
            is: "group"
            color: "#eadb1b"
        ]

  fetchPackage: (path) -> @cache[path.package]

  fetchPackages: () -> []

####################


std.of = (lang) -> switch lang

  when "go"
    lang = new std.Language "go", "https://golang.org/index.html?go", "img/lang-Go.svg"
    lang.addLib new GolangInternals
    lang.addLib new std.Library "stdtypes.org Go", "http://localhost/index.html?go", "img/stdtypes_192px.svg", "http://localhost/go"
    return lang

  when "js"
    new std.Language {
        name: "js"
        link: "https://golang.org/index.html?js"
        logo: "img/lang-JavaScript.svg"
      }, [
        new std.Library
          name: "stdtypes.org JavaScript"
          link: "http://localhost/index.html?js"
          logo: "img/stdtypes_192px.svg"
          url: "http://localhost/js"
      ], {
        go: new std.Packager
          name: "NPM"
          link: "https://golang.org/npm/"
          logo: "img/pkg-npm.svg"
      }

  ###
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
  ###

  else throw new Error "Lang #{lang} unknown."

################################################################################

###
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
###
