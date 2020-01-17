define(
[
  'Modules/Scene',
  'Environment/Constants',
  'Modules/RandomNumberGenerator',
  'Models/Asteroid'
],
function(Scene, Constants, RandomNumberGenerator, Asteroid) {
  'use strict';

  class AsteroidBeltFactory {
    constructor(scene, data) {
      this._scene = scene || null;
      this._count = data.blackholeCenter.count || 1000;
      this._distanceFromParent = data.blackholeCenter.distanceFromParent.min;
      this._distanceFromParentMin = data.blackholeCenter.distanceFromParent.min;
      this._distanceFromParentMax = BigInt(data.blackholeCenter.distanceFromParent.max);
      this._texture = new THREE.TextureLoader().load('src/assets/textures/asteroid.jpg');
      this._randomNumberGenerator = new RandomNumberGenerator();
      this._orbitCentroid = new THREE.Object3D();
      this._orbitRadian = 360 / 1681.6;
      this._d2r = Constants.degreesToRadiansRatio;
			this.maxR = 0;
			this.minR = Infinity;
			this.colors = [
					new THREE.Color(255/255, 255/255, 255/255), //rgb(255, 255, 255), rgb(241, 228, 188), rgb(227, 201, 122), rgb(214, 175, 56)
					new THREE.Color(241/255, 228/255, 188/255), //rgb(194, 156, 57), rgb(174, 137, 58), rgb(154, 119, 59), rgb(134, 100, 60) 
					new THREE.Color(227/255, 201/255, 122/255),// , rgb(114, 81, 61), rgb(94, 63, 62), rgb(74, 44, 63), rgb(54, 25, 64), rgb(35, 7, 65)
					new THREE.Color(214/255, 175/255, 56/255),
					new THREE.Color(194/255, 156/255, 57/255),
					new THREE.Color(174/255, 137/255, 58/255),
					new THREE.Color(154/255, 119/255, 59/255),
					new THREE.Color(134/255, 100/255, 60/255),
					new THREE.Color(114/255, 81/255, 61/255),
					new THREE.Color(94/255, 63/255, 62/255),
					new THREE.Color(74/255, 44/255, 63/255),
					new THREE.Color(54/255, 25/255, 64/255),
					new THREE.Color(35/255, 7/255, 65/255)
				]
			this.colorsNum = this.colors.length;
    }

    build() {
      return new Promise((resolve, reject)=> {
        var particles = this._count;
        var geometry = new THREE.BufferGeometry();
        var positions = new Float32Array(particles * 3);
        var colors = new Float32Array(particles * 3);
				var sizes = new Float32Array(particles);
        var color = new THREE.Color();
        var n = 1000;
        var n2 = n / 2; // particles spread in the cube
        color.setRGB(1, 1, 1);
				//console.log(color.getHexString());

        for (var i = 0; i < positions.length; i += 3) {
					var result = this.positionAndColorAsteroid(null, i); 
          var pos = result.pos;
          var x = pos.x;
          var y = pos.y;
          var z = pos.z;
					var color = result.color;
          positions[i] = x;
          positions[i + 1] = y;
          positions[i + 2] = z;
					sizes[i] = Math.floor(Math.random() * (200 - 16 + 1) + 16);
					var colorRand = Math.floor(Math.random() * 7);
          var rgbValue = this._randomNumberGenerator.getRandomArbitraryNumber(1, 20);
					//console.log(colorArray[colorRand]);
          colors[i] = color.r;
          colors[i + 1] = color.g;
          colors[i + 2] = color.b;
        }
				//console.log(colors);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
				geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
				var material = new THREE.PointsMaterial({
          size: 180,
					vertexColors: THREE.VertexColors,
          map: this.createCanvasMaterial(256),//this._texture
					//depthWrite: true,

        });
        geometry.computeBoundingSphere();
				var lightColor = 0xffff00;
				var intesity = 1;
				var lightDistanceStrength = 0;
				var lightDecayRate = 0.6;
				var sunLight = new THREE.PointLight(lightColor, intesity, lightDistanceStrength, lightDecayRate);

        var particleSystem = new THREE.Points(geometry, material);
				particleSystem.add(sunLight);
        this._orbitCentroid.add(particleSystem);

        this._scene.add(this._orbitCentroid);

        document.addEventListener('frame', (e)=> {
          var degreesToRotate = 0.001;

          this._orbitCentroid.rotation.z += degreesToRotate * Constants.degreesToRadiansRatio;
        }, false);
				console.log(this.minR, this.maxR);
        resolve();
      });
    }
		
		getPoint(r, theta, whichWay) {
			var start = new Date();
			var way = whichWay * Math.PI*0.25;
			var rSign = Math.random() > 0.5 ? 1 : -1;
			var randRMax = ((Math.abs(r)/69281451938879.52)* (3.6e13 - 5.6e10)) + 5.6e10;
			var randR = jStat.gamma.sample(1, 2);
			while(randR > 10) randR = jStat.gamma.sample(1, 2);
			var randR = rSign * (randR/10) * randRMax;
			//Math.abs(r) < 10000000000000 ? console.log(r) : null;
			var color = null;
			var copyR = r;
			r += randR;
			var x1 = -r*Math.cos(theta);
			var y1 = r*Math.sin(theta);
			if (copyR >= 66281273296061.04 || copyR <= -66281273296061.04) {
				var maxSign = Math.random() > 0.5 ? 1 : -1;
				x1 += maxSign * (jStat.gamma.sample(1, 5)/10.0) * 3.6e12;
				y1 += maxSign * (jStat.gamma.sample(1, 5)/10.0) * 3.6e12;
				color = this.getFarColor(); //TODO
			}
			if(Math.abs(copyR) < 12091769016272.819 && theta < Math.PI) {
				var rConst = copyR * (0.2);
				color = this.getCoreColor(Math.abs(copyR), 12091769016272.819, false);				//TODO
				var minSign = Math.random() > 0.5 ? 1 : -1;
				var minTheta = Math.random() * Math.PI * 2
				//console.log(copyR);
				var newRandR = jStat.gamma.sample(1, 4);
				while(newRandR > 10) newRandR = jStat.gamma.sample(1, 4);
				newRandR = rSign * (newRandR/10) *3.6e12;
				x1 = (copyR + newRandR + rConst) * Math.cos(minTheta);
				y1 = (copyR + newRandR + rConst) * Math.sin(minTheta);				
			}
			var x = x1*Math.cos(way) + y1*Math.sin(way);
			var y = -x1*Math.sin(way) + y1*Math.cos(way);
			var sign = Math.random() > 0.5 ? 1 : -1;
			var div =  1e-25; //new bigDecimal("10000000000000000000.0");
			var mult = 5000000000000000000000000.0;; //new bigDecimal("10000000000000000000.0");
			if(color == null) {
				color = this.getCoreColor(Math.abs(randR), randRMax, true)
				color == undefined ? console.log(Math.abs(randR) < randRMax, Math.abs(randR) >= randRMax, randRMax) : null;

			} //TODO
			var power = -(x*x + y*y);
			var powerSec = -2*(x*x+y*y);
			power = power * div;
			powerSec = powerSec * div;
			var temp = mult * Math.exp(power) + Math.exp(powerSec);
			//console.log(temp.getValue());
			var temp2 = temp + 18500000000000000.0;
			var z = sign * Math.sqrt(temp2)//this.sqrt(BigInt(bigDecimal.floor(temp2.getValue())));
			//console.log(new Date() - start);
			//if(Math.abs(x)< 1000  && Math.abs(y)< 1000) console.log(x, y, z);
			return {pos: {x: x, y: y, z: z}, color: color};
		}
		
		createCanvasMaterial(size) {
			var matCanvas = document.createElement('canvas');
			matCanvas.width = matCanvas.height = size;
			var matContext = matCanvas.getContext('2d');
			// create exture object from canvas.
			var texture = new THREE.Texture(matCanvas);
			// Draw a circle
			var center = size / 2;
			matContext.beginPath();
			matContext.arc(center, center, size/2, 0, 2 * Math.PI, false);
			matContext.closePath();
			matContext.fillStyle = "#ffffff";
			matContext.fill();
			// need to set needsUpdate
			texture.needsUpdate = true;
			// return a texture made from the canvas
			return texture;
		}

    positionAndColorAsteroid(asteroid, count) {
      //d = d + (count / count.toFixed(0).length);
      //var randomNumber = this._randomNumberGenerator.getRandomNumberWithinRange(1, 2000) * (Math.random() + 1);
      //var randomOffset = odd ? randomNumber * -1 : randomNumber;
			var whichWay = count % 4;
			//console.log(whichWay);
      var r = 0;
			var tmp = Number(this._distanceFromParentMax / 10000n);
			var threeDistanceFromParent = Math.floor(tmp * Constants.orbitScale) * 10000;
			var sign = Math.random() > 0.5 ? -1 : 1;
			const A = 22595172258117.7714221623313;
			var gammaRand = jStat.gamma.sample(0.25, 5);
			while(gammaRand > 10) gammaRand = jStat.gamma.sample(0.25, 5);
			gammaRand /= 10
			var theta = gammaRand * 2.15 * Math.PI;
			r = sign * (A/(Math.log(0.5*Math.tan(theta/7))));
			var isSphere = Math.random() > 0.5 ? true : false;
			if(Math.abs(r) < 1e13 && isSphere) {
					var randTheta = Math.random() * 360;
					var randPhi = Math.random() * 360;
					var x = r * 1e-6 * Math.cos(randTheta) * Math.sin(randPhi);
					var y = r * 1e-6 * Math.sin(randTheta) * Math.sin(randPhi);
					var z = r * 1e-6 * Math.cos(randPhi);
					var color = this.getCoreColor(Math.abs(r), 1e13, false); //TODO
					var result = {pos: {x: x, y: y, z: z}, color: color};
			//r = ((jStat.gamma.sample(0.5, 7)/10.0)* (threeDistanceFromParent - this._distanceFromParentMin * Constants.orbitScale + 1)) + this._distanceFromParentMin * Constants.orbitScale;
      //console.log(jStat.gamma.sample(1, 2));
			//var theta = count + 1 * Math.random() * this._orbitRadian * this._d2r;

			}
			else{
					this.minR = Math.abs(r) < this.minR ? Math.abs(r) : this.minR;
					this.maxR = Math.abs(r) > this.maxR ? Math.abs(r) : this.maxR;
					var result = this.getPoint(r, theta, whichWay);
			}
      var posX = result.pos.x;
      var posY = result.pos.y;
      var posZ = result.pos.z;
      return {
				pos: {
					x: posX,
					y: posY,
					z: posZ //odd ? posZ * -1 : posZ					
				},
				color: result.color
      }
    }
		
		
		getCoreColor(r, maxR, isSpiral) {
			var randIndex = jStat.gamma.sample(0.8, 0.3);
			while(randIndex >= 1) randIndex = jStat.gamma.sample(0.8, 0.3);
			//randIndex /=10;
			randIndex *= this.colorsNum;
			randIndex = Math.floor(randIndex);
			if (isSpiral) var index = ((7 +  Math.floor((r/maxR) * 7 )) + randIndex) % this.colorsNum;
			else var index = (Math.floor((r/maxR) * 7 ) + randIndex) % this.colorsNum ;

			//console.log(Math.floor((r/maxR) * 3 ));
			return this.colors[index];
		}
		
		getFarColor() {
			var randIndex = jStat.gamma.sample(2, 1.2);
			while(randIndex >= this.colorsNum) randIndex = jStat.gamma.sample(2, 1.2);
			var index = this.colorsNum - 1 - Math.floor(randIndex);
			index >= this.colorsNum ? console.log(index): null;
			return this.colors[index];			
		}
		
		getMidColor() {
			var randIndex = jStat.normal.sample(3.5, 0.3);
			while(randIndex >= 7) randIndex = jStat.normal.sample(3.5, 0.3);
			var index = Math.floor(randIndex);
			//console.log(index);
			return this.colors[index];			
		}
  }

  return AsteroidBeltFactory;
});
