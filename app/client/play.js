'use strict'

var Config = require('config');
var Connection = require('client/wsconnect');
var Local = require('client/local');
var Remote = require('client/remote');
var Mob = require('client/mob');

function Play(){}

Play.prototype = {

    initSocket: function() {
        this.game.socket = new Connection(Config.ServerHost, this.onSocketConnected);
       	this.game.socket.on("userlogged", this.onUserLogged());
      	this.game.socket.on("enemy_move", this.onEnemyMove());
      	this.game.socket.on("kill_enemy", this.onRemovePlayer());
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
		var result = null,
		tmp = [];
		location.search.substr(1).split("&").forEach(function (item) {
			tmp = item.split("=");
			if (tmp[0] === parameterName) result = decodeURIComponent(tmp[1]);
		});
		return result;
	},

	findplayerbyid: function(id) {
		for (var i = 0; i < entities.length; i++) {
			if (entities[i].User_id == id) {
				return entities[i];
			}
		}
		return false
	},

	onEnemyMove: function(data) {
		if (data.id == this.game.Properties.pseudo) {
			return
		}

		var movePlayer = this.findplayerbyid(data.id);
		if (!movePlayer) {
			NewPlayer(data)
			return;
		}
		movePlayer.moves.push(data)
	},

	onSocketConnected: function() {
		var passphrase = this.findGetParameter("key")
		console.log(passphrase)
		this.game.socket.logon(passphrase);
	},

    onUserLogged: function(pseudo) {
		this.game.Properties.in_game = true
		this.game.Properties.pseudo = pseudo

		player = new Local(this.game, pseudo, 'h1', 2, 2);
		this.game.camera.follow(player.sprite);
    },

    create: function() {
		this.game.physics.startSystem(Phaser.Physics.ARCADE);
		this.cursors = this.game.input.keyboard.addKeys({ 'space': Phaser.Keyboard.SPACEBAR, 'up': Phaser.Keyboard.UP, 'down': Phaser.Keyboard.DOWN, 'left': Phaser.Keyboard.LEFT, 'right': Phaser.Keyboard.RIGHT });

		console.log(this.game.Properties)
		this.initMap();
		this.initSocket();
		this.addMainPlayer();
    },

    update: function() {
		if (gameProperties.in_game) {
			updatePlayer()
		}
		updateRemotePlayers()
    },

	render: function() {
	}
};

module.exports = Play;
