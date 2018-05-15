
class TypesRegistry
  constructor: () ->
    @types = {}
    @pendingTypes = {}


  get: (name) -> @types[name]

  whenDefined: (name) ->
    if name of @types
      return Promise.resolve @types[name]
    else
      if not (name of @pendingTypes)
        promise = new Promise (resolve, reject) =>
          @pendingTypes[name] =
            promise: this
            resolve: resolve
            reject: reject
        @pendingTypes[name].promise = promise
      return @pendingTypes[name].promise

  define: (name, cls) ->
    @types[name] = cls
    if name of @pendingTypes
      pendingTypes = @pendingTypes[name]
      delete @pendingTypes[name]
      pendingTypes.resolve cls
types = new TypesRegistry


################################################################################


types.define "float", class FloatType extends Number

  @Input: class FloatInput
    constructor: () ->
      @element = document.createElement "input"
      @element.type = "number"

    getElement: () -> @element
    setValue: (val) -> @element.value = val
    getValue: () -> @element.value

  @View: class FloatView
    constructor: () ->
      @element = document.createTextNode()
    getElement: () -> @element
    setValue: (val) -> @element.textContent = val
    getValue: () -> @element.textContent

types.define "int", Number


types.define "string", class StringType extends String

  @Input: class StringInput
    constructor: () ->
      @element = document.createElement "textarea"

    getElement: () -> @element
    setValue: (val) -> @element.value = val
    getValue: () -> @element.value

  @View: class StringView
    constructor: () ->
      @element = document.createTextNode()
    getElement: () -> @element
    setValue: (val) -> @element.textContent = val
    getValue: () -> @element.textContent
