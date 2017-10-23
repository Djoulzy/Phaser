"use strict";

var Config = require('config');

var CharacterSpr = function(game, dest_x, dest_y) {
  this.face = 'h1';

  this.isPlayer = true
  this.PlayerOrdersCount = 0

  this.step = 32;
  this.speed = Math.ceil((1000/Config.ServerTimeStep)/32)*32+50;




  Phaser.Sprite.call(this, game, dest_x, dest_y, this.face);
  this.enableCollision();
  this.setupAnimations();
};

CharacterSpr.prototype = Object.create(Phaser.Sprite.prototype);
CharacterSpr.prototype.constructor = CharacterSpr;

CharacterSpr.prototype.enableCollision = function() {
    this.game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
};

CharacterSpr.prototype.adjustSpritePosition = function() {
  var markerx = this.game.math.snapToFloor(Math.ceil(this.dest_x), 32)
  var markery = this.game.math.snapToFloor(Math.ceil(this.dest_y), 32)
  // console.log("Adjusting : x="+this.sprite.body.x+" y="+this.sprite.body.y+" -> x="+ markerx +" y="+markery)
  this.body.x = markerx
  this.body.y = markery

  this.PlayerIsMoving = false
  // this.graphics.clear();
}

CharacterSpr.prototype.setupAnimations = function() {
    //this.anchor.setTo(0.5, 0.5);

    this.User_id = this.game.mainPlayerName;
		this.needUpdate = false;
		this.newMove = null;

    this.body.setSize(32, 32);
    this.PlayerIsMoving = false

    this.animations.add('left', [3, 4, 5], 10, true);
	  this.animations.add('right', [6, 7, 8], 10, true);
	  this.animations.add('up', [9, 10, 11], 10, true);
	  this.animations.add('down', [0, 1, 2], 10, true);

    this.line = new Phaser.Line(0, 0, 100, 100);
	  this.graphics=this.game.add.graphics(0,0);
    this.graphics.lineStyle(2, 0xffd900, 1);

    this.body.onMoveComplete.add(this.adjustSpritePosition, this);

};

CharacterSpr.prototype.sendMoveToServer = function(move) {

    this.PlayerOrdersCount += 1;
    // console.log("Sending: "+player.sprite.dest_x+"  "+player.sprite.dest_y)
    this.graphics.moveTo(this.body.x + 16, this.body.y + 16);//moving position of graphic if you draw mulitple lines
      this.graphics.lineTo(this.dest_x + 16, this.dest_y + 16);
      this.graphics.endFill();

    this.game.socket.bcast({type: "P", id: this.User_id, face: this.face, num: this.PlayerOrdersCount, move: move, speed: 1, x: this.dest_x, y: this.dest_y })


  this.graphics.moveTo(this.body.x + 16, this.body.y + 16);//moving position of graphic if you draw mulitple lines
  this.graphics.lineTo(this.dest_x + 16, this.dest_y + 16);
  this.graphics.endFill();

  this.PlayerIsMoving = true;
};

CharacterSpr.prototype.walkLeft = function(){
    this.dest_x = this.body.x - this.step
    this.dest_y = this.body.y

    this.sendMoveToServer('left')
    this.body.moveTo(this.speed, this.step, 180);
    this.animations.play('left');
};

CharacterSpr.prototype.walkRight = function(){
    this.dest_x = this.body.x + this.step
    this.dest_y = this.body.y

    this.sendMoveToServer('right')
    this.body.moveTo(this.speed, this.step, 0);
    this.animations.play('right');
};

CharacterSpr.prototype.walkUp = function(){
  this.dest_x = this.body.x
  this.dest_y = this.body.y - this.step

  this.sendMoveToServer('up')
  this.body.moveTo(this.speed, this.step, 270);
  this.animations.play('up');
};

CharacterSpr.prototype.walkDown = function(){
  this.dest_x = this.body.x
  this.dest_y = this.body.y + this.step

  this.sendMoveToServer('down')
  this.body.moveTo(this.speed, this.step, 90);
  this.animations.play('down');
};

CharacterSpr.prototype.stopAnimation = function(){
    this.animations.stop();
    this.PlayerIsMoving = false
    this.frame = 1;
};

CharacterSpr.prototype.isMoving = function(){
    return this.PlayerIsMoving
};

module.exports = CharacterSpr;
