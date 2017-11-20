'use strict'

var Config = require('config')

class Area
{
	// Status :
	// 0: init
	// 1: prending / loading
	// 2: active
	// 3: disabled

	constructor(x, y, status) {
        this.data = null
        this.coord = new Phaser.Point(x, y)
        this.status = status
		this.name = x+'_'+y
		this.tarrain = null
		this.obstacles = null
    }
}

class Map
{
    constructor(game) {
        this.WorldMap = new Array()
        this.game = game
        this.playerArea = new Phaser.Point(0, 0)
    }

    updateArea(x, y) {
		var newarea = new Phaser.Point(Math.floor(x/this.game.Properties.areaWidth), Math.floor(y/this.game.Properties.areaHeight))
		if (newarea != this.playerArea) {
			this.playerArea = newarea
			this.checkLoadedMaps(this.playerArea.x, this.playerArea.y)
		}
	}

    init(x, y) {
		this.playerArea.set(Math.floor(x/this.game.Properties.areaWidth), Math.floor(y/this.game.Properties.areaHeight))
        console.log("Player area: "+this.playerArea.toString())
        for (var py = -1; py < 2; py++) {
        	for (var px = -1; px < 2; px++) {
                var ax = this.playerArea.x+px
                var ay = this.playerArea.y+py
                if (ax < 0 || ay < 0) {
					this.WorldMap.push(new Area(ax, ay, 0))
				} else {
					var areaname = ax+'_'+ay
            		this.game.load.tilemap(areaname, 'http://'+Config.MMOServer.Host+'/map/'+areaname, null, Phaser.Tilemap.TILED_JSON);
					this.WorldMap.push(new Area(ax, ay, 1))
                }
            }
        }
        this.game.load.start();
		// var areaname = this.playerArea.x+'_'+this.playerArea.y
		// this.game.load.tilemap(areaname, 'http://'+Config.MMOServer.Host+'/map/'+areaname, null, Phaser.Tilemap.TILED_JSON);
		// this.WorldMap.push(new Area(this.playerArea.x, this.playerArea.y, 1))
	}

	checkLoadedMaps(x, y) {
	}

    renderMap() {
		console.log(this.WorldMap)
		this.WorldMap.forEach(function(element, index) {
			if (element.status == 1) {
				element.data = this.game.add.tilemap(element.name);
		        element.data.addTilesetImage('final');
				element.terrain = element.data.createLayer('terrain')
				element.obtacles = element.data.createLayer('obstacles')

		        // this.game.backLayer.add(terrain)
		        // this.game.backLayer.add(obtacles)

		        var newWidth = (element.coord.x+1)*this.game.Properties.areaWidth*this.game.Properties.step
		        var newHeight = (element.coord.y+1)*this.game.Properties.areaHeight*this.game.Properties.step
		        if (this.game.world.width > newWidth) newWidth = this.game.world.width
		        if (this.game.world.height > newHeight) newHeight = this.game.world.height
		        this.game.world.setBounds(0, 0, newWidth, newHeight)
		        console.log("Area "+element.name+" loaded - New World bounds : "+this.game.world.width+"x"+this.game.world.height)
				element.status = 2
			}
		}, this);
    }

    getTileInArea(x, y) {
		var map = this.WorldMap[4].data
		var newX = x - this.playerArea.x*this.game.Properties.areaWidth
		var newY = y - this.playerArea.y*this.game.Properties.areaHeight
		return map.getTile(newX, newY, "obstacles")
	}
}

module.exports = Map
