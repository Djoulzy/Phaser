class Mob extends Remote
{
	constructor(id, face, startx, starty) {
		super(id, "zombies", startx, starty)
		this.graphics.lineStyle(2, 0xf11010 , 1);
	}
}
