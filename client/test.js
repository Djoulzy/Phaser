var game = new Phaser.Game(640, 640, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update });

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
	createPlayer();
	gameProperties.in_game = true;
	gameProperties.pseudo = pseudo;
	socket.newPlayer({id: gameProperties.pseudo, x: player.x, y: player.y});
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
	// console.log(movePlayer);
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
			return enemies[i];
		}
	}
}

var remote_player = function (id, startx, starty) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;

	this.player = game.add.sprite(startx , starty, 'dude');
	game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    this.player.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player.animations.add('right', [5, 6, 7, 8], 10, true);
    // this.player.animations.add('up', [5, 6, 7, 8], 10, true);
    // this.player.animations.add('down', [5, 6, 7, 8], 10, true);
}

function createPlayer () {
	player = game.add.sprite(32, game.world.height - 150, 'dude');
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    // player.animations.add('up', [5, 6, 7, 8], 10, true);
    // player.animations.add('down', [5, 6, 7, 8], 10, true);

	game.camera.follow(player);
}

function preload() {
    game.load.tilemap('map', 'assets/zombie_a5.csv', null, Phaser.Tilemap.CSV);
	game.load.image('tiles', 'assets/zombie_a5.png');
	game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);
	cursors = game.input.keyboard.createCursorKeys();

	zeWorld = game.add.tilemap('map', 32, 32);
    zeWorld.addTilesetImage('tiles');
    layer = zeWorld.createLayer(0);
    layer.resizeWorld();
	zeWorld.setCollisionBetween(54, 83);
	layer.debug = true;

	socket = new Connection("192.168.0.2:8080", onsocketConnected);
	socket.on("userlogged", onuserlogged);
	socket.on("new_enemyPlayer", onNewPlayer);
	socket.on("enemy_move", onEnemyMove);
	socket.on('remove_player', onRemovePlayer);
}

function updatePlayer() {
	game.physics.arcade.collide(player, layer);
	player.body.velocity.set(0);
	move = false;
	if (cursors.left.isDown) //  Move to the left
	{
		// player.x -= 4;
		player.body.velocity.x = -100;
		player.animations.play('left');
		move = true;
	}
	else if (cursors.right.isDown) //  Move to the right
	{
		// player.x += 4;
		player.body.velocity.x = 100;
		player.animations.play('right');
		move = true;
	}
	else if (cursors.up.isDown) //  Move to the right
	{
		// player.y -= 4;
		player.body.velocity.y = -100;
		player.animations.play('right');
		move = true;
	}
	else if (cursors.down.isDown) //  Move to the right
	{
		// player.y += 4;
		player.body.velocity.y = 100;
		player.animations.play('left');
		move = true;
	}
	else //  Stand still
	{
		player.animations.stop();
		player.frame = 4;
	}
	if (move)
		socket.bcast({id: gameProperties.pseudo, x: player.x, y: player.y})
}

function updateRemotePlayers() {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].x > enemies[i].player.x) {
			enemies[i].player.x += 4;
			enemies[i].player.animations.play('right');
		}
		else if (enemies[i].x < enemies[i].player.x) {
			enemies[i].player.x -= 4;
			enemies[i].player.animations.play('left');
		}
		else if (enemies[i].y > enemies[i].player.y) {
			enemies[i].player.y += 4;
			enemies[i].player.animations.play('right');
		}
		else if (enemies[i].y < enemies[i].player.y) {
			enemies[i].player.y -= 4;
			enemies[i].player.animations.play('left');
		}
		else {
			enemies[i].player.animations.stop();
			enemies[i].player.frame = 4;
		}
	}
}

function update() {
	if (gameProperties.in_game) {
		updatePlayer()
	}
	updateRemotePlayers()
}
