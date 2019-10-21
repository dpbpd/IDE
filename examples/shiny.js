new require('styles/dark')
module.exports = require('base/drawapp').extend({
	tools       :{
		Rect:{
			col         :'red',
			id          :0,
			borderRadius:50,
			shadowOffset:[5, 5],
			borderWidth :2,
			pixelStyle  :function() {$
				this.borderColor = mix('white', 'black', this.mesh.y)
				this.color = mix(
					'white',
					this.color,
					1 - 2 * pow(abs(sin(2. * (this.mesh.y + this.mesh.x) + this.time)), 32.)
					 + abs(
							sin(
								sin(this.time + this.id) * 3. * length(
										this.mesh.xy - vec2(.5 + 0. * sin(this.time + 8. * this.id))
									) + this.time
							)
						)
				)
			}
		}
	},
	onFingerDown:function() {
		this.redraw()
	},
	onDraw      :function() {
		for(let i = 0;i < 450;i++){
			this.drawRect({
				id   :i * 0.01,
				color:[
					random(),
					random(),
					random(),
					1
				],
				w    :50,
				h    :50
			})
		}
	}
})