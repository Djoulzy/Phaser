(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var _cmp = 'components/';
  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf(_cmp) === 0) {
        start = _cmp.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return _cmp + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var _reg = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (_reg.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  require._cache = cache;
  globals.require = require;
})();
require.register("config", function(exports, require, module) {
window.Server = "10.31.100.200:8080";
window.ServerTimeStep = 10;

});

require.register("example", function(exports, require, module) {

// =============================================================================
//  An Entity in the world.
// =============================================================================
var Entity = function() {
  this.x = 0;
  this.speed = 2; // units/s
  this.position_buffer = [];
}

// Apply user's input to this entity.
Entity.prototype.applyInput = function(input) {
  this.x += input.press_time*this.speed;
}


// =============================================================================
//  A message queue with simulated network lag.
// =============================================================================
var LagNetwork = function() {
  this.messages = [];
}

// "Send" a message. Store each message with the timestamp when it should be
// received, to simulate lag.
LagNetwork.prototype.send = function(lag_ms, message) {
  this.messages.push({recv_ts: +new Date() + lag_ms,
                      payload: message});
}

// Returns a "received" message, or undefined if there are no messages available
// yet.
LagNetwork.prototype.receive = function() {
  var now = +new Date();
  for (var i = 0; i < this.messages.length; i++) {
    var message = this.messages[i];
    if (message.recv_ts <= now) {
      this.messages.splice(i, 1);
      return message.payload;
    }
  }
}


// =============================================================================
//  The Client.
// =============================================================================
var Client = function(canvas, status) {
  // Local representation of the entities.
  this.entities = {};

  // Input state.
  this.key_left = false;
  this.key_right = false;

  // Simulated network connection.
  this.network = new LagNetwork();
  this.server = null;
  this.lag = 0;

  // Unique ID of our entity. Assigned by Server on connection.
  this.entity_id = null;

  // Data needed for reconciliation.
  this.client_side_prediction = false;
  this.server_reconciliation = false;
  this.input_sequence_number = 0;
  this.pending_inputs = [];

  // Entity interpolation toggle.
  this.entity_interpolation = true;

  // UI.
  this.canvas = canvas;
  this.status = status;

  // Update rate.
  this.setUpdateRate(50);
}


Client.prototype.setUpdateRate = function(hz) {
  this.update_rate = hz;

  clearInterval(this.update_interval);
  this.update_interval = setInterval(
    (function(self) { return function() { self.update(); }; })(this),
    1000 / this.update_rate);
}


// Update Client state.
Client.prototype.update = function() {
  // Listen to the server.
  this.processServerMessages();

  if (this.entity_id == null) {
    return;  // Not connected yet.
  }

  // Process inputs.
  this.processInputs();

  // Interpolate other entities.
  if (this.entity_interpolation) {
    this.interpolateEntities();
  }

  // Render the World.
  renderWorld(this.canvas, this.entities);

  // Show some info.
  var info = "Non-acknowledged inputs: " + this.pending_inputs.length;
  this.status.textContent = info;
}


// Get inputs and send them to the server.
// If enabled, do client-side prediction.
Client.prototype.processInputs = function() {
  // Compute delta time since last update.
  var now_ts = +new Date();
  var last_ts = this.last_ts || now_ts;
  var dt_sec = (now_ts - last_ts) / 1000.0;
  this.last_ts = now_ts;

  // Package player's input.
  var input;
  if (this.key_right) {
    input = { press_time: dt_sec };
  } else if (this.key_left) {
    input = { press_time: -dt_sec };
  } else {
    // Nothing interesting happened.
    return;
  }

  // Send the input to the server.
  input.input_sequence_number = this.input_sequence_number++;
  input.entity_id = this.entity_id;
  this.server.network.send(this.lag, input);

  // Do client-side prediction.
  if (this.client_side_prediction) {
    this.entities[this.entity_id].applyInput(input);
  }

  // Save this input for later reconciliation.
  this.pending_inputs.push(input);
}


// Process all messages from the server, i.e. world updates.
// If enabled, do server reconciliation.
Client.prototype.processServerMessages = function() {
  while (true) {
    var message = this.network.receive();
    if (!message) {
      break;
    }

    // World state is a list of entity states.
    for (var i = 0; i < message.length; i++) {
      var state = message[i];

      // If this is the first time we see this entity, create a local representation.
      if (!this.entities[state.entity_id]) {
        var entity = new Entity();
        entity.entity_id = state.entity_id;
        this.entities[state.entity_id] = entity;
      }

      var entity = this.entities[state.entity_id];

      if (state.entity_id == this.entity_id) {
        // Received the authoritative position of this client's entity.
        entity.x = state.position;

        if (this.server_reconciliation) {
          // Server Reconciliation. Re-apply all the inputs not yet processed by
          // the server.
          var j = 0;
          while (j < this.pending_inputs.length) {
            var input = this.pending_inputs[j];
            if (input.input_sequence_number <= state.last_processed_input) {
              // Already processed. Its effect is already taken into account into the world update
              // we just got, so we can drop it.
              this.pending_inputs.splice(j, 1);
            } else {
              // Not processed by the server yet. Re-apply it.
              entity.applyInput(input);
              j++;
            }
          }
        } else {
          // Reconciliation is disabled, so drop all the saved inputs.
          this.pending_inputs = [];
        }
      } else {
        // Received the position of an entity other than this client's.

        if (!this.entity_interpolation) {
          // Entity interpolation is disabled - just accept the server's position.
          entity.x = state.position;
        } else {
          // Add it to the position buffer.
          var timestamp = +new Date();
          entity.position_buffer.push([timestamp, state.position]);
        }
      }
    }
  }
}


Client.prototype.interpolateEntities = function() {
  // Compute render timestamp.
  var now = +new Date();
  var render_timestamp = now - (1000.0 / server.update_rate);

  for (var i in this.entities) {
    var entity = this.entities[i];

    // No point in interpolating this client's entity.
    if (entity.entity_id == this.entity_id) {
      continue;
    }

    // Find the two authoritative positions surrounding the rendering timestamp.
    var buffer = entity.position_buffer;

    // Drop older positions.
    while (buffer.length >= 2 && buffer[1][0] <= render_timestamp) {
      buffer.shift();
    }

    // Interpolate between the two surrounding authoritative positions.
    if (buffer.length >= 2 && buffer[0][0] <= render_timestamp && render_timestamp <= buffer[1][0]) {
      var x0 = buffer[0][1];
      var x1 = buffer[1][1];
      var t0 = buffer[0][0];
      var t1 = buffer[1][0];

      entity.x = x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
    }
  }
}


// =============================================================================
//  The Server.
// =============================================================================
var Server = function(canvas, status) {
  // Connected clients and their entities.
  this.clients = [];
  this.entities = [];

  // Last processed input for each client.
  this.last_processed_input = [];

  // Simulated network connection.
  this.network = new LagNetwork();

  // UI.
  this.canvas = canvas;
  this.status = status;

  // Default update rate.
  this.setUpdateRate(10);
}

Server.prototype.connect = function(client) {
  // Give the Client enough data to identify itself.
  client.server = this;
  client.entity_id = this.clients.length;
  this.clients.push(client);

  // Create a new Entity for this Client.
  var entity = new Entity();
  this.entities.push(entity);
  entity.entity_id = client.entity_id;

  // Set the initial state of the Entity (e.g. spawn point)
  var spawn_points = [4, 6];
  entity.x = spawn_points[client.entity_id];
}

Server.prototype.setUpdateRate = function(hz) {
  this.update_rate = hz;

  clearInterval(this.update_interval);
  this.update_interval = setInterval(
    (function(self) { return function() { self.update(); }; })(this),
    1000 / this.update_rate);
}

Server.prototype.update = function() {
  this.processInputs();
  this.sendWorldState();
  renderWorld(this.canvas, this.entities);
}


// Check whether this input seems to be valid (e.g. "make sense" according
// to the physical rules of the World)
Server.prototype.validateInput = function(input) {
  if (Math.abs(input.press_time) > 1/40) {
    return false;
  }
  return true;
}


Server.prototype.processInputs = function() {
  // Process all pending messages from clients.
  while (true) {
    var message = this.network.receive();
    if (!message) {
      break;
    }

    // Update the state of the entity, based on its input.
    // We just ignore inputs that don't look valid; this is what prevents clients from cheating.
    if (this.validateInput(message)) {
      var id = message.entity_id;
      this.entities[id].applyInput(message);
      this.last_processed_input[id] = message.input_sequence_number;
    }

  }

  // Show some info.
  var info = "Last acknowledged input: ";
  for (var i = 0; i < this.clients.length; ++i) {
    info += "Player " + i + ": #" + (this.last_processed_input[i] || 0) + "   ";
  }
  this.status.textContent = info;
}


// Send the world state to all the connected clients.
Server.prototype.sendWorldState = function() {
  // Gather the state of the world. In a real app, state could be filtered to avoid leaking data
  // (e.g. position of invisible enemies).
  var world_state = [];
  var num_clients = this.clients.length;
  for (var i = 0; i < num_clients; i++) {
    var entity = this.entities[i];
    world_state.push({entity_id: entity.entity_id,
                      position: entity.x,
                      last_processed_input: this.last_processed_input[i]});
  }

  // Broadcast the state to all the clients.
  for (var i = 0; i < num_clients; i++) {
    var client = this.clients[i];
    client.network.send(client.lag, world_state);
  }
}


// =============================================================================
//  Helpers.
// =============================================================================

// Render all the entities in the given canvas.
var renderWorld = function(canvas, entities) {
  // Clear the canvas.
  canvas.width = canvas.width;

  var colours = ["blue", "red"];

  for (var i in entities) {
    var entity = entities[i];

    // Compute size and position.
    var radius = canvas.height*0.9/2;
    var x = (entity.x / 10.0)*canvas.width;

    // Draw the entity.
    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.arc(x, canvas.height / 2, radius, 0, 2*Math.PI, false);
    ctx.fillStyle = colours[entity.entity_id];
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "dark" + colours[entity.entity_id];
    ctx.stroke();
  }
}


var element = function(id) {
  return document.getElementById(id);
}

// =============================================================================
//  Get everything up and running.
// =============================================================================

// World update rate of the Server.
var server_fps = 4;


// Update simulation parameters from UI.
var updateParameters = function() {
  updatePlayerParameters(player1, "player1");
  updatePlayerParameters(player2, "player2");
  server.setUpdateRate(updateNumberFromUI(server.update_rate, "server_fps"));
  return true;
}


var updatePlayerParameters = function(client, prefix) {
  client.lag = updateNumberFromUI(player1.lag, prefix + "_lag");

  var cb_prediction = element(prefix + "_prediction");
  var cb_reconciliation = element(prefix + "_reconciliation");

  // Client Side Prediction disabled => disable Server Reconciliation.
  if (client.client_side_prediction && !cb_prediction.checked) {
    cb_reconciliation.checked = false;
  }

  // Server Reconciliation enabled => enable Client Side Prediction.
  if (!client.server_reconciliation && cb_reconciliation.checked) {
    cb_prediction.checked = true;
  }

  client.client_side_prediction = cb_prediction.checked;
  client.server_reconciliation = cb_reconciliation.checked;

  client.entity_interpolation = element(prefix + "_interpolation").checked;
}


var updateNumberFromUI = function(old_value, element_id) {
  var input = element(element_id);
  var new_value = parseInt(input.value);
  if (isNaN(new_value)) {
    new_value = old_value;
  }
  input.value = new_value;
  return new_value;
}


// When the player presses the arrow keys, set the corresponding flag in the client.
var keyHandler = function(e) {
  e = e || window.event;
  if (e.keyCode == 39) {
    player1.key_right = (e.type == "keydown");
  } else if (e.keyCode == 37) {
    player1.key_left = (e.type == "keydown");
  } else if (e.key == 'd') {
    player2.key_right = (e.type == "keydown");
  } else if (e.key == 'a') {
    player2.key_left = (e.type == "keydown");
  } else {
    console.log(e)
  }
}
document.body.onkeydown = keyHandler;
document.body.onkeyup = keyHandler;


// Setup a server, the player's client, and another player.
var server = new Server(element("server_canvas"), element("server_status"));
var player1 = new Client(element("player1_canvas"), element("player1_status"));
var player2 = new Client(element("player2_canvas"), element("player2_status"));


// Connect the clients to the server.
server.connect(player1);
server.connect(player2);


// Read initial parameters from the UI.
updateParameters();

});

