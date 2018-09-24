var StringInput;

StringInput = class StringInput extends HTMLElement {
  constructor() {
    super();
    this.input = $.create("input", {
      type: "text",
      class: "string",
      style: "pointer-events:none"
    });
    this.appendChild(this.input);
    $(this).on("dblclick", (event) => {
      this.input.style.pointerEvents = "auto";
      return this.input.focus();
    });
    $(this.input).on("blur", () => {
      return this.input.style.pointerEvents = "none";
    });
  }

  // @disabled = true
  /*
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
  */
  setValue(value) {
    return this.input.value = value;
  }

  getValue() {
    return this.input.value;
  }

  hasFocus() {
    return this.input.matches(":focus");
  }

};

customElements.define("std-string", StringInput); // , {extends: "input"}

components.define("stdtypes.org/string", () => {
  return StringInput;
});
