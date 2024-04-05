import * as THREE from './lib/three.module.js';

import {RPLDATA} from './immervision-rpl.js';

import jsQR from './lib/jsQR.js';



/** Class representing a stream player. */
export class IVEViewer {
	
	/**
	 * Create a Stream Player
	 * @constructor
	 * @param {object} viewOptions (passed to the view class)
	 * @param {domElement} viewOptions.target  domParent of the PLayer
	 * @param {string} [viewOptions.view] view classname "perspective"(default) or "perimeter"
	 * 
	 * @param {object} state State Object
	 * @param {(url|domElement)} state.video Stream URL or VIDEO domElement
	 * @param {string} [state.RPL=auto] RPL ID
	 * @param {number} [state.widthSegments=92] Lens Mesh Number of horizontal segments (Quality)
	 * @param {string} [state.QrCodeMode=auto] QrCode mode ("auto", "force_on", "off")
	 * @param {string} [state.orientation=auto] Orientation ("auto","CEILING","GROUND","WALL")
	 * @param {object} [state.QrCodeRect] Rectangle of the position of the QrCode in image/video
	 * @param {number} [state.QrCodeRect.x=0] X Top-left corner of the rectangle in pixel
	 * @param {number} [state.QrCodeRect.y=0] Y Top-left corner of the rectangle in pixel
	 * @param {number} [state.QrCodeRect.w=260] The width of the rectangle in pixel
	 * @param {number} [state.QrCodeRect.h=260] The height of the rectangle in pixel
	 * @param {object} [state.calibration] Calibration of the lens
	 * @param {number} [state.calibration.x=50] UVmap X Center in %
	 * @param {number} [state.calibration.y=50] UVmap Y Center in %
	 * @param {number} [state.calibration.w=100] UVmap width in %
	 * @param {number} [state.calibration.h=100] UVmap height in %
	 * @param {object} [state.rotation] Rotation of the lens (stabilization)
	 * @param {number} [state.rotation.x] Lens Rotation on X
	 * @param {number} [state.rotation.y] Lens Rotation on Y
	 * @param {number} [state.rotation.z] Lens Rotation on Z 
	 * @param {function} [state.onStateChange] callback on State Change (newState, state)
	 * @param {function} [state.onVideoFrame] callback on video frame (now, metadata)
	 * @param {function} [state.onQrCode] callback on QrCode (qrcode, newState)
	 * @param {function} [state.onProcessQrCode] Use other QrCode decoder engine (imageData) return string
	 * 
	 * @return {IVEViewer} A Player object.
	 * 
	 * IVEViewer.video_html
	 * IVEViewer.view
	 * IVEViewer.views
	 * 
	 */

	

