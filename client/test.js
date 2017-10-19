var game = new Phaser.Game(320, 320, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update, render: render });

function preload() {
    // game.load.tilemap('map', 'assets/zombie_a5.csv', null, Phaser.Tilemap.CSV);
	game.load.image('tiles', 'assets/tile.png');
	game.load.tilemap('map', 'assets/test.csv', null, Phaser.Tilemap.CSV);
	// game.load.image('tiles', 'assets/zombie_a5.png');
	game.load.spritesheet('h1', 'assets/h1.png', 32, 32);
	game.load.spritesheet('h2', 'assets/h2.png', 32, 32);
}

var ZeWorld;
var player;
var layer;
var cursors;
var socket;
var entities = [];
var PlayerOrdersCount = 0;
var PlayerIsMoving = false;

var gameProperties = {
	//this is the actual game size to determine the boundary of
	//the world
	gameWidth: 320,
	gameHeight: 320,
	game_elemnt: "gameDiv",
	in_game: false,
	pseudo: "",
};

///// EVENTS ////
function onsocketConnected () {
	passphrase = findGetParameter("key")
	socket.logon(passphrase);
}

function onuserlogged(pseudo) {
	//create a main player object for the connected user to control
	gameProperties.in_game = true;
	gameProperties.pseudo = pseudo;

	var new_player = new createPlayer(pseudo, 32, 32);
	// entities.push(new_player);
	socket.newPlayer({id: gameProperties.pseudo, x: 32, y: 32});
}

function onRemovePlayer (data) {
	var removePlayer = findplayerbyid(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id)
		return;
	}

	removePlayer.player.destroy();
	entities.splice(entities.indexOf(removePlayer), 1);
}

function onNewPlayer (data) {
	console.log(data);
	//enemy object
	var new_enemy = new remote_player(data.id, data.x, data.y);
	entities.push(new_enemy);
}

function onEnemyMove (data) {
	if (data.id == gameProperties.pseudo) {
		return
	}

	var movePlayer = findplayerbyid (data.id);
	if (!movePlayer) {
		onNewPlayer(data)
		return;
	}
	movePlayer.newMove = data

	movePlayer.x = data.x;
	movePlayer.y = data.y;
	movePlayer.needUpdate = true;
}

/////////////////////////

function findplayerbyid (id) {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].id == id) {
			return entities[i];
		}
	}
}

var remote_player = function (id, startx, starty) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;
	this.needUpdate = false;
	this.newMove = null;

	this.player = game.add.sprite(startx , starty, 'h2');
	game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;
	this.player.body.setSize(32, 32);
    this.player.anchor.setTo(0.5, 0.5);

	this.player.animations.add('left', [3, 4, 5], 10, true);
    this.player.animations.add('right', [6, 7, 8], 10, true);
    this.player.animations.add('up', [9, 10, 11], 10, true);
    this.player.animations.add('down', [0, 1, 2], 10, true);
}

function createPlayer (id, startx, starty) {
	this.x = startx;
	this.y = starty;
	this.id = id;
	this.needUpdate = false;
	this.newMove = null;

	player = game.add.sprite(startx, starty, 'h1');
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
	player.body.setSize(32, 32);
    player.anchor.setTo(0, 0);

    player.animations.add('left', [3, 4, 5], 10, true);
    player.animations.add('right', [6, 7, 8], 10, true);
    player.animations.add('up', [9, 10, 11], 10, true);
    player.animations.add('down', [0, 1, 2], 10, true);

	player.last_input = +new Date();

	game.camera.follow(player);
	player.body.onMoveComplete.add(movePlayerOver, this);

	this.player = player
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);
	cursors = game.input.keyboard.createCursorKeys();

	zeWorld = game.add.tilemap('map', 32, 32);
    zeWorld.addTilesetImage('tiles');
    layer = zeWorld.createLayer(0);
	game.physics.arcade.enable(layer);
    layer.resizeWorld();
	zeWorld.setCollisionBetween(45, 100);
	layer.debug = true;

	socket = new Connection(window.Server, onsocketConnected);
	socket.on("userlogged", onuserlogged);
	socket.on("new_enemyPlayer", onNewPlayer);
	socket.on("enemy_move", onEnemyMove);
	socket.on('remove_player', onRemovePlayer);
}

