'use strict'

var gameBootstrapper = {
    init: function(gameContainerElementId){

        var game = new Phaser.Game(800, 480, Phaser.AUTO, gameContainerElementId);

        game.state.add('boot', require('./boot'));
        game.state.add('play', require('./play'));

        game.state.start('boot');
    }
};

module.exports = gameBootstrapper
