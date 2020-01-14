define(
[
  'Environment/GridHelper',
  'Modules/Scene',
  'Factory/StarFactory',
  'Factory/AsteroidBeltFactory',
  'Factory/KuiperBeltFactory',
	'Factory/BlackholeCenterFactory',
	'Models/Blackhole',
	'Models/Star',
  'Models/Planet',
  'Models/Moon',
  'Controllers/RenderController',
  'Controllers/OrbitController',
  'Controllers/TravelController',
  'Controllers/MenuController',
  'Controllers/EffectsController',
  'Modules/RandomColorGenerator',
  'Environment/Constants',
  'vendor/three-text2d/dist/three-text2d',
  'Listeners/FactoryListener'
],
function(
  GridHelper,
  Scene,
  StarFactory,
  AsteroidBeltFactory,
  KuiperBeltFactory,
	BlackholeCenterFactory,
	Blackhole,
	Star,
  Planet,
  Moon,
  RenderController,
  OrbitController,
  TravelController,
  MenuController,
  EffectsController,
  RandomColorGenerator,
  Constants,
  ThreeText
) {
  'use strict';

  /**
   * SolarSystemFactory
   *
   * @param {Object} data
   */
  function SolarSystemFactory(data) {
    this.scene = new Scene();
    this.data = data || {};
    this.parent = data.parent || null;
		this.stars = data.stars || [];
    //this.planets = data.planets || [];
		this.orbitControls = this.scene._orbitControls;
    this.solarSystemObjects = {
			blackhole: null,
      stars: [],
      planets: [],
      moons: []
    };
		this.godraysEffects = [];
		this.renderPass = null;
		this.effectPass = [];
		this.godraysEffectOptions = {
				resolutionScale: 1,
				density: 1,
				decay: 0.95,
				weight: 0.5,
				exposure: 0.6,
				clampMax: 1,
				samples: 100,
				blur: false
		};
    this._randomColorGenerator = new RandomColorGenerator();
  }

  /**
   * Builds all objects in the scene.
   *
   * @param  {Object}  data
   * @return {Promise}
   */
  SolarSystemFactory.prototype.build = function(data) {
		
    return new Promise((resolve)=> {
			for(var i = 0; i < data.stars.length; i++) {
				data.stars[i].distanceFromParent = BigInt(data.stars[i].distanceFromParent);
			}
      var startTime = new Date().getTime();
      var startEvent = new CustomEvent('solarsystem.build.start', {
        detail: {
          timestamp: startTime
        }
      });

      //var sun = this.buildSun(data.parent);
			var blackhole = this.buildBlackhole(data.parent)
      //this.solarSystemObjects.sun = sun;
			this.solarSystemObjects.blackhole = blackhole;

      this.scene.add(blackhole.threeObject);
			
			
      var map = {
				'1': {
					buildGroup: this.buildStars.bind(this, data.stars, blackhole),
					timeout: 500
				}
				,
//        '1': {
//          buildGroup: this.buildPlanets.bind(this, data.startsplanets, sun),
//          timeout: 500
//        }
//        ,
        '2': {
          buildGroup: this.buildBalckholeCenter.bind(this, data),
          timeout: 500
        }
        ,
//        '3': {
//          buildGroup: this.buildKuiperBelt.bind(this, data.stars),
//          timeout: 300
//        }
//        ,
        '3': {
          buildGroup: this.buildFarStars.bind(this),
          timeout: 300
        }
      };

      var buildGroupsCount = Object.keys(map).length;
      var i = 0;

      function run() {
        i++;

        var groupStartTime = new Date().getTime();

        if (map.hasOwnProperty(i)) {
          setTimeout(()=> {
            map[i].buildGroup.call().then((response)=> {
              var groupEndTime = new Date().getTime();
              var elapsedTime = (groupEndTime - groupStartTime) * 0.001;
              var percentage = (i / 4) * 100;

              this.updateProgress(percentage);

              groupStartTime = groupEndTime;

              run.call(this);
            });
          }, 1000);

        } else {
					//console.log("HEREEEEEEEEEEEEEEEEEEEE");
          this.renderScene(startTime);
          resolve();
        }
      }

      run.call(this);
    });
  };

  SolarSystemFactory.prototype.renderScene = function(startTime) {
		console.log(this.godraysEffects.length);
		//this.effectPass.renderToScreen = true;
		this.renderPass = new POSTPROCESSING.RenderPass(this.scene, this.scene.camera);
		//this.effectPass = new POSTPROCESSING.EffectPass(this.scene.camera, godraysEffect);
		this.renderPass.renderToScreen = false;
		for(var effect of this.godraysEffects) {
			var pass = new POSTPROCESSING.EffectPass(this.scene.camera, effect);
			pass.renderToScreen = true;
			this.effectPass.push(pass);
		}
    var renderController = new RenderController(this.scene, this.renderPass, this.effectPass);
    var focalpoint = this.scene;

    focalpoint.add(this.scene.camera);
    this.scene.camera.up.set(0, 0, 1);
    this.scene.camera.position.set(
      270000000000000,
      0,
      0
    );

    var focalPointChangeEvent = new CustomEvent('solarsystem.focalpoint.change', {
      detail: {
        object: focalpoint
      }
    });
		this.orbitControls.target = new THREE.Vector3();
		this.orbitControls.update();
    //this.scene.camera.lookAt();
    document.dispatchEvent(focalPointChangeEvent);

    this.initializeUserInterface();

    var endTime = new Date().getTime();
    var endEvent = new CustomEvent('solarsystem.build.end', {
      detail: {
        elapsedTime: (endTime - startTime) * 0.001
      }
    });

    document.dispatchEvent(endEvent);
  };

  /**
   * Right now this basically just renders the prototype of the ISS. I'd like to get this to
   * work with man-made satellites and model those as well.
   */
  SolarSystemFactory.prototype.buildMechanicalSatellites = function(planet, satellitesData) {

    // console.debug('Build Mech Satellite', planet, satellitesData);

    if (!(satellitesData instanceof Array)) {
      throw new Error('Argument satellitesData must be an instanceof Array.');
    }

    var mesh = new THREE.Mesh(
      new THREE.SphereGeometry(
          0.002,
          16,
          16
        ),
        new THREE.MeshPhongMaterial()
      )
    ;

    var threeRadius = planet.threeDiameter / 2;
    var threeDistanceFromParent = threeRadius + 400 * Constants.universeScale;

    for (var i = 0; i < satellitesData.length; i++) {
      planet.threeObject.add(mesh);

      mesh.position.x = threeDistanceFromParent;
    }
  };

  SolarSystemFactory.prototype.buildMoons = function(planetData, planet) {
    for (var i = 0; i < planetData.satellites.length; i++) {
      var orbitColor = this._randomColorGenerator.getRandomColor({
        luminosity: 'light',
        format: 'hex',
        hue: 'blue'
      });

      var moon = new Moon(planetData.satellites[i], planet, planetData, orbitColor);
      var orbitCtrlMoon = new OrbitController(moon, false);

      this.solarSystemObjects.moons.push(moon);

      planet._moons.push(moon);
      // planet.threeObject.add(moon.orbitCentroid);
      // planet.objectCentroid.add(moon.orbitCentroid);

      planet.core.add(moon.orbitCentroid);

      var buildEvent = new CustomEvent('solarsystem.build.object.complete', {
        detail: {
          object: moon
        }
      });

      document.dispatchEvent(buildEvent);
    }
  };

	SolarSystemFactory.prototype.buildStar = function(data, blackhole) {
		return new Promise((resolve) => {
			var startTime = new Date().getTime();
			var star = new Star(data, blackhole);
			var orbitCtrl = new OrbitController(star)
			var map = {}

			if(data.satellites.asteroidBelt) {
				map["1"] = {
          buildGroup: this.buildAsteroidBelt.bind(this, data.satellites, star),
          timeout: 500
        }
			}
			if(data.satellites.kuiperBelt) {
				map["2"] = {
          buildGroup: this.buildKuiperBelt.bind(this, data.satellites, star),
          timeout: 300
				}
			}
			
      var buildGroupsCount = Object.keys(map).length;
      var i = 0;

      function run() {
        i++;

        var groupStartTime = new Date().getTime();

        if (map.hasOwnProperty(i)) {
          setTimeout(()=> {
            map[i].buildGroup.call().then((response)=> {
              var groupEndTime = new Date().getTime();
              var elapsedTime = (groupEndTime - groupStartTime) * 0.001;
              var percentage = (i / 4) * 100;

              this.updateProgress(percentage);

              groupStartTime = groupEndTime;

              run.call(this);
            });
          }, 1000);

        }
      }
      run.call(this);
			
			this.scene.add(star.orbitCentroid);
			
			if(data.satellites.planets.length) {
				this.buildPlanets(data, data.satellites.planets, star);
			}
			//this.solarSystemObjects.stars.push(star);
			var endTime = new Date().getTime();
			
			resolve({
				star: star,
				elapsedTime: (endTime - startTime) * 0.001
			});
		});
	};

  SolarSystemFactory.prototype.buildPlanet = function(parentData, data, star) {
    return new Promise((resolve)=> {
      var startTime = new Date().getTime();
      var planet = new Planet(data, star, parentData);
      var orbitCtrl = new OrbitController(planet);

      //this.scene.add(planet.orbitCentroid); // all 3d objects are attached to the orbit centroid

      if (data.satellites.length) {
        this.buildMoons(data, planet);
      }

      if (data.satellites_mech && data.satellites_mech.length) {
        this.buildMechanicalSatellites(planet, data.satellites_mech);
      }

      //this.solarSystemObjects.planets.push(planet);
      star._planets.push(planet);
			star.core.add(planet.orbitCentroid);
      var endTime = new Date().getTime();

      resolve({
        planet: planet,
        elapsedTime: (endTime - startTime) * 0.001
      });
    });
  };

	SolarSystemFactory.prototype.buildStars = function(stars, blackhole) {
		return new Promise((resolve) => {
			var startTime = new Date().getTime();
			var promises = [];
			var endCount = stars.length - 1;
			var i;
			for(i = 0; i < stars.length; i++) {
				var startTime = new Date().getTime();
				promises.push(this.buildStar(stars[i], blackhole).then((response) => {
					var godraysEffect = new POSTPROCESSING.GodRaysEffect(this.scene.camera, response.star.threeObject, this.godraysEffectOptions);
					godraysEffect.dithering = true;
					this.godraysEffects.push(godraysEffect);
					console.log("DDSADSADSA");
					var buildEvent = new CustomEvent('solarsystem.build.object.complete' , {
						detail: {
							object: response.star
						}
					});
					document.dispatchEvent(buildEvent);
					this.solarSystemObjects.stars.push(response.star);
				}));
			}
			Promise.all(promises).then(() => {
				var endTime = new Date().getTime();
				resolve({
					group: 'stars',
					elapsedTime: (endTime - startTime) * 0.001
				});
			});
		
		});
	};


  SolarSystemFactory.prototype.buildPlanets = function(data, planets, star) {
    return new Promise((resolve)=> {
      var startTime = new Date().getTime();
      var promises = [];
      var endCount = planets.length - 1;
      var i;

      for (i = 0; i < planets.length; i++) {
        var startTime = new Date().getTime();

        promises.push(this.buildPlanet(data, planets[i], star).then((response)=> {
          var buildEvent = new CustomEvent('solarsystem.build.object.complete', {
            detail: {
              object: response.planet
            }
          });

          document.dispatchEvent(buildEvent);

          this.solarSystemObjects.planets.push(response.planet);
        }));
      }

      Promise.all(promises).then(()=> {
        var endTime = new Date().getTime();

        resolve({
          group: 'planets',
          elapsedTime: (endTime - startTime) * 0.001
        });
      });
    });
  };

  SolarSystemFactory.prototype.buildBlackhole = function(parentData) {
    var blackhole = new Blackhole(parentData);

    this.solarSystemObjects.blackhole = blackhole;

    var buildEvent = new CustomEvent('solarsystem.build.object.complete', {
      detail: {
        object: blackhole
      }
    });

    document.dispatchEvent(buildEvent);

    return blackhole;
  };

  SolarSystemFactory.prototype.buildAsteroidBelt = function(data, center) {
    var startTime = new Date().getTime();
    var asteroidBeltFactory = new AsteroidBeltFactory(this.scene, data, center);

    return new Promise((resolve)=> {
      asteroidBeltFactory.build(center);

      var endTime = new Date().getTime();

      resolve({
        group: 'asteroids',
        elapsedTime: (endTime - startTime) * 0.001
      });
    });
  };

  SolarSystemFactory.prototype.buildBalckholeCenter = function(data) {
    var startTime = new Date().getTime();
    var blackholeCenterFactory = new BlackholeCenterFactory(this.scene, data);

    return new Promise((resolve)=> {
      blackholeCenterFactory.build();

      var endTime = new Date().getTime();

      resolve({
        group: 'asteroids',
        elapsedTime: (endTime - startTime) * 0.001
      });
    });
  };

  SolarSystemFactory.prototype.buildKuiperBelt = function(data, center) {
    var startTime = new Date().getTime();
    var kuiperBeltFactory = new KuiperBeltFactory(this.scene, data, center);

    return new Promise((resolve)=> {
      kuiperBeltFactory.build(center);

      var endTime = new Date().getTime();

      resolve({
        group: 'asteroids',
        elapsedTime: (endTime - startTime) * 0.001
      });
    });
  };

  SolarSystemFactory.prototype.buildFarStars = function() {
    var startTime = new Date().getTime();
    var starFactory = new StarFactory(this.scene, this.data.stars[0].threeDistanceFromParent * 2);
    return new Promise((resolve)=> {
      starFactory.buildStarField().then(()=> {
        var endTime = new Date().getTime();
				console.log("HERERE");
        resolve({
          group: 'farStars',
          elapsedTime: (endTime - startTime) * 0.001
        });
      });
    });
  };

  SolarSystemFactory.prototype.initializeUserInterface = function(currentTarget) {
		//console.log(this.solarSystemObjects);
    var menuController = new MenuController({
      el: '#menu',
      scene: this.scene,
      data: this.data.stars[0],
      sceneObjects: this.solarSystemObjects,
      currentTarget: currentTarget,
			orbitControls : this.orbitControls
    });

    var effectsController = new EffectsController({
      el: '#toggle-effects',
      sceneObjects: this.solarSystemObjects.planets
    });

    $('#social-buttons-corner').addClass('visible');
  };

  SolarSystemFactory.prototype.updateProgress = function(percentage, elapsedTime) {
    var meter = $('.progress-meter');

    meter.css({
      'transitionDuration': elapsedTime +'ms'
    });

    meter.width(percentage+ '%');
  };

  return SolarSystemFactory;
});
