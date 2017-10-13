var game = new Phaser.Game(800, 600, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update });
var ZeWorld;
var player;
var cursors;
var socket;
var enemies = [];

var gameProperties = {
	//this is the actual game size to determine the boundary of
	//the world
	gameWidth: 640,
	gameHeight: 480,
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
	var new_enemy = new remote_player(data.id, data.x, data.y, data.angle);
	enemies.push(new_enemy);
}

function onEnemyMove (data) {
	// console.log(data.id);
	// console.log(enemies);
	var movePlayer = findplayerbyid (data.id);

	if (!movePlayer) {
		console.log("player not found")
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

	this.player = game.add.sprite(this.x , this.y, 'dude');
	game.physics.arcade.enable(this.player);
    this.player.body.collideWorldBounds = true;

    this.player.animations.add('left', [0, 1, 2, 3], 10, true);
    this.player.animations.add('right', [5, 6, 7, 8], 10, true);
    this.player.animations.add('up', [5, 6, 7, 8], 10, true);
    this.player.animations.add('down', [5, 6, 7, 8], 10, true);

}

function createPlayer () {
	player = game.add.sprite(32, game.world.height - 150, 'dude');
    game.physics.arcade.enable(player);
    player.body.collideWorldBounds = true;

    player.animations.add('left', [0, 1, 2, 3], 10, true);
    player.animations.add('right', [5, 6, 7, 8], 10, true);
    player.animations.add('up', [5, 6, 7, 8], 10, true);
    player.animations.add('down', [5, 6, 7, 8], 10, true);
}

function preload() {
	game.load.image('tiles', 'assets/tiles.png');
	game.load.spritesheet('dude', 'assets/dude.png', 32, 48);
}

function create() {
	game.physics.startSystem(Phaser.Physics.ARCADE);

	// The player and its settings

	cursors = game.input.keyboard.createCursorKeys();

	socket = new Connection("10.31.200.78:8080", onsocketConnected);
	socket.on("userlogged", onuserlogged);
	socket.on("new_enemyPlayer", onNewPlayer);
	socket.on("enemy_move", onEnemyMove);
	socket.on('remove_player', onRemovePlayer);
}

function update() {
	if (gameProperties.in_game) {
		move = false;
	    if (cursors.left.isDown)
	    {
	        //  Move to the left
	        player.x -= 4;
	        player.animations.play('left');
			move = true;
	    }
	    else if (cursors.right.isDown)
	    {
	        //  Move to the right
	        player.x += 4;
	        player.animations.play('right');
			move = true;
	    }
		else if (cursors.up.isDown)
	    {
	        //  Move to the right
	        player.y -= 4;
	        player.animations.play('up');
			move = true;
	    }
		else if (cursors.down.isDown)
	    {
	        //  Move to the right
	        player.y += 4;
	        player.animations.play('down');
			move = true;
	    }
		else
	    {
	        //  Stand still
	        player.animations.stop();
	        player.frame = 4;
	    }
		if (move)
			socket.bcast({id: gameProperties.pseudo, x: player.x, y: player.y})
	}
}