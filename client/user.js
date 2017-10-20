class User
{
	constructor(id, face, startx, starty) {
		this.sprite = game.add.sprite(startx , starty, face);

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
	}

	sendMoveToServer(move) {
	}

	adjustSpritePosition() {
		var markerx = game.math.snapToFloor(Math.ceil(this.sprite.dest_x), 32)
		var markery = game.math.snapToFloor(Math.ceil(this.sprite.dest_y), 32)
		// console.log("Adjusting : x="+this.sprite.x+" y="+this.sprite.y+" -> x="+ markerx +" y="+markery)
		this.sprite.body.x = markerx
		this.sprite.body.y = markery
	}

	isMoving() {
		return this.sprite.PlayerIsMoving
	}

	needUpdate() {
		return this.sprite.needUpdate
	}

	moveLeft(step, speed) {
		this.sprite.dest_x = this.sprite.body.x - step
		this.sprite.dest_y = this.sprite.body.y

		this.sendMoveToServer('left')
		this.sprite.body.moveTo(speed, step, 180);
		this.sprite.animations.play('left');
	}

	moveRight(step, speed) {
		this.sprite.dest_x = this.sprite.body.x + step
		this.sprite.dest_y = this.sprite.body.y

		this.sendMoveToServer('right')
		this.sprite.body.moveTo(speed, step, 0);
		this.sprite.animations.play('right');
	}

	moveUp(step, speed) {
		this.sprite.dest_x = this.sprite.body.x
		this.sprite.dest_y = this.sprite.body.y - step

		this.sendMoveToServer('up')
		this.sprite.body.moveTo(speed, step, 270);
		this.sprite.animations.play('up');
	}

	moveDown(step, speed) {
		this.sprite.dest_x = this.sprite.body.x
		this.sprite.dest_y = this.sprite.body.y + step

		this.sendMoveToServer('down')
		this.sprite.body.moveTo(speed, step, 90);
		this.sprite.animations.play('down');
	}
}
