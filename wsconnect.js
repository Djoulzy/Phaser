function Connection(addr) {
    var ws = new WebSocket ('ws://'+addr+'/ws');
    var brothers = new Set();
    var connEvt = new Set();

	this.on = function(evt, callback) {
		connEvt[evt] = callback
	}

    ws.onopen = function(evt) {
		var params = Encrypt_b64('iphone1|xcode|USER')
        this.send("[HELO]" + params);
        connEvt["connected"].call(this);
    };

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
                console.log("RCPT: "+obj);
                break;
    		default:
                console.log(evt);
                break;
    	}
    };

    this.bcast = function(message) {
        console.log("[BCST]" + message);
        ws.send("[BCST]" + message)
    }
}
