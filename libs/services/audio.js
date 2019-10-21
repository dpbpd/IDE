var service = require('$audio1')

var IdAlloc = require('base/idalloc')
var flowIds = new IdAlloc()

var pileupQueue = []
var pileupTimer

function flushPileupQueue() {
	for(let i = 0; i < pileupQueue.length; i++) {
		var msg = pileupQueue[i]
		var flow = flowIds[msg.id]
		var node = flow.config[msg.node]
		// lets do the pileup
		if(node.onData) node.onData(msg.data)
	}
	pileupQueue.length = 0
}

service.onMessage = function(msg) {
	if(msg.fn === 'onRecorderData') {
		if(Date.now() - msg.pileupTime > 16) {
			if(pileupTimer) clearTimeout(pileupTimer)
			pileupQueue.push(msg)
			pileupTimer = setTimeout(flushPileupQueue, 16)
			return
		}
		if(pileupTimer) clearTimeout(pileupTimer), pileupTimer = undefined
		pileupQueue.push(msg)
		flushPileupQueue()
	}
}

function deepCopy(obj) {
	var out = {}
	for(let key in obj) {
		var value = obj[key]
		if(typeof value === 'function') out[key] = null
		else if(typeof value === 'object' && value.constructor === Object) out[key] = deepCopy(value)
		else out[key] = value
	}
	return out
}

exports.keyboardNoteMap = {
	'a': [0, 0],
	'z': [1, 0],
	's': [2, 0],
	'x': [3, 0],
	'd': [4, 0],
	'c': [5, 0],
	'f': [5, 0],
	'v': [6, 0],
	'g': [7, 0],
	'b': [8, 0],
	'h': [9, 0],
	'n': [10, 0],
	'j': [11, 0],
	'm': [12, 0],
	'k': [12, 0],
	'comma': [13, 0],
	'l': [14, 0],
	'period': [15, 0],
	'semiColon': [16, 0],
	'slash': [17, 0],
	'singleQuote': [18, 0],
	'accent': [11, 1],
	'tab': [12, 1],
	'num1': [12, 1],
	'q': [13, 1],
	'num2': [14, 1],
	'w': [15, 1],
	'num3': [16, 1],
	'e': [17, 1],
	'num4': [17, 1],
	'r': [18, 1],
	'num5': [19, 1],
	't': [20, 1],
	'num6': [21, 1],
	'y': [22, 1],
	'num7': [23, 1],
	'u': [24, 1],
	'num8': [24, 1],
	'i': [25, 1],
	'num9': [26, 1],
	'o': [27, 1],
	'num0': [28, 1],
	'p': [29, 1],
	'dash': [30, 1],
	'openBracket': [30, 1],
	'equals': [31, 1],
	'closeBracket': [32, 1],
	'backSpace': [33, 1],
	'backSlash': [34, 1]
}

exports.Flow = class Flow extends require('base/class'){
	constructor(config) {
		super()
		this.config = config
		this.id = flowIds.alloc(this)
		this.running
		// lets deep copy the flow
		// and skip functions
		// those are kept as callbacks for the system
		service.batchMessage({
			fn: 'init',
			id: this.id,
			config: deepCopy(config)
		})
	}
	
	start(overlay) {
		if(!this.id) throw new Error("flow destroyed")
		this.running = true
		service.batchMessage({
			fn: 'start',
			id: this.id,
			overlay: deepCopy(overlay)
		})
		return this
	}
	
	stop() {
		if(!this.id) throw new Error("flow destroyed")
		this.running = false
		service.batchMessage({
			fn: 'stop',
			id: this.id
		})
		return this
	}
	
	play(overlay) {
		if(!this.id) throw new Error("flow destroyed")
		// todo
		service.batchMessage({
			fn: 'trigger',
			id: this.id,
			overlay: deepCopy(overlay)
		})
		return this
	}
	
	destroy() {
		if(!this.id) throw new Error("flow destroyed")
		flowIds.free(this.id)
		service.batchMessage({
			fn: 'destroy',
			id: this.id
		})
		this.id = undefined
	}
}

exports.reset = function() {
	service.batchMessage({
		fn: 'reset'
	})
}

/*
var AudioNode = require('base/class').extend(function(proto){

proto._onConstruct = function(props){
this.id  = nodeIdsAlloc++
nodeIds[this.id] = this

service.batchMessage(this.onCreateArgs(props))

if(typeof props === 'object'){
for(let key in props){
this[key] = props[key]
}
}

if(this.className && !this.name){
this.name = this.className
}

nodeNames[this.name] = this.id
}

proto.onCreateArgs = function(){
return {
fn:'create'+this.className,
id:this.id,
}
}

proto.defProp = function(key, set, user){
var _key = '_'+key
Object.defineProperty(this, key, {
get:function(){
return this[_key]
},
set:function(val){
this[_key] = val
set.call(this, val, key, user)
}
})
}

proto.defProp('to', function(v){
service.batchMessage({
srcId:this.id,
dstId:typeof v === 'string'? nodeNames[v]: v.id,
fn:'connect'
})
})

Object.defineProperty(proto, 'values', {set:function(values){
for(let key in values){
this.defProp(key, function(value, key){
// deal with value types
service.batchMessage({
id:this.id,
key:key,
value:value,
fn:'setValue'
})
})
}
}})

Object.defineProperty(proto, 'setters', {set:function(setters){
for(let key in setters){
this.defProp(key, function(value, key, user){
user.call(this, value, key)
}, setters[key])
}
}})

proto.setters = {
start:function(value){
service.batchMessage({
id:this.id,
value:value,
fn:'startNode'
})
}
}
})

var Audio = require('base/class').extend({
reset:function(){
service.postMessage({
fn:'reset'
})
},
get:function(name){
return nodeIds[nodeNames[name]]
},
Osc:AudioNode.extend({
className: 'Osc',
values:{
type:{},
frequency:{},
detune:{},
type:{}
}
}),
Gain:AudioNode.extend({
className: 'Gain',
values:{
gain:{},
}
}),
Recorder:AudioNode.extend({
className:'Recorder',
onCreateArgs:function(props){
return {
fn:'createRecorder',
id:this.id,
chunk:props && props.chunk || this.chunk,
channels:props && props.channels || this.channels
}
},
channels:2,
chunk:1024,
}),
Player:AudioNode.extend({
className:'Player',
setters:{
buffer:function(buf){
service.batchMessage({
fn:'setBuffer',
id:this.id,
bufferId:typeof buf === 'string'?nodeNames[buf]:buf.id
})
}
}
}),
Buffer:AudioNode.extend({
className:'Buffer',
channels:2,
rate:44100,
duration:1,
onCreateArgs:function(props){
var samples = props && props.samples 
var duration = props && props.duration || this.duration
var rate = props && props.rate || this.rate
if(!samples) samples = rate * duration
this.samples = samples
this.offset = 0
return {
fn:'createBuffer',
id:this.id,
channels:props && props.channels || this.channels,
samples: samples,
rate:rate
}
},
update:function(data, offset){
if(offset === undefined){
offset = this.offset
this.offset += data[0].length
if(this.offset > this.samples){
this.offset = 0
}
}
service.batchMessage({
fn:'updateBuffer',
id:this.id,
data:data,
offset:offset
})
}
}),
Input:AudioNode.extend({
className:'Input'
})
})

var audio = module.exports = new Audio()
*/