function adjustSpritePosition(sprite) {
	markerx = game.math.snapToFloor(Math.ceil(sprite.body.x), 32)
	markery = game.math.snapToFloor(Math.ceil(sprite.body.y), 32)
	console.log("Adjusting : x="+sprite.x+" y="+sprite.y+" -> x="+ markerx +" y="+markery)
	sprite.body.x = markerx
	sprite.body.y = markery
}

function sendMoveToServer(sprite, tick, move, x, y) {
	sprite.last_input = tick;
	PlayerOrdersCount += 1;
	socket.bcast({id: gameProperties.pseudo, num: PlayerOrdersCount, move: move, x: x, y: y })
	PlayerIsMoving = true
}

function movePlayerOver(sprite) {
	adjustSpritePosition(sprite)
	PlayerIsMoving = false
}

function updatePlayer() {
	game.physics.arcade.collide(player, layer, movePlayerOver);
	var step = 32;
    var speed = Math.ceil((1000/window.ServerTimeStep)/32)*32+50;

	var destx = player.body.x
	var desty = player.body.y

	var now_ts = +new Date();
    var dt_msec = now_ts - player.last_input
	if (!PlayerIsMoving) {
		if (cursors.left.isDown) //  Move to the left
		{
			sendMoveToServer(player, now_ts, "left", destx-step, desty)
			player.body.moveTo(speed, step, 180);
			player.animations.play('left');
		}
		else if (cursors.right.isDown) //  Move to the right
		{
			sendMoveToServer(player, now_ts, "right", destx+step, desty)
			player.body.moveTo(speed, step, 0);
			player.animations.play('right');
		}
		else if (cursors.up.isDown) //  Move to the right
		{
			sendMoveToServer(player, now_ts, "up", destx, desty-step)
			player.body.moveTo(speed, step, 270);
			player.animations.play('up');
		}
		else if (cursors.down.isDown) //  Move to the right
		{
			sendMoveToServer(player, now_ts, "down", destx, desty+step)
			player.body.moveTo(speed, step, 90);
			player.animations.play('down');
		}
		else {
			player.animations.stop();
			player.frame = 1;
		}
	}
}

function updateRemotePlayers() {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].needUpdate) {
			entities[i].player.body.velocity.set(0);
			if (entities[i].newMove.move == "left") {
				entities[i].player.body.moveTo(1000/window.ServerTimeStep, entities[i].player.x - entities[i].x, 180);
				entities[i].player.animations.play(entities[i].newMove.move);
			}
			else if (entities[i].newMove.move == "right") {
				entities[i].player.body.moveTo(1000/window.ServerTimeStep, entities[i].x- entities[i].player.x, 0);
				entities[i].player.animations.play(entities[i].newMove.move);
			}
			else if (entities[i].newMove.move == "up") {
				entities[i].player.body.moveTo(1000/window.ServerTimeStep, entities[i].player.y - entities[i].y, 270);
				entities[i].player.animations.play(entities[i].newMove.move);
			}
			else if (entities[i].newMove.move == "down") {
				entities[i].player.body.moveTo(1000/window.ServerTimeStep, entities[i].y- entities[i].player.y, 90);
				entities[i].player.animations.play(entities[i].newMove.move);
			}
			else {
				entities[i].player.animations.stop();
				entities[i].player.frame = 1;
			}
			entities[i].needUpdate = false;
		}

	}
}

function update() {
	if (gameProperties.in_game) {
		updatePlayer()
	}
	updateRemotePlayers()
}

function render() {
}
