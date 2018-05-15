
inflateNavbar = (types) ->
  groups = {}

  for name,type of types
    g = type.tags[0]
    if not (g of groups)
      $ "<h2>"
        .text g
        .appendTo "nav"
      groups[g] = $ "<ul>"
        .appendTo "nav"
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

isPureFunction = (sym) -> ! isObject(sym) and isFunction(sym)


################################################################################


languages =
  JavaScript: ".js"
  Go: ".go"
  CoffeeScript: ".coffeescript"


inflateSymbol = (sym, impl, container, parent="") ->

  href = if parent then parent+"."+sym.name else sym.name

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

  if name == "operator::()"
    heading = $ "<h5>"
      .text "Function Call"

  else if name == "operator::new"
    heading = $ "<h5>"
      .text "Constructor"

  else if name
    heading = $ "<h3>"
      .append $("<a>").attr("href", "#"+href).text name+suffix
      .attr "id", href

  container.append heading

  if name == "operator::()"
    heading.closest ".row"
      .addClass "operator"

  if ! details.is ":empty"
    details.appendTo container

  if sym.type
    type = if sym.type[0] == "." then parent.split(".")[0]+sym.type else sym.type
    $ "<a>"
      .addClass "reference"
      .attr "href", "#"+type
      .text "→ "+type
      .appendTo container

  if sym.doc
    doc = $ "<p>"
      .addClass "doc"
      .html markdown.makeHtml sym.doc
      .appendTo container

  if sym.name and sym.name.startsWith "operator::"

    if typeof sym.params == "string"
      sym.params = [name: "", type: sym.params]
    params = $ "<ul>"
      .addClass "params"
      .appendTo container
    inflateSymbol symbol, null, params, href+".params" for symbol in sym.params

    if typeof sym.returns == "string"
      sym.returns = [name: "", type: sym.returns]
    returns = $ "<ul>"
      .addClass "returns"
      .appendTo container
    inflateSymbol symbol, null, returns, href+".returns" for symbol in sym.returns

  else if sym.symbols

    syms = $ "<ul>"
      .addClass "symbols"
      .appendTo container

    inflateSymbol symbol, null, syms, href for symbol in sym.symbols


################################################################################

currentType = ""

loadSymbol = (symbol) =>
  if symbol

    type = symbol.split(".")[0]
    if currentType == type
      $ "h3.active"
        .removeClass "active"
      $ document.getElementById symbol
        .addClass "active"
      return
    currentType = type

    fetch "./#{type}.json"
      .then (resp) => resp.json()
      .then (sym) =>

        $ ".container"
          .remove()

        ##########

        container = $ "<ul>"
          .addClass "container"
          .insertAfter "nav"
        h4 = $ "<h4>"
          .html "<a href='stdtypes.org'>std::</a>"+
            "<a href='##{ type }' class='active'>#{ type }</a>"
          .appendTo container

        $ "h3.active"
          .removeClass "active"

        inflateSymbol sym, null, container
        $ document.getElementById symbol
          .addClass "active"

################################################################################


fetch "./all.json"
  .then (resp) => resp.json()
  .then inflateNavbar

loadSymbol document.location.hash[1..]
$(window).on "hashchange", () => loadSymbol document.location.hash[1..]
