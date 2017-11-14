'use strict';

const User = require('client/user');

class Local extends User
{
	constructor(game, id, face, startx, starty) {
		super(game, id, face, startx, starty)

		this.initAnims()
		this.isPlayer = true
		this.PlayerOrdersCount = 0
		// this.sprite.body.onMoveComplete.add(this.moveLocalOver, this);
		// this.graphics.lineStyle(2, 0xffd900, 1);
		this.bearing = "down"
		this.area = new Phaser.Point(0, 0)
	}

	updateArea(x, y) {
		this.area.x = Math.floor(x/this.game.Properties.areaWidth)
		this.area.y = Math.floor(y/this.game.Properties.areaHeight)
	}

	fire(portee) {
		this.game.socket.playerShoot({
			typ: "P",
			id: this.User_id,
			x: this.X,
			y: this.Y,
			mov: this.bearing,
			pow: portee
		})
	}

	sendMoveToServer(move) {
		if (this.isPlayer) {
			this.updateArea(this.dest_X, this.dest_Y)
			this.bearing = move
			this.PlayerOrdersCount += 1;
			// console.log("Sending: "+player.sprite.dest_x+"  "+player.sprite.dest_y)
			// this.graphics.moveTo(this.sprite.body.x + 16, this.sprite.body.y + 16);//moving position of graphic if you draw mulitple lines
		    // this.graphics.lineTo(this.sprite.dest_x + 16, this.sprite.dest_y + 16);
		    // this.graphics.endFill();
			this.game.socket.playerMove({
				typ: "P",
				id: this.User_id,
				png: this.face,
				num: this.PlayerOrdersCount,
				mov: move,
				spd: 1,
				x: this.dest_X,
				y: this.dest_Y
			})
		}
		this.PlayerIsMoving = true
	}

	moveOver() {
		this.adjustSpritePosition()
		this.PlayerIsMoving = false
		this.sprite.animations.stop();
	}

	moveLeft(step, speed) {
		var map = this.game.WorldMap[this.area.x+'_'+this.area.y]
		if (map.getTile(this.X - 1, this.Y, "obstacles") == null) {
			this.dest_X = this.X - 1
			this.dest_Y = this.Y
			this.sendMoveToServer('left')
			this.sprite.body.moveTo(speed, step, 180);
			this.sprite.animations.play('left');
		}
	}

	moveRight(step, speed) {
		var map = this.game.WorldMap[this.area.x+'_'+this.area.y]
		if (map.getTile(this.X + 1, this.Y, "obstacles") == null) {
			this.dest_X = this.X + 1
			this.dest_Y = this.Y
			this.sendMoveToServer('right')
			this.sprite.body.moveTo(speed, step, 0);
			this.sprite.animations.play('right');
		}
	}

	moveUp(step, speed) {
		var map = this.game.WorldMap[this.area.x+'_'+this.area.y]
		if (map.getTile(this.X, this.Y - 1, "obstacles") == null) {
			this.dest_X = this.X
			this.dest_Y = this.Y - 1
			this.sendMoveToServer('up')
			this.sprite.body.moveTo(speed, step, 270);
			this.sprite.animations.play('up');
		}
	}

	moveDown(step, speed) {
		var map = this.game.WorldMap[this.area.x+'_'+this.area.y]
		if (map.getTile(this.X, this.Y + 1, "obstacles") == null) {
			this.dest_X = this.X
			this.dest_Y = this.Y + 1
			this.sendMoveToServer('down')
			this.sprite.body.moveTo(speed, step, 90);
			this.sprite.animations.play('down');
		}
	}
}

module.exports = Local
