var currentPackage, env, findTemplate, inflateNavbar, inflatePackager, inflateReference, inflateSymbol, inflateTemplates, isAny, languages, loadLanguage, loadSymbol, markdown, templates, toggleOpener, types;

toggleOpener = function(event) {
  return $(event.target).toggleClass("open");
};

inflateNavbar = function(packs, packagerId) {
  var group, groups, i, j, li, name, pack, parent, path, pathGroup, pathPrefix, ref, results, subPath;
  groups = {};
  pathPrefix = packagerId ? `${packagerId}?` : "";
  results = [];
  for (name in packs) {
    pack = packs[name];
    if (pack.group in groups) {
      group = groups[pack.group];
    } else {
      $("<h2>").text(pack.group).appendTo(".index");
      group = $("<ul>").appendTo(".index");
      group.paths = {};
      groups[pack.group] = group;
    }
    path = name.split("/");
    if (path.length !== 1) {
      for (i = j = 0, ref = path.length - 2; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
        subPath = path.slice(0, +i + 1 || 9e9).join("/");
        if (subPath in group.paths) {
          pathGroup = group.paths[subPath];
        } else {
          parent = i === 0 ? group : group.paths[path.slice(0, +(i - 1) + 1 || 9e9).join("/")];
          $("<h3>").addClass("opener open").on("click", toggleOpener).css("padding-left", `${25 + i * 20}px`).text(path[i]).appendTo(parent);
          pathGroup = $("<ul>").appendTo(parent);
          group.paths[subPath] = pathGroup;
        }
      }
      group = pathGroup;
    }
    li = $("<li>").appendTo(group);
    results.push($("<a>").attr({
      "data-type": name,
      href: "#" + pathPrefix + name
    }).text(pack.name).css("padding-left", `${25 + (path.length - 1) * 20 // path[path.length-1]
}px`).appendTo(li));
  }
  return results;
};

//###############################################################################
markdown = new showdown.Converter({
  emoji: true
});

isAny = function(sym) {
  var ref, ref1;
  return ((ref = sym.meta) != null ? ref.abstract : void 0) && !((ref1 = sym.symbols) != null ? ref1.length : void 0) && !sym.type;
};

//###############################################################################
inflateReference = function(sym) {
  /*
  templ = findTemplate type
  if templ

    $ "<a>"
      .addClass "reference"
      .attr "href", "#"+templ
      .text "→ Template "+type

  else
  */
  var variadic;
  variadic = (sym.variadic ? "list of: " : "");
  if (sym.type === "*") {
    return $("<span>").text("→ " + variadic + "any type or class");
  } else {
    return $("<a>").addClass("reference").attr("href", "#" + sym.type).text("→ " + variadic + (std.parsePath(sym.type)).name);
  }
};

//###############################################################################
templates = [];

findTemplate = function(name) {
  var j, len, n, templs;
  for (j = 0, len = templates.length; j < len; j++) {
    templs = templates[j];
    for (n in templs) {
      if (n === name) {
        return templs[n];
      }
    }
  }
  return null;
};

inflateTemplates = function(container, templates) {
  var j, len, row, table, temp;
  table = $("<div>").addClass("table").appendTo(container);
  for (j = 0, len = templates.length; j < len; j++) {
    temp = templates[j];
    row = $("<div>").addClass("row").appendTo(table);
    $("<h3>").addClass("column").attr("id", temp.path).append($("<a>").attr("href", "#" + temp.path).text(temp.name)).appendTo(row);
    $("<div>").addClass("column").appendTo(row).append(inflateReference(temp));
  }
  // if templ == "number"
  //   t.html "number (<a href='#int'>int</a> or <a href='#float'>float</a>)"
  // else
  return table;
};

//###############################################################################
languages = {
  JavaScript: ".js",
  Go: ".go",
  CoffeeScript: ".coffeescript"
};

env = null;

