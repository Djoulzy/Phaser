'use strict';

function NetworkManager() {

}

NetworkManager.prototype.openConnection = function() {
    this.ws = new WebSocket('ws://localhost:8080/ws');
    this.connected = false;
    this.ws.onmessage = this.onMessage.bind(this);
    this.ws.onerror = this.displayError.bind(this);
    this.ws.onopen = this.connectionOpen.bind(this);
};

NetworkManager.prototype.connectionOpen = function() {
    this.connected = true;
    this.ws.send("[HELO]" + key);
};

NetworkManager.prototype.bcast = function(message) {
 console.log(message);
 this.ws.send("[BCST]" + JSON.stringify(message))
}

NetworkManager.prototype.onMessage = function(message) {
    myText.text = myText.text + message.data;
    var msg = JSON.parse(message.data);
    sprite.x = msg.x;
    sprite.y = msg.y;
};

NetworkManager.prototype.displayError = function(err) {
    console.log('Websocketerror: ' + err);
};


module.exports = NetworkManager;