	constructor(viewOptions, state = {}){
		this.state = {}

		//default state:
		state = Object.assign({
			QrCodeMode:"auto",
			RPL:"auto",
			widthSegments:92,
			limitViews:"auto",
			orientation:"auto",
			orientationX:0,
			QrCodeRect:{
				x:0,
				y:0,
				w:260,
				h:260
			},
			calibration:{
				x:50,
				y:50,
				w:100,
				h:100,
				r:0
			},
			onProcessQrCode:(imageData, callback)=>{
				let QrCode = jsQR(imageData.data, imageData.width, imageData.height, {inversionAttempts :"dontInvert"})
				if(QrCode){
					callback(QrCode.data)
				}
			}
		}, state)
		
		/**
		* Update state of the player
		* @param {object} state State Object
		* @param {(url|domElement)} state.video Stream URL or VIDEO domElement
		* @param {string} [state.RPL=auto] RPL ID
		* @param {number} [state.widthSegments=46] Lens Mesh Number of horizontal segments (Quality)
		* @param {string} [state.QrCodeMode=auto] QrCode mode ("auto", "force_on", "off")
		* @param {string} [state.orientation=auto] Orientation ("auto","CEILING","GROUND","WALL")
		* @param {object} [state.QrCodeRect] Rectangle of the position of the QrCode in image/video
		* @param {number} [state.QrCodeRect.x=0] X Top-left corner of the rectangle in pixel
		* @param {number} [state.QrCodeRect.y=0] Y Top-left corner of the rectangle in pixel
		* @param {number} [state.QrCodeRect.w=260] The width of the rectangle in pixel
		* @param {number} [state.QrCodeRect.h=260] The height of the rectangle in pixel
		* @param {object} [state.calibration] Calibration of the lens
		* @param {number} [state.calibration.x=50] UVmap X Center in %
		* @param {number} [state.calibration.y=50] UVmap Y Center in %
		* @param {number} [state.calibration.w=100] UVmap width in %
		* @param {number} [state.calibration.h=100] UVmap height in %
		* @param {object} [state.rotation] Rotation of the lens (stabilization)
		* @param {number} [state.rotation.x] Lens Rotation on X
		* @param {number} [state.rotation.y] Lens Rotation on Y
		* @param {number} [state.rotation.z] Lens Rotation on Z 
		* @param {function} [state.onStateChange] callback on State Change (newState, state)
		* @param {function} [state.onVideoFrame] callback on video frame (now, metadata)
		* @param {function} [state.onQrCode] callback on QrCode (qrcode, newState)
		* @param {function} [state.onProcessQrCode] Use other QrCode decoder engine (imageData) return string
		*/
		this.setState = (state)=>{	
			const newState = {}
				
			if(state.video && state.video != this.state.video){
				newState.video = state.video
				
				if(state.video instanceof HTMLElement){
					this.video_html = state.video
				}else{
					if(this.video_html){
						//destroy old video
						this.video_html.pause();
						this.video_html.removeAttribute('src'); 
						this.video_html.load();
					}
					this.video_html = document.createElement( 'video' );
					this.video_html.src = state.video;
				}
				this.video_html.addEventListener("loadeddata", this.onVideoLoaded, false);
				this.video_html.muted = true;
				this.video_html.loop = true;
				this.video_html.crossOrigin = 'anonymous'
				this.video_html.play();
			}
			
			if(state.QrCodeMode && state.QrCodeMode != this.state.QrCodeMode){
				newState.QrCodeMode = state.QrCodeMode
				if(state.QrCodeMode == "force_on" || state.QrCodeMode == "auto"){
					this.processQrCode = (imageData) =>{
						this.state.onProcessQrCode(imageData, this.parseQrCode)
					}
					this.processQrCodeTexture =()=>{
						var imageData
						try{
							imageData = this.processWebglQrCodeTexture()
						}catch(e){
						}
						
						if(!imageData){
							console.warn("processQrCodeTexture fallback")
							this.texture.needsUpdate = true;
							imageData = this.textureContext.getImageData(this.state.QrCodeRect.x,this.state.QrCodeRect.y,this.state.QrCodeRect.w,this.state.QrCodeRect.h);
						}
						
						this.processQrCode(imageData)
					}	
				}else{
					this.processQrCode =()=>{}
					this.processQrCodeTexture =()=>{
						this.texture.needsUpdate = true;
					}
				}
			}
			if(state.image && state.image != this.state.image){
				newState.image = state.image
				
				let img = document.createElement("img");
				img.crossOrigin = 'anonymous';
				img.onload = ()=>{
					this.textureCanvas.width = img.width
					this.textureCanvas.height = img.height
					this.textureContext.drawImage(img, 0, 0, img.width, img.height);
					this.processQrCodeTexture()
				}
				img.src = state.image;
				this.texture.image = img;
				this.texture.needsUpdate = true;
			}
			
			if(state.imageData && state.imageData != this.state.imageData){
				newState.imageData = state.imageData
				this.textureCanvas.width = state.imageData.width
				this.textureCanvas.height = state.imageData.height
				this.textureContext.putImageData(state.imageData, 0, 0)
				this.texture.needsUpdate = true;

				this.processQrCode(state.imageData)
			}

			if(state.imageBitmap && state.imageBitmap != this.state.imageBitmap){
				newState.imageBitmap = state.imageBitmap
				this.textureCanvas.width = state.imageBitmap.width
			    this.textureCanvas.height = state.imageBitmap.height
                var ctx = this.textureCanvas.getContext('bitmaprenderer');
                if(ctx) {
                    ctx.transferFromImageBitmap(state.imageBitmap);
                }else {
                    // in case someone supports createImageBitmap only
                    // twice in memory...
                    this.textureContext.drawImage(state.imageBitmap,0,0);
                }

				this.texture.needsUpdate = true;
				this.processQrCodeTexture()
			}

			if(state.calibration && (this.state.calibration == null || state.calibration.x != this.state.calibration.x || state.calibration.y != this.state.calibration.y || state.calibration.w != this.state.calibration.w || state.calibration.h != this.state.calibration.h || state.calibration.r != this.state.calibration.r)){
				newState.calibration = state.calibration
			}
			
			if(state.RPL && state.RPL != this.state.RPL){
				newState.RPL = state.RPL

				if(state.RPL.indexOf(0) == 'V'){
					newState.calibration = {
						x:50,
						y:50,
						w:100,
						h:100,
						r:0
					}
				}
			}
			if(state.widthSegments && state.widthSegments != this.state.widthSegments){
				newState.widthSegments = state.widthSegments
			}
			
			if(state.orientation && state.orientation != this.state.orientation){
				state.orientationX = this.state.orientationX = IVEViewer.ORIENTATION[state.orientation] || 0
				newState.orientation = state.orientation
				newState.orientationX = state.orientationX
				//console.log("orientation!")
				this.views.forEach((view)=>{
					//view.recenter();
					view.initView = false;
					//console.log("view.initView to false!")
				})
			}
			
			if(state.rotation && (this.state.rotation == null || state.rotation.x != this.state.rotation.x || state.rotation.y != this.state.rotation.y || state.rotation.z != this.state.rotation.z)){ 
				//newState.rotation = state.rotation //limit output
				//console.log("rotation called!")
				//console.log("state.rotation.x")
				//console.log(state.rotation.x)
				
				if(this.lensMesh){
					//console.log("lens Meshed is good")
					
					this.lensMesh.rotation.set(0,0,0)
					let mat = new THREE.Matrix4();

					mat.makeRotationY(state.rotation.z); //roll
					this.lensMesh.applyMatrix4(mat);
					mat.makeRotationX(state.rotation.y + this.state.orientationX); //tilt
					this.lensMesh.applyMatrix4(mat);
					mat.makeRotationY(-state.rotation.x); //pan
					this.lensMesh.applyMatrix4(mat);

					if(!this.lensMesh.initLookAt){
						this.views.forEach((view)=>{
							view.recenter()
						})
						this.lensMesh.initLookAt = true
					}
				}
				if(this.state.limitViews != "off"){
					newState.limitViews = state.limitViews = "off" //turn off limit views when their is stabilisation
				}
			}
			if(state.wireframe != null){
				newState.wireframe = state.wireframe 
			}
			
			//Apply state
			Object.assign(this.state, state)
			
			if((newState.wireframe != null || newState.RPL || newState.calibration || newState.widthSegments) && this.state.RPL != "auto"){
				this.createLens(this.state.RPL, this.state.calibration)
				this.views.forEach((view)=>{
					view.recenter()
				})
			}	
		
			if(Object.keys(newState).length > 0 && this.state.onStateChange != null){
				//working delete:
				//console.log(this.state["GPS"]);
				delete this.state["CameraLocationDescription"];
				delete this.state["CameraModel"];
				//delete this.state["CameraFixedOrientation"]; not this one, we need this value
				delete this.state["DeviceOrientation"];
				//delete this.state["ACSvalues"]; not this one, we need this value
				//delete this.state["RPL"]; not this one, we need this value
				delete this.state["TravelSpeed"];
				delete this.state["Timestamp"];
				delete this.state["VirtualCameraEntryPoint"];
				delete this.state["VirtualCameraViewPoint"];
				delete this.state["FOV"];
				delete this.state["Acceleration"];
				delete this.state["Speed"];
				delete this.state["PulseRate"];
				delete this.state["NavigationType"];
				delete this.state["FOVMinorAxis"];
				delete this.state["FOVMajorAxis"];
				delete this.state["Version"];
				delete this.state["OriginalImageResolution"];
				delete this.state["Copyright"];
				delete this.state["DeviceTranslation"];
				delete this.state["ViewType"];
				delete this.state["CalibrationRotation"];
				delete this.state["CalibrationTranslation"];
				delete this.state["BlendAngle"];
				delete this.state["CCLSC_B2B"];
				delete this.state["FrameStruture"];
				delete this.state["Exposure"];
				delete this.state["FrameID"];
				delete this.state["Timestamp32"];
				delete this.state["GPS"];
				delete this.state["Assembling"];
				delete this.state["CameraRotationQuaternion"];
				delete this.state["FrameDataInfo"];
				delete this.state["MultiSyncGyroscopeInfo"];
				delete this.state["MultiSyncRotationVectorInfo"];
				delete this.state["DynamicMarker"];
				delete this.state["TurnSignal"];
				delete this.state["Timestamp"];

				this.state.onStateChange(newState, this.state)
			}

			if(newState.limitViews || newState.orientation){
				if(this.lensMesh){
					this.lensMesh.rotation.set(this.state.orientationX,0,0)
					//console.log("lfds")
					this.RotateMesh()
				}

				this.views.forEach((view)=>{
					//view.recenter()
					view.calculateFovLimits()
				})
			}
		}
		this.RotateMesh = () => {
			if(state.rotation && this.state.rotation != null)
			{
				if(this.lensMesh){
					//console.log("lens Meshed is good")
					//console.log(state.rotation.x)
					this.lensMesh.rotation.set(0,0,0)
					let mat = new THREE.Matrix4();

					mat.makeRotationY(state.rotation.z); //roll
					this.lensMesh.applyMatrix4(mat);
					mat.makeRotationX(state.rotation.y + this.state.orientationX); //tilt
					this.lensMesh.applyMatrix4(mat);
					mat.makeRotationY(-state.rotation.x); //pan
					this.lensMesh.applyMatrix4(mat);

					if(!this.lensMesh.initLookAt){
						this.views.forEach((view)=>{
							view.recenter()
						})
						this.lensMesh.initLookAt = true
					}
				}
				if(this.state.limitViews != "off"){
					newState.limitViews = state.limitViews = "off" //turn off limit views when their is stabilisation
				}
			}
		}
		
		this.FillTagArray = (result,length,lengthConstraint,tagInfoLength) => {
			
			//GetTagLength(int maxHex, char *value, int *length)
			var maxHex = 1;
			let tagLength=tagInfoLength;
			if (lengthConstraint != 2)
			{
				result = result.substr(maxHex, length-1);
				tagLength = parseInt(tagLength, 36);	
			}
			//console.log("tagLength: " + tagLength);	

			var tagInfo = new ArrayBuffer(tagLength);

			let n = 0;
			let bLeft = length;
			var incValue=0;
			
			do
			{
				let v = result.substr(incValue,Math.min(bLeft, 7));
				bLeft -= 7;
				incValue += 7;
				let r =  parseInt(v, 36);
				
				let nbEl = Math.min(4, tagLength - n);
				//console.log("nbEl: "+nbEl+"   tagLength:"+tagLength+"   n:"+n);
				
				for (var a = nbEl - 1; a >= 0; a--)
				{
					//if (n+a<tagLength)
					{
						//console.log("boucle"+ n+a);
						//(_tagInfo.base40Data)[n + a] = (r & 0x000000ff);
						tagInfo[n+a] = (r & 0x000000ff);
						
						//console.log("tagInfo[n+a]:",tagInfo[n+a]);
						r = r >> 8;
					}
					//   break;
				}
				n += 4;
				//console.log("bLeft: " + bLeft);	
			} while (bLeft > 0);
			
			return tagInfo;
		}
		
		this.convertTag40DataToLongLong = (tagInfo) => {
			//https://stackoverflow.com/questions/42699162/javascript-convert-array-of-4-bytes-into-a-float-value-from-modbustcp-read
			//a partir de 4 valeurs on transform en float:

			var buf = new ArrayBuffer(8);
			var view = new DataView(buf);
			view.setUint8(0, tagInfo[7]);
			view.setUint8(1, tagInfo[6]);
			view.setUint8(2, tagInfo[5]);
			view.setUint8(3, tagInfo[4]);
			view.setUint8(4, tagInfo[3]);
			view.setUint8(5, tagInfo[2]);
			view.setUint8(6, tagInfo[1]);
			view.setUint8(7, tagInfo[0]);
			return Number(view.getBigInt64(0));
		}
		
		this.convertTag40DataToFloat = (tagInfo,nbValueInsideTag) => {
			//https://stackoverflow.com/questions/42699162/javascript-convert-array-of-4-bytes-into-a-float-value-from-modbustcp-read
			//a partir de 4 valeurs on transform en float:
			
			var bufferOut = new Array(nbValueInsideTag);
			
			var buf = new ArrayBuffer(4);
			var view = new DataView(buf);
			
			var nbInc = 4*nbValueInsideTag-1;
			
			for (var i=0;i<nbValueInsideTag;i++)
			{
				view.setUint8(0, tagInfo[nbInc--]);
				view.setUint8(1, tagInfo[nbInc--]);
				view.setUint8(2, tagInfo[nbInc--]);
				view.setUint8(3, tagInfo[nbInc--]);
				//console.log("view:",view);
				bufferOut[i] = view.getFloat32(0);
			}
			return bufferOut;
		}
		
		this.convertTag40DataToUint = (tagInfo) => {

			var buf = new ArrayBuffer(4);
			var view = new DataView(buf);
			view.setUint8(0, tagInfo[3]);
			view.setUint8(1, tagInfo[2]);
			view.setUint8(2, tagInfo[1]);
			view.setUint8(3, tagInfo[0]);

			let value = Number(view.getUint32(0));
			return value;
		}
		
		this.convertTag40DataToChar = (tagInfo) => {
				
			//console.log("tagInfo:",tagInfo);
			//https://stackoverflow.com/questions/14028148/convert-integer-array-to-string-at-javascript
			for (var i=0, l=tagInfo.length, value='', c; c = tagInfo[i++];)
				value += String.fromCharCode(
					c > 0xdf && c < 0xf0 && i < l-1
						? (c & 0xf) << 12 | (tagInfo[i++] & 0x3f) << 6 | tagInfo[i++] & 0x3f
					: c > 0x7f && i < l
						? (c & 0x1f) << 6 | tagInfo[i++] & 0x3f
					: c
				);
			//console.log("value:",value);
			return value;
		}
	
		this.createLensGeometry = (radius = 500, widthSegments = 46, disto, calibration) => {
			const ellipseRotation = calibration.r
			const ellipseWidth = calibration.w / 100
			const ellipseHeight =  calibration.h / 100
			const ellipseCenterX = calibration.x / 100
			const ellipseCenterY = 1-(calibration.y / 100)
			//console.log("ellipseCenterY:",ellipseCenterY);
			const geometry = new THREE.SphereBufferGeometry();
			geometry.radius = 1;
			geometry.type = "ImmervisionGeometry";
			//Panomorph paraneters--------------
			const nbDistortionPts = disto.length / 3;
			const lastXValue = disto[disto.length - 1];
			const lastYValue = disto[disto.length - 2];
			let ix, iy;
			let index = 0;
			const grid = [];
			const vertex = new THREE.Vector3();
			const normal = new THREE.Vector3();
			// buffers
			const indices = [];
			const vertices = [];
			const normals = [];
			const uvs = [];
			
			let ratioFoV = 1;
			if(state.RPL[0] == "E" && state.RPL[1] == "0"){
					let RPLFov = state.RPL.slice(2,5);
					let forcedFov = Number(RPLFov);
					ratioFoV = forcedFov/180;
				}

			this.lenLimit = disto[(nbDistortionPts-1) * 3]*ratioFoV
			//console.log("set lenLimit:", this.lenLimit)
				
			// generate vertices, normals and uvs
			for (iy = 0; iy <= nbDistortionPts; iy++) {
				let verticesRow = [];
				let v = disto[iy * 3] * ratioFoV * Math.PI / 180;
				for (ix = 0; ix <= widthSegments; ix++) {
					
					//beta
					let u = ix * Math.PI * 2 / widthSegments;
					
					// vertex
					vertex.x = -radius * Math.cos(u + ellipseRotation) * Math.sin(v);
					vertex.y = radius * Math.cos(v);
					vertex.z = radius * Math.sin(u + ellipseRotation) * Math.sin(v);
					vertices.push(vertex.x, vertex.y, vertex.z);

					//add distortion
					let srcX = Math.cos(u) * (disto[iy * 3 + 2] / lastXValue);
					let srcY = Math.sin(u) * (disto[iy * 3 + 1] / lastYValue);
					let xx = srcX * (ellipseWidth / 2);
					let yy = srcY * (ellipseHeight / 2);
					let Ucoord = xx * Math.cos(ellipseRotation) - yy * Math.sin(ellipseRotation) + ellipseCenterX;
					let Vcoord = xx * Math.sin(ellipseRotation) + yy * Math.cos(ellipseRotation) + ellipseCenterY;
				
					// normal
					normal.set(vertex.x, vertex.y, vertex.z).normalize();
					normals.push(normal.x, normal.y, normal.z);
					
					//UV
					//Ucoord = Ucoord / ellipseWidth;
					//Vcoord = Vcoord / ellipseHeight;
					uvs.push(Ucoord, Vcoord);

					verticesRow.push(index++);
				}
				grid.push(verticesRow);
			}
			// indices
			for (iy = 0; iy < nbDistortionPts; iy++) {
				for (ix = 0; ix < widthSegments; ix++) {
					let a = grid[iy][ix + 1];
					let b = grid[iy][ix];
					let c = grid[iy + 1][ix];
					let d = grid[iy + 1][ix + 1];
					indices.push(a, b, d);
					indices.push(b, c, d);
				}
			}
			// build geometry
			geometry.setIndex(indices);
			geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
			geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
			geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));

