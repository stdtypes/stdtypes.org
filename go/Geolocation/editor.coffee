$.require [
    "https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.2.0/build/ol.js"
  ]
  .then () ->

    class GeolocationInput extends HTMLElement
      constructor: () ->
        super()

        @shadow = this.attachShadow
          mode: "open"
        @shadow.appendChild $.create "style", {}, [$.text "@import url('https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.2.0/css/ol.css')"]
        container = $.create "div", {style: "width:100%;border:3px solid #949494"}
        @shadow.appendChild container
        @map = new ol.Map
          target: container
          layers: [
            new ol.layer.Tile
              source: new ol.source.OSM()
          ]
          view: new ol.View
            center: ol.proj.fromLonLat [13.7326927, 51.0388926]
            zoom: 16

      onResize: () ->
        @map.updateSize()

      setValue: () ->
        @map.updateSize()


    customElements.define "std-geolocation", GeolocationInput
    components.define "stdtypes.org/Geolocation", () => GeolocationInput
