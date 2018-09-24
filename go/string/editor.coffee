class StringInput extends HTMLElement
  constructor: () ->
    super()

    @input = $.create "input", {type: "text", class: "string", style: "pointer-events:none"}
    @appendChild @input


    $(@).on "dblclick", (event) =>
      @input.style.pointerEvents = "auto"
      @input.focus()

    $(@input).on "blur", () =>
      @input.style.pointerEvents = "none"

    # @disabled = true
    ###
    @setAttribute "style", "cursor:default"

    focus = false

    $(@).on "dblclick", (event) =>
      focus = true

    $(@).on "blur", () =>
      focus = false

    $(@).on "select", (event) =>
      if focus then return
      @disabled = true
      @disabled = false

    $(@).on "focus", (event) =>
      if focus then return
      @disabled = true
      @disabled = false

    $(@).on "click", (event) =>
      if focus then return
      @disabled = true
      @disabled = false
    ###


  setValue: (value) ->@input.value = value
  getValue: () -> @input.value
  hasFocus: () -> @input.matches ":focus"


customElements.define "std-string", StringInput # , {extends: "input"}
components.define "stdtypes.org/string", () => StringInput
