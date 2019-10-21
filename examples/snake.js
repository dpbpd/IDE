new require('styles/dark')
module.exports = class extends require('base/drawapp'){ //top
	prototype() {
		this.tools = {
			Bg    :require('shaders/quad').extend({
				dead :0,
				pixel:function() {$
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('gray')
					this.stroke('#2b98c557', 2.)
					return this.result
				},
			}),
			Text  :require('shaders/text').extend({
				fontSize    :32,
				align       :[0.5, 0.5],
				boldness    :0.,
				outlineWidth:0.04,
				shadowColor :'#0009',
				shadowBlur  :1.0,
				shadowSpread:0.,
				shadowOffset:[2., 2],
				dy          :-4.1,
				lineSpacing :0.9,
			}),
			Quad  :{
				dead  :0,
				states:{
					default:{
						duration:0.05,
						//time    :{fn:'ease', begin:0, end:10},
						from    :{
							x:null,
							y:null
						},
						to      :{
							x:null,
							y:null
						}
					}
				},
				pixel :function() {$
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('green')
					this.stroke(mix('black', 'red', this.dead), 1.)
					return this.result
				},
			},
			AiQuad:require('shaders/quad').extend({
				dead :0,
				pixel:function() {$
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('orange')
					this.strokeKeep(mix('black', 'blue', this.dead), 1.)
					return this.result
				}
			}),
			Food  :require('shaders/quad').extend({
				pixel:function() {$
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('#079')
					this.strokeKeep('#d19f38ff', 2.)
					return this.result
				},
			}),
			Obs   :require('shaders/quad').extend({
				pixel:function() {$
					this.viewport()
					this.rect(0., 0., this.w, this.h)
					this.fillKeep('gray')
					this.stroke('black', 3.5)
					return this.result
				},
			}),
		}
	}
	onKeyDown(e) {
		if(e.name === 'upArrow') {
			if(this.dir[0] === 0 && this.dir[1] === 1) {
				this.dir = [0, 1]
			}
			else {
				this.dir = [0, -1]
			}
		}
		if(e.name === 'downArrow') {
			if(this.dir[0] === 0 && this.dir[1] - 1) {
				this.dir = [0, -1]
			}
			else {
				this.dir = [0, 1]
			}
		}
		if(e.name === 'leftArrow') {
			if(this.dir[0] === 1 && this.dir[1] === 0) {
				this.dir = [1, 0]
			}
			else {
				this.dir = [-1, 0]
			}
		}
		if(e.name === 'rightArrow') {
			if(this.dir[0] === -1 && this.dir[1] === 0) {
				this.dir = [-1, 0]
			}
			else {
				this.dir = [1, 0]
			}
		}
		if(e.name === 'w') {
			if(this.dir[0] === 0 && this.dir[1] === 1) {
				this.dir = [0, 1]
			}
			else {
				this.dir = [0, -1]
			}
		}
		if(e.name === 's') {
			if(this.dir[0] === 0 && this.dir[1] - 1) {
				this.dir = [0, -1]
			}
			else {
				this.dir = [0, 1]
			}
		}
		if(e.name === 'a') {
			if(this.dir[0] === 1 && this.dir[1] === 0) {
				this.dir = [1, 0]
			}
			else {
				this.dir = [-1, 0]
			}
		}
		if(e.name === 'd') {
			if(this.dir[0] === -1 && this.dir[1] === 0) {
				this.dir = [-1, 0]
			}
			else {
				this.dir = [1, 0]
			}
		}
		if(e.name === 'f') {
			this.food = [floor(random() * this.board), floor(random() * this.board)]
		}
		if(e.name === 'k') {
			this.dead = true
		}
		if(e.name === 'space') {
			this.start()
		}
	}
	constructor() {
		super()
		this.start()
		setInterval(_=>{
			this.step()
			this.AI()
			this.redraw()
		}, this.speed)
	}
	
	start() {
		this.snake = [[0, 0]]
		this.ai = [[29, 29]]
		this.len = 1
		this.aiLen = 1
		this.speed = 150
		this.dir = [1, 0]
		this.board = 30
		this.border = [0, 0, this.board, this.board]
		this.dead = false
		this.eatEachOther = 0
		//this.food = [23, 0] // tester
		this.food = [floor(random() * this.board), floor(random() * this.board)]
		this.obs = []
		this.openList = []
		this.closedList = []
		for(let i = 0;i < 5;i++){
			var wx = floor(random() * this.board), wy = floor(random() * this.board)
			//var wx = 19, wy = 22 // tester
			this.cur = []
			this.par = []
			this.cur.push([wx, wy])
			this.par.push([wx, wy])
			this.obs.push([wx, wy])
			for(let i = 0;i < 4;i++){
				let cur = this.cur[0]
				let par = this.par[0]
				//let walk = 1 // tester
				let walk = (random() * 3.)
				if(cur[0] == par[0] && cur[1] - 1 == par[1]) { //moved down
					if(walk < 1.) {
						if(cur[0] == 29) {wx += -1,wy += 0}
						else {wx += 1,wy += 0}
					}
					else if(walk < 2.) {
						if(cur[1] == 29) {wx += -1,wy += 0}
						else {wx += 0,wy += 1}
					}
					else {
						if(cur[0] == 0) {wx += 1,wy += 0}
						else {wx += -1,wy += 0}
					}
					this.obs.push([wx, wy])
					this.par.shift()
					this.par.push(this.cur.shift())
					this.cur.push([wx, wy])
				}
				if(cur[0] + 1 == par[0] && cur[1] == par[1]) { //moved left
					if(walk < 1.) {
						if(cur[1] == 29) {wx += -1,wy += 0}
						else {wx += 0,wy += 1}
					}
					else if(walk < 2.) {
						if(cur[0] == 0) {wx += 0,wy += -1}
						else {wx += -1,wy += 0}
					}
					else {
						if(cur[1] == 0) {wx += -1,wy += 0}
						else {wx += 0,wy += -1}
					}
					this.obs.push([wx, wy])
					this.par.shift()
					this.par.push(this.cur.shift())
					this.cur.push([wx, wy])
				}
				if(cur[0] == par[0] && cur[1] + 1 == par[1]) { //moved up
					if(walk < 1.) {
						if(cur[0] == 0) {wx += 0,wy += -1}
						else {wx += -1,wy += 0}
					}
					else if(walk < 2.) {
						if(cur[1] == 0) {wx += -1,wy += 0}
						else {wx += 0,wy += -1}
					}
					else {
						if(cur[0] == 29) {wx += 0,wy += -1}
						else {wx += 1,wy += 0}
					}
					this.obs.push([wx, wy])
					this.par.shift()
					this.par.push(this.cur.shift())
					this.cur.push([wx, wy])
				}
				if(cur[0] - 1 == par[0] && cur[1] == par[1]) { //moved right
					if(walk < 1.) {
						if(cur[1] == 0) {wx += 0,wy += 1}
						else {wx += 0,wy += -1}
					}
					else if(walk < 2.) {
						if(cur[0] == 29) {wx += 0,wy += 1}
						else {wx += 1,wy += 0}
					}
					else {
						if(cur[1] == 29) {wx += 0,wy += -1}
						else {wx += 0,wy += 1}
					}
					this.obs.push([wx, wy])
					this.par.shift()
					this.par.push(this.cur.shift())
					this.cur.push([wx, wy])
				}
				if(cur[0] == par[0] && cur[1] == par[1]) { //start obsNode
					//walk = 4 //tester
					walk = (random() * 10)
					if(walk < 2.5) {
						if(cur[0] == 29) {wx += 0,wy += 1}
						else {wx += 1,wy += 0}
					}
					else if(walk < 5) {
						if(cur[1] == 29) {wx += -1,wy += 0}
						else {wx += 0,wy += 1}
					}
					else if(walk < 7.5) {
						if(cur[0] == 0) {wx += 0,wy += -1}
						else {wx += -1,wy += 0}
					}
					else {
						if(cur[1] == 0) {wx += 1,wy += 0}
						else {wx += 0,wy += -1}
					}
					this.obs.push([wx, wy])
					this.par.shift()
					this.par.push(this.cur.shift())
					this.cur.push([wx, wy])
				}
			}
		}
		for(let i = 0;i < this.obs.length;i++){
			let storeObs = this.obs[i]
			this.closedList.push(storeObs)
		}
	}
	step() {
		if(this.dead) return
		let obs = this.obs
		let food = this.food
		let head = this.snake[0]
		let next = [
			head[0] + this.dir[0],
			head[1] + this.dir[1],
		]
		this.snake.unshift(next)
		if(next[0] < this.border[0]) this.dead = true
		if(next[1] < this.border[1]) this.dead = true
		if(next[0] >= this.border[2]) this.dead = true
		if(next[1] >= this.border[3]) this.dead = true
		if(next[0] == food[0] && next[1] == food[1]) {
			this.len++
			this.eatEachOther++
			this.closedList.splice(this.obs.length, this.closedList.length)
			if(this.speed > 50) {
				this.speed -= 2
			}
			if(this.eatEachOther >= 10) {
				_=this.ai.length + 'ai'
				if(this.ai.length == 1) {
					_='happens'
					this.dead = true
				}
				this.ai.pop()
				this.aiLen--
			}
			this.food = [floor(random() * this.board), floor(random() * this.board)]
		}
		for(let i = 0;i < this.obs.length;i++){
			let obs = this.obs[i]
			if(next[0] == obs[0] && next[1] == obs[1]) this.dead = true
		}
		for(var i = 1;i < this.snake.length;i++){
			let seg = this.snake[i]
			if(next[0] == seg[0] && next[1] == seg[1]) this.dead = true
			
			if(food[0] == seg[0] && food[1] == seg[1]) {
				this.food = [floor(random() * this.board), floor(random() * this.board)]
			}
		}
		for(let i = 0;i < this.ai.length;i++){
			let aiSeg = this.ai[i]
			if(next[0] == aiSeg[0] && next[1] == aiSeg[1]) this.dead = true
		}
		if(this.snake.length > this.len) {
			this.snake.pop()
		}
		if(this.dead) {
			//setTimeout(_=>this.start(), 700)
		}
	}
	
	AI() {
		if(this.dead) return
		let test2 = this.openList
		let food = this.food
		let obs = this.obs[0]
		let aiHead = this.ai[0]
		let head = this.snake[0]
		let lowVal = this.board * 2
		let lowCoords = []
		let currentNode = [aiHead[0], aiHead[1]]
		for(let i = 0;i < 4;i++){
			let wx = currentNode[0], wy = currentNode[1]
			//var wx = 6, wy = 3
			let openListWalk = i
			if(openListWalk == 0) {
				wx += 1,wy += 0
			}
			if(openListWalk == 1) {
				wx += 0,wy += 1
			}
			if(openListWalk == 2) {
				wx += -1,wy += 0
			}
			if(openListWalk == 3) {
				wx += 0,wy += -1
			}
			this.openList.push([wx, wy])
		}
		if(this.ai.length == 1) {
			this.closedList.push(currentNode)
		}
		// remove any closedList
		for(let i = this.openList.length - 1;i >= 0;i--){
			let open = this.openList[i]
			
			if(open[0] == -1 || open[1] == -1 || open[0] == this.board || open[1] == this.board) {
				this.openList.splice(i, 1)
			}
			for(let j = 0;j < this.closedList.length;j++){
				let close = this.closedList[j]
				if(open[0] == close[0] && open[1] == close[1]) {
					this.openList.splice(i, 1)
				}
			}
			for(let k = 0;k < this.ai.length;k++){
				let aiSeg = this.ai[k]
				if(aiSeg[0] == open[0] && aiSeg[1] == open[1]) {
					this.openList.splice(i, 1)
				}
				
			}
			for(let l = 0;l < this.snake.length;l++){
				let seg = this.snake[l]
				if(seg[0] == open[0] && seg[1] == open[1]) {
					this.openList.splice(i, 1)
				}
			}
		}
		
		if(this.openList.length == 0) {
			//console.log('entered isNaN')
			for(let i = 0;i < 4;i++){
				let wx = currentNode[0], wy = currentNode[1]
				//var wx = 6, wy = 3
				let openListWalk = i
				if(openListWalk == 0) {
					wx += 1,wy += 1
				}
				if(openListWalk == 1) {
					wx += -1,wy += 1
				}
				if(openListWalk == 2) {
					wx += -1,wy += -1
				}
				if(openListWalk == 3) {
					wx += -1,wy += 1
				}
				this.openList.push([wx, wy])
			}
			for(let i = this.openList.length - 1;i >= 0;i--){
				let open = this.openList[i]
				
				if(open[0] == -1 || open[1] == -1 || open[0] == this.board || open[1] == this.board) {
					this.openList.splice(i, 1)
				}
				for(let j = 0;j < this.closedList.length;j++){
					let close = this.closedList[j]
					if(open[0] == close[0] && open[1] == close[1]) {
						this.openList.splice(i, 1)
					}
				}
				
			}
		}
		for(let l = 0;l < this.openList.length;l++){
			let open = this.openList[l]
			let dx = open[0] - food[0]
			let dy = open[1] - food[1]
			let h = abs(dx) + abs(dy)
			if(h <= lowVal) {
				lowVal = h
				lowCoords = open
			}
		}
		
		this.ai.unshift(lowCoords)
		this.openList.splice(0, this.openList.length)
		if(this.ai.length > this.aiLen) {
			this.ai.pop()
		}
		if(aiHead[0] == food[0] && aiHead[1] == food[1]) {
			this.aiLen++
			this.eatEachOther++
			this.closedList.splice(this.obs.length, (this.closedList.length - this.obs.length))
			if(this.speed > 50) {
				this.speed -= 2
			}
			if(this.eatEachOther >= 10) {
				_=this.snake.length + 'ai'
				if(this.snake.length == 1) {
					_='happens'
					this.dead = true
				}
				this.snake.pop()
				this.len--
			}
			this.food = [floor(random() * this.board), floor(random() * this.board)]
		}
		for(var i = 1;i < this.ai.length;i++){
			let aiSeg = this.ai[i]
			if(food[0] == aiSeg[0] && food[1] == aiSeg[1]) {
				this.food = [floor(random() * this.board), floor(random() * this.board)]
			}
		}
		for(let i = 0;i < this.obs.length;i++){
			let obs = this.obs[i]
			if(food[0] == obs[0] && food[1] == obs[1]) this.food = [floor(random() * this.board), floor(random() * this.board)]
		}
		if(this.aiLen == 150) {
			this.start()
		}
	}
	
	onDraw() {
		//this.step()
		//this.AI()
		this.beginBg({
			x:0,
			y:0,
			w:10 * this.border[2],
			h:10 * this.border[3],
		})
		this.drawText({
			align   :[1, 1],
			fontSize:14,
			order   :1,
			text    :this.len + '-' + this.aiLen
			//text    :(this.len - 1) + '-' + (this.aiLen - 1)
		})
		this.endBg()
		this.drawFood({
			x:10 * this.food[0],
			y:10 * this.food[1],
			w:10,
			h:10,
		})
		for(var i = 0;i < this.obs.length;i++){
			let obs = this.obs[i]
			this.drawObs({
				x:10 * obs[0],
				y:10 * obs[1],
				w:10,
				h:10,
			})
		}
		for(var i = 0;i < this.ai.length;i++){
			let aiSeg = this.ai[i]
			this.drawAiQuad({
				x   :aiSeg[0] * 10,
				y   :aiSeg[1] * 10,
				w   :10,
				h   :10,
				dead:this.dead
			})
		}
		for(var i = 0;i < this.snake.length;i++){
			let seg = this.snake[i]
			this.drawQuad({
				x   :seg[0] * 10,
				y   :seg[1] * 10,
				w   :10,
				h   :10,
				dead:this.dead,
			})
		}
		//setTimeout(_=>this.redraw(), this.speed)
	}
}

