define(
[
  'Models/CelestialObject',
  'Environment/Constants',
	'Models/Orbit',
  'vendor/three-text2d/dist/three-text2d',
  'Extensions/RadialRingGeometry'
],
function(
	CelestialObject,
	Constants,
  Orbit,
  ThreeText,
  RadialRingGeometry) {
  'use strict';

  const DISTANCE_TO_KUIPER_BELT = 7479893535; // Kuiper Belt radius

  class Star extends CelestialObject {
    constructor(data, threeParent) {
      super(data.diameter, data.mass, data.gravity, data.density);

      this._id = data.id || null;
      this._name = data.name || null;
      this._rotationPeriod = data.rotationPeriod || null;
      this._lengthOfDay = data.lengthOfDay || null;
      this._distanceFromParent = data.distanceFromParent || null;
      this._orbitalPeriod = data.orbitalPeriod || null;
      this._orbitalVelocity = data.orbitalVelocity || null;
      this._orbitalInclination = data.orbitalInclination || null; // to the ecliptic plane
      this._axialTilt = data.axialTilt || null;
      this._meanTemperature = data.meanTemperature || null;
			this._color = this.getColor(data.color) || new THREE.Color(255, 255, 255);
      this._orbitPositionOffset = data.orbitPositionOffset;
      this._orbitHighlightColor = data.orbitHighlightColor || "#2d2d2d";
      this._textureLoader = new THREE.TextureLoader();
      this._threeDiameter = this.createThreeDiameter();
      this._threeRadius = this.createThreeRadius();
      this._surface = this.createSurface(data._3d.textures.base, data._3d.textures.topo);
      this._threeObject = this.createGeometry(this._surface);
      this._threeDistanceFromParent = this.createThreeDistanceFromParent();
      this._threeParent = threeParent || null;
      this._planets = [];
      this._theta = 0;
			this._lightDistance = data.lightDistance || DISTANCE_TO_KUIPER_BELT;
      this._orbitCentroid = this.createOrbitCentroid();
			this._highlight = this.createHighlight();
			
			this.buildFullObject3D();

    };

    /**
     * 3D Model Data
     */
		getColor(hexcolor) {
			return new THREE.Color(hexcolor);
		} 
		 
		
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
		
    get id() {
      return this._id;
    }

    get name() {
      return this._name;
    }

    get rotationPeriod() {
      return this._rotationPeriod;
    }

    get distanceFromParent() {
      return this._distanceFromParent;
    }

    get orbitalPeriod() {
      return this._orbitalPeriod;
    }

    get orbitalVelocity() {
      return this._orbitalVelocity;
    }

    get orbitalInclination() {
      return this._orbitalInclination;
    }

    get axialTilt() {
      return this._axialTilt;
    }

    get meanTemperature() {
      return this._meanTemperature;
    }

    get planets() {
      return this._planets;
    }

    get orbitPositionOffset() {
      return this._orbitPositionOffset;
    }

    get theta() {
      return this._theta;
    }

    set theta(theta) {
      this._theta = theta;
    }

    get highlight() {
      return this._highlight;
    }
		
    get threeParent() {
      return this._threeParent;
    }

    get threeDistanceFromParent() {
      return this._threeDistanceFromParent;
    }
		
		get orbitLine() {
      return this._orbitLine;
    }

    get orbitHighlightColor() {
      return this._orbitHighlightColor;
    }

    set highlight(amplitude) {
      this._highlight = this.createHighlight(amplitude);
    }
		
    setAxes() {
      this._threeObject.rotation.y = this._axialTilt * Constants.degreesToRadiansRatio;
      this._core.rotation.y = this._axialTilt * Constants.degreesToRadiansRatio;
      // this._objectCentroid.rotation.y = this._axialTilt * Constants.degreesToRadiansRatio;
    };
		
    buildFullObject3D() {
      // this.createLabelSprite();
      this.setAxes();
      // this.createLabelSprite();

      this._orbitLine = new Orbit(this);
      this._orbitCentroid.add(
        this._threeObject,
        this._core,
        this._orbitLine.orbit,
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
      var lightColor = 0xffffff;
      var intesity = 1;
      var lightDistanceStrength = this._lightDistance * Constants.universeScale;
      var lightDecayRate = 0.6;
      var sunLight = new THREE.PointLight(lightColor, intesity, lightDistanceStrength, lightDecayRate);

      mesh.rotation.x = 90 * Constants.degreesToRadiansRatio;

      mesh.add(sunLight);

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
				color: this._color
      });
    };
    
		createLabelSprite() {
      var sprite = new ThreeText.SpriteText2D(this._name, {
        align: ThreeText.textAlign.center,
        font: '400px Arial',
        fillStyle: '#ffffff',
        antialias: false
      });

      this._core.add(sprite);
    }
	  
		createThreeDistanceFromParent() {
			var number = Number(this._distanceFromParent / 10000n);
			console.log(Math.floor((number * Constants.orbitScale) * 10000));
      return Math.floor((number * Constants.orbitScale) * 10000);
    }
	
		createHighlight(amplitude) {
      var resolution = 2880; // segments in the line
      var length = 360 / resolution;
      var highlightDiameter = this._threeDiameter > 4 ? this._threeDiameter * 45 : this._threeDiameter * 75;
      var orbitAmplitude = amplitude || highlightDiameter;
      var orbitLine = new THREE.Geometry();
      var material = new THREE.MeshBasicMaterial({
        color: '#ffbd00', // '#00ffff',
        transparent: true,
        opacity: 0,
        depthTest: false
      });

      for (var i = 0; i <= resolution; i++) {
        var segment = (i * length) * Math.PI / 180;

        orbitLine.vertices.push(
          new THREE.Vector3(
            Math.cos(segment) * orbitAmplitude,
            Math.sin(segment) * orbitAmplitude,
            0
          )
        );
      }

      var line = new THREE.Line(orbitLine, material);

      line.rotation.y += 90 * Constants.degreesToRadiansRatio;
      line.position.set(0, 0, 0);

      this._core.add(line);

      return line;
    }

    getSphereGeometrySegmentOffset() {
      return Number.parseInt(this._threeDiameter + 1 * 60);
    }
	}

  return Star;
});
