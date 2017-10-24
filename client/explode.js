class Explode extends Objects
{
	constructor(startx, starty) {
		super(startx, starty)
		this.initAnims()
	}

	initAnims() {
		this.sprite.animations.add('splash', Phaser.Animation.generateFrameNames('explode', 1, 4));
	}

	play(step, speed) {
		this.sprite.animations.play('splash', 40, false, true);
	}
}
