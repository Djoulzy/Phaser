'use strict';

const Config = require('config');
var Connection = require('client/wsconnect')
var Local = require('client/local')
var Map = require('client/map')

function Boot(){}

Boot.prototype = {
    preload: function(){
        // Debbug
        // this.game.plugins.add(Phaser.Plugin.Inspector)

        this.game.stage.disableVisibilityChange = true;
        this.game.stage.backgroundColor = 0x3b0760;
        this.game.load.onFileComplete.add(this.onFileComplete, this);
        this.game.load.onLoadComplete.add(this.onLoadComplete, this);

        // this.showLoadingText()
        this.initMap()
        this.initSocket()
        // this.loadAssets()
    },

    initSocket: function() {
        this.game.socket = new Connection(Config.MMOServer.Host, this.onSocketConnected.bind(this))
       	this.game.socket.on("userlogged", this.onUserLogged.bind(this))
    },

    initMap: function() {
		// this.game.load.onFileComplete.add(this.mapFileComplete, this);
		this.game.WorldMap = new Map(this.game)
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

    onSocketConnected: function() {
		var passphrase = this.findGetParameter("key")
		this.game.socket.logon(passphrase);
	},

    onUserLogged: function(data) {
		this.game.Properties.pseudo = data.id

	  	this.game.load.spritesheet(data.png, 'http://'+Config.MMOServer.Host+'/data/'+data.png+'.png', 32, 32);
		this.game.player = new Local(this.game, data.id, data.png, data.x, data.y)
        this.game.WorldMap.init(data.x, data.y)
        // this.game.load.onLoadComplete.addOnce(this.redrawPlayer, this.game.player);
        // this.game.load.start();
        this.loadAssets()
		// this.checkLoadedMaps(this.game.player.area.x, this.game.player.area.y)
    },

    onFileComplete: function(progress, cacheKey, success, totalLoaded, totalFiles) {
        console.log("File Complete: " + progress + "% - " + totalLoaded + " out of " + totalFiles + "(" + cacheKey + ")")
    },

    onLoadComplete: function() {
        this.game.state.start('play')
    },

    loadAssets: function() {
		// Graphics
	  	this.game.load.spritesheet('h1', 'http://'+Config.MMOServer.Host+'/data/h1.png', 32, 32);
	  	// this.game.load.spritesheet('h2', 'http://'+Config.MMOServer.Host+'/data/h2.png', 32, 32);
	  	this.game.load.atlas('zombies', 'assets/ZombieSheet.png', 'assets/ZombieSheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
	  	this.game.load.atlas('shoot', 'assets/shoot.png', 'assets/shoot.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
		this.game.load.image('final', 'http://'+Config.MMOServer.Host+'/data/final.png');
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
