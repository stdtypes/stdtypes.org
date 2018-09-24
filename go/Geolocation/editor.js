$.require(["https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.2.0/build/ol.js"]).then(function() {
  var GeolocationInput;
  GeolocationInput = class GeolocationInput extends HTMLElement {
    constructor() {
      var container;
      super();
      this.shadow = this.attachShadow({
        mode: "open"
      });
      this.shadow.appendChild($.create("style", {}, [$.text("@import url('https://cdn.rawgit.com/openlayers/openlayers.github.io/master/en/v5.2.0/css/ol.css')")]));
      container = $.create("div", {
        style: "width:100%;border:3px solid #949494"
      });
      this.shadow.appendChild(container);
      this.map = new ol.Map({
        target: container,
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          })
        ],
        view: new ol.View({
          center: ol.proj.fromLonLat([13.7326927, 51.0388926]),
          zoom: 16
        })
      });
    }

    onResize() {
      return this.map.updateSize();
    }

    setValue() {
      return this.map.updateSize();
    }

  };
  customElements.define("std-geolocation", GeolocationInput);
  return components.define("stdtypes.org/Geolocation", () => {
    return GeolocationInput;
  });
});
