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

		this.sprite.PlayerIsMoving = false

		this.line = new Phaser.Line(0, 0, 100, 100);
	    this.graphics=game.add.graphics(0,0);
	}

	initAnims() {
		this.sprite.animations.add('left', [3, 4, 5], 10, true);
	    this.sprite.animations.add('right', [6, 7, 8], 10, true);
	    this.sprite.animations.add('up', [9, 10, 11], 10, true);
	    this.sprite.animations.add('down', [0, 1, 2], 10, true);
	}

	adjustSpritePosition() {
		var markerx = game.math.snapToFloor(Math.ceil(this.sprite.dest_x), 32)
		var markery = game.math.snapToFloor(Math.ceil(this.sprite.dest_y), 32)
		// console.log("Adjusting : x="+this.sprite.body.x+" y="+this.sprite.body.y+" -> x="+ markerx +" y="+markery)
		this.sprite.body.x = markerx
		this.sprite.body.y = markery
		// this.graphics.clear();
	}

	isMoving() {
		return this.sprite.PlayerIsMoving
	}

	needUpdate() {
		return this.sprite.needUpdate
	}
}
