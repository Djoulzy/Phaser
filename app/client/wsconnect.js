"use strict";

var Connection = function (addr, callback) {
    var ws = new WebSocket ('ws://'+addr+'/ws');
    var brothers = new Set();
    var connEvt = new Set();

	this.on = function(evt, callback) {
		connEvt[evt] = callback
	}

    ws.onopen = callback

    ws.onmessage = function(evt) {
    	switch(evt.data.substr(0, 6))
    	{
    		case "[RDCT]":
    			reconnect(evt.data.substr(6))
    			break;
    		case "[FLBK]":
    			var obj = JSON.parse(evt.data.substr(6));
    			for (var k in obj.BRTHLST){
    			    if (obj.BRTHLST.hasOwnProperty(k))
    					 brothers.add(obj.BRTHLST[k].Httpaddr)
    			}
    			break;
            case "[BCST]":
                var obj = JSON.parse(evt.data.substr(6));
				connEvt["enemy_move"].call(this, obj);
                break;
			case "[KILL]":
				connEvt["kill_enemy"].call(this, evt.data.substr(6));
                break;
			case "[NUSR]":
				// obj = JSON.parse(evt.data.substr(6));
				// obj = evt.data.substr(6);
                // console.log("RCPT: "+obj);
				// connEvt["new_enemyPlayer"].call(this, obj);
				// break;
			case "[WLCM]":
				var pseudo = evt.data.substr(6);
				connEvt["userlogged"].call(this, pseudo);
				break;
    		default:;
    	}
    }

	ws.onclose = function(evt) {
		switch(evt.code)
		{
			case 1005:
				console.log("CLOSE By Client");
				ws = null;
				break;
			case 1000:
				console.log("CLOSE By SERVER: " + evt.reason);
				ws = null;
				break;
			case 1006:
			default:
				// console.log("Lost Connection: " + evt.reason);
				// for (let item of brothers) {
				// 	reconnect(item)
				// 	if (ws.readyState == 0) {
				// 		brothers.delete(item)
				// 	}
				// 	else break;
				// }
				break;
		}
	}

	this.logon = function(pass) {
        ws.send("[HELO]" + pass);
		// connEvt["userlogged"].call(this);
	}

    this.bcast = function(message) {
		// console.log(message);
        ws.send("[BCST]" + JSON.stringify(message))
    }

	this.shoot = function(message) {
		// console.log(message);
        ws.send("[FIRE]" + JSON.stringify(message))
    }

	this.newPlayer = function(message) {
		// console.log(message);
        ws.send("[NUSR]" + JSON.stringify(message))
    }
}

module.exports = Connection;
