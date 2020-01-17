define(
[
  'Models/CelestialObject',
  'Environment/Constants'
],
function(CelestialObject, Constants) {
  'use strict';


  class Blackhole extends CelestialObject {
    constructor(data) {
      super(data.diameter, data.mass, data.gravity, data.density);

      this._id = data.id || null;
      this._name = data.name || null;
      this._rotationPeriod = data.rotationPeriod || null;
      this._lengthOfDay = data.lengthOfDay || null;
      this._distanceFromParent = data.distanceFromParent || null;
      this._axialTilt = data.axialTilt || null;
      this._meanTemperature = data.meanTemperature || null;
      this._threeDiameter = this.createThreeDiameter();
      this._threeRadius = this.createThreeRadius();
      this._surface = this.createSurface(data._3d.textures.base, data._3d.textures.topo);
      this._threeObject = this.createGeometry(this._surface);
      this._orbitCentroid = this.createOrbitCentroid();
			
			this.buildFullObject3D();

    };

    /**
     * 3D Model Data
     */
    get threeDiameter() {
      return this._threeDiameter;
    };

    get threeRadius() {
      return this._threeRadius;
    };

    get threeObject() {
      return this._threeObject;
    };
		
		get orbitCentroid() {
			return this._orbitCentroid;
		};

    getTexture(src) {
      if (src) {
        var texture = new THREE.TextureLoader().load(src);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        return texture;
      }
    };
		
		
		
    setAxes() {
      this._threeObject.rotation.y = this._axialTilt * Constants.degreesToRadiansRatio;
      this._core.rotation.y = this._axialTilt * Constants.degreesToRadiansRatio;
      // this._objectCentroid.rotation.y = this._axialTilt * Constants.degreesToRadiansRatio;
    };
		
    buildFullObject3D() {
      // this.createLabelSprite();
      this.setAxes();
      this._orbitCentroid.add(
        this._threeObject,
        this._core,
        this._objectCentroid
      );

      // Axis Helper (x = red, y = green, z = blue)
      // this._threeObject.add(new THREE.AxisHelper(this._threeDiameter * 2 + 1));
    };

    createOrbitCentroid() {
      return new THREE.Object3D();
    };

    createThreeDiameter() {
      return this._diameter * Constants.celestialScale;
    };

    createThreeRadius() {
      return this._diameter * Constants.celestialScale / 2;
    };

    createGeometry(surface) {
      var geometry = new THREE.SphereGeometry(
        this._threeRadius,
        84,
        42
      );

      var mesh = new THREE.Mesh(geometry, surface);
      var lightColor = 0xffff00;
      var intesity = 1;
      var lightDistanceStrength = 0;
      var lightDecayRate = 0.6;
      var sunLight = new THREE.PointLight(lightColor, intesity, lightDistanceStrength, lightDecayRate);
	
      mesh.rotation.x = 90 * Constants.degreesToRadiansRatio;
			mesh.add(sunLight)
      //mesh.add(sunLight);

      return mesh;
    };

    createSurface(base, topo) {
      if (!base) {
        return;
      }

      var texture = this.getTexture(base);

      texture.minFilter = THREE.NearestFilter;

      return new THREE.MeshPhongMaterial({
        //map: texture,
        lightMap: texture,
        transparent: true,
        opacity: 1, // 0.8
        flatShading: true,
				color: new THREE.Color(0, 0, 0)
      });
    };
  }

  return Blackhole;
});
