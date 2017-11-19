'use strict'

var Config = require('config')

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

    checkLoadedMaps(x, y) {
        console.log("Player area: "+x+"x"+y)
        for (var px = -1; px < 2; px++) {
            for (var py = -1; py < 2; py++) {
                var ax = x+px
                var ay = y+py
                if (ax < 0 || ay < 0) continue
                else {
                    if (!this.WorldMap[ax+'_'+ay]) {
                        var areaname = ax+'_'+ay
                		this.game.load.tilemap(areaname, 'http://'+Config.MMOServer.Host+'/map/'+areaname, null, Phaser.Tilemap.TILED_JSON);
                    }
                }
            }
        }
        this.game.load.start();
	}

    renderMap() {
        this.WorldMap[cacheKey] = this.game.add.tilemap(cacheKey);
        this.WorldMap[cacheKey].addTilesetImage('final');
        this.game.backLayer.add(this.WorldMap[cacheKey].createLayer('terrain'))
        this.game.backLayer.add(this.WorldMap[cacheKey].createLayer('obstacles'))

        var newWidth = (parseInt(coord[0])+1)*this.game.Properties.areaWidth*this.game.Properties.step
        var newHeight = (parseInt(coord[1])+1)*this.game.Properties.areaHeight*this.game.Properties.step
        if (this.game.world.width > newWidth) newWidth = this.game.world.width
        if (this.game.world.height > newHeight) newHeight = this.game.world.height
        this.game.world.setBounds(0, 0, newWidth, newHeight)
        console.log("Area "+cacheKey+" loaded - New World bounds : "+this.game.world.width+"x"+this.game.world.height)
    }

    getTileInArea(x, y) {
		var map = this.WorldMap[this.playerArea.x+'_'+this.playerArea.y]
		var newX = x - this.playerArea.x*this.game.Properties.areaWidth
		var newY = y - this.playerArea.y*this.game.Properties.areaHeight
		return map.getTile(newX, newY, "obstacles")
	}
}

module.exports = Map
