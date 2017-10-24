class Objects
{
	constructor(startx, starty) {
		this.sprite = game.add.sprite(startx , starty, "shoot");

	    this.sprite.dest_x = startx
	    this.sprite.dest_y = starty
		game.physics.arcade.enable(this.sprite);
	    this.sprite.body.collideWorldBounds = true;
		this.sprite.body.setSize(32, 32);
		this.sprite.body.onMoveComplete.add(this.moveOver, this);
	}

	adjustSpritePosition() {
		var markerx = game.math.snapToFloor(Math.ceil(this.sprite.dest_x), 32)
		var markery = game.math.snapToFloor(Math.ceil(this.sprite.dest_y), 32)
		// console.log("Adjusting : x="+this.sprite.body.x+" y="+this.sprite.body.y+" -> x="+ markerx +" y="+markery)
		this.sprite.body.x = markerx
		this.sprite.body.y = markery
		// this.graphics.clear();
	}

	moveOver(sprt) {
		this.sprite.animations.stop();
	}

	isMoving() {
		return this.sprite.PlayerIsMoving
	}
}
