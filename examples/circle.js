new require('styles/dark')
module.exports = class extends require('base/drawapp'){
	prototype() {
		this.tools = {
			Sand:require('shaders/quad').extend({
				pixel:function() {$
					this.viewport()
					this.circle(this.x, this.y * .5, this.w * .5)
					this.fillKeep('gray')
					return this.result
				}
			}),
			
		}
	}
	
	onDraw() {
		//this.sand(50, 50, 10)
		this.drawSand({
			x:50 * .5,
			y:50,
			w:50,
			h:50
		})
		
		
		
	}
}