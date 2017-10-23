"use strict";

var CharacterSpr = require('gameSprites/CharacterSpr');

var CharacterObj = function(game, x, y, isMainPlayer) {
    this.configure(game, isMainPlayer);
    this.setupSprite(x, y);
    this.resetCurrentPosition();
};

CharacterObj.prototype.configure = function(game, isMainPlayer){
    this.game = game;
    this.isMainPlayer = isMainPlayer;

};

CharacterObj.prototype.setupSprite = function(x, y){
    this.sprite = new CharacterSpr(this.game, x, y, this.isMainPlayer);
    this.game.add.existing(this.sprite);
};

CharacterObj.prototype.resetCurrentPosition  = function(){
    this.moving = false;
    this.sprite.stopAnimation();
};

CharacterObj.prototype.manageMouvement = function(){
  this.cursors = this.game.input.keyboard.createCursorKeys();

if (!this.sprite.isMoving()) {
    if (this.cursors.left.isDown)
    {
        this.sprite.walkLeft();
    }
    else if (this.cursors.right.isDown)
    {
        this.sprite.walkRight();
    }
    else if (this.cursors.up.isDown)
  {

    this.sprite.walkUp();
  }
  else if (this.cursors.down.isDown)
  {

    this.sprite.walkDown();
  }
    else
    {
        //  Stand still
        this.resetCurrentPosition();
    }
}
}

module.exports = CharacterObj;
