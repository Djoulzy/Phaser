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
var step = 32;
var speed = Math.ceil((1000/window.ServerTimeStep)/32)*32+50;

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

	player = new User(pseudo, 'h1', 32, 32);
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
	var new_enemy = new User(data.id, 'h2', data.x, data.y);
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
	movePlayer.sprite.newMove = data

	movePlayer.sprite.dest_x = data.x;
	movePlayer.sprite.dest_y = data.y;
	movePlayer.sprite.needUpdate = true;
}

/////////////////////////

function findplayerbyid (id) {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].sprite.User_id == id) {
			return entities[i];
		}
	}
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

function sendMoveToServer(player, tick, move, x, y) {
	player.sprite.last_input = tick;
    player.sprite.dest_x = x
    player.sprite.dest_y = y
	PlayerOrdersCount += 1;
	socket.bcast({id: gameProperties.pseudo, num: PlayerOrdersCount, move: move, x: player.sprite.dest_x, y: player.sprite.dest_y })
	player.sprite.PlayerIsMoving = true
}

function updatePlayer() {
	game.physics.arcade.collide(player, layer, player.moveUserOver);

	if (!player.sprite.PlayerIsMoving) {

		destx = player.sprite.body.x
		desty = player.sprite.body.y
		now_ts = +new Date();

		if (cursors.left.isDown) //  Move to the left
		{
			sendMoveToServer(player, now_ts, "left", destx-step, desty)
			player.sprite.body.moveTo(speed, step, 180);
			player.sprite.animations.play('left');
		}
		else if (cursors.right.isDown) //  Move to the right
		{
			sendMoveToServer(player, now_ts, "right", destx+step, desty)
			player.sprite.body.moveTo(speed, step, 0);
			player.sprite.animations.play('right');
		}
		else if (cursors.up.isDown) //  Move to the right
		{
			sendMoveToServer(player, now_ts, "up", destx, desty-step)
			player.sprite.body.moveTo(speed, step, 270);
			player.sprite.animations.play('up');
		}
		else if (cursors.down.isDown) //  Move to the right
		{
			sendMoveToServer(player, now_ts, "down", destx, desty+step)
			player.sprite.body.moveTo(speed, step, 90);
			player.sprite.animations.play('down');
		}
		else {
			player.sprite.animations.stop();
			player.sprite.frame = 1;
		}
	}
}

function updateRemotePlayers() {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].sprite.needUpdate && !entities[i].sprite.PlayerIsMoving) {
			entities[i].sprite.PlayerIsMoving = true
			entities[i].sprite.needUpdate = false
			if (entities[i].sprite.newMove.move == "left") {
				entities[i].sprite.body.moveTo(speed, step, 180);
				// game.physics.arcade.moveToXY(entities[i].player, entities[i].x, entities[i].player.body.y, speed);
				entities[i].sprite.animations.play(entities[i].sprite.newMove.move);
			}
			else if (entities[i].sprite.newMove.move == "right") {
				entities[i].sprite.body.moveTo(speed, step, 0);
				// game.physics.arcade.moveToXY(entities[i].player, entities[i].x, entities[i].player.body.y, speed);
				entities[i].sprite.animations.play(entities[i].sprite.newMove.move);
			}
			else if (entities[i].sprite.newMove.move == "up") {
				entities[i].sprite.body.moveTo(speed, step, 270);
				// game.physics.arcade.moveToXY(entities[i].player, entities[i].player.body.x, entities[i].y, speed);
				entities[i].sprite.animations.play(entities[i].sprite.newMove.move);
			}
			else if (entities[i].sprite.newMove.move == "down") {
				entities[i].sprite.body.moveTo(speed, step, 90);
				// game.physics.arcade.moveToXY(entities[i].player, entities[i].player.body.x, entities[i].y, speed);
				entities[i].sprite.animations.play(entities[i].sprite.newMove.move);
			}
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
