var createRow, createTable, currentType, fetchImpl, inflateImpl, inflateNavbar, inflateSymbol, isFunction, isObject, isPureFunction, languages, loadSymbol, markdown;

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
createTable = function() {
  return $("<div class='table'>");
};

createRow = function(colA, colB) {
  var cellA, cellB, row;
  cellA = $("<div class='cell sym'>");
  if (colA) {
    cellA.append(colA);
  }
  row = $("<div class='row'>");
  row.append(cellA);
  if (colB) {
    cellB = $("<div class='cell impl'>");
    cellB.append(colB);
    row.append(cellB);
  } else {
    cellA.addClass("fill");
  }
  return row;
};

//###############################################################################
languages = {
  JavaScript: ".js",
  Go: ".go",
  CoffeeScript: ".coffeescript"
};

inflateSymbol = function(sym, impl, table, parent = "") {
  var cell, details, doc, heading, href, i, impls, input, j, k, l, len, len1, len2, len3, m, name, params, ref, ref1, ref2, ref3, ref4, results, results1, returns, row, stability, suffix, symbol, type, version;
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
  // .appendTo ul
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
  //  .appendTo ul
  } else if (name === "operator::new") {
    heading = $("<h5>").text("Constructor");
  //  .appendTo ul
  } else if (name) {
    heading = $("<h3>").append($("<a>").attr("href", "#" + href).text(name + suffix)).attr("id", href);
  }
  //  .appendTo ul
  input = $("<div>").addClass("input");
  row = createRow(heading, input);
  inflateImpl(sym, impl, input, parent);
  table.append(row);
  if (name === "operator::()") {
    heading.closest(".row").addClass("operator");
  }
  cell = heading.parent();
  if (!details.is(":empty")) {
    details.appendTo(cell);
  }
  if (sym.type) {
    type = sym.type[0] === "." ? parent.split(".")[0] + sym.type : sym.type;
    $("<a>").addClass("reference").attr("href", "#" + type).text("→ " + type).appendTo(cell);
  }
  if (sym.doc) {
    doc = $("<p>").addClass("doc").html(markdown.makeHtml(sym.doc)).appendTo(cell);
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
    params = createTable().addClass("params"); //  $ "<ul>"
    //  .appendTo cell
    //  .appendTo ul
    table.append(createRow(params, null));
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
    returns = createTable().addClass("returns"); // $ "<ul>"
    //  .appendTo cell
    //  .appendTo ul
    table.append(createRow(returns, null));
    ref3 = sym.returns;
    results = [];
    for (l = 0, len2 = ref3.length; l < len2; l++) {
      symbol = ref3[l];
      results.push(inflateSymbol(symbol, null, returns, href + ".returns"));
    }
    return results;
  } else if (sym.symbols) {
    ref4 = sym.symbols;
    results1 = [];
    for (m = 0, len3 = ref4.length; m < len3; m++) {
      symbol = ref4[m];
      // syms = createTable() # $ "<ul>"
      //  .addClass "symbols"
      //  .appendTo ul
      //table.append createRow syms, null
      results1.push(inflateSymbol(symbol, null, table, href));
    }
    return results1;
  }
};

//###############################################################################
fetchImpl = function(type) {
  var script;
  script = $("<script>").prop("defer", true).appendTo("head");
  return setTimeout(() => {
    return script.attr("src", `./${type}.js`);
  });
};

//###############################################################################
currentType = "";

loadSymbol = (symbol) => {
  var type;
  if (symbol) {
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
      var h4, hasImpl, input, ref, ref1, table;
      $(".container").remove();
      //#########
      table = createTable();
      h4 = $("<h4>").attr("id", name).html("<a href='stdtypes.org'>std::</a>" + `<a href='#${type}' class='active'>${type}</a>`);
      input = $("<h4>").text("Input");
      table.append(createRow(h4, input));
      table.addClass("container").insertAfter("nav");
      $("h3.active").removeClass("active");
      //#########
      hasImpl = (ref = sym.meta) != null ? (ref1 = ref.impl) != null ? ref1.includes("JavaScript") : void 0 : void 0;
      if (!hasImpl) {
        inflateSymbol(sym, null, table);
        return $(document.getElementById(symbol)).addClass("active"); // if ! hasImpl
      } else {
        fetchImpl(type);
        return types.whenDefined(type).then(function(Impl) {
          var impl;
          impl = new Impl;
          inflateSymbol(sym, impl, table);
          return $(document.getElementById(symbol)).addClass("active");
        });
      }
    });
  }
};

/*
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
*/
/*
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
*/
/*
$.ajax
  url: "./#{pkg}.js"
  cache: true
  dataType: "script"
*/
//###############################################################################
inflateImpl = function(sym, impl, cell, parent = "") {
  var type;
  // href = if parent then parent+"."+sym.name else sym.name
  type = (function() {
    switch (false) {
      case !sym.type:
        return sym.type;
      case !!parent:
        return sym.name;
      default:
        return null;
    }
  })();
  console.log(impl, sym.name);
  if (sym.name === "operator::()") {
    return $("<button>").addClass("call").text("Call Function").appendTo(cell);
  } else if (type) {
    fetchImpl(type);
    return types.whenDefined(type).then(function(Impl) {
      var input;
      if (Impl.Input) {
        input = new Impl.Input;
        $("<label>").text(sym.name + ":").appendTo(cell);
        return cell.append(input.getElement());
      }
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
