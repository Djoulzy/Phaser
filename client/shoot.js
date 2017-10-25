class Shoot
{
	constructor() {
		this.bullets = game.add.group();
	    this.bullets.enableBody = true;
	    this.bullets.physicsBodyType = Phaser.Physics.ARCADE;
		this.bulletTime = 0;

		this.gunfire = game.add.group();
	}

	moveOver(sprt) {
		sprt.kill();
	}

	sendMoveToServer(move) {
	}

	showFire(from) {
		var fire = this.gunfire.getFirstExists(false);
		if (!fire)
		{
			fire = this.bullets.create(from.body.x, from.body.y, 'shoot');
			fire.animations.add('fire', Phaser.Animation.generateFrameNames('fire', 1, 3));
		}
        fire.reset(from.body.x, from.body.y);
		fire.play('fire', 30, false, true)
	}

	moveLeft(bullet, step, speed) {
		this.showFire(bullet)
		bullet.frameName = "bullet3"
		this.sendMoveToServer('left')
		bullet.body.moveTo(speed, step, 180);
	}

	moveRight(bullet, step, speed) {
		this.showFire(bullet)
		bullet.frameName = "bullet1"
		this.sendMoveToServer('right')
		bullet.body.moveTo(speed, step, 0);
	}

	moveUp(bullet, step, speed) {
		this.showFire(bullet)
		bullet.frameName = "bullet4"
		this.sendMoveToServer('up')
		bullet.body.moveTo(speed, step, 270);
	}

	moveDown(bullet, step, speed) {
		this.showFire(bullet)
		bullet.frameName = "bullet2"
		this.sendMoveToServer('down')
		bullet.body.moveTo(speed, step, 90);
	}

	fire(from, step, speed) {

	    //  To avoid them being allowed to fire too fast we set a time limit
	    if (game.time.now > this.bulletTime)
	    {
			from.fire(step)
	        //  Grab the first bullet we can from the pool
	        var bullet = this.bullets.getFirstExists(false);
	        if (!bullet)
	        {
				bullet = this.bullets.create(from.sprite.body.x, from.sprite.body.y, 'shoot');
				bullet.checkWorldBounds = true;
				bullet.outOfBoundsKill = true;
			}
            //  And fire it
            bullet.reset(from.sprite.body.x, from.sprite.body.y);
			bullet.body.onMoveComplete.add(this.moveOver, this);

			switch(from.bearing) {
				case "up": this.moveUp(bullet, step, speed); break;
				case "down": this.moveDown(bullet, step, speed); break;
				case "left": this.moveLeft(bullet, step, speed); break;
				case "right": this.moveRight(bullet, step, speed); break;
			}
            this.bulletTime = game.time.now + 500;
	    }

	}
}
