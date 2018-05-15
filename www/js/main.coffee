
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


createTable = () -> $("<div class='table'>")
createRow = (colA, colB) ->
  cellA = $ "<div class='cell sym'>"
  cellA.append colA if colA
  row = $ "<div class='row'>"
  row.append cellA
  if colB
    cellB = $ "<div class='cell impl'>"
    cellB.append colB
    row.append cellB
  else
    cellA.addClass "fill"
  return row


################################################################################


languages =
  JavaScript: ".js"
  Go: ".go"
  CoffeeScript: ".coffeescript"


inflateSymbol = (sym, impl, table, parent="") ->

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
    # .appendTo ul
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
    #  .appendTo ul
  else if name == "operator::new"
    heading = $ "<h5>"
      .text "Constructor"
    #  .appendTo ul
  else if name
    heading = $ "<h3>"
      .append $("<a>").attr("href", "#"+href).text name+suffix
      .attr "id", href
    #  .appendTo ul

  input = $ "<div>"
    .addClass "input"

  row = createRow heading, input
  inflateImpl sym, impl, input, parent
  table.append row

  if name == "operator::()"
    heading.closest ".row"
      .addClass "operator"

  cell = heading.parent()
  if ! details.is ":empty"
    details.appendTo cell

  if sym.type
    type = if sym.type[0] == "." then parent.split(".")[0]+sym.type else sym.type
    $ "<a>"
      .addClass "reference"
      .attr "href", "#"+type
      .text "→ "+type
      .appendTo cell

  if sym.doc
    doc = $ "<p>"
      .addClass "doc"
      .html markdown.makeHtml sym.doc
      .appendTo cell

  if sym.name and sym.name.startsWith "operator::"

    if typeof sym.params == "string"
      sym.params = [name: "", type: sym.params]
    params = createTable() #  $ "<ul>"
      .addClass "params"
    #  .appendTo cell
    #  .appendTo ul
    table.append createRow params, null
    inflateSymbol symbol, null, params, href+".params" for symbol in sym.params

    if typeof sym.returns == "string"
      sym.returns = [name: "", type: sym.returns]
    returns = createTable() # $ "<ul>"
      .addClass "returns"
    #  .appendTo cell
    #  .appendTo ul
    table.append createRow returns, null

    inflateSymbol symbol, null, returns, href+".returns" for symbol in sym.returns

  else if sym.symbols

    # syms = createTable() # $ "<ul>"
    #  .addClass "symbols"
    #  .appendTo ul
    #table.append createRow syms, null
    inflateSymbol symbol, null, table, href for symbol in sym.symbols


################################################################################


fetchImpl = (type) ->
  script = $ "<script>"
    .prop "defer", true
    .appendTo "head"

  setTimeout () => script.attr "src", "./#{type}.js"


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

        table = createTable()
        h4 = $ "<h4>"
          .attr "id", name
          .html "<a href='stdtypes.org'>std::</a>"+
            "<a href='##{ type }' class='active'>#{ type }</a>"

        input = $ "<h4>"
          .text "Input"

        table.append createRow h4, input

        table
          .addClass "container"
          .insertAfter "nav"

        $ "h3.active"
          .removeClass "active"

        ##########

        hasImpl = sym.meta?.impl?.includes "JavaScript"

        if ! hasImpl

          inflateSymbol sym, null, table
          $ document.getElementById symbol
            .addClass "active"

        else # if ! hasImpl

          fetchImpl type
          types.whenDefined type
            .then (Impl) ->
              impl = new Impl
              inflateSymbol sym, impl, table

              $ document.getElementById symbol
                .addClass "active"
        ###
        else
          fetchImpl pkg
          fetchInput pkg
          Promise.all [
              types.whenDefined pkg
              types.whenInputDefined pkg
            ]
            .then (args) =>
              [Impl, Input] = args
              impl = new Impl
              input = new Input

              inflateSymbol sym, impl, table

              $ document.getElementById type
                .addClass "active"
        ###
        ###
        if sym.meta?.impl?.includes "JavaScript"

          Impl = types.get pkg
          if Impl then inflateImpl Impl
          else

            script = $ "<script>"
              .prop "defer", true
              .appendTo "head"

            setTimeout () =>
              script.attr "src", "./#{pkg}.js"
              types.whenDefined pkg
                .then inflateImpl
          ###
          ###
          $.ajax
            url: "./#{pkg}.js"
            cache: true
            dataType: "script"
          ###

################################################################################


inflateImpl = (sym, impl, cell, parent="") ->

  # href = if parent then parent+"."+sym.name else sym.name

  type = switch
    when sym.type then sym.type
    when !parent then sym.name
    else null

  console.log impl, sym.name

  if sym.name == "operator::()"
    $ "<button>"
      .addClass "call"
      .text "Call Function"
      .appendTo cell

  else if type

    fetchImpl type
    types.whenDefined type
      .then (Impl) ->

        if Impl.Input
          input = new Impl.Input
          $ "<label>"
            .text sym.name+":"
            .appendTo cell
          cell.append input.getElement()








################################################################################


fetch "./all.json"
  .then (resp) => resp.json()
  .then inflateNavbar

loadSymbol document.location.hash[1..]
$(window).on "hashchange", () => loadSymbol document.location.hash[1..]
