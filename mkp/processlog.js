var types = require('base/log').types

module.exports = class Log extends require('base/view'){
	
	prototype() {
		this.props = {
			w:'100%',
			h:'100#',
			padding:0,
			resource:null,
			tail:true,
			order:2,
			shiftX:5,
			shiftY:5,
			selectedRow:-1
		}

		var colors = module.style.colors

		this.tools = {
			Button: require('views/button').extend({
				order:4,
			}),
			Bg:require("shaders/bg").extend({
				color:module.style.colors.bgNormal
			}),
			Text: require('shaders/codetext').extend({
				font: require('fonts/ubuntu_monospace_256.font'),
				order:3,
			}),
			SelectedRow:require('shaders/quad').extend({
				color:colors.accentNormal
			})
		} 

		this.styles = {
			$boldness: 0.,
			$color: '#fff',
			$italic: 0,
			$head: 0,
			$tail: 0,
			whitespace:{},
			curly:{},
			Object:{
				$color:colors.codeObject,
				curly:{},
				colon:{},
				key:{alignLeft:0,alignRight:1.},
				commaClose:{$tail:1},
				bracket:{},
				member:{}
			},
			Array:{
				$color:colors.codeObject,
				commaClose:{$tail:1},
				bracket:{}
			},
			Function:{
				$color:colors.codeFunction,
				function:{},
				comma:{$tail:1},
				parenLeft:{},
				parenRight:{$tail:1}
			},
			Value:{
				undefined:{
					global:{$color:colors.codeGlobal, $boldness:0.2}
				},
				regexp:{
					$color:colors.codeString
				}, 
				object:{
					$color:colors.codeObject
				},
				num:{
					$color:colors.codeNumber
				},
				boolean:{
					$color:colors.codeBoolean
				},
				string:{
					$color:colors.codeString
				},
			},
		} 
	} 
	
	constructor(...args){
		super(...args)
		// send new init message to worker
		this.app.store.observe(this.resource,_=>{
			this.redraw()
		})
	}
	
	onDestroy(){

	}

	drawLine(item){

	}

	deserializeLog(buf, isObjectKey, skipObj){
		var type = buf.u32[buf.off++]
		if(type === types.ref){
			var r = buf.u32[buf.off++]
			var uid = buf.u32[r + 2]
			if(this.writeText('<'+uid+'>', this.styles.Value.undefined)>buf.MAXTEXT) return true
			return
		}
		if(type === types.undefined){
			if(this.writeText('undefined', this.styles.Value.undefined)>buf.MAXTEXT) return true
			return
		}
		if(type === types.null){
			if(this.writeText('null', this.styles.Value.object)>buf.MAXTEXT) return true
			return
		}
		if(type === types.number){
			if(buf.off&1) buf.off++
			var s = String(buf.f64[buf.off>>1])
			if(this.writeText(s, this.styles.Value.num)>buf.MAXTEXT) return true
			buf.off += 2
			return
		}
		if(type === types.boolean){
			if(buf.u32[buf.off++]){
				if(this.writeText('true', this.styles.Value.boolean)>buf.MAXTEXT) return true
				return 
			}
			if(this.writeText('false', this.styles.Value.boolean)>buf.MAXTEXT) return true
			return
		}
		if(type === types.string){
			var l = buf.u32[buf.off++]
			var u16 = buf.u16
			var o = buf.off<<1
			var str = isObjectKey?"":"'"
			for(var i = 0; i < l; i++){
				var cc = u16[o++]
				if(cc < 32){
					str += CharMap[cc]
				}
				else{
					str += String.fromCharCode(cc)
				}
			}
			if(o&1) o++
			buf.off = o>>1
			if(!isObjectKey) str += "'"
			else str += ":"
			//console.log(str)
			if(this.turtle.$propOffset + str.length > buf.MAXTEXT){
				str = str.slice(this.MAXTEXT - this.turtle.$propOffset)
			}
			if(this.writeText(str, isObjectKey?this.styles.Object.key:this.styles.Value.string)>this.MAXTEXT) return true
			return
		}
		if(type === types.function){
			if(this.writeText('function', this.styles.Function.function)>buf.MAXTEXT) return true
			var l = buf.u32[buf.off++]
			var o = buf.off<<1
			o += l
			if(o&1) o++
			buf.off = o>>1
			return
		}
		if(type === types.array){
			var skip = buf.u32[buf.off++]
			var id = buf.u32[buf.off++]
			var len = buf.u32[buf.off++]
			
			if(len === 0){
				if(this.writeText('[]', this.styles.Array.bracket)>buf.MAXTEXT) return true
			}
			else{
				if(skipObj){
					buf.off = skip
					if(this.writeText('[.]', this.styles.Array.bracket)>buf.MAXTEXT) return true
					return
				}
				// write array..
				if(this.writeText('[', this.styles.Array.bracket)>buf.MAXTEXT) return true
				for(var i = 0; i < len; i++){
					if(this.deserializeLog(buf, false, true)) return true
					if(i !== len - 1) if(this.writeText(',', this.styles.Array.commaClose)>buf.MAXTEXT) return true		
				}
				if(this.writeText(']', this.styles.Array.bracket)>buf.MAXTEXT) return true				
			}
			return
		}
		if(type === types.storeproxy){
			return this.deserializeLog(buf, null, true)
		}
		if(type === types.object){
			var skip = buf.u32[buf.off++]
			var id = buf.u32[buf.off++]

			// lets skip the prototype
			var proto = buf.u32[buf.off++]

			if(proto === types.object){
				// skip it
				//console.log("SKIP PROTO")
				buf.off = buf.u32[buf.off++]
			}
			else if(proto === types.ref){
				buf.off++
			}

			if(this.writeText('{', this.styles.Object.curly)>buf.MAXTEXT) return true

			var l = buf.u32[buf.off++]
			if(l && skipObj){
				if(this.writeText('.', this.styles.Object.colon)>buf.MAXTEXT) return true
				buf.off = skip
			}
			else{
				for(i = 0;i < l; i++){
					if(this.deserializeLog(buf, true)) return true
					if(this.deserializeLog(buf, null, true)) return true
					if(i < l - 1) this.writeText(', ', this.styles.Object.commaClose)
				}
			}
			if(this.writeText('}', this.styles.Object.curly)>buf.MAXTEXT) return true
			return
		}
	}

	onScroll(e) { 
		var todo = this.$mainTodo
		// lets check if we overflow the safety window, ifso redraw.
		if(todo.yScroll < todo.yVisible+0.5*this.safeHeight || 
			todo.yScroll+todo.yView > todo.yVisible + todo.hVisible - 0.5*this.safeHeight){
			this.tail = false
			this.parent.tail = false
			this.redraw() 
			this.doScroll = true
		}
		else{
			// lets return a scroll sync
			todo.scrollSync()
		}

	}

	// compute the selection ID
	onFingerDown(e){
		// lets compute the actual line selection
		this.onFingerMove(e)
		this.setFocus()
	}

	onFingerMove(e){
		var pos = this.toLocal(e)
		var off = max(0,floor((pos.y-this.shiftY) / this.lineHeight))
		this.selectRow(off)
	}

	onSelectedChange(){
		// ok so we changed the selected log item.
		// now we need to highlight the callstack in the editor
		var logs = this.resource && this.resource.processes && this.resource.processes[0].logs.__unwrap__
		if(!logs) return
		var item = logs[this.selectedRow]
	//	if(!item) return
		// ok so now the next query.
		// callstack markers.. how do we do them
		// well first off we have to find the right editor
		// shall we use the datamodel?... 
		//console.log(item.stack)

		// lets update our resources with callstacks we wanna viz
		this.app.store.act('stackMarkers',store=>{
			var res = this.resource
			res.stackMarkers = item && item.stack.stack
		})
		this.redraw()
	}

	selectRow(row){
		if(this.scrollAtDraw) return
		var logs = this.resource && this.resource.processes && this.resource.processes[0].logs.__unwrap__
		if(!logs) return
		if(row<0) row = logs.length - row
		var newRow = clamp(row,0,logs.length-1)
		if(newRow!==this.selectedRow){
			this.selectedRow = newRow
			this.scrollAtDraw = true
			this.onSelectedChange()
		}
	}

	onKeyDown(e){
		var row = this.selectedRow
		if(e.name == 'downArrow'){
			row = this.selectedRow+1
		}
		if(e.name == 'upArrow'){
			row = max(this.selectedRow-1,0)
		}
		if(e.name === 'home'){
			row = 0			
		}
		if(e.name === 'end'){
			row = -1
		}
		if(e.name === 'pageUp'){
			row = max(this.selectedRow-10,0)
		}
		if(e.name === 'pageDown'){
			row = this.selectedRow+10
		}
		this.selectRow(row)
	}

	onTrash(){
		// send new init message to worker
		this.app.store.act("clearLog",store=>{
			this.resource.processes[0].logs.length = 0
		})
	}

	onTailToggle(btn){
		this.tail = btn.toggled
		this.redraw()
	}

	onDraw() {
		this.drawBg({
			w:'100%',
			h:'100%',
			moveScroll:0
		})

		this.drawButton({
			heavy:true,
			id:'play',
			icon:'trash-o',
			align:[1,0],
			onClick:this.onTrash.bind(this)
		})

		this.drawButton({
			heavy:true,
			id:'close',
			align:[1,0],
			icon:'level-down',
			margin:[0,10,0,0],
			toggle:true,
			toggled:this.tail,
			onClick:this.onTailToggle.bind(this)
		})

		//this.beginBg()	
		this.$fastTextChunks = []
		this.$fastTextStyles = []
		this.$fastTextFontSize = 10
		
		//this.scrollMode(0)
		
		var tproto = this.Text.prototype
		var lineHeight = this.lineHeight = tproto.lineSpacing * this.$fastTextFontSize
		var charWidth = tproto.font.fontmap.glyphs[32].advance * this.$fastTextFontSize
		// how would we virtual viewport this thing?
		var logs = this.resource && this.resource.processes && this.resource.processes[0].logs.__unwrap__

		if(this.selectedRow >= logs.length && this.selectedRow > 0){
			this.selectRow(0)
		}

		if(logs){
		//console.log(logs)
			//this.turtle.sx = this.shiftX
			//this.turtle.sy = this.shiftY
			// lets set the viewspace
			this.scrollSize(charWidth * 1000, lineHeight *(logs.length))
			// lets scroll to the bottom
			// be sure to start at yScroll and stop when > size
			var ypos = 0
			var height = this.turtle.height
			
			if(this.tail){
				// how do we scroll to the bottom?
				var scroll = (logs.length+1)* lineHeight- this.turtle.height
				//console.log(logs.length, scroll / lineHeight)
				this.scrollTo(undefined,scroll, -1)
			}

			if(this.scrollAtDraw){
				this.scrollIntoView(
					undefined,
					this.selectedRow * this.lineHeight + this.shiftY,
					0,
					this.lineHeight,
					1.
				)
				this.scrollAtDraw=false
			}

			var scroll = this.todo.yScroll
			// compute the start i and end i
			var safeWin = 5
			this.safeHeight = safeWin * lineHeight
			var iStart = max(0,floor(scroll / lineHeight)-safeWin)
			var iEnd = min(iStart + ceil(height / lineHeight)+2*safeWin, logs.length)

			this.turtle.pushShift(this.shiftX, iStart * lineHeight + this.shiftY)
			// how do we see if a scrollbar is at the bottom?
			//this.turtle.wy = this.turtle.sy
			// set scroll area for async scrolling
			this.scrollArea(
				0,
				this.turtle.wy,
				charWidth*1000,
				(iEnd-iStart)*lineHeight
			)
			// lets draw a cursor
			if(this.selectedRow>=0){
				this.turtle.$debug = 1
				this.drawSelectedRow({
					align:[0,0],
					x:0,
					y:this.selectedRow * lineHeight + this.shiftY,// + this.turtle.sy,
					w:charWidth*1000,
					h:lineHeight
				})
				this.turtle.$debug = 0
			}

			// lets write callstack position here
			for(var i = iStart; i < iEnd; i++){
				var log = logs[i]

				if(!log || !log.data) continue
				// lets draw what we logged
				// all primitive values instead of object
				var item = log.stack && log.stack.stack && log.stack.stack[1]
				var path = 'undefined'
				if(item.path){
					path = item.path.slice(item.path.lastIndexOf('/') + 1)+':'
				}
				this.writeText(path, this.styles.Function)
				this.writeText(item.line + ' ', this.styles.Value.regexp)
				var buf = {
					MAXTEXT:(this.lengthText() || 0) + 1000,
					str:'',
					max:256,
					off:0,
					size:log.data.byteLength >> 2,
					u32: new Uint32Array(log.data),
					f64: new Float64Array(log.data),
					u16: new Uint16Array(log.data),
				}
				this.deserializeLog(buf)
				this.writeText('\n', this.styles.Value.undefined)
			}
		}

		this.turtle.popShift()
	}
}

var CharMap = {
	9:'\\t',
	10:'\\n',
	13:'\\r'
}
for(let i = 0;i < 32; i++) if(!CharMap[i]) CharMap[i] = '\\x'+i
