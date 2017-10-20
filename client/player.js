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