			return geometry
		};
	
		this.createLens = (RPL, calibration) =>{
			//console.log("createLens:", RPL, calibration, this.textureCanvas.width)
			let RPLData = RPLDATA[RPL]
			if(RPLData == null){
				//console.log("RPLData:", RPLData)
				for(var i = 4; i>=2;i--){//Search RPL if not found
					RPLData = RPLDATA[RPL.substr(0,i)]
					//console.log("RPLData:", RPL.substr(0,i))
					if(RPLData){
						continue;
					}
				}
			

				if(RPLData == null){
					console.error("RPL not found:", RPL)
					return
				}
			}

			const geometry = this.createLensGeometry(500, this.state.widthSegments, RPLData, calibration).toNonIndexed();

			geometry.scale(-1, 1, 1);

			const material = new THREE.MeshBasicMaterial({
				map: this.texture
			});

			
			//remove old lens
			this.scene.remove(this.lensMesh)

			this.lensMesh = new THREE.Mesh(geometry, material); 
			this.lensMesh.rotation.set(this.state.orientationX,0,0)

			this.scene.add(this.lensMesh);
			
			if(this.state.wireframe){
				var wireframe = new THREE.WireframeGeometry( geometry );
				var line = new THREE.LineSegments( wireframe );
				line.material.depthTest = false;
				line.material.opacity = 0.2;
				line.material.transparent = true;
				this.lensMesh.add( line );
			}
			
			this.RotateMesh();
		}
			
		this.onVideoLoaded=(event)=>{
			this.textureCanvas.width = this.video_html.videoWidth;
			this.textureCanvas.height = this.video_html.videoHeight;
			//start the loop
			if(this.video_html.requestVideoFrameCallback){
				this.video_html.requestVideoFrameCallback(this.onVideoFrame)
			}else{
				requestAnimationFrame(this.onVideoFrame)
			}	
		}
		
		this.onVideoFrame=(now, metadata)=>{
			//Firefox hack to not process the same frame and skip the first frame of a new video
			if(!this.video_html.requestVideoFrameCallback && (this.video_html.lastTime||0) === this.video_html.currentTime){
				requestAnimationFrame(this.onVideoFrame)
				return
			}
			

			this.textureContext.drawImage(this.video_html, 0, 0, this.textureCanvas.width, this.textureCanvas.height);
			//hack...doouble texture copy
			if(this.views.length > 1){
				this.texture.needsUpdate = true
			}
			try{
				this.processQrCodeTexture()
			}catch(e){
				console.warn(e);
			}
			if(this.video_html.requestVideoFrameCallback){
				this.video_html.requestVideoFrameCallback(this.onVideoFrame)
			}else{
				this.video_html.lastTime = this.video_html.currentTime
				requestAnimationFrame(this.onVideoFrame)
			}
			
			if(this.state.onVideoFrame){
				this.state.onVideoFrame(now, metadata)
			}
		}
				
		this.update3dViews = () =>{
			this.views.forEach((view)=>{view.render()})
			requestAnimationFrame(this.update3dViews);
		}
		

		this.processWebglQrCodeTexture = () =>{
			//update texture NOW! (replace -> this.texture.needsUpdate = true;)
			this.webglContext.activeTexture(this.webglContext.TEXTURE0 );
			this.webglContext.bindTexture(this.webglContext.TEXTURE_2D, this.webglTexture.__webglTexture);
			this.webglContext.texImage2D(this.webglContext.TEXTURE_2D, 0, this.webglContext.RGBA, this.webglContext.RGBA, this.webglContext.UNSIGNED_BYTE, this.textureCanvas);

			let framebuffer = this.webglContext.createFramebuffer();
			this.webglContext.bindFramebuffer(this.webglContext.FRAMEBUFFER, framebuffer);
			this.webglContext.framebufferTexture2D(this.webglContext.FRAMEBUFFER, this.webglContext.COLOR_ATTACHMENT0, this.webglContext.TEXTURE_2D, this.webglTexture.__webglTexture, 0);
			
			this.webglContext.bindFramebuffer(this.webglContext.FRAMEBUFFER, null);
			
			this.webglContext.bindFramebuffer(this.webglContext.FRAMEBUFFER, framebuffer);

			let data = new Uint8Array(this.state.QrCodeRect.w * this.state.QrCodeRect.h * 4);
			this.webglContext.readPixels(this.state.QrCodeRect.x, this.state.QrCodeRect.y, this.state.QrCodeRect.w, this.state.QrCodeRect.h, this.webglContext.RGBA, this.webglContext.UNSIGNED_BYTE, data);
			let imageData = new ImageData(new Uint8ClampedArray(data), this.state.QrCodeRect.w, this.state.QrCodeRect.h);
			this.webglContext.bindFramebuffer(this.webglContext.FRAMEBUFFER, null);

			if(this.webglContext.getError()){
				return
			}
			return imageData
		}
		
		this.parseQrCode = (result)=>{
			
			const newState = {}

			let idx = 0
			let subCnt = 3;
			let precisionInfoCnt = 3;

			const markType = result.substr(idx, subCnt);
			if(markType == "IVO"){
				console.warn("IVO RPL not supported!")
			}else if(markType == "IVE"){
				//console.log(result);
				idx += subCnt;
				subCnt = 2;
				let markInfo = parseInt(result.substr(idx, subCnt), 36);
				
				if (16 & markInfo) {
					precisionInfoCnt = 4;
				}
				
				
				if (1 & markInfo) {
					idx += subCnt;
					subCnt = 5;
					
					if(this.state.RPL == "auto"){
						newState.RPL = result.substr(idx, subCnt)
						//console.log("parseQrCode:", newState.RPL)
					}
				}
				if (2 & markInfo) {
					idx += subCnt;
					subCnt = precisionInfoCnt;
					
					let valueAvg = 2.0475;
					let mult = 0.001;
					if (precisionInfoCnt == 4){
						valueAvg = 3.27675;
						mult = 0.0001;
					}

					let x = 100 * (parseInt(result.substr(idx, subCnt), 36) * mult - valueAvg + 1)/2;
					idx += subCnt;
					let y = 100 * (parseInt(result.substr(idx, subCnt), 36) * mult - valueAvg +1 )/2;
					idx += subCnt;
					let w = parseInt(result.substr(idx, subCnt), 36) * mult * 100;
					idx += subCnt;
					let h = parseInt(result.substr(idx, subCnt), 36) * mult * 100;
					idx += subCnt;
					let r = THREE.Math.degToRad(parseInt(result.substr(idx, subCnt), 36) * mult);
					
					newState.calibration = {
						x:x,
						y:y,
						w:w,
						h:h,
						r:r
					}
				}

				if (4 & markInfo) {
					idx += subCnt;
					subCnt = 1;
					if(this.state.orientation == "auto"){
						let direction = parseInt(result.substr(idx, subCnt));
						newState.orientation = IVEViewer.ORIENTATIONID[direction]
					}
				}
				
				if (8 & markInfo) {
					idx += subCnt;
					subCnt = precisionInfoCnt;
					let precision = .1;
			
					if (precisionInfoCnt == 4){
						precision = 1/4600;
					}

					let x = THREE.Math.degToRad(precision * parseInt(result.substr(idx, subCnt), 36));
					idx += subCnt;
					let y = THREE.Math.degToRad(precision * parseInt(result.substr(idx, subCnt), 36));
					idx += subCnt;
					let z = THREE.Math.degToRad(precision * parseInt(result.substr(idx, subCnt), 36));
					
					newState.rotation = {
						x:x,
						y:y,
						z:z
					}
				}
				
				
				//----------
				//From here, each tags need to be read separately
				idx += subCnt;
				subCnt = 3;
				var notFinished = true;
				var tagnumber=1;

				//console.log("---------------");
				while (notFinished)
				{
					subCnt = 3;
					let newTag = result.substr(idx, subCnt);

					//console.log("tag "+tagnumber + ": \"" + newTag+"\"");
					//console.log("idx: "+ idx + "  subCnt: "+ subCnt);
					
					tagnumber++;
					
					//console.log("tagList: " + IVEViewer.tagList[newTag].name + "  size:" + IVEViewer.tagList[newTag].size + "  length:" + IVEViewer.tagList[newTag].LengthConstraint);

					switch(newTag){
						case "000":
						case "001":
						case "002":
						case "003":
						case "004":
						case "005":
						case "006":
						case "007":
						case "008":
						case "009":
						case "00A":
						case "00B":
						case "00C":
						case "00D":
						case "00E":
						case "00F":
						case "00G":
						case "00I":
						case "00K":
						case "00L":
						case "00M":
						case "00N":
						case "00O":
						case "00P":
						case "00Q":
						case "00U":
						case "00V":
						case "00W":
						case "00X":
						case "030":
						case "040":
						case "IV0":
						{
							var tagInfoLength = IVEViewer.tagList[newTag].size;
							var nbValueInsideTag = IVEViewer.tagList[newTag].nbValue;
							
							idx += subCnt;
							var positionChaine = idx;
							var l=0;
							let value = "";
							
							//console.log("tagList: " + IVEViewer.tagList[newTag].name + "  size:" + IVEViewer.tagList[newTag].size + "  lengthConst:" + IVEViewer.tagList[newTag].LengthConstraint+ "  type:" + IVEViewer.tagList[newTag].type+"   nbValueInsideTag:"+nbValueInsideTag);
							
							while(positionChaine < result.length && result[positionChaine] != '%')
							{
								positionChaine++;
								l++;
							}
							
							if ((result[positionChaine] == '%' && l > 0) || (positionChaine == result.length && l > 0))
							{
								//FillTagArray(value, l);
								//_subTags[6]->FillTagArray(value, 7);
								value = result.substr(idx, l);
							}
							//console.log("value: " + value);

							var tagInfo = this.FillTagArray(value,l,IVEViewer.tagList[newTag].LengthConstraint,tagInfoLength);
							var stringOut;
							
							//console.log(IVEViewer.tagList[newTag].type);
							if (IVEViewer.tagList[newTag].type=="longlong")
							{
								//console.log("longlong function called");
								stringOut = this.convertTag40DataToLongLong(tagInfo);
							}
							else if (IVEViewer.tagList[newTag].type=="char")
							{
								//console.log("char function called");
								stringOut = this.convertTag40DataToChar(tagInfo);
							}
							else if (IVEViewer.tagList[newTag].type=="uint")
							{
								//console.log("uint function called");
								stringOut = this.convertTag40DataToUint(tagInfo);
							}
							else if (IVEViewer.tagList[newTag].type=="float")
							{
								//console.log("float function called");
								stringOut = this.convertTag40DataToFloat(tagInfo,nbValueInsideTag);
							}

							newState[IVEViewer.tagList[newTag].name] = stringOut;

							//console.log(IVEViewer.tagList[newTag].name+": " + stringOut);
							
							idx = positionChaine;
							idx++;

							break;
						}
						
						case "00T"://CCLSC_B2B
						{
							var val = new Array(5);
							
							idx += subCnt;
							
							for (var i=0;i<5;i++)
							{
								subCnt = 2;
								val[i] = parseInt(result.substr(idx, subCnt), 36);
								idx += subCnt;
							}
							
							newState[IVEViewer.tagList[newTag].name] = val;
							
							//le tag finit par % du coup on rajoute 1
							subCnt = 1;
							idx += subCnt;
							
							break;
						}
						
						case "010":
						{
							//GPS
							let altitude = null;
							let altitudeRef = "false";
							let direction = null;
							let directionRef = "false";
							let longitude = null;
							let longitudeRef = "false";
							let latitude = null;
							let latitudeRef = "false";
							
							//les 2 premieres valeurs indiquent ce qu´il y aura dedans
							idx += subCnt;
							subCnt = 2;
							let valueType = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							//console.log("GPSInfo:",GPSInfo)
							
							if (1 & valueType) 
								directionRef = "M";
							else
								directionRef = "T";
							valueType = valueType>>1;
							if (1 & valueType) 
								altitudeRef = "1";
							else
								altitudeRef = "0";
							valueType = valueType>>1;
							if (1 & valueType) 
								latitudeRef = "N";
							else
								latitudeRef = "S";
							valueType = valueType>>1;
							if (1 & valueType) 
								longitudeRef = "E";
							else
								longitudeRef = "W";
					
							valueType = valueType>>1;
							if (valueType & 1) //on a une valeur de direction
							{
								idx += subCnt;
								subCnt = 7;
								let value = result.substr(idx, subCnt);
								let r =  parseInt(value, 36);
								const buffer = new ArrayBuffer(4);
								var dv = new DataView(buffer,0);
								dv.setUint32(0, r,true);//true veut dire bigendian
								direction = dv.getFloat32(0);
							}
							valueType = valueType >> 1;
							//indexTag = _subTags[5]->GetIndexTagInBaseArray();
							if (valueType & 1) //on a une valeur de altitude
							{
								idx += subCnt;
								subCnt = 7;
								let value = result.substr(idx, subCnt);
								let r =  parseInt(value, 36);
								const buffer = new ArrayBuffer(4);
								var dv = new DataView(buffer,0);
								dv.setUint32(0, r,true);//true veut dire bigendian
								altitude = dv.getFloat32(0);
							}
							valueType = valueType >> 1;
							//indexTag = _subTags[6]->GetIndexTagInBaseArray();
							if (valueType & 1) //on a une valeur de latitude
							{
								idx += subCnt;
								subCnt = 7;
								let value = result.substr(idx, subCnt);
								let r =  parseInt(value, 36);
								const buffer = new ArrayBuffer(4);
								var dv = new DataView(buffer,0);
								dv.setUint32(0, r,true);//true veut dire bigendian
								latitude = dv.getFloat32(0);
							}
							valueType = valueType >> 1;
							//indexTag = _subTags[7]->GetIndexTagInBaseArray();
							if (valueType & 1) //on a une valeur de longitude
							{
								idx += subCnt;
								subCnt = 7;
								let value = result.substr(idx, subCnt);
								let r =  parseInt(value, 36);
								const buffer = new ArrayBuffer(4);
								var dv = new DataView(buffer,0);
								dv.setUint32(0, r,true);//true veut dire bigendian
								longitude = dv.getFloat32(0);
							}
							
							newState[IVEViewer.tagList[newTag].name] = {
								Altitude:altitude,
								AltitudeRef:altitudeRef,
								Direction:direction,
								DirectionRef:directionRef,
								Longitude:longitude,
								LongitudeRef:longitudeRef,
								Latitude:latitude,
								LatitudeRef:latitudeRef
							}
							
							//le tag finit par % du coup on rajoute 1
							idx += subCnt;
							subCnt = 1;
							
							break;
						}
						
						case "020"://Assembling
						{
							let assemblyLayoutFormat = 1;
							let assemblyLayoutNbColumns = 1;
							let assemblyLayoutNbLines = 1;
							let assemblyImageIndex = 0;
							
							idx += subCnt;
							
							subCnt = 1;
							let value = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							assemblyLayoutFormat = value;
							idx += subCnt;
							
							subCnt = 1;
							value = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							assemblyLayoutNbColumns = value;
							idx += subCnt;
							
							subCnt = 1;
							value = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							assemblyLayoutNbLines = value;
							idx += subCnt;
							
							subCnt = 1;
							value = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							assemblyImageIndex = value;
							idx += subCnt;
							
							newState[IVEViewer.tagList[newTag].name] = {
								assemblyLayoutFormat:assemblyLayoutFormat,
								assemblyLayoutNbColumns:assemblyLayoutNbColumns,
								assemblyLayoutNbLines:assemblyLayoutNbLines,
								assemblyImageIndex:assemblyImageIndex
							}
							

							//le tag finit par % du coup on rajoute 1
							subCnt = 1;
							idx += subCnt;
							
							
							break;
						}
						case "041"://MultiSyncGyroscopeInfo
						{
							//pour le moment on le lit pas, on parcours la chaine jusqu´au prochain tag
							idx += subCnt;

							var positionChaine = idx;
							var l=0;
							
							while(positionChaine < result.length && result[positionChaine] != '%')
							{
								positionChaine++;
								l++;
							}
							l++;
							//console.log(""+result[positionChaine-1]+" "+result[positionChaine]+" "+result[positionChaine+1]+" "+result[positionChaine+2]+" "+result[positionChaine+3]);
							
							//le tag finit par % du coup on rajoute 1
							subCnt = 1;
							idx += l;
							
							break;
						}
						case "042"://MultiSyncRotationVectorInfo
						{
							//pour le moment on le lit pas, on parcours la chaine jusqu´au prochain tag
							idx += subCnt;

							var positionChaine = idx;
							var l=0;
							
							while(positionChaine < result.length && result[positionChaine] != '%')
							{
								positionChaine++;
								l++;
							}
							l++;
							
							subCnt = 1;
							idx += l;
							break;
						}
						case "050":
						{
							idx += subCnt;
							//DynamicMarker
							let dynamicMarkerVersion = 0;
							let dynamicMarkerPosition = 0;
							//let dynamicMarkerSizeW = 0;
							let dynamicMarkerSizeH = 0;
							
							
							//on sait qu´il y aura 1 float et 2 unsigned char
							let value =0;
							{
								//voila les 2 floats
								
								subCnt = 7;
								value = result.substr(idx, subCnt);
								//console.log(value);								
								//let v = value.substr(0,Math.min(bLeft, 7));
								let r =  parseInt(value, 36);
								const buffer = new ArrayBuffer(4);
								var dv = new DataView(buffer,0);
								dv.setUint32(0, r,true);//true veut dire bigendian
								dynamicMarkerSizeH = dv.getFloat32(0);
								idx += subCnt;
								
								//console.log(dynamicMarkerSizeH);
							}

							//et les 2 unsigned char
							
							subCnt = 1;
							value = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							dynamicMarkerVersion = value;
							idx += subCnt;
							
							subCnt = 1;
							value = parseInt(result.substr(idx, subCnt), 36); //int valueType = (int)(Hex2dec(type2));
							dynamicMarkerPosition = value;
							idx += subCnt;
							
							if (dynamicMarkerVersion==0)//si la version est 0 on ne lit que la taille verticale
							{
								newState[IVEViewer.tagList[newTag].name] = {
									DynamicMarkerSizeH:dynamicMarkerSizeH,
									DynamicMarkerVersion:dynamicMarkerVersion,
									DynamicMarkerPosition:dynamicMarkerPosition
								}
							}
							else
							{
								newState[IVEViewer.tagList[newTag].name] = {
									DynamicMarkerSizeW:dynamicMarkerSizeW,
									DynamicMarkerSizeH:dynamicMarkerSizeH,
									DynamicMarkerVersion:dynamicMarkerVersion,
									DynamicMarkerPosition:dynamicMarkerPosition
								}
							}
							
							//le tag finit par % du coup on rajoute 1
							idx += subCnt;
							subCnt = 1;
							break;
						}

						default:
						{
							//console.log("notFinished FALSE");
							notFinished = false;
						}
						
					}
				}
				//console.log(notFinished);
				//----------
				
				
				if(Object.keys(newState).length > 0){
					this.setState(newState)
				}
			}

			if(this.state.onQrCode){
				this.state.onQrCode(result, newState)
			}
			
			
		}
		this.getVersion = () => {
			//use env variable?
			return "1.4.1";
		}
		this.destroy = ()=>{
			console.warn("Destroying Player instance: You still need to remove any references to this instance from your code!");
			this.video_html.pause();
			this.video_html.removeAttribute('src'); 
			this.video_html.load();
			this.video_html.remove()
			this.video_html = null
			this.textureCanvas.remove()
			this.textureCanvas = null
			this.views.forEach((view)=>{view.destroy()})
			this.views = []
		}
		
		
		this.views = []
		
		this.textureCanvas = document.createElement('canvas');
		this.textureCanvas.crossOrigin = 'anonymous';
		this.textureContext = this.textureCanvas.getContext('2d', { alpha: false })
		this.textureContext.imageSmoothingEnabled = false
		
		this.texture = new THREE.Texture(this.textureCanvas);
		this.texture.format = THREE.RGBFormat;
		this.texture.minFilter = THREE.LinearFilter
		
		this.scene = new THREE.Scene();
	
		this.setState(state)

		if(viewOptions.target){
			if(viewOptions.view == "perimeter"){
				this.view = new PerimeterView(viewOptions.target, this, viewOptions)
			}else{
				this.view = new PerspectiveView(viewOptions.target, this, viewOptions)
			}
		}else{
			console.error("target parameter is required! stopping...")
			return
		}
		
		//WebGL imageData cropping
		try{
			if(!this.lensMesh){
				//dummy mesh creation to load texture to GPU, initTexture doesn't work!!!!
				const material = new THREE.MeshBasicMaterial({
					map: this.texture
				});
				const geometry = new THREE.BoxGeometry( 1, 1, 1 );
				this.lensMesh = new THREE.Mesh(geometry, material);
				this.lensMesh.visibility = false
				if(this.view.scene){//PerimeterView
					this.view.scene.add( this.lensMesh );
				}else{
					this.scene.add( this.lensMesh );
				}
				this.RotateMesh();
			}
			
			
			//this.views[0].renderer.initTexture(this.texture)
			this.webglContext = this.view.renderer.getContext()
			this.webglTexture = this.view.renderer.properties.get( this.texture );
			this.texture.needsUpdate = true; //init texture2d
		}catch(e){
			console.warn("WebGL imageData cropping:",e)
		}
		
		
		this.update3dViews() //start main loop
	}
}

