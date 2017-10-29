var game = new Phaser.Game(640, 640, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update, render: render });

function preload() {
	game.load.image('zombie_tiles', 'assets/zombie_tiles.png');
	game.load.tilemap('zone1', 'http://'+window.Server+'/data/zone1.json', null, Phaser.Tilemap.TILED_JSON);
	// game.load.tilemap('terrain', 'assets/zone1_terrain.csv', null, Phaser.Tilemap.CSV);
	// game.load.tilemap('obstacles', 'assets/zone1_obstacles.csv', null, Phaser.Tilemap.CSV);
	game.load.spritesheet('h1', 'assets/h1.png', 32, 32);
	game.load.spritesheet('h2', 'assets/h2.png', 32, 32);

	game.load.atlas('zombies', 'assets/ZombieSheet.png', 'assets/ZombieSheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
	game.load.atlas('shoot', 'assets/shoot.png', 'assets/shoot.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
}

var zeWorld;
var player;
var terrain, decors, obstacles;
var cursors;
var socket;
var entities = [];
var step = 32;
var ServerSpeed = 1000/window.ServerTimeStep
var baseSpeed = Math.ceil(ServerSpeed/step)*step;
var speed = baseSpeed + 50

var bullets;
var explodes;

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

	player = new Local(pseudo, 'h1', 1, 1);
	game.camera.follow(player.sprite);
	// entities.push(new_player);
	// socket.bcast({type: "P", id: gameProperties.pseudo, face: "h1", x: 32, y: 32});
}

function onRemovePlayer(id) {
	var removePlayer = findplayerbyid(id);
	// Player not found
	if (!removePlayer) {
		console.log('Player not found: ', id)
		return;
	}

	explodes.boom(removePlayer.sprite)
	removePlayer.destroy();
	entities.splice(entities.indexOf(removePlayer), 1);
}

function NewPlayer (data) {
	var movePlayer = findplayerbyid (data.id);
	if (findplayerbyid (data.id)) return
	else {
		if (data.type == "P")
			var new_enemy = new Remote(data.id, data.face, "", data.x, data.y);
		else
			var new_enemy = new Mob(data.id, "zombies", data.face, data.x, data.y);
		entities.push(new_enemy);
	}
}

function onEnemyMove (data) {
	if (data.id == gameProperties.pseudo) {
		return
	}

	var movePlayer = findplayerbyid (data.id);
	if (!movePlayer) {
		NewPlayer(data)
		return;
	}
	movePlayer.moves.push(data)
}

/////////////////////////

function findplayerbyid (id) {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].User_id == id) {
			return entities[i];
		}
	}
	return false
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);
	// cursors = game.input.keyboard.createCursorKeys();
	// cursors.addKeys({ 'space': Phaser.Keyboard.SPACEBAR })
	cursors = game.input.keyboard.addKeys({ 'space': Phaser.Keyboard.SPACEBAR, 'up': Phaser.Keyboard.UP, 'down': Phaser.Keyboard.DOWN, 'left': Phaser.Keyboard.LEFT, 'right': Phaser.Keyboard.RIGHT });

	zeWorld = game.add.tilemap('zone1');
    zeWorld.addTilesetImage('zombie_tiles');
    terrain = zeWorld.createLayer('terrain');
    decors = zeWorld.createLayer('decors');
    obstacles = zeWorld.createLayer('obstacles');

    terrain.resizeWorld();

    bullets = new Shoot()
	explodes = new Explode()

	game.stage.disableVisibilityChange = true;
	socket = new Connection(window.Server, onsocketConnected);
	socket.on("userlogged", onuserlogged);
	// socket.on("new_enemyPlayer", onNewPlayer);
	socket.on("enemy_move", onEnemyMove);
	socket.on("kill_enemy", onRemovePlayer);
	// socket.on('remove_player', onRemovePlayer);
}

function playerBlocked() {
	player.PlayerIsMoving = false
	player.sprite.animations.stop();
}

function updatePlayer() {
	// game.physics.arcade.collide(player.sprite, obstacles, playerBlocked);

	if (!player.isMoving()) {
		if (cursors.left.isDown) player.moveLeft(zeWorld, step, speed)
		else if (cursors.right.isDown) player.moveRight(zeWorld, step, speed)
		else if (cursors.up.isDown) player.moveUp(zeWorld, step, speed)
		else if (cursors.down.isDown) player.moveDown(zeWorld, step, speed)
		else if (cursors.space.isDown) {
			var portee = 5
			bullets.fire(player, portee, speed);
		}
	}
}

function updateRemotePlayers() {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].moves.length > 0 && !entities[i].isMoving()) {
			move = entities[i].moves.shift()
			entities[i].dest_X = move.x;
			entities[i].dest_Y = move.y;
			entities[i].PlayerIsMoving = true
			mobSpeed = Math.ceil((ServerSpeed*move.speed)/step)*step + 50;

			if (move.move == "left") entities[i].moveLeft(step, mobSpeed)
			else if (move.move == "right") entities[i].moveRight(step, mobSpeed)
			else if (move.move == "up") entities[i].moveUp(step, mobSpeed)
			else if (move.move == "down") entities[i].moveDown(step, mobSpeed)
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
