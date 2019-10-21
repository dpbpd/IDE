var painter = require('services/painter')
//var fingers = require('fingers')
var types = require('base/types')

function defineToolInheritable(proto, key){
	proto.inheritable(key, function(){
		var inherit = this[key]
		var base = Object.getPrototypeOf(this)[key]
		if(!base) return
		var cls
		//console.log(key, inherit)
		if(inherit && inherit.constructor === Object){ 
			// write it back
			cls = this[key] = base.extend(inherit)
		}
		else{
			cls = this[key] = inherit
		}
		this.$compileVerbs(key, cls)
	}, true)
}

module.exports = class Tools extends require('base/class'){

	prototype(){
		this.Turtle = require('base/turtle')

		this.inheritable('states', function(){
			// process stamp states. into shader states
			var states = this.states
			this._statesProto = protoInherit(this._statesProto, states)
			states = this.states = protoProcess('', this._statesProto, null, null, null, new WeakMap())

			for(let stateName in states){
				var state = states[stateName]
				var stateTime = state.time
				for(let frameName in state){
					var frame = state[frameName]
					if(frameName === 'time' || typeof frame !== 'object') continue // its a playback prop
					var frameTime = frame.time
					
					for(let subName in frame){
						var subFrame = frame[subName]
						// ok lets create/modify a subFrame with playback props.
						if(!this.hasOwnProperty(subName)) this[subName] = {}
						var subObj = this[subName]

						if(!subObj.hasOwnProperty('states')) subObj.states = {}
						var subStates = subObj.states

						// lets create the state
						if(!subStates[stateName]) subStates[stateName] = {
							duration:state.duration,
							repeat:state.repeat,
							bounce:state.bounce
						}
						var subState = subStates[stateName]
						if(stateTime) subState.time = stateTime
						
						// alright lets create the keyframe
						var outFrame = subState[frameName] = {}
						if(frameTime) outFrame.time = frameTime
						for(let prop in subFrame){
							outFrame[prop] = subFrame[prop]
						}
					}
				}
			}
		})

		this.inheritable('tools', function(nesting){
			//if(!this.hasOwnProperty('_tools')) this._tools = this._tools?Object.create(this._tools):{}
			var tools = this.tools
			for(let key in tools){
				var inherit = tools[key]
				var base = this[key]
				if(inherit && inherit.constructor === Object){ // subclass it
					var cls = this[key] = base.extend(inherit)
					// lets call the callback
					this.$compileVerbs(key, cls)
				}
				// reversed (prop object below class)
				else if(base && base.constructor === Object && typeof inherit === 'function'){ // already has an object defined
					var cls = this[key] = inherit.extend(base)
					this.$compileVerbs(key, cls)
				}
				else{
					// else replace it
					this[key] = inherit
					this.$compileVerbs(key, inherit)
				}
				if(!this.inheritable(key)){
					// make it inheritable
					defineToolInheritable(this, key)
				}
			}	
		})

		this.inheritable('styles', function(){
			var styles = this.styles
			this._stylesProto = protoInherit(this._stylesProto, styles)
			this.styles = protoProcess('', this._stylesProto, null, null, null, new WeakMap())
		})
	}

	setState(state, queue, props){
		this.state = state
		// alright now what. now we need to change state on our range.
		let view = this.view
		let todo = view.todo
		let time = view.app.getTime()
		let $writeList = view.$writeList
		for(let i = this.$writeStart; i < this.$writeEnd; i+=3){
			let mesh = $writeList[i]
			let start = $writeList[i+1]
			let end = $writeList[i+2]

			if(!mesh || start === -1) continue

			let shaderProto = mesh.shader.shaderProto
			let info = shaderProto.$compileInfo
			let slots = mesh.slots

			let instanceProps = info.instanceProps
			let array = mesh.array
			// let interrupt = info.interrupt
			// let animStateOff = instanceProps.thisDOTanimState.offset
			// let animNextOff = instanceProps.thisDOTanimNext.offset
			// let animStartOff = instanceProps.thisDOTanimStart.offset
			// let newState = info.stateIds[state] || 1
			// let newDelay = (info.stateDelay[newState] || 0)
			// let newDuration = (info.stateDuration[newState] || 0)
			// let newTotal = time + newDelay + newDuration
			for(let j = start; j < end; j++){
				let o = j * slots
				if(props) for(let key in props){
					let prop = instanceProps['thisDOT'+key]
					if(!prop) continue
					if(prop.config.pack || prop.slots > 1) throw new Error("Implement propwrite for packed/props with more than 1 slot")
					let off = prop.offset
					if(prop.hasFrom) off += prop.slots
					array[o + off] = props[key]
				}
				var total = shaderProto.setState(state, queue, time, array, j, array, j)
				//console.log("HI", total, queue)
				if(total > todo.timeMax) todo.timeMax = total
			}
			// alright so how do we declare this thing dirty
			if(!mesh.dirty){
				mesh.updateMesh()
				mesh.dirty = true
			}
		}
		todo.updateTodoTime()
	}
	
	beginLayout(opts){
		var turtle = this.turtle
		if(opts){
			turtle._margin = opts.margin || zeroMargin
			turtle._padding = opts.padding || zeroMargin
			turtle._align = opts.align || zeroAlign
			turtle._wrap = opts.wrap || true
			if(opts.x !== undefined) turtle._x = opts.x
			if(opts.y !== undefined) turtle._y = opts.y
			if(opts.w !== undefined) turtle._w = opts.w
			if(opts.h !== undefined) turtle._h = opts.h
		}
		this.beginTurtle(1)
	}

	endLayout(){
		var ot = this.endTurtle()
		this.turtle.walk(ot)
	}

	beginTurtle(dump){
		var view = this.view
		// add a turtle to the stack
		var len = view.$turtleStack.len++
		var outer = this.turtle
		var turtle = this.turtle = view.$turtleStack[len]
		if(!turtle){
			turtle = this.turtle = view.$turtleStack[len] = new view.Turtle(view)
		}
		//turtle.view = view
		turtle.context = view
		turtle._pickId = outer._pickId
		turtle._order = outer._order
		turtle.begin(outer, dump)
		return turtle
	}

	endTurtle(doBounds){
		// call end on a turtle and pop it off the stack
		var view = this.view
		this.turtle.end(doBounds)
		// pop the stack
		view.$turtleStack.len--
		// switch to outer
		var last = this.turtle
		this.turtle = last.outer
		//var outer = this.turtle = view.$turtleStack[--view.$turtleStack.len]
		// forward the pickId back down
		//outer._pickId = last._pickId
		return last
	}

	lineBreak(){
		this.turtle.lineBreak()
	}

	$moveWritten(start, dx, dy){
		var view = this.view
		var writes = view.$writeList
		var current = view.$turtleStack.len
		for(var i = start; i < writes.length; i += 3){
			var props = writes[i]
			var begin = writes[i+1]
			if(begin<0){ // its a view
				// move the view
				//console.log("MOVE", dx, dy)
				props.$rx += dx
				props.$ry += dy
				continue
			}
			var end = writes[i+2]
			var slots = props.slots
			var xoff = props.xOffset
			var yoff = props.yOffset
			var array = props.array
			for(var j = begin; j < end; j++){
				array[j * slots + xoff] += dx
				array[j * slots + yoff] += dy
 			}
		}
	}

	setPickId(pickId){
		this.turtle._pickId = pickId
	}

	allocPickId(){
		return this.turtle._pickId = ++this.$pickId
	}

	clearPickIds(){
		this.$pickId = 1
	}

	// destroy framebuffers
	$recurDestroyShaders(node){
		for(var key in node){
			var shader = node[key]
			node[key] = undefined
			if(shader.constructor === Object){
				this.$recurDestroyShaders(shader)
				continue
			}
			shader.$drawUbo.destroyUbo()
			shader.$vao.destroyVao()
			shader.$props.destroyMesh()
			shader.destroyShader()
		}
	}

	// internal API used by canvas macros
	$allocShader(classname, order){
		var shaders = this.$shaders
		var proto = new this[classname]()
		
		var info = proto.$compileInfo
		var shaderOrder = shaders[classname] || (shaders[classname] = {})

		var shader = shaderOrder[order] = new painter.Shader(info)
	
		var litDef = info.uboDefs.literals
		var litUbo = shader.$literalsUbo = new painter.Ubo(info.uboDefs.literals)
		// lets fill the literals ubo
		for(var litKey in litDef){
			if(litKey.indexOf('_litFloat') === 0){
				litUbo.vec4(painter.nameId(litKey), litDef[litKey].value)
			}
			else{
				litUbo.ivec4(painter.nameId(litKey), litDef[litKey].value)
			}
		}

		shader.$drawUbo = new painter.Ubo(info.uboDefs.draw)
		shader.shaderProto = proto
		var props = shader.$props = new painter.Mesh(info.propSlots)
		props.shader = shader
		props.order = order
		props.hook = this
		// create a vao
		var vao = shader.$vao = new painter.Vao(shader)

		// initialize the VAO
		var geometryProps = info.geometryProps
		var attrbase = painter.nameId('ATTR_0')
		var attroffset = Math.ceil(info.propSlots / 4)

		vao.instances(attrbase, attroffset, props)

		var attrid = attroffset
		// set attributes
		for(let key in geometryProps){
			var geom = geometryProps[key]
			var attrRange = ceil(geom.type.slots / 4)
			vao.attributes(attrbase + attrid, attrRange, proto[geom.name])
			attrid += attrRange
		}

		// check if we have indice
		if(proto.indices){
			vao.indices(proto.indices)
		}

		props.name = this.id + "-"+classname
		var xProp = info.instanceProps.thisDOTx
		props.xOffset = xProp && xProp.offset
		var yProp = info.instanceProps.thisDOTy 
		props.yOffset = yProp && yProp.offset

		props.transferData = proto.transferData
		return shader
	}

	parseColor(str, alpha){
		var out = []
		if(!types.colorFromString(str, alpha, out, 0)){
			console.log("Cannot parse color" + str)
		}
		return out
	}

	$parseColor(str, alpha, a, o){
		if(!types.colorFromString(str, alpha, a, o)){
			console.log("Cannot parse color "+str)
		}
	}

	$parseColorPacked(str, alpha, a, o){
		if(!types.colorFromStringPacked(str, alpha, a, o)){
			console.log("Cannot parse color "+str)
		}
	}

	$compileVerbs(className, sourceClass){
		var sourceProto = sourceClass.prototype

		if(sourceProto.onCompileVerbs){
			sourceProto.onCompileVerbs(this)
		}

		var verbs = sourceProto._verbs
		var target = this

		for(let verbName in verbs){
			var methodName = verbName + className
			var thing = verbs[verbName]
			
			var info = sourceProto.$compileInfo
			if(info){
				var cache = fnCache[info.cacheKey+methodName]
				if(cache){
					//console.log(cacheKey)
					target[methodName] = cache
					continue
				}
			}

			if(typeof thing !== 'function'){
				if(thing) target[methodName] = thing
				continue
			}
			var code = thing.toString().replace(comment1Rx,'').replace(comment2Rx,'')
			// lets parse our args
			var marg = code.match(mainArgRx)
			var mainargs = marg[1].match(argSplitRx) || []
			var scope = {}
			code = code.replace(macroRx, function(m, indent, fnname, args){
				if(fnname === 'NAME') return m
				// if args are not a {
				var macroArgs
				if(typeof args === 'string'){ 
					if(args.indexOf('{') !== -1){
						// lets parse args
						var res, argobj = {}
						while((res = argRx.exec(args)) !== null) {
							argobj[res[1]] = res[2]
						}
						macroArgs = [argobj]
					}
					else macroArgs = args.split(/\s*,\s*/)
				}
				var fn = sourceProto[fnname]
				if(!fn) throw new Error('CanvasMacro: '+fnname+ ' does not exist')
				return sourceProto[fnname](macroArgs, indent, className, scope, target, code)
			})
			code = code.replace(nameRx,className)

			var outcode = code.replace(dumpRx,'')
			if(outcode !== code){
				console.log(code)
				code = outcode
			}
	
			code = code.replace(fnnameRx, function(m, args){
				var out = 'function '+methodName+'('+args+'){\n'
				for(var key in scope){
					out += '\tvar '+key+' = '+scope[key]+'\n'
				}
				return out
			})

			//console.log(code)


			// create the function on target
			target[methodName] = fnCache[code] || (fnCache[code] = new Function('return ' + code)())

			if(info){ // store it
				fnCache[info.cacheKey+methodName] = target[methodName]
			}
		}
	}
}

