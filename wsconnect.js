function Connection(addr, callback) {
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
    			obj = JSON.parse(evt.data.substr(6));
    			for (var k in obj.BRTHLST){
    			    if (obj.BRTHLST.hasOwnProperty(k))
    					 brothers.add(obj.BRTHLST[k].Httpaddr)
    			}
    			break;
            case "[BCST]":
                obj = JSON.parse(evt.data.substr(6));
                // console.log("RCPT: "+obj);
				connEvt["enemy_move"].call(this, obj);
                break;
			case "[NUSR]":
				obj = JSON.parse(evt.data.substr(6));
				// obj = evt.data.substr(6);
                // console.log("RCPT: "+obj);
				connEvt["new_enemyPlayer"].call(this, obj);
				break;
    		default:;
    	}
    }

	this.logon = function(name, pass) {
		var params = Encrypt_b64(name+'|'+pass+'|USER')
        ws.send("[HELO]" + params);
		connEvt["userlogged"].call(this);
	}

    this.bcast = function(message) {
		// console.log(message);
        ws.send("[BCST]" + JSON.stringify(message))
    }

	this.newPlayer = function(message) {
		// console.log(message);
        ws.send("[NUSR]" + JSON.stringify(message))
    }
}
