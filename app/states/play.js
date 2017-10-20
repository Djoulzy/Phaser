'use strict';


function Play(){}

Play.prototype = {
    preload: function(){
        this.game.load.image('tiles', 'gameAssets/tile.png');
    	this.game.load.tilemap('map', 'gameAssets/test.csv', null, Phaser.Tilemap.CSV);
    	// game.load.image('tiles', 'assets/zombie_a5.png');
    	this.game.load.spritesheet('h1', 'gameAssets/h1.png', 32, 32);
    	this.game.load.spritesheet('h2', 'gameAssets/h2.png', 32, 32);

    	this.game.load.atlas('zombies', 'gameAssets/ZombieSheet.png', 'gameAssets/ZombieSheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
    },
    create: function(){
      console.log('creatttttttte', this.game.keyCrypt);


      this.game.physics.startSystem(Phaser.Physics.ARCADE);
     	this.cursors = this.game.input.keyboard.createCursorKeys();

     	this.zeWorld = this.game.add.tilemap('map', 32, 32);
      this.zeWorld.addTilesetImage('tiles');
      this.layer = this.zeWorld.createLayer(0);
     	this.game.physics.arcade.enable(this.layer);
      this.layer.resizeWorld();
     	this.zeWorld.setCollisionBetween(45, 100);
     	this.layer.debug = true;
    },

    update: function(){

    }
};

module.exports = Play;
