class Local extends User
{
	constructor(id, face, startx, starty) {
		super(id, face, startx, starty)

		this.initAnims()
		this.isPlayer = true
		this.PlayerOrdersCount = 0
		// this.sprite.body.onMoveComplete.add(this.moveLocalOver, this);
		// this.graphics.lineStyle(2, 0xffd900, 1);
		this.bearing = "down"
	}

	fire(portee) {
		socket.shoot({type: "P", id: this.User_id, x: this.X, y: this.Y, move: this.bearing, pow: portee })
	}

	sendMoveToServer(move) {
		if (this.isPlayer) {
			this.bearing = move
			this.PlayerOrdersCount += 1;
			// console.log("Sending: "+player.sprite.dest_x+"  "+player.sprite.dest_y)
			// this.graphics.moveTo(this.sprite.body.x + 16, this.sprite.body.y + 16);//moving position of graphic if you draw mulitple lines
		    // this.graphics.lineTo(this.sprite.dest_x + 16, this.sprite.dest_y + 16);
		    // this.graphics.endFill();
			socket.bcast({type: "P", id: this.User_id, face: this.face, num: this.PlayerOrdersCount, move: move, speed: 1, x: this.dest_X, y: this.dest_Y })
		}
		this.PlayerIsMoving = true
	}

	moveOver() {
		this.adjustSpritePosition()
		this.PlayerIsMoving = false
		this.sprite.animations.stop();
	}

	moveLeft(step, speed) {
		this.dest_X = this.X - 1
		this.dest_Y = this.Y

		this.sendMoveToServer('left')
		this.sprite.body.moveTo(speed, step, 180);
		this.sprite.animations.play('left');
	}

	moveRight(step, speed) {
		this.dest_X = this.X + 1
		this.dest_Y = this.Y

		this.sendMoveToServer('right')
		this.sprite.body.moveTo(speed, step, 0);
		this.sprite.animations.play('right');
	}

	moveUp(step, speed) {
		this.dest_X = this.X
		this.dest_Y = this.Y - 1

		this.sendMoveToServer('up')
		this.sprite.body.moveTo(speed, step, 270);
		this.sprite.animations.play('up');
	}

	moveDown(step, speed) {
		this.dest_X = this.X
		this.dest_Y = this.Y + 1

		this.sendMoveToServer('down')
		this.sprite.body.moveTo(speed, step, 90);
		this.sprite.animations.play('down');
	}
}
