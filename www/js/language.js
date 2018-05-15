var FloatType, StringType, TypesRegistry, types;

TypesRegistry = class TypesRegistry {
  constructor() {
    this.types = {};
    this.pendingTypes = {};
  }

  get(name) {
    return this.types[name];
  }

  whenDefined(name) {
    var promise;
    if (name in this.types) {
      return Promise.resolve(this.types[name]);
    } else {
      if (!(name in this.pendingTypes)) {
        promise = new Promise((resolve, reject) => {
          return this.pendingTypes[name] = {
            promise: this,
            resolve: resolve,
            reject: reject
          };
        });
        this.pendingTypes[name].promise = promise;
      }
      return this.pendingTypes[name].promise;
    }
  }

  define(name, cls) {
    var pendingTypes;
    this.types[name] = cls;
    if (name in this.pendingTypes) {
      pendingTypes = this.pendingTypes[name];
      delete this.pendingTypes[name];
      return pendingTypes.resolve(cls);
    }
  }

};

types = new TypesRegistry;

//###############################################################################
types.define("float", FloatType = (function() {
  var FloatInput, FloatView;

  class FloatType extends Number {};

  FloatType.Input = FloatInput = class FloatInput {
    constructor() {
      this.element = document.createElement("input");
      this.element.type = "number";
    }

    getElement() {
      return this.element;
    }

    setValue(val) {
      return this.element.value = val;
    }

    getValue() {
      return this.element.value;
    }

  };

  FloatType.View = FloatView = class FloatView {
    constructor() {
      this.element = document.createTextNode();
    }

    getElement() {
      return this.element;
    }

    setValue(val) {
      return this.element.textContent = val;
    }

    getValue() {
      return this.element.textContent;
    }

  };

  return FloatType;

}).call(this));

types.define("int", Number);

types.define("string", StringType = (function() {
  var StringInput, StringView;

  class StringType extends String {};

  StringType.Input = StringInput = class StringInput {
    constructor() {
      this.element = document.createElement("textarea");
    }

    getElement() {
      return this.element;
    }

    setValue(val) {
      return this.element.value = val;
    }

    getValue() {
      return this.element.value;
    }

  };

  StringType.View = StringView = class StringView {
    constructor() {
      this.element = document.createTextNode();
    }

    getElement() {
      return this.element;
    }

    setValue(val) {
      return this.element.textContent = val;
    }

    getValue() {
      return this.element.textContent;
    }

  };

  return StringType;

}).call(this));
