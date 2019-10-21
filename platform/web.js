(function(root){
	root.platformPath = '/platform/'
	root.platform = 'web'
	root.isWindows = typeof navigator !== 'undefined' && navigator.appVersion.indexOf("Win") > -1
	root.isIPad = navigator.userAgent.match(/iPad/)
	root.isIOSDevice = navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/)
	root.isTouchDevice = ('ontouchstart' in window || navigator.maxTouchPoints)
	root.locationSearch = location.search
	root.hardwareConcurrency = navigator.hardwareConcurrency || 4
	// creates a worker creator
	root.makeWorkerCreator = function(source, fake){
		if(fake){

			var mask = Object.getOwnPropertyNames(window)
			var jsGlobals = getJsGlobals()
			for(let i = 0; i < jsGlobals.length; i++){
				var idx = mask.indexOf(jsGlobals[i])
				if(idx !== -1) mask.splice(idx, 1)
			}

			return function(){
				// exec it
				var inMain = {
					postMessage:function(msg){
						//setTimeout(function(){
							inWorker.onMessage(msg)
						//},0)
					}
				}
				var inWorker = {
					postMessage:function(msg){
						setTimeout(function(){
							inMain.onMessage(msg)
						},0)
					}
				}

				function WrapFunction(){
					var globnames = []
					var globargs = []
					for(var key in global){
						globnames.push(key)							
						globargs.push(global[key])
					}

					// lets push in all masked
					for(var i = 0; i < mask.length; i++){
						var name = mask[i]
						if(!(name in global)){
							globnames.push(name)
						}
					}

					var fnargs = []
					var args = arguments
					var len = arguments.length
					var code = '"use strict"\nreturn function('
					for(var i = 0; i < len - 1; i++){
						if(i) code += ','
						code += args[i]
					}
					code += '){'+args[i]+'}'
					globnames.push(code)
					return Function.apply(null, globnames).apply(null, globargs)
				}

				var global = {
					Object:Object,
					String:String,
					Number:Number,
					Boolean:Boolean,
					console:{
						log:console.log.bind(console)
					},
					setTimeout:setTimeout,
					clearTimeout:clearTimeout,
					setInterval:setInterval,
					clearInterval:clearInterval,
					Function:WrapFunction
				}	

				function postBoot(){
				}

				new Function("Function","global", "worker", source+'\n'+postBoot.toString()+'\npostBoot()\n')(WrapFunction, global, inWorker)
				return inMain
			}			
		}

		var src = 
			'(function(){'+
			'	var global = self\n'+
			'	var worker = {postMessage:self.postMessage.bind(self)}\n'+
			'	self.onmessage = function(msg){worker.onMessage(msg.data)}\n'+
			getJsGlobals.toString()+
			'('+cleanWebWorker.toString()+')()\n'+
			source+'\n'+
			'})()'

		var blob = URL.createObjectURL(new Blob([src], {type: "text/javascript"}))

		return function(){
			var worker = new Worker(blob)
			worker.onmessage = function(msg){
				this.onMessage(msg.data)
			}
			return worker
		}
	}

	// watches a file
	root.watchFile = function(localFile){

	}

	// inject a script tag for url
	root.showParseError = function(path){
		var script = document.createElement('script')
		script.type = 'text/javascript'
		script.src = location.origin+path
		document.getElementsByTagName('head')[0].appendChild(script)
	}

	// downloads a resource
	if(!root.cache) root.cache = {}

	root.downloadResource = function(localFile, isBinary, appProgress){
		return new Promise(function(resolve, reject){


			var ret = root.cache[localFile]
			if(ret){
				if(Array.isArray(ret)){
					root.cache[localFile] = ret = toByteArray(ret[0]).buffer
				}
				console.log("resolving",localFile, root.cache)
				resolve(ret)
				return
			}
			var req = new XMLHttpRequest()
			
			// lets add this node to the canvas tag
			var progressDiv
			var progressTimeout
			if(appProgress){
				progressDiv = document.createElement('span')
				progressDiv.style.marginLeft = 50
				progressDiv.style.display = 'none'
				progressDiv.style.fontSize = '10px'
				progressDiv.style.color = 'white'// = 'margin-left:50;display:block;font-size:10px;color:white'
				progressDiv.innerHTML = 'Loading resource 0%'
				document.body.appendChild(progressDiv)
				req.addEventListener("progress", function(e){
					var pos = e.position || e.loaded
					var total = e.totalSize || e.total
					progressDiv.innerHTML = 'Loading resource '+Math.floor(100*pos / total)+'%<br/>'
				})
				progressTimeout = setTimeout(function(){
					progressTimeout = undefined
					progressDiv.style.display = 'block'
				}, 2000)
			}
			req.addEventListener("error", function(){
				//console.error('Error loading '+localFile)
				//consoe.log('rejecting!')
				//reject(resource)
			})
			req.responseType = isBinary?'arraybuffer':'text'
			req.addEventListener("load", function(){
				if(appProgress){
					document.body.removeChild(progressDiv)
					if(progressTimeout) clearTimeout(progressTimeout)
				}
				if(req.status !== 200){
					return reject(req.status)
				}
				root.cache[localFile] = req.response
				resolve(req.response)
			})
			req.open("GET", location.origin+localFile)
			req.send()
		})
	}

	var canvasses =	document.getElementsByClassName('makepad')
	

	var initApps 
	function init(){
		var failES6
		try{
			new Function("return class test{}")()
		}
		catch(e){
			failES6 = true
		}
		var apps = []
		for(let i = 0; i < canvasses.length; i++){
			var canvas = canvasses[i]
			apps.push({
				main:canvas.getAttribute('main'),
				platform:{
					canvas:canvas,
					search:location.search && location.search.slice(1)
				}
			})

			if(failES6){
				var span = document.createElement('span')
				span.style.color = 'white'
				canvas.parentNode.replaceChild(span, canvas)
				span.innerHTML = "Sorry, makepad needs browser support for ES6 to run<br/>Please update your browser to a more modern one<br/>Update to atleast iOS 10, Safari 10, latest Chrome, Edge or Firefox<br/>Go and update and come back, your browser will be better, faster and more secure!"
			}
		}
		if(failES6) return
		if(root.onInitApps) root.onInitApps(apps) 
		else initApps = apps
	}

	document.addEventListener('DOMContentLoaded', init)

	// load up boot file
	root.downloadResource(root.platformPath+'boot.js').then(function(result){
		// start it up
		try{
			new Function("exports", result)(root)
		}
		catch(e){
			root.showParseError(root.platformPath+'boot.js')
			return
		}
		// if we were slower than DOMContentLoaded
		if(initApps) root.onInitApps(initApps)
	})

	function watchFileChange(){
		var req = new XMLHttpRequest()
		req.timeout = 60000
		req.addEventListener("error", function(){
			setTimeout(watchFileChange, 500)
		})
		req.responseType = 'text'
		req.addEventListener("load", function(){
			if(req.response === '{continue:true}') return watchFileChange()
			if(req.status === 200){
			// do something with data, or not
				location.href = location.href
			}
		})
		req.open("GET", "/$watch?"+(''+Math.random()).slice(2))
		req.send()
	}

	function getJsGlobals(){
		return [
			'console', 'eval', 'Infinity','NaN','undefined','null','isFinite','isNaN','parseFloat','parseInt',
			'Symbol','Error','EvalError','InternalError','RangeError','ReferenceError','TypeError','URIError',
			'Proxy','Map','Set','WeakMap','WeakSet','SIMD','JSON','Generator','GeneratorFunction','Intl','SyntaxError', 
			'Function', 'RegExp', 'Math', 'Object', 'String', 'Number','Boolean','Date', 'Array',
			'Int8Array','Uint8Array','Uint8ClampedArray','Int16Array','Uint16Array','Int32Array','Uint32Array',
			'Float32Array','Float64Array','DataView','ArrayBuffer','setTimeout','clearTimeout','setInterval','clearInterval'
		]
	}

	if(location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname.indexOf('10.') === 0)
		watchFileChange()

	var lookup = []
	var revLookup = []

	var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
	for (var i = 0, len = code.length; i < len; ++i) {
		lookup[i] = code[i]
		revLookup[code.charCodeAt(i)] = i
	}

	revLookup['-'.charCodeAt(0)] = 62
	revLookup['_'.charCodeAt(0)] = 63

	function placeHoldersCount (b64) {
		var len = b64.length
		if (len % 4 > 0) {
			throw new Error('Invalid string. Length must be a multiple of 4')
		}
		return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0
	}

	function byteLength (b64) {
		return (b64.length * 3 / 4) - placeHoldersCount(b64)
	}

	function toByteArray (b64) {
		var i, j, l, tmp, placeHolders, arr
		var len = b64.length
		placeHolders = placeHoldersCount(b64)

		arr = new Uint8Array((len * 3 / 4) - placeHolders)

		// if there are placeholders, only get up to the last complete 4 chars
		l = placeHolders > 0 ? len - 4 : len

		var L = 0

		for (i = 0, j = 0; i < l; i += 4, j += 3) {
			tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)]
			arr[L++] = (tmp >> 16) & 0xFF
			arr[L++] = (tmp >> 8) & 0xFF
			arr[L++] = tmp & 0xFF
		}

		if (placeHolders === 2) {
			tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4)
			arr[L++] = tmp & 0xFF
		} else if (placeHolders === 1) {
			tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2)
			arr[L++] = (tmp >> 8) & 0xFF
			arr[L++] = tmp & 0xFF
		}
		return arr
	}


	function cleanWebWorker(){
		var deprecated = [
			'webkitIDBTransaction','webkitIDBRequest','webkitIDBObjectStore','webkitIDBKeyRange','webkitIDBIndex','webkitIDBFactory',
			'webkitIDBDatabase','webkitIDBCursor'
		]
		var jsGlobals = getJsGlobals()
		var mask = Object.getOwnPropertyNames(self)
		var forceMask = []
		var LocalFunction = self.Function

		self.Function = function WrapFunction(){
			var fnargs = []
			var code = '"use strict"\nreturn function('
			for(var i =0; i < arguments.length - 1; i++){
				if(i) code += ','
				code += arguments[i]
			}
			code += '){'+arguments[i]+'}'
			fnargs.push.apply(fnargs, forceMask)
			fnargs.push(code)
			return LocalFunction.apply(null, fnargs)()
		}

		self.importScripts=function(){}

		for(let i = 0; i < mask.length; i++){
			var name = mask[i]
			if(jsGlobals.indexOf(name) !== -1) continue
			try{
				if(deprecated.indexOf(name)!==-1){
					self[name] = undefined
				}
				else Object.defineProperty(self, name, {value:undefined})
			}
			catch(e){
				forceMask.push(name)
			}
		}
		self = undefined
	}
})({})