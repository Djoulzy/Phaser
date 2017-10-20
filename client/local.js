class Local extends User
{
	constructor(id, face, startx, starty) {
		super(id, face, startx, starty)

		this.sprite.isPlayer = true
		this.sprite.PlayerOrdersCount = 0
		this.sprite.body.onMoveComplete.add(this.moveLocalOver, this);
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
			socket.bcast({type: "P", id: this.sprite.User_id, face: this.sprite.face, num: this.sprite.PlayerOrdersCount, move: move, x: player.sprite.dest_x, y: player.sprite.dest_y })
		}
		this.sprite.PlayerIsMoving = true
	}
}
