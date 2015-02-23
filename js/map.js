/*全局对象，逐步添加完善
 * global.map
 * global.drawingManager    绘图库
 * global.fence				围栏
 * global.fenceType			围栏类型，包括圆、多边形和矩形三类
 * global.curPostion		当前位置
 * global.socket			与node连接的全局socketio对象
 * 
 */

var global={};

//similar to document.ready(function(){})		
$(function(){  
	//初始化地图
	var options ={
			zoom: 15,
			mapTypeId: google.maps.MapTypeId.ROADMAP,
			disableDoubleClickZoom : true,
	};
	global.map=new google.maps.Map(document.getElementById("map_canvas"),options);
	global.map.setCenter(new google.maps.LatLng(24.8646,118.6654));
	//使用HTML5的geolocation API获取终端当前位置信息
	if(navigator.geolocation){
		var coords=navigator.geolocation.getCurrentPosition(function(pos){
			global.curPosition= new google.maps.LatLng(pos.coords.latitude,pos.coords.longitude)
			global.map.setCenter(global.curPosition);
		  },function(){
			$("div#output").append("获取位置信息失败<br/>");
			global.map.setCenter(new google.maps.LatLng(24.8646,118.6654));
		});
	}else{
		alert("您的浏览器不支持HTML5 geoLocation，手机浏览器建议Opera Mobile 12");
	}

	//加载google.maps.drawing库，暂不显示绘图面板，留待用户启动电子围栏功能时显示
	global.drawingManager = new google.maps.drawing.DrawingManager({
		//drawingMode: google.maps.drawing.OverlayType.MARKER,
		drawingControl : true,
		drawingControlOptions : {
			position : google.maps.ControlPosition.TOP_LEFT ,
			drawingModes : [ 
			        //google.maps.drawing.OverlayType.MARKER,
					google.maps.drawing.OverlayType.CIRCLE,
					google.maps.drawing.OverlayType.POLYGON,
					google.maps.drawing.OverlayType.RECTANGLE ]
		},
		circleOptions : {
			fillColor : '#ffff00',
			fillOpacity : 1,
			strokeWeight : 5,
			clickable : false,
			editable : true,
			zIndex : 1
		}
	});

	global.drawingManager.setMap(null);
	
	//getMsg();
	
});	//end ready


function getMsg(){
	
	global.socket = new io.connect("http://192.168.1.3:8080");
	global.socket.on('connect', function(){
		console.log("connected");
	});
	global.socket.on("message", function(data){ 
		console.log("received message: " + data);
		var parsed=JSON.parse(data);
		switch (parsed.type) {
			//接受服务器端pub的消息
           case 'publish':
        	  console.log("received publish--");
        	  var marker= new google.maps.Marker({
        	        position: new google.maps.LatLng(parsed.content.latitude,parsed.content.longitude),
        	        map: global.map,
        	        title: "--servered--"
        	  });
              break;
           case 'error':
			  $("div#output").append("error is :"+parsed.content);
              break;
           default:
              $("div#output").append('Unknown message type ' + parsed.type);
              break;
         }
		//document.getElementById("message").innerHTML = data;
	});
	global.socket.on("disconnect", function(){ 
		console.log("disconnected"); 
	});
	
	//pub current position
//	global.socket.send(JSON.stringfy({
//		type:publish,
//		content:{latitude:global.curPosition.lat(),
//			     longitude:global.curPosition.lng()
//		}
//	}));
	
	global.socket.send(JSON.stringify({
		type:"subscribe",
		channel:"ch1",
	}));
	
	global.socket.send(JSON.stringify({
		type:"publish",
		channel:"ch1",
		content:{latitude:24.9190549,
			     longitude:118.5708421
		}
	}));
	
	setInterval(pubPosition(),180000); //3 minutes
	
}//end getMsg()

function pubPosition(){
	global.socket.send(JSON.stringify({
		type:"publish",
		channel:"ch1",
		content:{latitude:24.9190549,
			     longitude:118.5708421
		}
	}));
}//end pubPosition()

