

toggleOpener = (event) ->
  $ event.target
    .toggleClass "open"

###
getOrCreateGroup = (name) ->
  group = $ ".index [data-group='#{name}']"
  if group.length == 0
    $ "<h2>"
      .text name
      .appendTo ".index"
  ...
###
inflateLibrary = (name, lib) ->

  packages = await lib.fetchPackages()

  for name,pck of packages

    if pack.group of groups
      group = groups[pack.group]
    else
      $ "<h2>"
        .text pack.group
        .appendTo ".index"
      group = $ "<ul>"
        .appendTo ".index"
      group.paths = {}
      groups[pack.group] = group

    path = name.split "/"
    if path.length != 1
      for i in [0..path.length-2]
        subPath = path[0..i].join "/"

        if subPath of group.paths
          pathGroup = group.paths[subPath]
        else
          parent = if i==0
            group
          else
            group.paths[path[0..i-1].join "/"]

          $ "<h3>"
            .addClass "opener open"
            .on "click", toggleOpener
            .css "padding-left", "#{25+i*20}px"
            .text path[i]
            .appendTo parent
          pathGroup = $ "<ul>"
            .appendTo parent

          group.paths[subPath] = pathGroup
      group = pathGroup

    li = $ "<li>"
      .appendTo group
    $ "<a>"
      .attr
        "data-type": name
        href: "#"+pathPrefix+name
      .text pack.name # path[path.length-1]
      .css "padding-left", "#{25+(path.length-1)*20}px"
      .appendTo li


################################################################################


markdown = new showdown.Converter
  emoji: true


isAny = (sym) -> sym.meta?.abstract && ! sym.symbols?.length && ! sym.type


################################################################################


inflateReference = (sym) ->

  ###
  templ = findTemplate type
  if templ

    $ "<a>"
      .addClass "reference"
      .attr "href", "#"+templ
      .text "→ Template "+type

  else
  ###
  variadic = (if sym.variadic then "list of: " else "")

  if sym.type == "*"
    $ "<span>"
      .text "→ "+variadic+"any type or class"
  else
    $ "<a>"
      .addClass "reference"
      .attr "href", "#"+sym.type
      .text "→ "+variadic+(std.parsePath sym.type).name


################################################################################


templates = []

findTemplate = (name) ->
  for templs in templates
    for n of templs
      if n == name
        return templs[n]
  return null

inflateTemplates = (container, templates) ->

  table = $ "<div>"
    .addClass "table"
    .appendTo container

  for temp in templates

    row = $ "<div>"
      .addClass "row"
      .appendTo table

    $ "<h3>"
      .addClass "column"
      .attr "id", temp.path
      .append $("<a>").attr("href", "#"+temp.path).text(temp.name)
      .appendTo row

    $ "<div>"
      .addClass "column"
      .appendTo row
      .append inflateReference temp

    # if templ == "number"
    #   t.html "number (<a href='#int'>int</a> or <a href='#float'>float</a>)"
    # else

  return table


################################################################################


languages =
  JavaScript: ".js"
  Go: ".go"
  CoffeeScript: ".coffeescript"

env = null


