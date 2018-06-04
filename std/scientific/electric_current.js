var ElectricCurrent;

types.define("electric_current", ElectricCurrent = class ElectricCurrent {
  constructor(value = 0) {
    this.value = value;
  }

  toString() {
    return `${this.value} A`;
  }

});
