var currentType, env, findTemplate, inflateNavbar, inflateReference, inflateSymbol, inflateTemplate, isAny, isFunction, isObject, isPureFunction, languages, loadEnv, loadSymbol, markdown, templates, types,
  indexOf = [].indexOf;

inflateNavbar = function(types) {
  var g, group, groups, li, name, results, type;
  groups = {};
  results = [];
  for (name in types) {
    type = types[name];
    g = type.tags[0];
    if (!(g in groups)) {
      $("<h2>").text(g).appendTo(".index");
      groups[g] = $("<ul>").appendTo(".index");
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

isAny = function(sym) {
  var ref1, ref2;
  return ((ref1 = sym.meta) != null ? ref1.abstract : void 0) && !((ref2 = sym.symbols) != null ? ref2.length : void 0) && !sym.type;
};

isPureFunction = function(sym) {
  return !isObject(sym) && isFunction(sym);
};

//###############################################################################
inflateReference = function(ref, type) {
  var href, templ;
  templ = findTemplate(type);
  if (templ) {
    return $("<a>").addClass("reference").attr("href", "#" + templ).text("→ Template " + type);
  } else {
    if (type[0] === ".") {
      href = "#" + ref.split(".")[0] + type;
    } else {
      if (indexOf.call(window.types, type) >= 0) {
        href = "#" + type;
      } else {
        href = "/#" + type;
      }
    }
    return $("<a>").addClass("reference").attr("href", href).text("→ " + type.split(".").pop());
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

inflateTemplate = function(ref, template) {
  var name, row, t, table, templ;
  table = $("<div>").addClass("table");
  t = {};
  for (name in template) {
    t[name] = ref + ".template." + name;
  }
  templates.push(t);
  for (name in template) {
    templ = template[name];
    template.push;
    row = $("<div>").addClass("row").appendTo(table);
    $("<h3>").addClass("column").text(name).attr("id", ref + ".template." + name).appendTo(row);
    t = $("<div>").addClass("column").text(templ).appendTo(row);
    if (templ === "number") {
      t.html("number (<a href='#int'>int</a> or <a href='#float'>float</a>)");
    } else {
      t.append(inflateReference(ref, templ));
    }
  }
  return table;
};

//###############################################################################
languages = {
  JavaScript: ".js",
  Go: ".go",
  CoffeeScript: ".coffeescript"
};

env = null;

inflateSymbol = function(sym, impl, container, href) {
  var details, doc, head, heading, i, impls, j, k, l, len, len1, len2, len3, m, name, params, ref1, ref2, ref3, ref4, ref5, returns, stability, suffix, symbol, syms, version;
  container = $("<div>").addClass("symbol").appendTo(container);
  head = $("<div>").addClass("head level" + (href.split(".").length - 1)).appendTo(container);
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
  if ((ref1 = sym.meta) != null ? ref1.impl : void 0) {
    impls = $("<div>").addClass("implementation").appendTo(details);
    ref2 = sym.meta.impl;
    for (j = 0, len = ref2.length; j < len; j++) {
      i = ref2[j];
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
  /*
  if name == "operator::()"
    $ "<h5>"
      .text "Function Call"
      .appendTo head

  else if name == "operator::new"
    $ "<h5>"
      .text "Constructor"
      .appendTo head

  else
  */
  if (name && !name.startsWith("operator::")) {
    $("<h3>").append($("<a>").attr("href", "#" + href).text(name + suffix)).attr("id", href).appendTo(head);
  }
  if (!details.is(":empty")) {
    details.appendTo(head);
  }
  if (sym.type) {
    inflateReference(href, sym.type).appendTo(head);
  }
  if (isAny(sym)) {
    $("<span>").addClass("reference").text("(any)").appendTo(head);
  }
  if (sym.doc) {
    doc = $("<p>").addClass("doc").html(markdown.makeHtml(sym.doc)).appendTo(head);
  }
  if (sym.name && sym.name.startsWith("operator::")) {
    container.addClass("operator");
    if (sym.template) {
      $("<div>").append(inflateTemplate(href, sym.template)).addClass("template body").appendTo(container);
    }
    if (typeof sym.params === "string") {
      sym.params = [
        {
          name: "",
          type: sym.params
        }
      ];
    }
    params = $("<ul>").addClass("params body").appendTo(container);
    ref3 = sym.params;
    for (k = 0, len1 = ref3.length; k < len1; k++) {
      symbol = ref3[k];
      inflateSymbol(symbol, null, params, href + ".params." + symbol.name);
    }
    if (typeof sym.returns === "string") {
      sym.returns = [
        {
          name: "",
          type: sym.returns
        }
      ];
    }
    returns = $("<ul>").addClass("returns body").appendTo(container);
    ref4 = sym.returns;
    for (l = 0, len2 = ref4.length; l < len2; l++) {
      symbol = ref4[l];
      inflateSymbol(symbol, null, returns, href + ".returns." + symbol.name);
    }
    if (sym.template) {
      templates.pop();
    }
  } else if (sym.symbols) {
    syms = $("<ul>").addClass("symbols body").appendTo(container);
    ref5 = sym.symbols;
    for (m = 0, len3 = ref5.length; m < len3; m++) {
      symbol = ref5[m];
      inflateSymbol(symbol, null, syms, href + "." + symbol.name);
    }
  }
  return container;
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
    return fetch(env + "/" + type + ".json").then((resp) => {
      return resp.json();
    }).then((sym) => {
      var container, h4;
      $(".container").remove();
      //#########
      container = $("<ul>").addClass("container").insertAfter("nav");
      h4 = $("<h4>").html(`<a href='#${type}' class='active'>${env}::${type
      // .split("/").join("::")
}</a>`).appendTo(container);
      $("h3.active").removeClass("active");
      inflateSymbol(sym, null, container, type).addClass("root");
      return $(document.getElementById(symbol)).addClass("active");
    });
  }
};

//###############################################################################
types = {};

loadEnv = (env) => {
  window.env = env;
  fetch(env + ".json").then((resp) => {
    return resp.json();
  }).then((types) => {
    window.types = types;
    return inflateNavbar(types);
  });
  loadSymbol(document.location.hash.slice(1));
  return $(window).on("hashchange", () => {
    return loadSymbol(document.location.hash.slice(1));
  });
};

$(".burger").on("click", function(event) {
  return $("nav").toggleClass("open");
});
