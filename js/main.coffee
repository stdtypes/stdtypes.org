
inflateNavbar = (types) ->
  groups = {}

  for name,type of types
    g = type.tags[0]
    if not (g of groups)
      $ "<h2>"
        .text g
        .appendTo ".index"
      groups[g] = $ "<ul>"
        .appendTo ".index"
    group = groups[g]
    li = $ "<li>"
      .appendTo group
    $ "<a>"
      .attr
        "data-type": name
        href: "#"+name
      .text name
      .appendTo li


################################################################################


markdown = new showdown.Converter
  emoji: true


isObject = (sym) -> sym.symbols and
  sym.symbols.find (sym) => ! sym.name.startsWith "operator::"

isFunction = (sym) -> sym.symbols and
  sym.symbols.find (sym) => sym.name == "operator::()"

isAny = (sym) -> sym.meta?.abstract && ! sym.symbols?.length && ! sym.type

isPureFunction = (sym) -> ! isObject(sym) and isFunction(sym)


################################################################################


inflateReference = (ref, type) ->

  templ = findTemplate type
  if templ

    $ "<a>"
      .addClass "reference"
      .attr "href", "#"+templ
      .text "→ Template "+type

  else


    if type[0] == "."
      href = "#"+ref.split(".")[0]+type
    else
      if type in window.types
        href = "#"+type
      else
        href = "/#"+type

    $ "<a>"
      .addClass "reference"
      .attr "href", href
      .text "→ "+type.split(".").pop()


################################################################################


templates = []

findTemplate = (name) ->
  for templs in templates
    for n of templs
      if n == name
        return templs[n]
  return null

inflateTemplate = (ref, template) ->

  table = $ "<div>"
    .addClass "table"

  t = {}
  for name of template
    t[name] = ref+".template."+name
  templates.push t

  for name, templ of template

    template.push

    row = $ "<div>"
      .addClass "row"
      .appendTo table

    $ "<h3>"
      .addClass "column"
      .text name
      .attr "id", ref+".template."+name
      .appendTo row

    t = $ "<div>"
      .addClass "column"
      .text templ
      .appendTo row

    if templ == "number"
      t.html "number (<a href='#int'>int</a> or <a href='#float'>float</a>)"
    else
      t.append inflateReference ref, templ

  return table


################################################################################


languages =
  JavaScript: ".js"
  Go: ".go"
  CoffeeScript: ".coffeescript"

env = null


inflateSymbol = (sym, impl, container, href) ->

  container = $ "<div>"
    .addClass "symbol"
    .appendTo container

  head = $ "<div>"
    .addClass "head level"+(href.split(".").length-1)
    .appendTo container

  if (sym.params || sym.returns) and not sym.name.startsWith "operator::"
    if ! sym.symbols then sym.symbols = []
    sym.symbols.push
      name: "operator::()"
      params: sym.params
      returns: sym.returns
      meta: sym.meta

  details = $ "<div>"
    .addClass "details"

  if sym.meta?.impl

    impls = $ "<div>"
      .addClass "implementation"
      .appendTo details

    for i in sym.meta.impl
      if i of languages
        $ "<a>"
          .attr
            href: href+languages[i]
            "data-lang": i
          .html "<img src='img/lang-#{i}.svg' alt='Language #{i}'>"
          .appendTo impls

  if sym.version
    version = $ "<span>"
      .addClass "version"
      .text sym.version
    details.append version
  if sym.stability
    stability = $ "<span>"
      .addClass "stability "+sym.stability
      .text sym.stability
    details.append stability

  ##########

  name = sym.desc || sym.name
  suffix = switch
    when isPureFunction(sym) then " ()"
    else ""

  heading = null

  ###
  if name == "operator::()"
    $ "<h5>"
      .text "Function Call"
      .appendTo head

  else if name == "operator::new"
    $ "<h5>"
      .text "Constructor"
      .appendTo head

  else
  ###
  if name and ! name.startsWith "operator::"
    $ "<h3>"
      .append $("<a>").attr("href", "#"+href).text name+suffix
      .attr "id", href
      .appendTo head

  if ! details.is ":empty"
    details.appendTo head

  if sym.type

    inflateReference href, sym.type
      .appendTo head

  if isAny(sym)
    $ "<span>"
      .addClass "reference"
      .text "(any)"
      .appendTo head

  if sym.doc
    doc = $ "<p>"
      .addClass "doc"
      .html markdown.makeHtml sym.doc
      .appendTo head

  if sym.name and sym.name.startsWith "operator::"

    container.addClass "operator"

    if sym.template
      $ "<div>"
        .append inflateTemplate href, sym.template
        .addClass "template body"
        .appendTo container

    if typeof sym.params == "string"
      sym.params = [name: "", type: sym.params]
    params = $ "<ul>"
      .addClass "params body"
      .appendTo container
    inflateSymbol symbol, null, params, href+".params."+symbol.name for symbol in sym.params

    if typeof sym.returns == "string"
      sym.returns = [name: "", type: sym.returns]
    returns = $ "<ul>"
      .addClass "returns body"
      .appendTo container
    inflateSymbol symbol, null, returns, href+".returns."+symbol.name for symbol in sym.returns

    if sym.template
      templates.pop()

  else if sym.symbols

    syms = $ "<ul>"
      .addClass "symbols body"
      .appendTo container
    inflateSymbol symbol, null, syms, href+"."+symbol.name for symbol in sym.symbols

  return container


################################################################################

currentType = ""

loadSymbol = (symbol) =>
  if symbol

    $ "nav"
      .removeClass "open"

    type = symbol.split(".")[0]
    if currentType == type
      $ "h3.active"
        .removeClass "active"
      $ document.getElementById symbol
        .addClass "active"
      return
    currentType = type

    fetch env+"/"+type+".json"
      .then (resp) => resp.json()
      .then (sym) =>

        $ ".container"
          .remove()

        ##########

        container = $ "<ul>"
          .addClass "container"
          .insertAfter "nav"
        h4 = $ "<h4>"
          .html "<a href='##{ type }' class='active'>#{ env }::#{ type }</a>" # .split("/").join("::")
          .appendTo container

        $ "h3.active"
          .removeClass "active"

        inflateSymbol sym, null, container, type
          .addClass "root"

        $ document.getElementById symbol
          .addClass "active"

################################################################################

types = {}

loadEnv = (env) =>

  window.env = env

  fetch env+".json"
    .then (resp) => resp.json()
    .then (types) =>
      window.types = types
      inflateNavbar types

  loadSymbol document.location.hash[1..]
  $(window).on "hashchange", () => loadSymbol document.location.hash[1..]


$ ".burger"
  .on "click", (event) ->
    $ "nav"
      .toggleClass "open"
