
var brothers = new Set();

function Connection() {
    this.createConnection = function(addr, user)
    {
        var ws = new WebSocket ('ws://'+addr+'/ws');

		ws.on = function(evt, callback) {
			callback()
		}

        ws.onopen = function(evt) {
			var params = Encrypt_b64(user)
            ws.send("[HELO]" + params);
        };

        ws.onclose = function(evt) {
			switch(evt.code)
			{
				case 1005:
                    ws = null;
                    disconnect()
					break;
				case 1000:
					ws = null;
                    disconnect()
					break;
				case 1006:
				default:
					console.log(evt);
					for (let item of brothers) {
						reconnect(item)
						if (conn.readyState == 0) {
							brothers.delete(item)
						}
						else break;
					}
					break;
			}
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
				default:;
			}
			console.log(brothers);
        };

        ws.onerror = function(evt) {
        };

        return ws;
    }

	function disconnect()
	{
		ws = null
	}

	function bcast(message)
	{
		ws.send("[BCST]" + message);
	}
}
