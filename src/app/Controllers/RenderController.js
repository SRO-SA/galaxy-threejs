define(
[
  'Environment/Constants',
  'Environment/Stats'
  // 'Controllers/TimeController'
],
function(Constants, Stats) {
  'use strict';

  var tweening = false;

  document.addEventListener('travelStart', (e)=> {
    tweening = true;
  }, false);

  document.addEventListener('travelComplete', (e)=> {
    tweening = false;
  }, false);

  function getElapsedTimeSec(start, end) {
    return (end - start) * 0.001;
  }

  function roundHundred(value) {
    return Math.round(value / 100) * 100;
  }

  function RenderController(scene, renderPass, effectPass) {
    this._renderEngine = new THREE.WebGLRenderer();
    this._scene = scene;
    this._camera = scene.camera;
		this._renderPass = renderPass;
		this._effectPass = effectPass;
		
		this._renderEngine.setSize(1920, 1080);
		this._composer = new POSTPROCESSING.EffectComposer(this._renderEngine);
    this.setFrame();

    var self = this;
		this._composer.addPass(this._renderPass);
		for(var effect of this._effectPass){
			this._composer.addPass(effect);
		}
    var frameEvent = new CustomEvent('frame');

    function render() {
      // Moniter javascript performance
      Stats.begin();

      requestAnimationFrame(render);
      TWEEN.update();
      document.dispatchEvent(frameEvent);
      //self._renderEngine.render(self._scene, self._camera);
			self._composer.render(0.0001);

      Stats.end();
    }

    render();
  }

  RenderController.prototype.setFrame = function() {
    var framecontainer = document.getElementById('solar-system');

    this._renderEngine.setSize(window.innerWidth, window.innerHeight);

    if (framecontainer) {
      framecontainer.appendChild(this._renderEngine.domElement);
    } else {
      document.body.appendChild(this._renderEngine.domElement);
    }
  };

  return RenderController;
});

