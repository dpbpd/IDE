new require('styles/dark')

module.exports = class extends require('base/drawapp'){ //top
	prototype() {
		
		this.xOverflow = 'none'
		this.yOverflow = 'none'
		this.props = {
			page:_=module.worker.page || 0
		}
		this.tools = {
			Splash:require('base/view').extend({
				props :{text:'HI'},
				tools :{
					Bg  :require('shaders/quad').extend({
						padding  :130,
						fillColor:'orange',
						//dump     :1,
						pixel    :function() {$
							this.viewport(this.mesh.xy)
							this.translate(.5, .5)
							this.circle(0., 0., .35) //+sin(this.time*8))
							let p = this.pos
							this.shape += 0.05 * abs(sin(atan(p.y, p.x) * 4 + this.time * 1))
							this.fillKeep(this.fillColor)
							this.strokeKeep('#44ffff', .02)
							this.shape += 0.08
							this.strokeKeep('blue', .03)
							this.blur = 0.1
							this.glow('white', 0.1)
							return this.result
						}
					}),
					Text:require('shaders/text').extend({
						fontSize    :62,
						align       :[0.5, 0.5],
						boldness    :0.,
						outlineWidth:0.04,
						shadowColor :'#0009',
						shadowBlur  :1.0,
						shadowSpread:0.,
						shadowOffset:[2., 2],
						dy          :-4.1,
						lineSpacing :0.9,
						outlineColor:'black',
						vertexStyle :function() {$
							let b = this.bouncy = 0.4 // abs(sin(this.time))
							this.shadowOffset = vec2(b * 10, b * 10)
						},
						vertexPos   :function(pos) {$
							//return pos
							this.pos = pos
							let cen = vec2(this.viewSpace.x * .5, this.viewSpace.y * .53)
							this.scale((this.bouncy * .8 + 1.5), cen.x, cen.y)
							this.rotate(this.bouncy * .25, cen.x, cen.y)
							return this.pos
						},
					}),
				},
				onDraw:function() {
					this.beginBg({fillColor:this.color})
					this.drawText({text:this.text})
					this.endBg()
				}
			}),
			
		}
	}
	
	constructor() {
		super()
		
		this.pages = [
			{h:"Demos", q:"- Sliders\n- Windtree\n- Gameshow\n"},
			{h:"Overview", q:"- All in web-browser\n- Multithreaded\n- Type Inference JS to shaders\n- AST Code editor\n- Class composition\n- Layout\n- Future\n"},
			{h:"Multithreading", q:"- Main browser thread: renderer\n- Worker 1: Editor\n- Worker 2: User programs\n\nUses commandbuffer trees cross thread\nCan recover from user process\n\nMain thread implements services\nworkers get message passing\nservice interface"},
			{h:"Type inferencing JS", q:"- JS class backbone with pixel and vertex methods\n- Use type information to generate JS as well\n", c:'vec4 thisDOTpixel_T(){\n' + 
				'  thisDOTviewport_T_vec2(thisDOTmesh.xy);\n' + 
				'  thisDOTtranslate_T_float_float(0.5,0.5);\n' + 
				'  thisDOTcircle_T_float_float_float(0.0,0.0,0.35);\n' + 
				'  vec2 p = thisDOTpos;\n' + 
				'  thisDOTshape += 0.05 * abs(sin(atan(p.y, p.x) * 8.0 + thisDOTtime * 8.0));\n' + 
				'  thisDOTfillKeep_T_vec4(thisDOTfillColor);\n' + 
				'  thisDOTstrokeKeep_T_vec4_float(vec4(0.26666666666666666,1,1,1),0.02);\n' + 
				'  thisDOTshape += 0.08;\n' + 
				'  thisDOTstrokeKeep_T_vec4_float(vec4(1,0,0,1),0.03);\n' + 
				'  thisDOTblur = 0.2;\n' + 
				'  thisDOTglow_T_vec4_float(vec4(1,1,1,1),0.1);\n' + 
				'  return thisDOTresult;\n' + 
				'}'},
			{h:"AST Code editor", q:"- Cycles on-key-down through parser and formatter\n- Parse error handled gracefully\n- 1K base editor\n  - Draw primitives\n  - Keyboard handling\n  - Cursor sets\n- 1K code editor\n  - Code spec. draw primitives\n  - Formatting colors\n  - Draw function w format call\n- 1K Formatter\n  - Simple AST matcher"},
			{h:"Class composition", q:"- Nested classes compose everything\n- Replacement for CSS\n- GPU animation engine"},
			{h:"Layout engine", q:"- Inline layout engine, in drawflow\n- Can move after, not resize"},
			{h:"Future", q:"- Finish UI kit\n- Visual editors for AST\n- Alternate media\n- Online service makepad.io\n\nTwitter:@rikarends\nAll apache2/MIT at github: github.com/makepad"},
		]
	}
	
	onKeyDown(e) {
		if(e.name === 'leftArrow') {
			this.page = max(0, this.page - 1)
		}
		if(e.name === 'rightArrow') {
			this.page = min(this.pages.length, this.page + 1)
		}
		
		module.worker.page = this.page
	}
	
	onDraw() {
		var scale = 0.6
		var panel = 300
		_=this.page
		if(this.page == 0) {
			this.drawSplash({id:0, text:'Makepad'})
		}
		else {
			
			this.drawText({
				fontSize:50 * scale,
				margin  :[0, 0, 0, 40],
				align   :[0., 0],
				text    :this.pages[this.page - 1].h
			})
			this.lineBreak()
			this.turtle.wy += 40
			this.drawText({
				fontSize:32 * scale,
				margin  :[0, 0, 0, 40],
				text    :this.pages[this.page - 1].q
			})
			this.turtle.wy += 20
			this.drawText({
				fontSize:20 * scale,
				margin  :[0, 0, 0, 40],
				text    :this.pages[this.page - 1].c
			})
		}
	}
}