new require('styles/dark')

module.exports = class extends require('base/drawapp'){
	prototype() {
		this.tools = {
			Bg    :require('shaders/quad').extend({
				//dead :0,
				pixel:function() {$
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('gray')
					//this.stroke('black', 1.)
					return this.result
				},
			}),
			Bomb  :require('shaders/quad').extend({
				pixel:function() {
					this.viewport()
					this.rect(0, 0, this.w, this.h)
					this.fillKeep('red')
					this.strokeKeep('gray', 4.)
					return this.result
				}
				//font    :require('fonts/fontawesome_low.font'),
			}),
			Button:require('stamps/mineButton').extend({
			}),
			Num   :require('shaders/text').extend({
				//font    :require('fonts/ubuntu_monospace_256.font'),
				fontSize:14,
			}),
			//if(i && !(i % 10)) this.turtle.lineBreak()
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
		this.board = 20
		this.grid = []
		this.gridLen = 100
		this.bomb = []
		this.buttonToggle = []
		
		
		for(let i = 0;i < this.gridLen;i++){
			this.grid.push(-1)
			this.buttonToggle.push(false)
			//_=this.grid[i] 
		}
		
		
		for(let i = 0;i < 10;i++){
			this.bombLocation = floor(random() * 100)
			if(this.grid[this.bombLocation] !== 0) {
				this.grid.splice(this.bombLocation, 1, 0)
			}
			else { //if duplicated
				do{
					var newBomb = floor(random() * 100)
				}while(this.grid[newBomb] === 0)
				this.grid.splice(newBomb, 1, 0)
			}
		}
		for(let i = 0;i < this.grid.length;i++){
			let qty = 0
			let grid = this.grid[i]
			let g = this.grid
			if(grid == -1) {
				if(i % 10 == 0) {
					if(g[i - 10] == 0) {qty++}
					if(g[i - 9] == 0) {qty++}
					if(g[i + 1] == 0) {qty++}
					if(g[i + 10] == 0) {qty++}
					if(g[i + 11] == 0) {qty++}
				}
				else if((i + 1) % 10 == 0) {
					if(g[i - 11] == 0) {qty++}
					if(g[i - 10] == 0) {qty++}
					if(g[i - 1] == 0) {qty++}
					if(g[i + 9] == 0) {qty++}
					if(g[i + 10] == 0) {qty++}
				}
				else {
					if(g[i - 1] == 0) {qty++}
					if(g[i - 11] == 0) {qty++}
					if(g[i + 9] == 0) {qty++}
					if(g[i + 10] == 0) {qty++}
					if(g[i - 10] == 0) {qty++}
					if(g[i + 1] == 0) {qty++}
					if(g[i + 11] == 0) {qty++}
					if(g[i - 9] == 0) {qty++}
					
				}
				if(qty > 0) this.grid.splice(i, 1, qty)
			}
		}
	}
	
	onDraw() {
		this.beginBg({
			x:0,
			y:0,
			w:10 * (this.board),
			h:10 * (this.board),
		})
		for(let i = 0;i < this.grid.length;i++){
			let grid = this.grid[i]
			if(grid < 0) {
				this.drawBg({
					w:20,
					h:20
				})
			}
			else if(grid == 0) {
				this.drawBomb({
					w     :19,
					h     :19,
					margin:[.5, .5, .5, .5]
				})
			}
			else {
				this.drawNum({
					text  :'' + grid,
					w     :20,
					h     :20,
					margin:[.9, 6.5, .9, 6.5]
				})
			}
			
		}
		
		
		this.turtle.wx = 0
		this.turtle.wy = 0
		for(let i = 0;i < this.grid.length;i++){
			this.drawButton({
				id     :i,
				toggled:true,
				text   :' ',
				onClick:(btn) =>{
					_=btn
					_=i
					if(this.grid[i] == 0) {
						for(let j = 0;j < this.grid.length;j++){
							let grid = this.grid[j]
							if(grid == 0) {
								this.buttonToggle.splice(j, 1, true)
							}
						}
						this.redraw()
					}
					if(this.grid[i] == -1) {
						let newVal = []
						let oldVal = [i]
						let queue = [i]
						let grid = this.grid
						this.buttonToggle.splice(i, 1, true)
						while(queue.length > 0){
							let q = queue[0]
							if(q % 10 == 0) {
								if(grid[q + 1] == -1) newVal.push(q + 1)
								if(grid[q - 10] == -1) newVal.push(q - 10)
								if(grid[q + 10] == -1) newVal.push(q + 10)
							}
							else if((q + 1) % 10 == 0) {
								if(grid[q - 1] == -1) newVal.push(q - 1)
								if(grid[q - 10] == -1) newVal.push(q - 10)
								if(grid[q + 10] == -1) newVal.push(q + 10)
							}
							else {
								if(grid[q + 1] == -1) newVal.push(q + 1)
								if(grid[q - 1] == -1) newVal.push(q - 1)
								if(grid[q - 10] == -1) newVal.push(q - 10)
								if(grid[q + 10] == -1) newVal.push(q + 10)
							}
							for(let j = newVal.length - 1;j >= 0;j--){
								let n = newVal[j]
								let equalTo = false
								for(let k = 0;k < oldVal.length;k++){
									let o = oldVal[k]
									if(n === o) {
										newVal.splice(j, 1)
										equalTo = true
									}
								}
								if(!equalTo) {
									this.buttonToggle.splice(n, 1, true)
									oldVal.push(n)
									queue.push(newVal.pop())
								}
								
							}
							queue.shift()
						}
						oldVal = []
						this.redraw()
					}
					if(this.grid[i] >= 1) {
						this.buttonToggle.splice(i, 1, true)
						
					}
				},
				toggled:this.buttonToggle[i]
			})
		}
		
		this.endBg()
	}
}