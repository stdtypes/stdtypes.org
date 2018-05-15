
types.define "electric_current", class ElectricCurrent
  constructor: (@value = 0) ->
  toString: () -> "#{@value} A"
