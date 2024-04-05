
/**
 *  Class of the UX Control mouse and touchscreen
 *  Example code for controling the camera (not part of the SDK, not supported)
 *  Must overwrite this class for custom control, the SDK will load this file
 */
export class Control{
	/**
	 * The default UX Control mouse and touchscreen for views
	 * @param {domElement} domElement of container
	 * @param {object} [options] 
	 * @param {function} [options.onRotate=null] rotation callback(tiltDelta,panDelta)
     * @param {functoin} [options.onZoom=null] zoom callback (zoomDelta)
	 * @param {number} [option.deltaZoom=0.05] mouseWheel zoom incremental
	 */
	constructor(domElement, options={}){
		this.domElement = domElement;
		

		this.onZoom = options.onZoom;
		this.onRotate = options.onRotate;
		this.deltaZoom = options.deltaZoom || 0.05

		// domElement.style = " touch-action: none; "

		this.touchEvents = {}


		this.onPointerDown = (event) => {
			this.lastPointerX = event.pageX
			this.lastPointerY = event.pageY

			if(this.onZoom && event.pointerType == "touch"){
				this.touchEvents[event.pointerId] = event
				let touchs = Object.values(this.touchEvents)
				if(touchs.length == 2){
					this.lastPinchDistance = Math.hypot(touchs[0].pageX - touchs[1].pageX, touchs[0].pageY - touchs[1].pageY)
				}
			}

			this.domElement.ownerDocument.addEventListener("pointermove", this.onPointerMove, false)
			this.domElement.ownerDocument.addEventListener("pointerup", this.onPointerUp, false)
			this.domElement.ownerDocument.addEventListener("pointercancel", this.onPointerUp, false)
		}
		this.onPointerMove = (event) => {
			event.preventDefault();
			if(event.pointerType == "touch"){
				this.touchEvents[event.pointerId] = event
			}
			let touchs = Object.values(this.touchEvents)

			if(this.onRotate && (touchs.length == 1 || event.pointerType == "mouse")){
				let rotX = (event.pageY - this.lastPointerY) / 200;
				let rotY = (event.pageX - this.lastPointerX) / 200;
				this.lastPointerX = event.pageX
				this.lastPointerY = event.pageY

				this.onRotate(rotX, rotY)
			} else if(this.onZoom && touchs.length == 2 && event.isPrimary){
				let distance = Math.hypot(touchs[0].pageX - touchs[1].pageX, touchs[0].pageY - touchs[1].pageY)

				this.onZoom(distance/this.lastPinchDistance)
				this.lastPinchDistance = distance
			}
		}
		this.onPointerUp = (event) => {
			this.domElement.ownerDocument.removeEventListener("pointermove", this.onPointerMove, false)
			this.domElement.ownerDocument.removeEventListener("pointerup", this.onPointerUp, false)
			this.domElement.ownerDocument.removeEventListener("pointercancel", this.onPointerUp, false)
			this.touchEvents = [] //erase all touch event 
		}

		this.onMouseWheel = ( event ) => {
			event.preventDefault();
			event.stopPropagation();

			this.onZoom(event.deltaY < 0 ? 1 - this.deltaZoom : 1 + this.deltaZoom)
		}
		
		this.domElement.addEventListener("pointerdown", this.onPointerDown, false)
		
		if(this.onZoom){
			this.domElement.addEventListener("wheel", this.onMouseWheel, false)
		}
	}
}