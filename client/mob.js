class Mob extends Remote
{
	constructor(id, face, startx, starty) {
		super(id, "zombies", startx, starty)
		this.graphics.lineStyle(2, 0xf11010 , 1);
	}

	initAnims(face) {
		// visual = int((face-1)*12 +1)
		// this.sprite.animations.add('left', [visual+3, visual+4, visual+5], 10, true);
	    // this.sprite.animations.add('right', [visual+6, visual+7, visual+8], 10, true);
	    // this.sprite.animations.add('up', [visual+9, visual+10, visual+11], 10, true);
	    // this.sprite.animations.add('down', [visual+0, visual+1, visual+2], 10, true);

		// visual = 13
		this.sprite.animations.add('left', [15, 16, 17], 10, true);
	    this.sprite.animations.add('right', [18, 19, 20], 10, true);
	    this.sprite.animations.add('up', [21, 22, 23], 10, true);
	    this.sprite.animations.add('down', [12, 13, 14], 10, true);
	}
}
