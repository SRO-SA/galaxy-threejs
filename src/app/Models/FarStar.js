define(
[
  'Models/CelestialObject'
],
function(CelestialObject) {

  class FarStar extends CelestialObject {
    constructor(data) {
      super(data.diameter, data.mass, data.gravity, data.density);

      this._brightness = 1;
    }
  }
});
