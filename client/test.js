var game = new Phaser.Game(640, 640, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update, render: render });

function preload() {
    game.load.tilemap('map', 'assets/zombie_a5.csv', null, Phaser.Tilemap.CSV);
	game.load.image('tiles', 'assets/zombie_a5.png');
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
var velocity = 200;
var pixelpersecond = Math.round(velocity * 1/window.ServerTimeStep);

var gameProperties = {
	//this is the actual game size to determine the boundary of
	//the world
	gameWidth: 640,
	gameHeight: 640,
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

	var new_player = new createPlayer(pseudo, 224, 96);
	// entities.push(new_player);
	socket.newPlayer({id: gameProperties.pseudo, x: 224, y: 96});
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
	// player.body.setSize(10, 14, 2, 1);

    player.animations.add('left', [3, 4, 5], 10, true);
    player.animations.add('right', [6, 7, 8], 10, true);
    player.animations.add('up', [9, 10, 11], 10, true);
    player.animations.add('down', [0, 1, 2], 10, true);

	player.last_input = +new Date();

	game.camera.follow(player);

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

function updatePlayer() {
	var now_ts = +new Date();
    var dt_sec = (now_ts - player.last_input) / 1000.0;

	game.physics.arcade.collide(player, layer);
	var step = 32;
	var destx = player.body.x;
	var desty = player.body.y;
	if (dt_sec > 1/window.ServerTimeStep) {
		player.body.velocity.set(0);
		move = "";
		if (cursors.left.isDown) //  Move to the left
		{
			// player.x -= 4;
			// player.body.velocity.x = -velocity;
			player.body.moveTo(1000/window.ServerTimeStep, step, 180);
			player.animations.play('left');
			destx -= step;
			move = "left";
		}
		else if (cursors.right.isDown) //  Move to the right
		{
			// player.x += 4;
			// player.body.velocity.x = velocity;
			player.body.moveTo(1000/window.ServerTimeStep, step, 0);
			player.animations.play('right');
			destx += step;
			move = "right";
		}
		else if (cursors.up.isDown) //  Move to the right
		{
			// player.y -= 4;
			// player.body.velocity.y = -velocity;
			player.body.moveTo(1000/window.ServerTimeStep, step, 270);
			player.animations.play('up');
			desty -= step;
			move = "up";
		}
		else if (cursors.down.isDown) //  Move to the right
		{
			// player.y += 4;
			// player.body.velocity.y = +velocity;
			player.body.moveTo(1000/window.ServerTimeStep, step, 90);
			player.animations.play('down');
			desty += step;
			move = "down";
		}
		else //  Stand still
		{
			player.animations.stop();
			player.frame = 1;
		}
		if (move != "")
		{
			// console.log("last_input: "+player.last_input+" / player_input: "+player.input+" / delta: "+dt_sec)
			player.last_input = now_ts;
			PlayerOrdersCount += 1;
			socket.bcast({id: gameProperties.pseudo, num: PlayerOrdersCount, move: move, x: destx, y: desty })
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
		// if (entities[i].needUpdate) {
			// if (entities[i].x < entities[i].player.body.x) {
			// 	entities[i].player.body.x -= pixelpersecond
			// 	entities[i].player.animations.play('left');
			// }
			// else if (entities[i].x > entities[i].player.body.x) {
			// 	entities[i].player.body.x += pixelpersecond
			// 	entities[i].player.animations.play('right');
			// }
			// else if (entities[i].y < entities[i].player.body.y) {
			// 	entities[i].player.body.y -= pixelpersecond
			// 	entities[i].player.animations.play('up');
			// }
			// else if (entities[i].y > entities[i].player.body.y) {
			// 	entities[i].player.body.y += pixelpersecond
			// 	entities[i].player.animations.play('down');
			// }
			// else {
			// 	entities[i].player.animations.stop();
			// 	entities[i].player.frame = 1;
			// }
		// 	entities[i].needUpdate = false;
		// }
		// else {
		// 	entities[i].player.body.velocity.set(0);
		// }
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