require.register("game", function(exports, require, module) {
var game = new Phaser.Game(320, 320, Phaser.AUTO, 'gameDiv', { preload: preload, create: create, update: update, render: render });

function preload() {
    // game.load.tilemap('map', 'assets/zombie_a5.csv', null, Phaser.Tilemap.CSV);
	game.load.image('tiles', 'assets/tile.png');
	game.load.tilemap('map', 'assets/test.csv', null, Phaser.Tilemap.CSV);
	// game.load.image('tiles', 'assets/zombie_a5.png');
	game.load.spritesheet('h1', 'assets/h1.png', 32, 32);
	game.load.spritesheet('h2', 'assets/h2.png', 32, 32);

	game.load.atlas('zombies', 'assets/ZombieSheet.png', 'assets/ZombieSheet.json', Phaser.Loader.TEXTURE_ATLAS_JSON_HASH);
}

var ZeWorld;
var player;
var layer;
var cursors;
var socket;
var entities = [];
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

	player = new User("P", pseudo, 'h1', 32, 32);
	// entities.push(new_player);
	socket.bcast({type: "P", id: gameProperties.pseudo, face: "h1", x: 32, y: 32});
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
	if (data.id == gameProperties.pseudo)
		return
	var movePlayer = findplayerbyid (data.id);
	if (findplayerbyid (data.id)) return
	else {
		if (data.type == "P")
			var new_enemy = new User(data.type, data.id, data.face, data.x, data.y);
		else
			var new_enemy = new Mob(data.type, data.id, data.face, data.x, data.y);
		entities.push(new_enemy);
	}
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
	return false
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
	game.physics.arcade.collide(player, layer, player.moveUserOver);

	if (!player.isMoving()) {
		if (cursors.left.isDown)
		{
			player.moveLeft(step, speed)
		}
		else if (cursors.right.isDown)
		{
			player.moveRight(step, speed)
		}
		else if (cursors.up.isDown)
		{
			player.moveUp(step, speed)
		}
		else if (cursors.down.isDown)
		{
			player.moveDown(step, speed)
		}
	}
}

function updateRemotePlayers() {
	for (var i = 0; i < entities.length; i++) {
		if (entities[i].needUpdate() && !entities[i].isMoving()) {
			entities[i].sprite.PlayerIsMoving = true
			entities[i].sprite.needUpdate = false
			if (entities[i].sprite.newMove.move == "left") {
				player.moveLeft(step, speed)
			}
			else if (entities[i].sprite.newMove.move == "right") {
				player.moveRight(step, speed)
			}
			else if (entities[i].sprite.newMove.move == "up") {
				player.moveUp(step, speed)
			}
			else if (entities[i].sprite.newMove.move == "down") {
				player.moveDown(step, speed)
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

});

;require.register("gameStart", function(exports, require, module) {
"use strict";

var gameBootstrapper = {
    init: function(gameContainerElementId){

        var game = new Phaser.Game(800, 480, Phaser.AUTO, gameContainerElementId);

        game.state.add('boot', require('./states/boot'));
        game.state.add('login', require('./states/login'));
        game.state.add('play', require('./states/play'));

        game.state.start('boot');
    }
};

module.exports = gameBootstrapper;

});

require.register("main", function(exports, require, module) {

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
}

function onuserlogged() {
	//create a main player object for the connected user to control
	createPlayer();
	gameProperties.in_game = true;
	socket.newPlayer({id: gameProperties.pseudo, x: player.x, y: player.y, angle: player.angle})
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
		game.plugins.add(new GridPhysics(this.game));
		game.physics.gridPhysics.gridSize.set(8);
		// game.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		// game.world.setBounds(0, 0, gameProperties.gameWidth,
		// gameProperties.gameHeight, false, false, false, false);
		// //I’m using P2JS for physics system. You can choose others if you want
		// game.physics.startSystem(Phaser.Physics.P2JS);
		// game.physics.p2.setBoundsToWorld(false, false, false, false, false)
		// //sets the y gravity to 0. This means players won’t fall down by gravity
		// game.physics.p2.gravity.y = 0;
		// // turn gravity off
		// game.physics.p2.applyGravity = false;
		// game.physics.p2.enableBody(game.physics.p2.walls, false);
		// // turn on collision detection
		// game.physics.p2.setImpactEvents(true);

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
			// var pointer = game.input.mousePointer;
			//
			// // distanceToPointer allows us to measure the distance between the
			// // mouse pointer and the player object
			// if (distanceToPointer(player, pointer) <= 50) {
			// 	//The player can move to mouse pointer at a certain speed.
			// 	//look at player.js on how this is implemented.
			// 	movetoPointer(player, 0, pointer, 100);
			// } else {
			// 	movetoPointer(player, 500, pointer);
			// }
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

});

require.register("mob", function(exports, require, module) {
var Mob = function (type, id, face, startx, starty) {
	this.sprite = game.add.sprite(startx , starty, "zombies");

	//this is the unique socket id. We use it as a unique name for enemy
	this.sprite.User_id = id;
	this.sprite.needUpdate = false;
	this.sprite.newMove = null;
	this.sprite.face = face

    this.sprite.dest_x = startx
    this.sprite.dest_y = starty
	game.physics.arcade.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
	this.sprite.body.setSize(32, 32);

	this.sprite.animations.add('left', [3, 4, 5], 10, true);
    this.sprite.animations.add('right', [6, 7, 8], 10, true);
    this.sprite.animations.add('up', [9, 10, 11], 10, true);
    this.sprite.animations.add('down', [0, 1, 2], 10, true);

	this.sprite.PlayerIsMoving = false
	this.sprite.body.onMoveComplete.add(this.moveMobOver, this);
}

User.prototype.adjustSpritePosition = function() {
	markerx = game.math.snapToFloor(Math.ceil(this.sprite.dest_x), 32)
	markery = game.math.snapToFloor(Math.ceil(this.sprite.dest_y), 32)
	console.log("Adjusting : x="+this.sprite.x+" y="+this.sprite.y+" -> x="+ markerx +" y="+markery)
	this.sprite.body.x = markerx
	this.sprite.body.y = markery
}

User.prototype.moveMobOver = function() {
	this.adjustSpritePosition()
	this.sprite.PlayerIsMoving = false
	this.sprite.animations.stop();
	this.sprite.frame = 1;
}

});

;require.register("player", function(exports, require, module) {
var User = function (type, id, face, startx, starty) {
	this.sprite = game.add.sprite(startx , starty, face);

	//this is the unique socket id. We use it as a unique name for enemy
	this.sprite.User_id = id;
	if (type == "P") this.sprite.isPlayer = true
	else this.sprite.isPlayer = false
	this.sprite.needUpdate = false;
	this.sprite.newMove = null;
	this.sprite.face = face
	this.sprite.PlayerOrdersCount = 0

    this.sprite.dest_x = startx
    this.sprite.dest_y = starty
	game.physics.arcade.enable(this.sprite);
    this.sprite.body.collideWorldBounds = true;
	this.sprite.body.setSize(32, 32);

	this.sprite.animations.add('left', [3, 4, 5], 10, true);
    this.sprite.animations.add('right', [6, 7, 8], 10, true);
    this.sprite.animations.add('up', [9, 10, 11], 10, true);
    this.sprite.animations.add('down', [0, 1, 2], 10, true);

	this.sprite.PlayerIsMoving = false
	this.sprite.body.onMoveComplete.add(this.moveUserOver, this);
}

User.prototype.sendMoveToServer = function(move) {
	if (this.sprite.isPlayer) {
		this.sprite.PlayerOrdersCount += 1;
		socket.bcast({type: "P", id: this.sprite.User_id, face: this.sprite.face, num: this.sprite.PlayerOrdersCount, move: move, x: player.sprite.dest_x, y: player.sprite.dest_y })
	}
	this.sprite.PlayerIsMoving = true
}

User.prototype.adjustSpritePosition = function() {
	markerx = game.math.snapToFloor(Math.ceil(this.sprite.dest_x), 32)
	markery = game.math.snapToFloor(Math.ceil(this.sprite.dest_y), 32)
	console.log("Adjusting : x="+this.sprite.x+" y="+this.sprite.y+" -> x="+ markerx +" y="+markery)
	this.sprite.body.x = markerx
	this.sprite.body.y = markery
}

User.prototype.moveUserOver = function() {
	this.adjustSpritePosition()
	this.sprite.PlayerIsMoving = false
	this.sprite.animations.stop();
	this.sprite.frame = 1;
}

User.prototype.isMoving = function() {
	return this.sprite.PlayerIsMoving
}

User.prototype.needUpdate = function() {
	return this.sprite.needUpdate
}

User.prototype.moveLeft = function(step, speed) {
	this.sprite.dest_x = this.sprite.body.x - step
	this.sprite.dest_y = this.sprite.body.y

	this.sendMoveToServer('left')
	this.sprite.body.moveTo(speed, step, 180);
	this.sprite.animations.play('left');
}

User.prototype.moveRight = function(step, speed) {
	this.sprite.dest_x = this.sprite.body.x + step
	this.sprite.dest_y = this.sprite.body.y

	this.sendMoveToServer('right')
	this.sprite.body.moveTo(speed, step, 0);
	this.sprite.animations.play('right');
}

User.prototype.moveUp = function(step, speed) {
	this.sprite.dest_x = this.sprite.body.x
	this.sprite.dest_y = this.sprite.body.y - step

	this.sendMoveToServer('up')
	this.sprite.body.moveTo(speed, step, 270);
	this.sprite.animations.play('up');
}

User.prototype.moveDown = function(step, speed) {
	this.sprite.dest_x = this.sprite.body.x
	this.sprite.dest_y = this.sprite.body.y + step

	this.sendMoveToServer('down')
	this.sprite.body.moveTo(speed, step, 90);
	this.sprite.animations.play('down');
}

});

;require.register("states/boot", function(exports, require, module) {
'use strict';

function Boot(){}

Boot.prototype = {
    preload: function(){
        this.game.stage.disableVisibilityChange = true;
        this.game.stage.backgroundColor = 0x3b0760;
        this.load.onLoadComplete.addOnce(this.onLoadComplete, this);

        this.showLoadingText();
        this.loadAssets();
    },

    onLoadComplete: function(){
        this.game.state.start('play');
    },

    loadAssets: function(){
      this.game.load.image('tiles', 'gameAssets/tile.png');
      this.game.load.tilemap('map', 'gameAssets/test.csv', null, Phaser.Tilemap.CSV);
      // game.load.image('tiles', 'assets/zombie_a5.png');
      this.game.load.spritesheet('h1', 'gameAssets/h1.png', 32, 32);
      this.game.load.spritesheet('h2', 'gameAssets/h2.png', 32, 32);
    },

    showLoadingText: function(){
        var loadingText = "- Loading -";
        var text = this.game.add.text(this.game.world.centerX, this.game.world.centerY, loadingText);
        //  Centers the text
        text.anchor.set(0.5);
        text.align = 'center';

        //  Our font + size
        text.font = 'Arial';
        text.fontWeight = 'bold';
        text.fontSize = 70;
        text.fill = '#ffffff';
    }
};

module.exports = Boot;

});

require.register("states/login", function(exports, require, module) {
'use strict';


var DomHelper = require('utils/DomHelper');

var nickNameInput;
var domToRemove = [];

function Login(){}


Login.prototype = {

    create: function(){
        this.game.stage.backgroundColor = 0x66990D;

        DomHelper.init(this.game);
        domToRemove = [];
        this.showLoginPanel();
    },
    showLoginPanel: function(){
        var me = this;
        var panel = DomHelper.mediumPanel(180, 120, 'game-login-panel');
        var form = DomHelper.form(saveName);
        var blockInput = DomHelper.inputBlock();

        nickNameInput = DomHelper.inputWithLabel(blockInput, 'Enter a nickname', 200, 200);

        var saveButton = DomHelper.createButton('GO !!', 'game-login-button');

        form.appendChild(blockInput);
        form.appendChild(saveButton);
        panel.appendChild(form);

        domToRemove.push(panel); // removing the panel will remove all its childs

        function saveName(){
            me.game.mainPlayerName = nickNameInput.value;
            me.game.keyCrypt = Encrypt_b64(me.game.mainPlayerName+'|USER');

            if(me.game.mainPlayerName){
                me.cleanDom();
                me.game.state.start('play');
             }
             nickNameInput.value = '';
        }
    },

    cleanDom: function(){
        for(var i = 0, max = domToRemove.length; i < max; i++){
            domToRemove[i].remove();
        }
    }
};

module.exports = Login;

});

require.register("states/play", function(exports, require, module) {
'use strict';


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
    create: function(){
      console.log('creatttttttte', this.game.keyCrypt);


      this.game.physics.startSystem(Phaser.Physics.ARCADE);
     	this.cursors = this.game.input.keyboard.createCursorKeys();

     	this.zeWorld = this.game.add.tilemap('map', 32, 32);
      this.zeWorld.addTilesetImage('tiles');
      this.layer = this.zeWorld.createLayer(0);
     	this.game.physics.arcade.enable(this.layer);
      this.layer.resizeWorld();
     	this.zeWorld.setCollisionBetween(45, 100);
     	this.layer.debug = true;
    },

    update: function(){

    }
};

module.exports = Play;

});

require.register("toto", function(exports, require, module) {

var game = new Phaser.Game(800, 600, Phaser.CANVAS, 'phaser-example', { preload: preload, create: create, update:update, render:render  });

var sprite ;
var counter = 0 ;
var step = Math.PI * 2 / 360 ;


function preload() {

    // Load images to use as the game sprites
    game.load.image('sprite', 'assets/sprites/phaser2.png');

}

function create() {

    // Create sprite and put it in the middle of the stage
    sprite = game.add.sprite(0, 0, 'sprite');
    sprite.alpha = 0.5 ;
    sprite.x = game.width / 2 ;
    sprite.anchor.x = sprite.anchor.y = 0.5 ;
}

function update()
{
    // Move sprite up and down smoothly for show
    var tStep = Math.sin( counter ) ;
    sprite.y = (game.height/2) + tStep * 30 ;
    sprite.rotation += Phaser.Math.degToRad( 0.1 * tStep ) ;
    counter += step ;
}

function render() {

    // Sprite debug info
    game.debug.spriteInfo(sprite, 32, 32);

}

});

;require.register("utils/ChatManager", function(exports, require, module) {
'use strict';

var NetworkManager = require('client/network/NetworkManager');

var chatInput, messagesBox;
var mainPlayerName;

function init(containerId){
    initGuiElements(containerId);
    appendSystemMessage('info', 'Welcome ' + mainPlayerName + ' to this Demo');
}

/*
 Create the html structure that correspond to this :

 <div id="game-chat-box">
     <div class="game-chat-messages">
        Messages goes here
     </div>
     <form>
        <input type="text" class="game-chat-input">
     </form>
 </div>
 */
function initGuiElements(containerId){
    var container = document.getElementById(containerId);

    var chatBox = document.createElement('div');
    chatBox.id = 'game-chat-box';

    messagesBox = document.createElement('div');
    messagesBox.className = 'game-chat-messages';

    var chatForm = document.createElement('form');

    chatForm.onsubmit= onSendMessage;

    chatInput = document.createElement('input');
    chatInput.type = 'text';
    chatInput.className = 'game-chat-input';

    chatForm.appendChild(chatInput);

    chatBox.appendChild(messagesBox);
    chatBox.appendChild(chatForm);

    container.appendChild(chatBox);
}

function onSendMessage(){
    var textMessage = escapeHtml(chatInput.value);

    NetworkManager.sendChatMessage(textMessage);

    appendMessage(mainPlayerName, textMessage);

    chatInput.value = '';

    return false;
}

function appendSystemMessage(type, message){
    appendMessage('*', message, type);
}

function appendMessage(author, message, messageType){
    var cssTypeSuffix = '';
    if(messageType !== undefined){
        cssTypeSuffix = 'game-message-type-' + messageType;
    }

    var htmlMessage = '<span class="game-message ' + cssTypeSuffix + '"><span class="game-message-author"> [' + author + ']</span> : ' + message + '</span>';
    messagesBox.innerHTML += htmlMessage + '<br />';

    messagesBox.scrollTop = messagesBox.scrollHeight;
}

function setMainPlayerName(nickName){
    if(!nickName || nickName.length === 0){
        return false;
    }
    mainPlayerName = escapeHtml(nickName);
    return mainPlayerName;
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = {
    init: init,
    appendMessage: appendMessage,
    systemMessage: appendSystemMessage,
    setMainPlayerName: setMainPlayerName
};
});

require.register("utils/DomHelper", function(exports, require, module) {
'use strict';

var containerElement, verticalOffset = 0, horizontalOffset = 0;

function getY(y){
    return y - verticalOffset;
}

function getX(x){
    return x - horizontalOffset;
}


module.exports = {
    init: function(game){
        containerElement = document.getElementById(game.parent);
        verticalOffset = game.height;
    },

    mediumPanel: function (x, y, cssClass){
        if(!cssClass){
            cssClass = '';
        }
        var panel = document.createElement('div');
        panel.className = 'gui-panel gui-panel-medium ' + cssClass;
        panel.style.left = getX(x) + 'px';
        panel.style.top = getY(y) + 'px';

        containerElement.appendChild(panel);

        return panel;
    },

    form: function(onSaveCallback){
        var form = document.createElement('form');
        form.onsubmit= function(){
            onSaveCallback();

            return false;
        };

        return form;
    },

    inputBlock: function(){
        var blockInput = document.createElement('div');
        blockInput.className='game-input-block';
        return blockInput;
    },

    inputWithLabel: function(parent, label, x, y){
        var nameLabel = document.createElement('div');
        nameLabel.className='game-gui-label';
        nameLabel.innerText = label;


        var nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'game-gui-input';

        parent.appendChild(nameLabel);
        parent.appendChild(nameInput);

        return nameInput;
    },

    createButton: function(label, cssClass){
        var button = document.createElement('button');
        button.className = cssClass;

        button.innerText = label;
        return button;
    },

    createElement: function(elementName, className){
        var element = document.createElement(elementName);
        element.className = className;
        return element;
    },

    addToContainer: function(element){
        containerElement.appendChild(element);
    },
    getX: getX,
    getY: getY

};
});

require.register("utils/Pathfinder", function(exports, require, module) {
'use strict';


var pathfinder;

module.exports = {
  init: function(game, walkableLayer, walkableLayerData, walkableTiles, tileSize){

      this.walkableLayer = walkableLayer;
      this.tileSize = tileSize;
      pathfinder = game.plugins.add(Phaser.Plugin.PathFinderPlugin);
      pathfinder.setGrid(walkableLayerData, walkableTiles);
      
  },
    calculatePath: function(fromX, fromY, toX, toY, onPathReadyCallback){
        var fromTiles = [this.getTileX(fromX), this.getTileY(fromY)];
        var toTiles = [this.getTileX(toX), this.getTileY(toY)];
        pathfinder.preparePathCalculation (fromTiles, toTiles,onPathReadyCallback );

        pathfinder.calculatePath();
    },

    getTileX: function(value){
        return this.walkableLayer.getTileX(value);
    },
    getTileY: function(value){
        return this.walkableLayer.getTileY(value);
    }
};
});

require.register("utils/ScoreBoard", function(exports, require, module) {
'use strict';

var DomHelper = require('client/utils/DomHelper');
var scoreList;


function init(){
    var scoreContainer = DomHelper.createElement('div', 'game-scoreboard');
    scoreContainer.style.left = DomHelper.getX(800) + 'px';
    scoreContainer.style.top = DomHelper.getY(0) + 'px';

    var title = document.createElement('h3');
    title.innerHTML = 'Scores';

    scoreList = DomHelper.createElement('ul', 'game-scorelist');

    scoreContainer.appendChild(title);
    scoreContainer.appendChild(scoreList);

    DomHelper.addToContainer(scoreContainer);
}

function setScores(scores){
    // empty the list
    while (scoreList.firstChild) {
        scoreList.removeChild(scoreList.firstChild);
    }

    scores.sort(orderByScore)
          .forEach(addScoreElement);

    function orderByScore(a, b) {
        return parseFloat(b.score) - parseFloat(a.score);
    }
    function addScoreElement(scoreInfo){
        var listElement = document.createElement('li');
        listElement.innerHTML = '<strong>' + scoreInfo.nickname + '</strong>' + ' : ' + scoreInfo.score;

        scoreList.appendChild(listElement);
    }
}

module.exports = {
    init: init,
    setScores: setScores
};
});

require.register("wsconnect", function(exports, require, module) {
function Connection(addr, callback) {
    var ws = new WebSocket ('ws://'+addr+'/ws');
    var brothers = new Set();
    var connEvt = new Set();

	this.on = function(evt, callback) {
		connEvt[evt] = callback
	}

    ws.onopen = callback

    ws.onmessage = function(evt) {
    	switch(evt.data.substr(0, 6))
    	{
    		case "[RDCT]":
    			reconnect(evt.data.substr(6))
    			break;
    		case "[FLBK]":
    			obj = JSON.parse(evt.data.substr(6));
    			for (var k in obj.BRTHLST){
    			    if (obj.BRTHLST.hasOwnProperty(k))
    					 brothers.add(obj.BRTHLST[k].Httpaddr)
    			}
    			break;
            case "[BCST]":
                obj = JSON.parse(evt.data.substr(6));
                // console.log("RCPT: "+obj);
				connEvt["enemy_move"].call(this, obj);
                break;
			case "[NUSR]":
				obj = JSON.parse(evt.data.substr(6));
				// obj = evt.data.substr(6);
                // console.log("RCPT: "+obj);
				connEvt["new_enemyPlayer"].call(this, obj);
				break;
			case "[WLCM]":
				pseudo = evt.data.substr(6);
				connEvt["userlogged"].call(this, pseudo);
				break;
    		default:;
    	}
    }

	ws.onclose = function(evt) {
		switch(evt.code)
		{
			case 1005:
				console.log("CLOSE By Client");
				ws = null;
				break;
			case 1000:
				console.log("CLOSE By SERVER: " + evt.reason);
				ws = null;
				break;
			case 1006:
			default:
				// console.log("Lost Connection: " + evt.reason);
				// for (let item of brothers) {
				// 	reconnect(item)
				// 	if (ws.readyState == 0) {
				// 		brothers.delete(item)
				// 	}
				// 	else break;
				// }
				break;
		}
	}

	this.logon = function(pass) {
        ws.send("[HELO]" + pass);
		// connEvt["userlogged"].call(this);
	}

    this.bcast = function(message) {
		// console.log(message);
        ws.send("[BCST]" + JSON.stringify(message))
    }

	this.newPlayer = function(message) {
		// console.log(message);
        ws.send("[NUSR]" + JSON.stringify(message))
    }
}

});

;
//# sourceMappingURL=app.js.map