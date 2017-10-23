class Local extends User
{
	constructor(id, face, startx, starty) {
		super(id, face, startx, starty)

		this.initAnims()
		this.sprite.isPlayer = true
		this.sprite.PlayerOrdersCount = 0
		this.sprite.body.onMoveComplete.add(this.moveLocalOver, this);
		this.graphics.lineStyle(2, 0xffd900, 1);
	}

	moveLocalOver() {
		this.adjustSpritePosition()
		this.sprite.PlayerIsMoving = false
		// this.sprite.animations.stop();
		// this.sprite.frame = 1;
	}

	sendMoveToServer(move) {
		if (this.sprite.isPlayer) {
			this.sprite.PlayerOrdersCount += 1;
			// console.log("Sending: "+player.sprite.dest_x+"  "+player.sprite.dest_y)
			this.graphics.moveTo(this.sprite.body.x + 16, this.sprite.body.y + 16);//moving position of graphic if you draw mulitple lines
		    this.graphics.lineTo(this.sprite.dest_x + 16, this.sprite.dest_y + 16);
		    this.graphics.endFill();
			socket.bcast({type: "P", id: this.sprite.User_id, face: this.sprite.face, num: this.sprite.PlayerOrdersCount, move: move, speed: 1, x: this.sprite.dest_x, y: this.sprite.dest_y })
		}
		this.sprite.PlayerIsMoving = true
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