IVEViewer.ORIENTATION = {
	GROUND: 0,
	CEILING: Math.PI,
	WALL: -Math.PI/2
}
IVEViewer.ORIENTATIONID = ["auto","CEILING","GROUND","WALL"]

IVEViewer.eLengthConstraint = {LENGTH_GREATER_OR_EQUAL:0,LENGTH_LOWER_OR_EQUAL:1,LENGTH_EQUAL:2};

IVEViewer.tagList = {
	"000":{name: "CameraLocationDescription",	LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL,nbValue:1, type:"char", 	size:25},
	"001":{name: "CameraModel", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL,nbValue:1, type:"char",	size:25},
	"002":{name: "CameraFixedOrientation", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint", 	size:4},
	"003":{name: "DeviceOrientation", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"004":{name: "ACSvalues", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:5,	type:"float",	size:5},
	"005":{name: "RPL", 						LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:5,	type:"char",	size:5},
	"006":{name: "TravelSpeed", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"007":{name: "Timestamp", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"longlong",size:8},
	"008":{name: "VirtualCameraEntryPoint", 	LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"009":{name: "VirtualCameraViewPoint", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"00A":{name: "FOV", 						LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"00B":{name: "Acceleration", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"00C":{name: "Speed", 						LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"00D":{name: "PulseRate", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
	"00E":{name: "NavigationType", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
	"00F":{name: "FOVMinorAxis", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"00G":{name: "FOVMajorAxis", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"00I":{name: "Version", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"int",		size:4},
	"00K":{name: "OriginalImageResolution", 	LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:2,	type:"uint",	size:8},
	"00L":{name: "Copyright", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL,nbValue:1,	type:"char",	size:25},
	"00M":{name: "DeviceTranslation", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"00N":{name: "ViewType", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
	"00O":{name: "CalibrationRotation", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"00P":{name: "CalibrationTranslation", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"00Q":{name: "BlendAngle", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"00T":{name: "CCLSC_B2B", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:10,	type:"char",	size:10},
																														   
	"00U":{name: "FrameStruture", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:0,	type:"",		size:0},
	"00V":{name: "Exposure", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
	"00W":{name: "FrameID", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
	"00X":{name: "Timestamp32", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
																															
	"010":{name: "GPS", 						LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:0,	type:"",		size:0},
	"011":{name: "GPSLongitude", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"012":{name: "GPSLatitude", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"013":{name: "GPSAltitude", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"014":{name: "GPSDirection", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"015":{name: "GPSLongitudeRef", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
	"016":{name: "GPSLatitudeRef", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
	"017":{name: "GPSAltitudeRef", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
	"018":{name: "GPSDirectionRef", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
																																
	"020":{name: "Assembling", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:0,	type:"",		size:0},
	"021":{name: "assemblyLayoutFormat", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
	"022":{name: "assemblyLayoutNbColumns", 	LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
	"023":{name: "assemblyLayoutNbLines", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
	"024":{name: "assemblyImageIndex", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
																																
	"030":{name: "CameraRotationQuaternion", 	LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:4,	type:"float",	size:16},
																																
	"040":{name: "FrameDataInfo", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:3,	type:"float",	size:12},
	"041":{name: "MultiSyncGyroscopeInfo", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL,nbValue:3,	type:"custom", 	size:112},
	"042":{name: "MultiSyncRotationVectorInfo", LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL,nbValue:3,	type:"custom", 	size:112},
																															
	"050":{name: "DynamicMarker", 				LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:0,	type:"",		size:0},
	"051":{name: "DynamicMarkerSizeW", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"052":{name: "DynamicMarkerSizeH", 			LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"float",	size:4},
	"053":{name: "DynamicMarkerVersion", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
	"054":{name: "DynamicMarkerPosition", 		LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"char",	size:1},
																															
	"IV0":{name: "TurnSignal", 					LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_EQUAL, 		nbValue:1,	type:"uint",	size:4},
};
/*
IVEViewer.tagList = Array();
IVEViewer.tagList["000"] = {name: "CameraLocationDescription", LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL, size:25};
IVEViewer.tagList["001"] = {name: "CameraLocationDescription", LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL, size:25};
IVEViewer.tagList["007"] = {name: "CameraLocationDescription", LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL, size:25};
IVEViewer.tagList["010"] = {name: "CameraLocationDescription", LengthConstraint: IVEViewer.eLengthConstraint.LENGTH_LOWER_OR_EQUAL, size:25};*/

/**
 * Class of PerspectiveView
 */
export class PerspectiveView{
	/**
	 * Add a PerspectiveView to element
	 * @param {domElement} element domParent of the view
	 * @param {IVEViewer} player Player instance
	 * @param {object} [options]
	 * @param {radian} [options.minTiltAngle=-Math.PI/2] minimum tilt limit
	 * @param {radian} [options.maxTiltAngle=Math.PI/2] maximum tilt limit
	 * @param {radian} [options.minPanAngle] minimum pan limit
	 * @param {radian} [options.maxPanAngle] maximum pan limit
	 * @param {number} [options.minZoom=1] minimum zoom limit (fov)
	 * @param {number} [options.maxZoom=115] maximum zoom limit (fov)
	 * @return {PerspectiveView} view object
	 */
	constructor(element, player, options={}){
		this.element = element

		let initView = false;
		//console.log("set initView = false")
		this.minTiltAngle = options.minTiltAngle || -Math.PI/2; // radians
		this.maxTiltAngle = options.maxTiltAngle || Math.PI/2; // radians
		this.minPanAngle = options.minPanAngle || null; // radians
		this.maxPanAngle = options.maxPanAngle || null; // radians

		this.minZoom = options.minZoom || 1
		this.maxZoom = options.maxZoom || 115
		
		this.renderer = new THREE.WebGLRenderer({ antialias: true });	
		this.renderer.setPixelRatio( window.devicePixelRatio );

		let rect = element.getBoundingClientRect()

		this.renderer.setSize( rect.width, rect.height );


		this.camera = new THREE.PerspectiveCamera( 40, rect.width / rect.height, 1, 20000 );
		this.camera.position.z = 1;
		
		element.appendChild( this.renderer.domElement );

		this.render = () => {

			//console.log("render, initView=",this.initView)
			if (this.initView == false)
			{
				//console.log("initView = false")
				this.initView = true
				this.recenter();
			}
			if(this.showVideo){
				if(!this.showVideoCanvas){
					this.renderer.domElement.remove()
					element.appendChild(player.texture.image)
					player.texture.image.style = "max-width: 100%; max-height: 100%;"

					this.showVideoCanvas = true
				}
			}else{
				if(this.showVideoCanvas){
					player.texture.image.remove()
					element.appendChild( this.renderer.domElement );
					this.showVideoCanvas = false
				}
				this.renderer.render( player.scene, this.camera );
			}
			
		}		
		player.views.push(this)


		this.destroy = () =>{
			this.renderer.domElement.remove()
			this.renderer.dispose()
		}

		// controls
		// ---------------------------------------------------------------------------
		this.calculateFovLimits = ()=>{
			//console.log("Check lenLimit:", player.lenLimit)
			let fovLimits = player.state.limitViews == "auto" ? player.state.orientation : player.state.limitViews
			//console.log("fovLimits:", fovLimits)
			const verticalFovlimit = (player.lenLimit - 90 - this.camera.fov/2)  * Math.PI/180
			//console.log("verticalFovlimit:", verticalFovlimit)

			//defaults
			this.minTiltAngle = options.minTiltAngle || -Math.PI/2; // radians
			this.maxTiltAngle = options.maxTiltAngle || Math.PI/2; // radians
			this.minPanAngle = options.minPanAngle || null; // radians
			this.maxPanAngle = options.maxPanAngle || null; // radians
			
			//console.log("this.minTiltAngle:", this.minTiltAngle)
			//console.log("this.maxTiltAngle:", this.maxTiltAngle)
			

			if(fovLimits == "CEILING"){
				this.maxTiltAngle = verticalFovlimit
				//console.log("CEILING -> this.maxTiltAngle:", this.maxTiltAngle)
			}else if(fovLimits == "GROUND"){
				this.minTiltAngle = -verticalFovlimit
				//console.log("GROUND -> this.minTiltAngle:", this.minTiltAngle)
			}else if(fovLimits == "WALL"){
				//fix bug horizontal limit in wall
				//let horizontalFovlimit = verticalFovlimit * this.camera.aspect;//bug
				let horizontalFov = Math.atan( this.camera.aspect * Math.tan((this.camera.fov* Math.PI/180)/ 2) )
				this.minPanAngle = -player.lenLimit *Math.PI/180 + horizontalFov
				this.maxPanAngle =  player.lenLimit *Math.PI/180 - horizontalFov
				this.maxTiltAngle = Math.PI/2 + verticalFovlimit
				this.minTiltAngle = -Math.PI/2 - verticalFovlimit
			}
		}
		/**
		 * Rotate the camera relative
		 * @param {radian} tiltDelta 
		 * @param {radian} panDelta
		 * @returns {THREE.Euler} rotation of the camera
		 */
		this.rotate = (tiltDelta, panDelta)=>{
			//console.log("rotate")
			return this.setRotation(this.camera.rotation.x - tiltDelta, this.camera.rotation.y - panDelta)
		}
		/**
		 * Rotate the camera absolute
		 * @param {radian} tilt 
		 * @param {radian} pan 
		 * @returns {THREE.Euler} rotation of the camera
		 */
		this.setRotation = (tilt,pan)=>{
			//console.log("setRotation")
			this.calculateFovLimits()
			if(this.minTiltAngle != null && this.maxTiltAngle != null){
				tilt = Math.max(this.minTiltAngle, Math.min(tilt, this.maxTiltAngle));
			}
			if(this.minPanAngle != null && this.maxPanAngle != null){
				pan = Math.max(this.minPanAngle, Math.min(pan, this.maxPanAngle));
			}
			this.camera.rotation.set(tilt, pan, 0, "YXZ")
			return this.camera.rotation
		}
		/**
		 * Zoom the camera(fov) relative
		 * @param {number} zoomDelta 
		 * @returns {number} fov of the camera
		 */
		this.zoom = (zoomDelta)=>{
			//console.log("zoom")
			return this.setZoom(this.camera.fov*zoomDelta)
		}
		/**
		 * Zoom the camera(fov) absolute
		 * @param {number} zoom 
		 * @returns {number} fov of the camera
		 */
		this.setZoom = (zoom)=>{
			//console.log("setZoom")
			this.camera.fov =  Math.max(this.minZoom, Math.min(zoom, this.maxZoom))

			this.showVideo = zoom > this.maxZoom

			this.calculateFovLimits()
			this.setRotation(this.camera.rotation.x,this.camera.rotation.y)
			this.camera.updateProjectionMatrix()
			return this.camera.fov
		}
		/**
		 * Center the camera to the lens
		 */
		this.recenter = ()=>{
			this.setRotation((Math.PI*4+player.lensMesh.rotation.x )%Math.PI*2-Math.PI, player.lensMesh.rotation.z)
			//console.log("recenter")
		}

		// Event Listeners
		// -----------------------------------------------------------------------------
		this.onWindowResize =( event ) => {
			let rect = this.element.getBoundingClientRect()			
			this.resize(rect.width, rect.height)
		}
		this.resize = (width,height)=>{
			this.camera.aspect = width / height;
			
			this.camera.updateProjectionMatrix();
			this.renderer.setSize( width, height ); 
			this.render()
		}
		window.addEventListener( 'resize', this.onWindowResize, false );
		
		this.initView = false;
	}
}
/**
 * Class of the PerimeterView
 */
export class PerimeterView{
	/**
	 * Add a PerimeterView to element
	 * @param {domElement} element domParent of the view
	 * @param {IVEViewer} player Player instance
	 * @param {object} [options]
	 * @param {number} [options.minY=-350] lower y limit
	 * @param {number} [options.maxY=-157] upper y limit
	 * @param {radian} [options.minPanAngle] minimum pan limit
	 * @param {radian} [options.maxPanAngle] maximum pan limit
	 * @param {number} [options.minZoom=1] minimum zoom limit
	 * @param {number} [options.maxZoom=115] maximum zoom limit
	 * @return {PerspectiveView} view object
	 */
	constructor(element, player, options={}){
		//create a new scene and lens mesh with player.texture
		this.element = element

		this.minY = options.minY || -350;
		this.maxY = options.maxY || -157;
		this.minPanAngle = options.minPanAngle || null; // radians
		this.maxPanAngle = options.maxPanAngle || null; // radians
	
		this.minZoom = options.minZoom || 1
		this.maxZoom = options.maxZoom || 45
		
				
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio( window.devicePixelRatio );

		let rect = element.getBoundingClientRect()

		this.renderer.setSize( rect.width, rect.height );
		element.appendChild( this.renderer.domElement );

		this.camera_portal = new THREE.OrthographicCamera(  rect.width/-2, rect.width/2, rect.height/2, rect.height/-2, 0, 2000 );

		this.camera_portal.updateProjectionMatrix()
		this.scene = new THREE.Scene();
		this.camera = new THREE.Group();

		this.camera.position.y = -250

		let width = 35
		this.portal_height = 200
		let ratio = width/this.portal_height
		let fov = 35
		let cam_angle_h = fov * Math.PI/180 * ratio
		
		for (var i = -15; i <= 15;i++){
			let camera = new THREE.PerspectiveCamera(fov, ratio, 1, 2000 );
			camera.rotation.y =  i * cam_angle_h
			camera.updateMatrixWorld();
			camera.renderTarget = new THREE.WebGLRenderTarget( 1024, 1024 );

			let geometry = new THREE.PlaneGeometry( width, this.portal_height);

			const material = new THREE.MeshBasicMaterial({
				map: camera.renderTarget.texture
			});
			camera.planeMesh = new THREE.Mesh( geometry, material);
			
			camera.planeMesh.position.x = -i * width
	
			this.scene.add( camera.planeMesh );

			this.camera.add(camera)
			
			//player.scene.add( new THREE.CameraHelper( camera ) );
		}
	
		

		player.scene.add(this.camera) //to update the rotation
	
		this.render = () => {
			this.camera.children.forEach((camera) =>{
				this.renderer.setRenderTarget(camera.renderTarget);
				this.renderer.render(player.scene,  camera);
				this.renderer.setRenderTarget(null);
			})
			
			this.renderer.render( this.scene, this.camera_portal );
		}		
		player.views.push(this)
		
		this.destroy = () =>{
			this.renderer.domElement.remove()
			this.renderer.dispose()
		}

		// controls
		// ---------------------------------------------------------------------------


		this.calculateFovLimits = ()=>{
			//todo
			//this.maxY = ???
			this.setRotation(this.camera.position.y,this.camera.rotation.y)
		}

		/**
		 * Rotate/translate the camera relative
		 * @param {number} yDelata translate
		 * @param {radian} panDelta rotate
		 * @returns {object} {x:position.y, y:pan}
		 */
		this.rotate = (yDelta, panDelta)=>{
			return this.setRotation(this.camera.position.y - (yDelta*100), this.camera.rotation.y - panDelta)
		}
		/**
		 * Rotate/translate the camera absolute
		 * @param {number} y translate
		 * @param {radian} pan rotate
		 * @returns {object} {x:position.y, y:pan}
		 */
		this.setRotation = (y,pan)=>{ //note that in perimeter, the camera does't tilt, it translate on Y axis
			
			if(this.minY != null && this.maxY != null){
				y = Math.max(this.minY, Math.min(y, this.maxY));
			}
			if(this.minPanAngle != null && this.maxPanAngle != null){
				pan = Math.max(this.minPanAngle, Math.min(pan, this.maxPanAngle));
			}
			this.camera.position.y = y
			this.camera.rotation.set(0, pan, 0, "YXZ")
			return {
				x:y,
				y:pan
			}
		}
		/**
		 * Zoom the camera relative
		 * @param {number} zoomDelta 
		 * @returns {number} zoom of the camera
		 */
		this.zoom = (zoomDelta)=>{
			return this.setZoom(this.camera_portal.zoom/zoomDelta)
		}
		/**
		 * Zoom the camera absolute
		 * @param {number} zoom 
		 * @returns {number} zoom of the camera
		 */
		this.setZoom = (zoom)=>{
			this.camera_portal.zoom =  Math.max(this.minZoom, Math.min(zoom, this.maxZoom))
			this.calculateFovLimits()
			this.camera_portal.updateProjectionMatrix()
			return this.camera_portal.zoom
		}
		/**
		 * Center the camera to the lens
		 */
		this.recenter = ()=>{
			this.setRotation(-200, player.lensMesh.rotation.z)
		}

		// Event Listeners
		// -----------------------------------------------------------------------------
		this.onWindowResize = () => {
			let rect = this.element.getBoundingClientRect()			
			this.resize(rect.width, rect.height)
		}
		this.resize = (width,height)=>{
			this.camera_portal.left = width/-2
			this.camera_portal.right = width/2
			this.camera_portal.top = height/2;
			this.camera_portal.bottom = height/-2;

			this.minZoom = height/this.portal_height
			this.setZoom(this.camera_portal.zoom)
			
			this.camera_portal.updateProjectionMatrix();
  			this.renderer.setSize( width, height );
			this.render()
		}
		window.addEventListener( 'resize', this.onWindowResize, false );

		this.minZoom = rect.height/this.portal_height
		this.setZoom(rect.height/this.portal_height)
	}
}


class MarkingInterpreter{
	constructor(MarkingString){
	}
}
