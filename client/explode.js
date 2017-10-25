class Explode
{
	constructor() {
		this.explodes = game.add.group();
	    this.explodes.enableBody = true;
	}

	boom(from) {
		var explode = this.explodes.getFirstExists(false);
		if (!explode)
		{
			explode = this.explodes.create(from.body.x, from.body.y, 'shoot');
			explode.animations.add('boom', Phaser.Animation.generateFrameNames('explode', 1, 4));
		}
		explode.reset(from.body.x, from.body.y);
		explode.play('boom', 30, false, true)
	}
}
