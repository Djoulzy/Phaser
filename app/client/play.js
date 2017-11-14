'use strict'

var Config = require('config')
var Connection = require('client/wsconnect')
var Local = require('client/local')
var Remote = require('client/remote')
var Mob = require('client/mob')
var Shoot = require('client/shoot')
var Explode = require('client/explode')

function Play(){}

// TPOW.States.Game = function(game) {};
// TPOW.States.Game.prototype = {
// 	 create : function() {
// 		 // Load the current over world map
// 		 this.home_village_f0 = this.game.add.tilemap('home_village_f0');
// 		 this.home_village_f0.addTilesetImage('city_inside', 'tiles_city_inside');
// 		 this.home_village_f0.addTilesetImage('forest_tiles', 'tiles_forest_tiles');
// 		 this.home_village_f0.addTilesetImage('PathAndObjects_0', 'tiles_PathAndObjects_0');
// 		 this.ground = this.home_village_f0.createLayer('ground');
// 		 // Resize the game world to match the layer dimensions
// 		 this.ground.resizeWorld();        // Load each module
// 		 // TODO: Auto load modules based on map content
// 		 this.house0_f0 = this.game.add.tilemap('house0_f0');
// 		 this.house0_f0.addTilesetImage('city_outside', 'tiles_city_outside');
// 		 this.house0_f0.addTilesetImage('interior', 'tiles_interior');
// 		 this.house0_f0.addTilesetImage('hyptosis_tile-art-batch-3', 'tiles_hyptosis_tile-art-batch-3');
// 		 this.house0_f0.addTilesetImage('base_out_atlas', 'tiles_base_out_atlas');
// 		 this.house0_floor = this.house0_f0.createLayer('floor');
// 		 this.house0_indoors0 = this.house0_f0.createLayer('indoors0');
// 		 this.house0_indoors1 = this.house0_f0.createLayer('indoors1');
// 		 this.house0_outdoors0 = this.house0_f0.createLayer('outdoors0');
// 		 this.house0_outdoors1 = this.house0_f0.createLayer('outdoors1');        // Test
// 		 this.house0_floor.alpha = 0;
// 		 this.house0_indoors0.alpha = 0;
// 		 this.house0_indoors1.alpha = 0;        /**         * More content not relevant to question.         */
// 	 },
// 	 update : function() {
// 		 var alpha = this.house0_floor.alpha;
// 		 if (alpha != 1) {
// 			 alpha = Math.min(1, alpha + 0.005);        }
// 			 this.house0_floor.alpha = alpha;
// 			 this.house0_indoors0.alpha = alpha;
// 			 this.house0_indoors1.alpha = alpha;
// 			 this.house0_outdoors0.alpha = 1 - alpha;
// 			 this.house0_outdoors1.alpha = 1 - alpha;        /**         * More content not relevant to question.         */
// 	}};
//
// 	layer.fixedToCamera = false;
// 	layer.scrollFactorX = 0;
// 	layer.scrollFactorY = 0;
// 	layer.position.set(pixelX, pixelY);

