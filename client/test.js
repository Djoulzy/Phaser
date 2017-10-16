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
var enemies = [];

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

	var new_player = new createPlayer(pseudo, 200, 100);
	enemies.push(new_player);
	socket.newPlayer({id: gameProperties.pseudo, x: 200, y: 100});
	console.log(gameProperties);
}

function onRemovePlayer (data) {
	var removePlayer = findplayerbyid(data.id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', data.id)
		return;
	}

	removePlayer.player.destroy();
	enemies.splice(enemies.indexOf(removePlayer), 1);
}

function onNewPlayer (data) {
	console.log(data);
	//enemy object
	var new_enemy = new remote_player(data.id, data.x, data.y);
	enemies.push(new_enemy);
}

function onEnemyMove (data) {
	// console.log(enemies);
	var movePlayer = findplayerbyid (data.id);
	if (!movePlayer) {
		onNewPlayer(data)
		return;
	}
	movePlayer.x = data.x;
	movePlayer.y = data.y;
}

/////////////////////////

function findplayerbyid (id) {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			console.log(enemies[i])
			return enemies[i];
		}
	}
}

var remote_player = function (id, startx, starty) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;

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

	player = game.add.sprite(200, 100, 'h1');
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;
	// player.body.setSize(10, 14, 2, 1);

    player.animations.add('left', [3, 4, 5], 10, true);
    player.animations.add('right', [6, 7, 8], 10, true);
    player.animations.add('up', [9, 10, 11], 10, true);
    player.animations.add('down', [0, 1, 2], 10, true);

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

	socket = new Connection("10.31.200.78:8080", onsocketConnected);
	socket.on("userlogged", onuserlogged);
	socket.on("new_enemyPlayer", onNewPlayer);
	socket.on("enemy_move", onEnemyMove);
	socket.on('remove_player', onRemovePlayer);
}

function updatePlayer() {
	game.physics.arcade.collide(player, layer);
	player.body.velocity.set(0);
	move = false;
	destx = player.body.x;
	desty = player.body.y;
	if (cursors.left.isDown) //  Move to the left
	{
		// player.x -= 4;
		// player.body.velocity.x = -200;
		// player.animations.play('left');
		destx -= 4;
		move = true;
	}
	else if (cursors.right.isDown) //  Move to the right
	{
		// player.x += 4;
		// player.body.velocity.x = 200;
		// player.animations.play('right');
		destx += 4;
		move = true;
	}
	else if (cursors.up.isDown) //  Move to the right
	{
		// player.y -= 4;
		// player.body.velocity.y = -200;
		// player.animations.play('up');
		desty -= 4;
		move = true;
	}
	else if (cursors.down.isDown) //  Move to the right
	{
		// player.y += 4;
		// player.body.velocity.y = +200;
		// player.animations.play('down');
		desty += 4;
		move = true;
	}
	else //  Stand still
	{
		player.animations.stop();
		player.frame = 1;
	}
	if (move)
		socket.bcast({id: gameProperties.pseudo, x: Math.ceil(destx), y: Math.ceil(desty)})
}

function updateRemotePlayers() {
	modifier = 4;
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].x < enemies[i].player.body.x) {
			// enemies[i].player.body.velocity.x = -200
			this.game.physics.arcade.moveToXY(enemies[i].player, enemies[i].x, Phaser.Math.snapTo(enemies[i].player.body.y, 70), 200)
			enemies[i].player.animations.play('left');
		}
		else if (enemies[i].x > enemies[i].player.body.x) {
			// enemies[i].player.body.velocity.x = +200
			this.game.physics.arcade.moveToXY(enemies[i].player, enemies[i].x, Phaser.Math.snapTo(enemies[i].player.body.y, 70), 200)
			enemies[i].player.animations.play('right');
		}
		else if (enemies[i].y < enemies[i].player.body.y) {
			// enemies[i].player.body.velocity.y = -200
			// this.game.physics.arcade.moveToXY(enemies[i].player, enemies[i].player.body.x, enemies[i].y, 200)
			this.game.physics.arcade.moveToXY(enemies[i].player, Phaser.Math.snapTo(enemies[i].player.body.x, 70), enemies[i].y, 200)
			enemies[i].player.animations.play('up');
		}
		else if (enemies[i].y > enemies[i].player.body.y) {
			// enemies[i].player.body.velocity.y = +200
			this.game.physics.arcade.moveToXY(enemies[i].player, Phaser.Math.snapTo(enemies[i].player.body.x, 70), enemies[i].y, 200)
			enemies[i].player.animations.play('down');
		}
		else {
			enemies[i].player.body.velocity.x = 0;
			enemies[i].player.body.velocity.y = 0;
			enemies[i].player.body.x = Math.ceil(enemies[i].player.body.x)
			enemies[i].player.body.y = Math.ceil(enemies[i].player.body.y)
			enemies[i].player.animations.stop();
			enemies[i].player.frame = 1;
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
