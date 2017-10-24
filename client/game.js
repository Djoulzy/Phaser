var game = new Phaser.Game(640, 320, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update, render: render });

function preload() {
	game.load.image('tiles', 'assets/tile.png');
	game.load.tilemap('map', 'assets/tile.csv', null, Phaser.Tilemap.CSV);
	game.load.spritesheet('h1', 'assets/h1.png', 32, 32);
	game.load.spritesheet('h2', 'assets/h2.png', 32, 32);

	game.load.atlas('zombies', 'assets/ZombieSheet.png', 'assets/ZombieSheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
	game.load.atlas('shoot', 'assets/shoot.png', 'assets/shoot.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
}

var ZeWorld;
var player;
var layer;
var cursors;
var socket;
var entities = [];
var step = 32;
var ServerSpeed = 1000/window.ServerTimeStep
var baseSpeed = Math.ceil(ServerSpeed/step)*step;
var speed = baseSpeed + 50
var explosion

var gameProperties = {
	//this is the actual game size to determine the boundary of
	//the world
	gameWidth: 640,
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

	player = new Local(pseudo, 'h1', 32, 32);
	game.camera.follow(player.sprite);
	// entities.push(new_player);
	// socket.bcast({type: "P", id: gameProperties.pseudo, face: "h1", x: 32, y: 32});
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
		if (entities[i].sprite.User_id == id) {
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

	zeWorld = game.add.tilemap('map', 32, 32);
    zeWorld.addTilesetImage('tiles');
    layer = zeWorld.createLayer(0);
	game.physics.arcade.enable(layer);
    layer.resizeWorld();
	zeWorld.setCollisionBetween(45, 100);
	layer.debug = true;

	game.stage.disableVisibilityChange = true;
	socket = new Connection(window.Server, onsocketConnected);
	socket.on("userlogged", onuserlogged);
	// socket.on("new_enemyPlayer", onNewPlayer);
	socket.on("enemy_move", onEnemyMove);
	// socket.on('remove_player', onRemovePlayer);
}

function updatePlayer() {
	game.physics.arcade.collide(player, layer, player.moveUserOver);

	if (!player.isMoving()) {
		if (cursors.left.isDown) player.moveLeft(step, speed)
		else if (cursors.right.isDown) player.moveRight(step, speed)
		else if (cursors.up.isDown) player.moveUp(step, speed)
		else if (cursors.down.isDown) player.moveDown(step, speed)
		else if (cursors.space.isDown) {
			var fire = new Shoot(player.sprite.body.x, player.sprite.body.y)
			fire.play()
			var shoot = new Bullet(player.sprite.body.x, player.sprite.body.y)
			shoot.move(player.bearing, step*10, speed)
		}
	}
}

function updateRemotePlayers() {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].moves.length > 0 && !entities[i].isMoving()) {
			move = entities[i].moves.shift()
			entities[i].sprite.dest_x = move.x;
			entities[i].sprite.dest_y = move.y;
			entities[i].sprite.PlayerIsMoving = true
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