inflateSymbol = function(container, symbol) {
  var details, doc, head, heading, i, impls, j, k, l, len, len1, len2, len3, m, name, params, path, ref, ref1, ref2, ref3, ref4, ref5, returns, stability, sym, syms, version;
  path = std.parsePath(symbol.path);
  container = $("<div>").addClass("symbol").appendTo(container);
  head = $("<div>").addClass("head level" + path.symbols.length).appendTo(container);
  details = $("<div>").addClass("details");
  if ((ref = symbol.meta) != null ? ref.impl : void 0) {
    impls = $("<div>").addClass("implementation").appendTo(details);
    ref1 = symbol.meta.impl;
    for (j = 0, len = ref1.length; j < len; j++) {
      i = ref1[j];
      if (i in languages) {
        $("<a>").attr({
          //  href: href+languages[i]
          "data-lang": i
        }).html(`<img src='img/lang-${i}.svg' alt='Language ${i}'>`).appendTo(impls);
      }
    }
  }
  if (symbol.isPackage()) {
    version = (std.parsePath(symbol.path)).version;
    $("<span>").addClass("version").text(version).appendTo(details);
    stability = version[0] === "0" ? "experimental" : "stable";
    $("<span>").addClass("stability " + stability).text(stability).appendTo(details);
  }
  switch (false) {
    //#########
    case !symbol.isPureFunction():
      name = symbol.name + " ()";
      heading = "<h3>";
      break;
    case symbol.name !== "operator::new":
      name = "Constructor";
      heading = "<h5>";
      break;
    case symbol.name !== "operator::()":
      heading = null;
      break;
    default:
      name = symbol.name;
      heading = "<h3>";
  }
  if (name) {
    $(heading).append($("<a>").attr("href", "#" + symbol.path).text(name)).attr("id", symbol.path).appendTo(head);
  }
  if (!details.is(":empty")) {
    details.appendTo(head);
  }
  if (symbol.type) {
    inflateReference(symbol).appendTo(head);
  }
  if (isAny(symbol)) {
    $("<span>").addClass("reference").text("(any)").appendTo(head);
  }
  if (symbol.doc) {
    doc = $("<p>").addClass("doc").html(markdown.makeHtml(symbol.doc)).appendTo(head);
  }
  if (symbol.templates) {
    templates = $("<div>").addClass("template body").appendTo(container);
    inflateTemplates(templates, symbol.templates);
  }
  if (symbol.isOperator()) {
    container.addClass("operator");
    params = $("<ul>").addClass("params body").appendTo(container);
    ref2 = symbol.params;
    for (k = 0, len1 = ref2.length; k < len1; k++) {
      sym = ref2[k];
      inflateSymbol(params, sym);
    }
    returns = $("<ul>").addClass("returns body").appendTo(container);
    ref3 = symbol.returns;
    for (l = 0, len2 = ref3.length; l < len2; l++) {
      sym = ref3[l];
      inflateSymbol(returns, sym);
    }
  /*
  if symbol.template
    templates.pop()
  */
  } else if ((ref4 = symbol.symbols) != null ? ref4.length : void 0) {
    syms = $("<ul>").addClass("symbols body").appendTo(container);
    ref5 = symbol.symbols;
    for (m = 0, len3 = ref5.length; m < len3; m++) {
      sym = ref5[m];
      inflateSymbol(syms, sym);
    }
  }
  return container;
};

//###############################################################################
currentPackage = "";

loadSymbol = async(symbol) => {
  var container, h4, path, sym, version;
  if (!symbol) {
    return;
  }
  $("nav").removeClass("open");
  path = std.parsePath(symbol);
  if (!path.version && !path.packager) {
    version = window.packages[path.package].latest;
    history.replaceState(null, "", "#" + path.package + "@" + version);
    loadSymbol(path.package + "@" + version);
    return;
  }
  if (currentPackage === path.package) {
    $("h3.active").removeClass("active");
    $(document.getElementById(symbol)).addClass("active");
    return;
  }
  currentPackage = path.package;
  sym = (await window.language.fetch(path.package));
  $(".container").remove();
  //#########
  container = $("<ul>").addClass("container").insertAfter("nav");
  h4 = $("<h4>").html(`<a href='#${path.package}' class='active'>${symbol
  // .split("/").join("::")
}</a>`).appendTo(container);
  $("h3.active").removeClass("active");
  inflateSymbol(container, sym).addClass("root");
  return $(document.getElementById(symbol)).addClass("active");
};

//###############################################################################
inflatePackager = function(id, packager) {
  var h4, li;
  li = $("<li>").appendTo(".packager");
  if (packager.logo) {
    li.append($("<img>", {
      src: packager.logo
    }));
  }
  h4 = $("<h4>").appendTo(li);
  if (packager.link) {
    $("<a>").appendTo(h4).attr("href", packager.link).text(packager.name);
  } else {
    h4.text(packager.name);
  }
  return $("<input>").appendTo(li).attr("placeholder", `Search ${packager.name} ..`).on("change", async(event) => {
    var packs, query;
    query = event.target.text;
    $("nav .index, nav h1, #search").hide();
    $("<div>").addClass("index").insertAfter(".packager");
    packs = (await packager.search(query));
    return inflateNavbar(packs, id);
  });
};

//###############################################################################
types = {};

loadLanguage = async function(lang) {
  var id, packager, packs, ref;
  lang = window.language = std.of(lang);
  ref = lang.packager;
  for (id in ref) {
    packager = ref[id];
    inflatePackager(id, packager);
  }
  packs = window.packages = (await lang.fetchPackages());
  inflateNavbar(packs);
  loadSymbol(document.location.hash.slice(1));
  return $(window).on("hashchange", () => {
    return loadSymbol(document.location.hash.slice(1));
  });
};

$(".burger").on("click", function(event) {
  return $("nav").toggleClass("open");
});

$(`a[href='${location.search}']`).addClass("active");

loadLanguage(location.search.slice(1) || "go");
