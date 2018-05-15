var currentType, inflateNavbar, inflateSymbol, isFunction, isObject, isPureFunction, languages, loadSymbol, markdown;

inflateNavbar = function(types) {
  var g, group, groups, li, name, results, type;
  groups = {};
  results = [];
  for (name in types) {
    type = types[name];
    g = type.tags[0];
    if (!(g in groups)) {
      $("<h2>").text(g).appendTo("nav");
      groups[g] = $("<ul>").appendTo("nav");
    }
    group = groups[g];
    li = $("<li>").appendTo(group);
    results.push($("<a>").attr({
      "data-type": name,
      href: "#" + name
    }).text(name).appendTo(li));
  }
  return results;
};

//###############################################################################
markdown = new showdown.Converter({
  emoji: true
});

isObject = function(sym) {
  return sym.symbols && sym.symbols.find((sym) => {
    return !sym.name.startsWith("operator::");
  });
};

isFunction = function(sym) {
  return sym.symbols && sym.symbols.find((sym) => {
    return sym.name === "operator::()";
  });
};

isPureFunction = function(sym) {
  return !isObject(sym) && isFunction(sym);
};

//###############################################################################
languages = {
  JavaScript: ".js",
  Go: ".go",
  CoffeeScript: ".coffeescript"
};

inflateSymbol = function(sym, impl, container, parent = "") {
  var details, doc, heading, href, i, impls, j, k, l, len, len1, len2, len3, m, name, params, ref, ref1, ref2, ref3, ref4, results, results1, returns, stability, suffix, symbol, syms, type, version;
  href = parent ? parent + "." + sym.name : sym.name;
  if ((sym.params || sym.returns) && !sym.name.startsWith("operator::")) {
    if (!sym.symbols) {
      sym.symbols = [];
    }
    sym.symbols.push({
      name: "operator::()",
      params: sym.params,
      returns: sym.returns,
      meta: sym.meta
    });
  }
  details = $("<div>").addClass("details");
  if ((ref = sym.meta) != null ? ref.impl : void 0) {
    impls = $("<div>").addClass("implementation").appendTo(details);
    ref1 = sym.meta.impl;
    for (j = 0, len = ref1.length; j < len; j++) {
      i = ref1[j];
      if (i in languages) {
        $("<a>").attr({
          href: href + languages[i],
          "data-lang": i
        }).html(`<img src='img/lang-${i}.svg' alt='Language ${i}'>`).appendTo(impls);
      }
    }
  }
  if (sym.version) {
    version = $("<span>").addClass("version").text(sym.version);
    details.append(version);
  }
  if (sym.stability) {
    stability = $("<span>").addClass("stability " + sym.stability).text(sym.stability);
    details.append(stability);
  }
  //#########
  name = sym.desc || sym.name;
  suffix = (function() {
    switch (false) {
      case !isPureFunction(sym):
        return " ()";
      default:
        return "";
    }
  })();
  heading = null;
  if (name === "operator::()") {
    heading = $("<h5>").text("Function Call");
  } else if (name === "operator::new") {
    heading = $("<h5>").text("Constructor");
  } else if (name) {
    heading = $("<h3>").append($("<a>").attr("href", "#" + href).text(name + suffix)).attr("id", href);
  }
  container.append(heading);
  if (name === "operator::()") {
    heading.closest(".row").addClass("operator");
  }
  if (!details.is(":empty")) {
    details.appendTo(container);
  }
  if (sym.type) {
    type = sym.type[0] === "." ? parent.split(".")[0] + sym.type : sym.type;
    $("<a>").addClass("reference").attr("href", "#" + type).text("→ " + type).appendTo(container);
  }
  if (sym.doc) {
    doc = $("<p>").addClass("doc").html(markdown.makeHtml(sym.doc)).appendTo(container);
  }
  if (sym.name && sym.name.startsWith("operator::")) {
    if (typeof sym.params === "string") {
      sym.params = [
        {
          name: "",
          type: sym.params
        }
      ];
    }
    params = $("<ul>").addClass("params").appendTo(container);
    ref2 = sym.params;
    for (k = 0, len1 = ref2.length; k < len1; k++) {
      symbol = ref2[k];
      inflateSymbol(symbol, null, params, href + ".params");
    }
    if (typeof sym.returns === "string") {
      sym.returns = [
        {
          name: "",
          type: sym.returns
        }
      ];
    }
    returns = $("<ul>").addClass("returns").appendTo(container);
    ref3 = sym.returns;
    results = [];
    for (l = 0, len2 = ref3.length; l < len2; l++) {
      symbol = ref3[l];
      results.push(inflateSymbol(symbol, null, returns, href + ".returns"));
    }
    return results;
  } else if (sym.symbols) {
    syms = $("<ul>").addClass("symbols").appendTo(container);
    ref4 = sym.symbols;
    results1 = [];
    for (m = 0, len3 = ref4.length; m < len3; m++) {
      symbol = ref4[m];
      results1.push(inflateSymbol(symbol, null, syms, href));
    }
    return results1;
  }
};

//###############################################################################
currentType = "";

loadSymbol = (symbol) => {
  var type;
  if (symbol) {
    $("nav").removeClass("open");
    type = symbol.split(".")[0];
    if (currentType === type) {
      $("h3.active").removeClass("active");
      $(document.getElementById(symbol)).addClass("active");
      return;
    }
    currentType = type;
    return fetch(`./${type}.json`).then((resp) => {
      return resp.json();
    }).then((sym) => {
      var container, h4;
      $(".container").remove();
      //#########
      container = $("<ul>").addClass("container").insertAfter("nav");
      h4 = $("<h4>").html("<a href='stdtypes.org'>std::</a>" + `<a href='#${type}' class='active'>${type}</a>`).appendTo(container);
      $("h3.active").removeClass("active");
      inflateSymbol(sym, null, container);
      return $(document.getElementById(symbol)).addClass("active");
    });
  }
};

//###############################################################################
fetch("./all.json").then((resp) => {
  return resp.json();
}).then(inflateNavbar);

loadSymbol(document.location.hash.slice(1));

$(window).on("hashchange", () => {
  return loadSymbol(document.location.hash.slice(1));
});

$(".burger").on("click", function(event) {
  return $("nav").toggleClass("open");
});
