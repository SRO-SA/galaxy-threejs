define(
[
	'jquery',
	'underscore',
	'backbone',
	'Controllers/TravelController',
  'Controllers/MoonMenuController',
	'Modules/TemplateLoader',
  'Models/Planet',
  'Models/Moon'
],
function(
  $,
  _,
  Backbone,
  TravelController,
  MoonMenuController,
  TemplateLoader,
  Planet,
  Moon,
  MoonData
) {
  'use strict';

  const ORBIT_COLOR_DEFAULT = '#000000';
  const ORBIT_COLOR_HIGHLIGHT = '#197eaa';
  const ORBIT_COLOR_ACTIVE = '#3beaf7';

  return Backbone.View.extend({
    events: {
      'click a[data-id]': 'onClick',
      'mouseenter a[data-id]': 'onMouseEnter',
      'mouseleave a[data-id]': 'onMouseLeave'
    },

    initialize: function(options) {
      this.scene = options.scene || null;
      this.camera = this.scene ? this.scene.camera : null;
      this.data = options.data || {};
			this.orbitControls = options.orbitControls;
      this.sceneObjects = options.sceneObjects || [];
      this.travelController = new TravelController(this.scene, this.orbitControls);
      this.templateLoader = new TemplateLoader();
      this.moonDataModel = null;
      this.isTraveling = false;
      this.hasTraveled = false;
      this.currentTarget = options.currentTarget || this.sceneObjects.stars[0];
      this.template = this.templateLoader.get('planets', 'src/app/Views/menu.twig').then((template)=> {
        this.template = template;
        this.render();
        this.initializePlugins();
        this.initializeListeners();

        this.moonMenuController = new MoonMenuController({
          el: $('#moons'),
          scene: this.scene,
          data: this.data,
          sceneObjects: this.sceneObjects.moons,
					orbitControls: this.orbitControls
        });
      });
    },

    initializePlugins: function() {
      this.accordion = new Foundation.Accordion(this.$('.accordion'), { allowAllClosed: true });
    },

    render: function() {
			//console.log(this.data);
      this.$el.html(this.template.render({ planets: this.data.satellites.planets, star: this.data }));
    },

    onClick: function(e) {
      var id = Number.parseInt(e.currentTarget.dataset.id);
      var target = this.matchTarget(id);

      if (this.isCurrentTarget(target)) {
        e.stopImmediatePropagation();
        return false;
      }
			this.travelToObject(target);
    },

    onMouseEnter: function(e) {
      var id = Number.parseInt(e.currentTarget.dataset.id);
			//console.log(e.currentTarget.dataset.id);
      var target = this.matchTarget(id);
			if(id.toString() !== "0"){
				if (this.isCurrentTarget(target)) {
					if (!this.isTraveling) {
						this.highlightTarget(target);
					}

					return true;
				}
			}
			if(id.toString() !== "0") this.highlightObject(e);
    },

    onMouseLeave: function(e) {
      var id = Number.parseInt(e.currentTarget.dataset.id);
      var target = this.matchTarget(id);
			if(id.toString() !== "0"){
				if (this.isCurrentTarget(target)) {
					if (!this.isTraveling) {
						this.unhighlightTarget(target);
					}

					return true;
				}
			}
			if(id.toString() !== "0") this.unhighlightObject(e);
    },

    travelToObject: function(target) {
      // Return old target to default orbit line color
      if (this.currentTarget && this.currentTarget.orbitLine) {
        this.currentTarget.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_DEFAULT);
				this.currentTarget.orbitLine.orbit.material.visible = false;
      }

      // Change new target orbit line color
			if(target._id.toString() !== "0"){
				target.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_ACTIVE); // same color as hover and active state
				target.orbitLine.orbit.material.visible= true;
				target.orbitLine.orbit.material.needsUpdate = true;
			}
			//console.log(target.highlight.geometry);
      this.travelController.travelToObject(
        this.orbitControls.position,
        target,
        target.threeDiameter * 2.5
      );

      this.currentTarget = target;
    },

    matchTarget: function(id) {
      var target = null;
			//console.log(id);
			//console.log(this.sceneObjects.star[0]._id.toString() === id.toString());  change star to stars
			if(this.sceneObjects.stars[0].id.toString() === id.toString()) {
				//console.log(id);
				return this.sceneObjects.stars[0];
			}
      for (var i = 0; i < this.sceneObjects.planets.length; i++) {
        if (this.sceneObjects.planets[i].id === id) {
          return this.sceneObjects.planets[i];
      	}
      }
      return target;
    },

    isCurrentTarget: function(target) {
      return this.currentTarget && _.isEqual(this.currentTarget.id, target.id);
    },

  	highlightObject: function(e) {
		  var target = this.matchTarget(Number.parseInt(e.currentTarget.dataset.id));

      this.highlightTarget(target);
      this.highlightOrbit(target);
    },

    unhighlightObject: function(e) {
      var target = this.matchTarget(Number.parseInt(e.currentTarget.dataset.id));

      this.unhighlightTarget(target);
      this.unhighlightOrbit(target);
    },

    highlightTarget: function(target) {
      var distanceTo = this.scene.camera.position.distanceTo(target.threeObject.position);
      var highlightDiameter = distanceTo * 0.011; // 1.1% of distance to target

      target.highlight = highlightDiameter;
      target.highlight.material.opacity = 0.9;
    },

    highlightOrbit: function(target) {
      var hightlightColor = '#197eaa'; // target.orbitHighlightColor || #216883

      target.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_HIGHLIGHT); // new THREE.Color('#d3d3d3');
      target.orbitLine.orbit.material.needsUpdate = true;
    },

    unhighlightTarget: function(target) {
      target.core.remove(target.highlight);
    },

    unhighlightOrbit: function(target) {
      target.orbitLine.orbit.material.color = new THREE.Color(ORBIT_COLOR_DEFAULT);
      target.orbitLine.orbit.material.needsUpdate = true;
    },

    initializeListeners: function() {
      document.addEventListener('solarsystem.travel.planet.start', this.handleTravelStart.bind(this));
      document.addEventListener('solarsystem.travel.planet.complete', this.handleTravelComplete.bind(this));
      document.addEventListener('solarsystem.focalpoint.change', this.handleTravelComplete.bind(this));
			document.addEventListener('solarsystem.travel.star.complete', this.handleStarTravelComplete.bind(this));
			document.addEventListener('solarsystem.travel.star.start', this.handleStarTravelStart.bind(this));

    },
		
		
		handleStarTravelStart: function(e) {
      this.isTraveling = true;
      $('#current-target-title').removeClass('active').html('');			
		},
		
		handleStarTravelComplete: function(e) {
			var object = e.detail;
      $('#current-target-title').html("Orouna").addClass('active');	
      this.moonMenuController.setModel([]);			
			this.isTraveling = false;
		},


    handleTravelStart: function(e) {
      this.isTraveling = true;

      $('#current-target-title').removeClass('active').html('');
    },

    handleTravelComplete: function(e) {
      var object = e.detail;

      $('#current-target-title').html(object.name).addClass('active');

      this.moonMenuController.setModel(object._moons);
      this.isTraveling = false;
    }
  });
});