inflateSymbol = (container, symbol) ->

  path = std.parsePath symbol.path

  container = $ "<div>"
    .addClass "symbol"
    .appendTo container

  head = $ "<div>"
    .addClass "head level"+(path.symbols.length)
    .appendTo container

  details = $ "<div>"
    .addClass "details"

  if symbol.meta?.impl

    impls = $ "<div>"
      .addClass "implementation"
      .appendTo details

    for i in symbol.meta.impl
      if i of languages
        $ "<a>"
          .attr
          #  href: href+languages[i]
            "data-lang": i
          .html "<img src='img/lang-#{i}.svg' alt='Language #{i}'>"
          .appendTo impls

  if symbol.isPackage()
    version = (std.parsePath symbol.path).version
    $ "<span>"
      .addClass "version"
      .text version
      .appendTo details

    stability = if version[0] == "0" then "experimental" else "stable"
    $ "<span>"
      .addClass "stability " + stability
      .text stability
      .appendTo details

  ##########



  switch
    when symbol.isPureFunction()
      name = symbol.name+" ()"
      heading = "<h3>"
    when symbol.name == "operator::new"
      name = "Constructor"
      heading = "<h5>"
    when symbol.name == "operator::()"
      heading = null
    else
      name = symbol.name
      heading = "<h3>"



  if name
    $ heading
      .append $("<a>").attr("href", "#"+symbol.path).text name
      .attr "id", symbol.path
      .appendTo head

  if ! details.is ":empty"
    details.appendTo head

  if symbol.type

    inflateReference symbol
      .appendTo head

  if isAny(symbol)
    $ "<span>"
      .addClass "reference"
      .text "(any)"
      .appendTo head

  if symbol.doc
    doc = $ "<p>"
      .addClass "doc"
      .html markdown.makeHtml symbol.doc
      .appendTo head


  if symbol.templates
    templates = $ "<div>"
      .addClass "template body"
      .appendTo container
    inflateTemplates templates, symbol.templates

  if symbol.isOperator()

    container.addClass "operator"

    params = $ "<ul>"
      .addClass "params body"
      .appendTo container
    inflateSymbol params, sym for sym in symbol.params

    returns = $ "<ul>"
      .addClass "returns body"
      .appendTo container
    inflateSymbol returns, sym for sym in symbol.returns

    ###
    if symbol.template
      templates.pop()
    ###

  else if symbol.symbols?.length

    syms = $ "<ul>"
      .addClass "symbols body"
      .appendTo container
    inflateSymbol syms, sym for sym in symbol.symbols

  return container


################################################################################

currentPackage = ""

loadSymbol = (symbol) =>
  if ! symbol then return

  $ "nav"
    .removeClass "open"

  path = std.parsePath symbol

  if !path.version && !path.packager
    version = window.packages[path.package].latest
    history.replaceState null, "", "#"+path.package+"@"+version
    loadSymbol path.package+"@"+version
    return

  if currentPackage == path.package
    $ "h3.active"
      .removeClass "active"
    $ document.getElementById symbol
      .addClass "active"
    return
  currentPackage = path.package

  sym = await window.language.fetch path.package

  $ ".container"
    .remove()

  ##########

  container = $ "<ul>"
    .addClass "container"
    .insertAfter "nav"
  h4 = $ "<h4>"
    .html "<a href='##{ path.package }' class='active'>#{ symbol }</a>" # .split("/").join("::")
    .appendTo container

  $ "h3.active"
    .removeClass "active"

  inflateSymbol container, sym
    .addClass "root"

  $ document.getElementById symbol
    .addClass "active"


################################################################################


inflatePackager = (id, packager) ->

  li = $ "<li>"
    .appendTo ".packager"
  li.append $ "<img>", src: packager.logo if packager.logo

  h4 = $ "<h4>"
    .appendTo li

  if packager.link
    $ "<a>"
      .appendTo h4
      .attr "href", packager.link
      .text packager.name
  else
    h4.text packager.name

  $ "<input>"
    .appendTo li
    .attr "placeholder", "Search #{packager.name} .."
    .on "change", (event) =>
      query = event.target.text
      $ "nav .index, nav h1, #search"
        .hide()
      $ "<div>"
        .addClass "index"
        .insertAfter ".packager"

      packs = await packager.search query
      inflateNavbar packs, id

################################################################################


loadLanguage = (lang) ->

  lang = window.language = std.of lang
  # inflatePackager id, packager for id, packager of lang.packager

  for name,lib of lang.libs
  inflateLibrary name, lib

  loadSymbol document.location.hash[1..]
  $(window).on "hashchange", () => loadSymbol document.location.hash[1..]


$ ".burger"
  .on "click", (event) ->
    $ "nav"
      .toggleClass "open"


$ "a[href='#{location.search}']"
  .addClass "active"

loadLanguage location.search[1..] || "go"
