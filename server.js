var sys = require("util"),
    http = require("http"),
    url = require("url"),
    path = require("path"),
    io = require("socket.io"),
    fs = require("fs"),
    redis = require('redis');

//创建http服务器，也可以不用node做http服务器（担心兼容性问题），只用它做socketio服务器
var server = http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname;
    var filename = path.join(process.cwd(), uri);
    path.exists(filename, function(exists) {
    	if(!exists) {
    		response.writeHeader(404, {"Content-Type": "text/plain"});
    		response.write("404 Not Found\n");
    		response.end();
    		return;
    	}
		//binary or utf-8
    	fs.readFile(filename, "binary", function(err, file) {
    		if(err) {
    			response.writeHeader(500, {"Content-Type": "text/plain"});
    			response.write(err + "\n");
    			response.end();
    			return;
    		}

    		response.writeHeader(200);
    		response.write(file, "binary");
    		response.end();
    	});
    });
    
    console.log("userNo is: "+request.body.user[userNo]);
    
});

server.listen(8080);
sys.puts("Nodejs Server running at http://localhost:8080/");


//创建socketio服务器
var socket = io.listen(server);
socket.on("connection", function(sckioClient) {
	console.log("----some socketio client connected----");
	
	//浏览器连接到node server时，node server操作redis,创建两个client，
	//一个用于pub，一个用于sub，主要是解决sub模式下的连接不能pub的问题
	var redisSubClient =redis.createClient();
	var redisPubClient =redis.createClient();
	redisSubClient.on("error", function (err) {
	    console.log("Error :" + err);
	});
	redisPubClient.on("error", function (err) {
	    console.log("Error :" + err);
	});
	

	sckioClient.on("message", function(data) {
		//sckioClient.send("Hello " + data);
		var parsed=JSON.parse(data);
		switch (parsed.type) {
		// 浏览器端sub自身家庭的那个频道
		case 'subscribe':
			// 向redis服务器订阅某个频道
			redisSubClient.subscribe(parsed.channel);
			console.log("redisClient subscribe: " + parsed.channel);
			break;
		// 浏览器端pub自身的位置
		case 'publish':
			// 向redis服务器的某个频道发布信息
			redisPubClient.publish(parsed.channel, JSON
					.stringify(parsed.content));
			console.log("someone published his location: " + parsed.channel);
			break;
		case 'error':
			$("div#output").append("error is :" + parsed.content);
			break;
		default:
			$("div#output").append('Unknown message type ' + parsed.type);
			break;
		}
	});  //sckioClient.on("message")

	sckioClient.on("disconnect", function() {
		//可以在这里释放redis client
		redisSubClient.end();
		redisPubClient.end();
		console.log("disconnected");
	});
	
	// 接受redis服务器pub的消息（别人共享的位置信息）
	redisSubClient.on("message", function (channel, message) {
	    var parsedMsg=JSON.parse(message);
	    console.log("now publish to client-- " +parsedMsg.latitude + "  "+parsedMsg.longitude);
	    sckioClient.send(JSON.stringify({
	    	type:"publish",
	    	channel: channel,
	    	content:{
	    		latitude:parsedMsg.latitude,
	    		longitude: parsedMsg.longitude
	    	}
	    }));
	}); //redisSubClient.on("message")
});