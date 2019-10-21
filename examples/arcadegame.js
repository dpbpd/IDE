new require('styles/dark')

module.exports = class extends require('base/drawapp'){
	prototype() {
		this.tools = {
			Bg:require('shaders/quad').extend({
				//dead :0,
				pixel:function() {$
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('#079')
					//this.stroke('black', 1.)
					return this.result
				},
			}),
			
		}
	}
	
	onKeyDown(e) {
		if(e.name === 'space') {
			
			this.start()
			this.redraw()
			
		}
	}
	
	constructor(...args) {
		super(...args)
		this.start()
		
	}
	start() {
		
	}
	
	onDraw() {
		this.beginBg({
			//x:0,
			//y:0,
			w:600,
			h:400,
		})
		
		
		this.endBg()
	}
}