// creates a prototypical inheritance overload from an object
function protoInherit(oldobj, newobj){
	// copy oldobj
	var outobj = oldobj?Object.create(oldobj):{}
	// copy old object subobjects
	for(let key in oldobj){
		var item = oldobj[key]
		if(item && item.constructor === Object){
			outobj[key] = protoInherit(item, newobj && newobj[key])
		}
	}
	// overwrite new object
	for(let key in newobj){
		var item = newobj[key]
		if(item && item.constructor === Object){
			outobj[key] = protoInherit(oldobj && oldobj[key], newobj && newobj[key])
		}
		else{
			//if(typeof item === 'string' && item.charAt(0) === '#'){
			//	item = module.exports.prototype.parseColor(item,1)
			//}
			outobj[key] = item
		}
	}
	return outobj
}

// we have to return a new objectect
function protoProcess(name, base, ovl, parent, incpy, parents){
	var cpy = incpy
	var out = {}
	Object.defineProperty(out, 'name', {value:name})
	parents.set(out, parent)
	// make sure our copy props are read first
	for(let key in base){
		var value = base[key]
		var $index = key.indexOf('$')
		if($index === 0){
			cpy = cpy?cpy === incpy?Object.create(cpy):cpy:{}
			cpy[key.slice(1)] = value
		}
	}
	for(let key in ovl){
		var value = ovl[key]
		var $index = key.indexOf('$')
		if($index === 0){
			cpy = cpy?cpy === incpy?Object.create(cpy):cpy:{}
			cpy[key.slice(1)] = value
		}
	}
	for(let key in base){
		var value = base[key]
		var $index = key.indexOf('$')
		if($index === 0){}
		else if($index >0){
			var keys = key.split('$')
			var o = out, bc = keys[1]
			while(o && !o[bc]) o = parents.get(o)
			var key0 = keys[0]
			out[key0] = protoProcess(key0, o && o[bc], value, out, cpy, parents)
		}
		else if(value && value.constructor === Object){
			out[key] = protoProcess(key, value, null, out, cpy, parents)
		}
		else{
			out[key] = value
		}
	}
	for(let key in ovl){
		var value = ovl[key]
		var $index = key.indexOf('$')
		if($index === 0){ }
		else if($index>0){
			var keys = key.split('$')
			var o = out, bc = keys[1]
			while(o && !o[bc]) o = parents.get(o)
			var key0 = keys[0]
			out[key0] = protoProcess(key0, out[key0], protoProcess(key0, o && o[bc], value, out, cpy, parents), out, cpy, parents)
		}
		else if(value && value.constructor === Object){
			out[key] = protoProcess(key, out[key], value, out, cpy, parents)
		}
		else{
			out[key] = value
		}
	}
	for(let key in cpy){
		out[key] = cpy[key]
	}
	return out
}

module.exports.protoProcess = protoProcess

var argRx = new RegExp(/([a-zA-Z\_\$][a-zA-Z0-9\_\$]*)\s*\:\s*([^\,\}]+)/g)
var comment1Rx = new RegExp(/\/\*[\S\s]*?\*\//g)
var comment2Rx = new RegExp(/\/\/[^\n]*/g)
var mainArgRx = new RegExp(/function\s*[a-zA-Z\_\$]*\s*\(([^\)]*?)/)
var macroRx = new RegExp(/([\t]*)this\.([A-Z][A-Z0-9\_]+)(?:\s*[\(\[]([^\)\]]*)[\)\]])?/g)
var argSplitRx = new RegExp(/[^,\s]+/g)
var nameRx = new RegExp(/NAME/g)
var fnnameRx = new RegExp(/^function\s*\(([^\)]*?)\)[^\}]*?\{/)
var dumpRx = new RegExp(/DUMP/g)

var fnCache = {}
var zeroMargin = [0,0,0,0]
var zeroAlign = [0,0]
