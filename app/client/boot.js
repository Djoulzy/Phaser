'use strict';

const Config = require('config');

function Boot(){}

Boot.prototype = {
    preload: function(){
        this.game.stage.disableVisibilityChange = true;
        this.game.stage.backgroundColor = 0x3b0760;
        this.load.onLoadComplete.addOnce(this.onLoadComplete, this);

        this.showLoadingText();
        this.loadAssets();
    },

    onLoadComplete: function() {
        this.game.state.start('play');
    },

    loadAssets: function() {
		 // game.load.image('zombie_tiles', 'assets/zombie_tiles.png');
	  	this.game.load.image('Travail', 'assets/Travail.png');
	  	this.game.load.tilemap('zone1', 'http://'+Config.MMOServer.Host+'/data/zone1.json', null, Phaser.Tilemap.TILED_JSON);
	  	// game.load.tilemap('terrain', 'assets/zone1_terrain.csv', null, Phaser.Tilemap.CSV);
	  	// game.load.tilemap('obstacles', 'assets/zone1_obstacles.csv', null, Phaser.Tilemap.CSV);
	  	this.game.load.spritesheet('h1', 'assets/h1.png', 32, 32);
	  	this.game.load.spritesheet('h2', 'assets/h2.png', 32, 32);

	  	this.game.load.atlas('zombies', 'assets/ZombieSheet.png', 'assets/ZombieSheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
	  	this.game.load.atlas('shoot', 'assets/shoot.png', 'assets/shoot.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
    },

    showLoadingText: function(){
        var loadingText = "- Loading -";
        var text = this.game.add.text(this.game.world.centerX, this.game.world.centerY, loadingText);
        //  Centers the text
        text.anchor.set(0.5);
        text.align = 'center';

        //  Our font + size
        text.font = 'Arial';
        text.fontWeight = 'bold';
        text.fontSize = 70;
        text.fill = '#ffffff';
    }
};

module.exports = Boot;