class Shoot extends Objects
{
	constructor(startx, starty) {
		super(startx, starty)
		this.initAnims()
	}

	initAnims() {
		this.sprite.animations.add('fire', Phaser.Animation.generateFrameNames('fire', 1, 3))
	}

	play(step, speed) {
		this.sprite.animations.play('fire', 40, false, true)
	}
}

class Bullet extends Objects
{
	constructor(startx, starty) {
		super(startx, starty)
		console.log("SHOOT")
	}

	// moveOver(sprt) {
	// 	this.sprite.destroy();
	// }

	sendMoveToServer(move) {
	}

	moveLeft(step, speed) {
		this.sprite.frameName = "bullet3"
		this.sprite.dest_x = this.sprite.body.x - step
		this.sprite.dest_y = this.sprite.body.y

		this.sendMoveToServer('left')
		this.sprite.body.moveTo(speed, step, 180);
	}

	moveRight(step, speed) {
		this.sprite.frameName = "bullet1"
		this.sprite.dest_x = this.sprite.body.x + step
		this.sprite.dest_y = this.sprite.body.y

		this.sendMoveToServer('right')
		this.sprite.body.moveTo(speed, step, 0);
	}

	moveUp(step, speed) {
		this.sprite.frameName = "bullet4"
		this.sprite.dest_x = this.sprite.body.x
		this.sprite.dest_y = this.sprite.body.y - step

		this.sendMoveToServer('up')
		this.sprite.body.moveTo(speed, step, 270);
	}

	moveDown(step, speed) {
		this.sprite.frameName = "bullet2"
		this.sprite.dest_x = this.sprite.body.x
		this.sprite.dest_y = this.sprite.body.y + step

		this.sendMoveToServer('down')
		this.sprite.body.moveTo(speed, step, 90);
	}

	move(bearing, step, speed) {
		switch(bearing) {
			case "up": this.moveUp(step, speed); break;
			case "down": this.moveDown(step, speed); break;
			case "left": this.moveLeft(step, speed); break;
			case "right": this.moveRight(step, speed); break;
		}
	}
}
