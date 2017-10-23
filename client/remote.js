class Remote extends User
{
	constructor(id, face, startx, starty) {
		super(id, face, startx, starty)

		this.sprite.isPlayer = false
		this.sprite.PlayerOrdersCount = 0
		this.sprite.body.onMoveComplete.add(this.moveRemoteOver, this);
		this.graphics.lineStyle(2, 0x14c818 , 1);
	}

	debugLine() {
		this.graphics.moveTo(this.sprite.body.x + 16, this.sprite.body.y + 16);//moving position of graphic if you draw mulitple lines
		this.graphics.lineTo(this.sprite.dest_x + 16, this.sprite.dest_y + 16);
		this.graphics.endFill();
	}

	moveRemoteOver() {
		this.adjustSpritePosition()
		this.sprite.PlayerIsMoving = false
		this.sprite.animations.stop();
		this.sprite.frame = 1;
	}

	moveLeft(step, speed) {
		this.debugLine()
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 180);
		this.sprite.animations.play('left');
	}

	moveRight(step, speed) {
		this.debugLine()
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 0);
		this.sprite.animations.play('right');
	}

	moveUp(step, speed) {
		this.debugLine()
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 270);
		this.sprite.animations.play('up');
	}

	moveDown(step, speed) {
		this.debugLine()
		this.sprite.PlayerIsMoving = true
		this.sprite.body.moveTo(speed, step, 90);
		this.sprite.animations.play('down');
	}
}
