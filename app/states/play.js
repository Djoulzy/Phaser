'use strict';

var Connection = require('wsconnect');
var Config = require('config');
var NetworkManager = require('network/NetworkManager');

var CharacterObj = require('gameObjects/CharacterObj');


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
    initSocket: function(){
        this.game.socket = new Connection(Config.ServerHost, this.game.keyCrypt);

       	this.game.socket.on("userlogged", this.addMainPlayer());


     //  	this.socket.on("new_enemyPlayer", onNewPlayer);
     //  	this.socket.on("enemy_move", onEnemyMove);
     //  	this.socket.on('remove_player', onRemovePlayer);
    },
    initMap: function(){
        this.zeWorld = this.game.add.tilemap('map', 32, 32);
        this.zeWorld.addTilesetImage('tiles');
        this.layer = this.zeWorld.createLayer(0);
        this.game.physics.arcade.enable(this.layer);
        this.layer.resizeWorld();
        this.zeWorld.setCollisionBetween(45, 100);
        this.layer.debug = true;
    },
    addMainPlayer: function(){

        	//create a main player object for the connected user to control
        	//gameProperties.in_game = true;
        	//gameProperties.pseudo = pseudo;
            console.log('addMAINPKLAYER',this.game.socket);
        	//player = new User("P", pseudo, 'h1', 32, 32);
        	this.player = new CharacterObj(this.game, 32, 32);
        	// entities.push(new_player);
        	this.serverSocket.bcast({type: "P", id: this.game.mainPlayerName, face: "h1", x: 32, y: 32});

    },
    create: function(){

      this.game.physics.startSystem(Phaser.Physics.ARCADE);
      this.cursors = this.game.input.keyboard.createCursorKeys();


      this.initMap();
     // this.initSocket();
      this.connectToServer();
      this.addMainPlayer();

    },

    update: function(){
        this.player.manageMouvement();
    },


    connectToServer: function(){

        this.serverSocket = new NetworkManager(this.game.keyCrypt);
/*
        NetworkManager.onOtherPlayerConnected(function(otherPlayerInfo){
            ChatManager.systemMessage('info', otherPlayerInfo.nickname + ' is connected');
            me.addOtherPlayer(otherPlayerInfo);
        });

        // set what to do when the current player receive movement information about another player
        NetworkManager.onOtherPlayerMove(function(movementInfo){
            var otherPlayerToMove = searchById(me.otherPlayers, movementInfo.uid);
            if(otherPlayerToMove){
                otherPlayerToMove.moveTo(movementInfo.x, movementInfo.y);
            }
        });

        // set what to do when the client receive the players list from the server
        NetworkManager.onUpdatePlayerList(function(receivedList){
            me.removeDisconnected(receivedList);
            me.addConnected(receivedList);

        });
        this.otherPlayers = [];

        this.synchronizeMapData(serverSocket);*/
    }



};

module.exports = Play;