Play.prototype = {

    initSocket: function() {
        this.game.socket = new Connection(Config.MMOServer.Host, this.onSocketConnected.bind(this));
       	this.game.socket.on("userlogged", this.onUserLogged.bind(this));
      	this.game.socket.on("enemy_move", this.onEnemyMove.bind(this));
      	this.game.socket.on("kill_enemy", this.onRemoveEntity.bind(this));
    },

    initMap: function() {
		this.zeWorld = this.game.add.tilemap('area1');
	    this.zeWorld.addTilesetImage('zombie_tiles');
	    this.terrain = this.zeWorld.createLayer('terrain');
	    this.decors = this.zeWorld.createLayer('decors');
	    this.obstacles = this.zeWorld.createLayer('obstacles');
        this.game.world.setBounds(0,0,320,320);

		this.loadNewMap()
    },

	loadNewMap: function() {
		// this.game.load.tilemap('zone2', 'http://'+Config.MMOServer.Host+'/data/zone2.json', null, Phaser.Tilemap.TILED_JSON);
        this.NewWorld = this.game.add.tilemap('area2');
	    this.NewWorld.addTilesetImage('zombie_tiles');
        this.terrain_2 = this.NewWorld.createLayer('terrain');
	    this.decors_2 = this.NewWorld.createLayer('decors');
	    this.obstacles_2 = this.NewWorld.createLayer('obstacles');
        this.game.world.setBounds(0,0,10240,10240);
	},

	findGetParameter: function(parameterName) {
		var result = null
		var tmp = []
		location.search.substr(1).split("&").forEach(function (item) {
			tmp = item.split("=");
			if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
		})
		return result
	},

	findplayerbyid: function(id) {
		for (var i = 0; i < this.entities.length; i++) {
			if (this.entities[i].User_id == id) {
				return this.entities[i];
			}
		}
		return false
	},

	newEntitie: function(data) {
		var movePlayer = this.findplayerbyid(data.id);
		if (this.findplayerbyid(data.id)) return
		else {
			if (data.typ == "P")
				var new_enemy = new Remote(this.game, data.id, data.png, "", data.x, data.y);
			else
				var new_enemy = new Mob(this.game, data.id, "zombies", data.png, data.x, data.y);
			this.entities.push(new_enemy);
		}
	},

	onEnemyMove: function(data) {
		if (data.id == this.game.Properties.pseudo) {
			return
		}

		var movePlayer = this.findplayerbyid(data.id);
		if (!movePlayer) {
			this.newEntitie(data)
			return
		}
		movePlayer.moves.push(data)
	},

	onRemoveEntity: function(id) {
		var removePlayer = this.findplayerbyid(id);
		if (!removePlayer) {
			console.log('Player not found: ', id)
			return
		}

		this.explode.boom(removePlayer.sprite)
		removePlayer.destroy();
		this.entities.splice(this.entities.indexOf(removePlayer), 1);
	},

	onSocketConnected: function() {
		var passphrase = this.findGetParameter("key")
		this.game.socket.logon(passphrase);
	},

    onUserLogged: function(pseudo) {
		this.game.Properties.in_game = true
		this.game.Properties.pseudo = pseudo

		this.player = new Local(this.game, pseudo, 'h1', 2, 2);
		this.game.camera.follow(this.player.sprite);
    },

    create: function() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.cursors = this.game.input.keyboard.addKeys({ 'space': Phaser.Keyboard.SPACEBAR, 'up': Phaser.Keyboard.UP, 'down': Phaser.Keyboard.DOWN, 'left': Phaser.Keyboard.LEFT, 'right': Phaser.Keyboard.RIGHT });

		this.entities = [];

		this.initMap();
		this.initSocket();
		// this.addMainPlayer();
		this.bullets = new Shoot(this.game)
		this.explode = new Explode(this.game)
    },

	updatePlayer: function() {
		// game.physics.arcade.collide(player.sprite, obstacles, playerBlocked);

		if (!this.player.isMoving()) {
			if (this.cursors.left.isDown) this.player.moveLeft(this.zeWorld, this.game.Properties.step, this.game.Properties.speed)
			else if (this.cursors.right.isDown) this.player.moveRight(this.zeWorld, this.game.Properties.step, this.game.Properties.speed)
			else if (this.cursors.up.isDown) this.player.moveUp(this.zeWorld, this.game.Properties.step, this.game.Properties.speed)
			else if (this.cursors.down.isDown) this.player.moveDown(this.zeWorld, this.game.Properties.step, this.game.Properties.speed)
			else if (this.cursors.space.isDown) {
				var portee = 5
				this.bullets.fire(this.player, portee, this.game.Properties.speed);
				// this.loadNewMap()
			}
		}
	},

	updateRemotePlayers: function() {
		for (var i = 0; i < this.entities.length; i++) {
			if (this.entities[i].moves.length > 0 && !this.entities[i].isMoving()) {
				var move = this.entities[i].moves.shift()
				this.entities[i].dest_X = move.x;
				this.entities[i].dest_Y = move.y;
				this.entities[i].PlayerIsMoving = true
				var mobSpeed = Math.ceil((this.game.Properties.ServerSpeed * move.spd) / this.game.Properties.step) * this.game.Properties.step + 50;

				if (move.mov == "left") this.entities[i].moveLeft(this.game.Properties.step, mobSpeed)
				else if (move.mov == "right") this.entities[i].moveRight(this.game.Properties.step, mobSpeed)
				else if (move.mov == "up") this.entities[i].moveUp(this.game.Properties.step, mobSpeed)
				else if (move.mov == "down") this.entities[i].moveDown(this.game.Properties.step, mobSpeed)
			}
		}
	},

    update: function() {
		if (this.game.Properties.in_game) {
			this.updatePlayer()
		}
		this.updateRemotePlayers()
    },

	render: function() {
	}
};

module.exports = Play;
