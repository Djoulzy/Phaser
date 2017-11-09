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

    initSocket: function() {
        this.game.socket = new Connection(Config.MMOServer.Host, this.onSocketConnected.bind(this));
       	this.game.socket.on("userlogged", this.onUserLogged.bind(this));
      	this.game.socket.on("enemy_move", this.onEnemyMove.bind(this));
      	this.game.socket.on("kill_enemy", this.onRemoveEntity.bind(this));
    },

    initMap: function() {
		this.zeWorld = this.game.add.tilemap('zone1');
	    this.zeWorld.addTilesetImage('Travail');
	    this.terrain = this.zeWorld.createLayer('terrain');
	    this.decors = this.zeWorld.createLayer('decors');
	    this.obstacles = this.zeWorld.createLayer('obstacles');
	    this.terrain.resizeWorld();
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
			if (data.type == "P")
				var new_enemy = new Remote(this.game, data.id, data.face, "", data.x, data.y);
			else
				var new_enemy = new Mob(this.game, data.id, "zombies", data.face, data.x, data.y);
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
		this.bullets = new Shoot(this.game)
		this.explode = new Explode(this.game)

		this.initMap();
		this.initSocket();
		// this.addMainPlayer();
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
				var mobSpeed = Math.ceil((this.game.Properties.ServerSpeed*move.speed)/this.game.Properties.step)*this.game.Properties.step + 50;

				if (move.move == "left") this.entities[i].moveLeft(this.game.Properties.step, mobSpeed)
				else if (move.move == "right") this.entities[i].moveRight(this.game.Properties.step, mobSpeed)
				else if (move.move == "up") this.entities[i].moveUp(this.game.Properties.step, mobSpeed)
				else if (move.move == "down") this.entities[i].moveDown(this.game.Properties.step, mobSpeed)
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
