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
				var colorArray = [
					new THREE.Color(167/255, 188/255, 255/255),
					new THREE.Color(192/255, 209/255, 255/255),
					new THREE.Color(237/255, 238/255, 255/255),
					new THREE.Color(255/255, 249/255, 249/255),
					new THREE.Color(225/255, 241/255, 223/255),
					new THREE.Color(225/255, 198/255, 144/255),
					new THREE.Color(255/255, 187/255, 123/255)
				]

        for (var i = 0; i < positions.length; i += 3) {
          var pos = this.positionAsteroid(null, i);
          var x = pos.x;
          var y = pos.y;
          var z = pos.z;

          positions[i] = x;
          positions[i + 1] = y;
          positions[i + 2] = z;
					sizes[i] = Math.floor(Math.random() * (200 - 16 + 1) + 16);
					var colorRand = Math.floor(Math.random() * 7);
          var rgbValue = this._randomNumberGenerator.getRandomArbitraryNumber(1, 20);
					//console.log(colorArray[colorRand]);
          colors[i] = colorArray[colorRand].r;
          colors[i + 1] = colorArray[colorRand].g;
          colors[i + 2] = colorArray[colorRand].b;
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
		
		sqrt(number) {
			const bytes = new ArrayBuffer(Float32Array.BYTES_PER_ELEMENT);
			const floatView = new Float32Array(bytes);
			const intView = new Uint32Array(bytes);
			const threehalfs = new bigDecimal("1.5");

			function Q_rsqrt(number) {
				const x2 = new bigDecimal(bigDecimal.multiply(number.getValue(),"0.5"));
				floatView[0] = number.getValue();
				//console.log(floatView[0]);
				intView[0] = 0x5f3759df - ( intView[0] >> 1 );
				let y = new bigDecimal(floatView[0]);
				y = y.multiply( threehalfs.subtract((x2.multiply(y).multiply(y))));

				return y;
			}
			var result = parseFloat(Q_rsqrt(new bigDecimal(number.toString())).getValue());
			console.log("sssss");
			return 1/result;
			
		}
		
		getPoint(r, theta, whichWay) {
			var start = new Date();
			var way = whichWay === 1 ? Math.PI*0.5 : 0
			var rSign = Math.random() > 0.5 ? 1 : -1;
			var randR = rSign * (jStat.gamma.sample(1, 10)/10.0) * 5.6e12;
			//Math.abs(r) < 10000000000000 ? console.log(r) : null;
			var copyR = r;
			r += randR;
			var x1 = -r*Math.cos(theta);
			var y1 = r*Math.sin(theta);
			if (copyR >= 66281273296061.04 || copyR <= -66281273296061.04) {
				var maxSign = Math.random() > 0.5 ? 1 : -1;
				x1 += maxSign * (jStat.gamma.sample(0.5, 10)/10.0) * 5.6e12;
				y1 += maxSign * (jStat.gamma.sample(0.5, 10)/10.0) * 5.6e12;
			}
			if(Math.abs(copyR) < 12091769016272.819 && theta < Math.PI) {
				var minSign = Math.random() > 0.5 ? 1 : -1;
				var minTheta = Math.random() * Math.PI * 2
				//console.log(copyR);
				x1 = r * Math.cos(minTheta);
				y1 = r * Math.sin(minTheta);				
			}
			var x = x1*Math.cos(way) + y1*Math.sin(way);
			var y = -x1*Math.sin(way) + y1*Math.cos(way);
			var sign = Math.random() > 0.5 ? 1 : -1;
			var div =  1e-25; //new bigDecimal("10000000000000000000.0");
			var mult = 5000000000000000000000000.0;; //new bigDecimal("10000000000000000000.0");
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
			return {x: x, y: y, z: z};
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

    positionAsteroid(asteroid, count) {
      //d = d + (count / count.toFixed(0).length);
      //var randomNumber = this._randomNumberGenerator.getRandomNumberWithinRange(1, 2000) * (Math.random() + 1);
      //var randomOffset = odd ? randomNumber * -1 : randomNumber;
			var whichWay = count % 1;
			//console.log(whichWay);
      var r = 0;
			var tmp = Number(this._distanceFromParentMax / 10000n);
			var threeDistanceFromParent = Math.floor(tmp * Constants.orbitScale) * 10000;
			var sign = Math.random() > 0.5 ? -1 : 1;
			const A = 22595172258117.7714221623313;
			var gammaRand = jStat.gamma.sample(0.25, 5);
			while(gammaRand > 10) gammaRand = jStat.gamma.sample(1, 5);
			gammaRand /= 10
			var theta = gammaRand * 2.15 * Math.PI;
			r = sign * (A/(Math.log(0.5*Math.tan(theta/7))));
			var isSphere = Math.random() > 0.5 ? true : false;
			if(r < 1e13 && isSphere) {
					var randTheta = Math.random() * 360;
					var randPhi = Math.random() * 360;
					var x = r * 1e-6 * Math.cos(randTheta) * Math.sin(randPhi);
					var y = r * 1e-6 * Math.sin(randTheta) * Math.sin(randPhi);
					var z = r * 1e-6 * Math.cos(randPhi);		
					//console.log(x, y, z);
					var result = {x: x, y: y, z: z};
			//r = ((jStat.gamma.sample(0.5, 7)/10.0)* (threeDistanceFromParent - this._distanceFromParentMin * Constants.orbitScale + 1)) + this._distanceFromParentMin * Constants.orbitScale;
      //console.log(jStat.gamma.sample(1, 2));
			//var theta = count + 1 * Math.random() * this._orbitRadian * this._d2r;

			}
			else{
					this.minR = Math.abs(r) < this.minR ? Math.abs(r) : this.minR;
					this.maxR = Math.abs(r) > this.maxR ? Math.abs(r) : this.maxR;
					var result = this.getPoint(r, theta, whichWay);
			}
      var posX = result.x;
      var posY = result.y;
      var posZ = result.z;
      return {
        x: posX,
        y: posY,
        z: posZ //odd ? posZ * -1 : posZ
      }
    }
  }

  return AsteroidBeltFactory;
});
