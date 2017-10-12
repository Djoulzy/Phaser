
var socket;

//this is just configuring a screen size to fit the game properly
//to the browser
canvas_width = window.innerWidth * window.devicePixelRatio;
canvas_height = window.innerHeight * window.devicePixelRatio;

//make a phaser game
game = new Phaser.Game(canvas_width, canvas_height, Phaser.CANVAS, 'gameDiv');

var enemies = [];

var gameProperties = {
	//this is the actual game size to determine the boundary of
	//the world
	gameWidth: 640,
	gameHeight: 480,
	game_elemnt: "gameDiv",
	in_game: false,
};

// this is the main game state
var main = function(game){
};

//call this function when the player connects to the server.
function onsocketConnected () {
	gamediv = document.getElementById(gameProperties.game_elemnt)
	login = gamediv.getAttribute("pseudo");
	pass = gamediv.getAttribute("pass");
	// send to the server a "new_player" message so that the server knows
	// a new player object has been created
	gameProperties.pseudo = login;
	socket.logon(login, pass);
	socket.newPlayer({id: gameProperties.pseudo, x: player.x, y: player.y, angle: player.angle})
}

function onuserlogged() {
	//create a main player object for the connected user to control
	createPlayer();
	gameProperties.in_game = true;
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

function createPlayer () {
	//uses Phaser’s graphics to draw a circle
	player = game.add.graphics(0, 0);
	player.radius = 100;

	// set a fill and line style
	player.beginFill(0xffd900);
	player.lineStyle(2, 0xffd900, 1);
	player.drawCircle(0, 0, player.radius * 2);
	player.endFill();
	player.anchor.setTo(0.5,0.5);
	player.body_size = player.radius;

	// draw a shape
	game.physics.p2.enableBody(player, true);
	player.body.clearShapes();
	player.body.addCircle(player.body_size, 0 , 0);
	player.body.data.shapes[0].sensor = true;
}

// this is the enemy class.
var remote_player = function (id, startx, starty, start_angle) {
	this.x = startx;
	this.y = starty;
	//this is the unique socket id. We use it as a unique name for enemy
	this.id = id;
	this.angle = start_angle;

	this.player = game.add.graphics(this.x , this.y);
	this.player.radius = 100;

	// set a fill and line style
	this.player.beginFill(0xffd900);
	this.player.lineStyle(2, 0xffd900, 1);
	this.player.drawCircle(0, 0, this.player.radius * 2);
	this.player.endFill();
	this.player.anchor.setTo(0.5,0.5);
	this.player.body_size = this.player.radius;

	// draw a shape
	game.physics.p2.enableBody(this.player, true);
	this.player.body.clearShapes();
	this.player.body.addCircle(this.player.body_size, 0 , 0);
	this.player.body.data.shapes[0].sensor = true;
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
	movePlayer.player.body.x = data.x;
	movePlayer.player.body.y = data.y;
	movePlayer.player.angle = data.angle;
}

function findplayerbyid (id) {
	for (var i = 0; i < enemies.length; i++) {
		if (enemies[i].id == id) {
			return enemies[i];
		}
	}
}

// add the
main.prototype = {
	preload: function() {
		game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		game.world.setBounds(0, 0, gameProperties.gameWidth,
		gameProperties.gameHeight, false, false, false, false);
		//I’m using P2JS for physics system. You can choose others if you want
		game.physics.startSystem(Phaser.Physics.P2JS);
		game.physics.p2.setBoundsToWorld(false, false, false, false, false)
		//sets the y gravity to 0. This means players won’t fall down by gravity
		game.physics.p2.gravity.y = 0;
		// turn gravity off
		game.physics.p2.applyGravity = false;
		game.physics.p2.enableBody(game.physics.p2.walls, false);
		// turn on collision detection
		game.physics.p2.setImpactEvents(true);

    },
	//this function is fired once when we load the game
	create: function () {
		game.stage.backgroundColor = 0xE1A193;;
		console.log("client started");
		//listen if a client successfully makes a connection to the server,
		//and call onsocketConnected
		socket = new Connection("10.31.200.78:8080", onsocketConnected);
		socket.on("userlogged", onuserlogged);

		socket.on("new_enemyPlayer", onNewPlayer);
		//listen to enemy movement
		socket.on("enemy_move", onEnemyMove);

		// when received remove_player, remove the player passed;
		socket.on('remove_player', onRemovePlayer);
	},

	update: function () {
		// emit the player input

		//move the player when he is in game
		if (gameProperties.in_game) {
			// we're using phaser's mouse pointer to keep track of
			// user's mouse position
			var pointer = game.input.mousePointer;

			// distanceToPointer allows us to measure the distance between the
			// mouse pointer and the player object
			if (distanceToPointer(player, pointer) <= 50) {
				//The player can move to mouse pointer at a certain speed.
				//look at player.js on how this is implemented.
				movetoPointer(player, 0, pointer, 100);
			} else {
				movetoPointer(player, 500, pointer);
			}
			// console.log(player)
			socket.bcast({id: gameProperties.pseudo, x: player.x, y: player.y, angle: player.angle})
		}
	}
}

// wrap the game states.
var gameBootstrapper = {
    init: function(gameContainerElementId){
		game.state.add('main', main);
		game.state.start('main');
    }
};;

//call the init function in the wrapper and specifiy the division id
gameBootstrapper.init("gameDiv");
