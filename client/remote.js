class Remote extends User
{
	constructor(id, face, startx, starty) {
		super(id, face, startx, starty)

		this.sprite.isPlayer = false
		this.sprite.PlayerOrdersCount = 0
		this.sprite.body.onMoveComplete.add(this.moveRemoteOver, this);
	}

	moveRemoteOver() {
		this.adjustSpritePosition()
		this.sprite.PlayerIsMoving = false
		this.sprite.animations.stop();
		this.sprite.frame = 1;
	}

	moveLeft(step, speed) {
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 180);
		this.sprite.animations.play('left');
	}

	moveRight(step, speed) {
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 0);
		this.sprite.animations.play('right');
	}

	moveUp(step, speed) {
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 270);
		this.sprite.animations.play('up');
	}

	moveDown(step, speed) {
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 90);
		this.sprite.animations.play('down');
	}
}
