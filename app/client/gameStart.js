'use strict'

var Config = require('config');

var gameBootstrapper = {
    init: function(gameContainerElementId){

        var game = new Phaser.Game(320, 320, Phaser.AUTO, gameContainerElementId);

		game.Properties = {
			gameWidth: 640,
			gameHeight: 640,
			game_elemnt: "gameDiv",
			in_game: false,
			pseudo: "",
			step: 32,
			ServerSpeed: 1000/Config.MMOServer.TimeStep,
			baseSpeed: 0,
			speed: 0
		};

		game.Properties.baseSpeed = Math.ceil(game.Properties.ServerSpeed / game.Properties.step)*game.Properties.step
		game.Properties.speed = game.Properties.baseSpeed + 50

        game.state.add('boot', require('./boot'));
        game.state.add('play', require('./play'));

        game.state.start('boot');
    }
};

module.exports = gameBootstrapper
