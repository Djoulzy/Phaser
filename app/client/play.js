'use strict'

var Config = require('config')
var Connection = require('client/wsconnect')
var Local = require('client/local')
var Remote = require('client/remote')
var Mob = require('client/mob')
var Shoot = require('client/shoot')
var Explode = require('client/explode')

function Play(){}

Play.prototype = {

    create: function() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.cursors = this.game.input.keyboard.addKeys({ 'space': Phaser.Keyboard.SPACEBAR, 'up': Phaser.Keyboard.UP, 'down': Phaser.Keyboard.DOWN, 'left': Phaser.Keyboard.LEFT, 'right': Phaser.Keyboard.RIGHT });

		this.entities = [];

        this.game.backLayer = this.game.add.group()
		this.game.midLayer = this.game.add.group()
		this.game.frontLayer = this.game.add.group()

		this.initSocket()
		this.initPlayer()
		this.bullets = new Shoot(this.game)
		this.explode = new Explode(this.game)

		this.initMap()
    },

	initMap: function() {
		this.game.WorldMap.renderMap()
        // this.game.world.bringToTop(this.game.backLayer);
	},

    initSocket: function() {
      	this.game.socket.on("enemy_move", this.onEnemyMove.bind(this));
      	this.game.socket.on("kill_enemy", this.onRemoveEntity.bind(this));
    },

	initPlayer: function() {
        this.game.player.initSprite()
	},

	findplayerbyid: function(id) {
		for (var i = 0; i < this.entities.length; i++) {
			if (this.entities[i].User_id == id) {
				return this.entities[i];
			}
		}
		return false
	},

    // redrawPlayer: function() {
    //     console.log("Reload texture for sprite "+this.User_id)
    //     this.sprite.loadTexture(this.face, 0, false);
    // },

	newEntitie: function(data) {
		var movePlayer = this.findplayerbyid(data.id);
		if (this.findplayerbyid(data.id)) return
		else {
			if (data.typ == "P") {
                console.log("New Remote Player")
                this.game.load.spritesheet(data.png, 'http://'+Config.MMOServer.Host+'/data/'+data.png+'.png', 32, 32);
				var new_enemy = new Remote(this.game, data.id, data.png, "", data.x, data.y);
                // this.game.load.onLoadComplete.addOnce(this.redrawPlayer, new_enemy);
                this.game.load.start();
            } else {
				var new_enemy = new Mob(this.game, data.id, "zombies", data.png, data.x, data.y);
            }
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

	updatePlayer: function() {
		// game.physics.arcade.collide(player.sprite, obstacles, playerBlocked);
        if (this.game.player.inGame) {
    		if (!this.game.player.isMoving()) {
    			if (this.cursors.left.isDown) this.game.player.moveLeft(this.game.Properties.step, this.game.Properties.speed)
    			else if (this.cursors.right.isDown) this.game.player.moveRight(this.game.Properties.step, this.game.Properties.speed)
    			else if (this.cursors.up.isDown) this.game.player.moveUp(this.game.Properties.step, this.game.Properties.speed)
    			else if (this.cursors.down.isDown) this.game.player.moveDown(this.game.Properties.step, this.game.Properties.speed)
    			else if (this.cursors.space.isDown) {
    				var portee = 5
    				this.bullets.fire(this.game.player, portee, this.game.Properties.speed);
    				// this.loadNewMap()
    			}
    		}
        }
	},

	updateRemotePlayers: function() {
		for (var i = 0; i < this.entities.length; i++) {
            if (this.entities[i].inGame) {
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
		}
	},

    update: function() {
		this.updatePlayer()
		this.updateRemotePlayers()
    },

	render: function() {
		// this.game.debug.spriteInfo(this.game.player.sprite, 32, 32);
        // this.game.backLayer.forEach(this.game.debug.spriteInfo);
	}
};

module.exports = Play;
