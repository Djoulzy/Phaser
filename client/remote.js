class Remote extends User
{
	constructor(id, face, startx, starty) {
		super(id, face, startx, starty)

		this.sprite.isPlayer = false
		this.sprite.PlayerOrdersCount = 0
	}

	sendMoveToServer(move) {
		this.sprite.PlayerIsMoving = true
	}
}
