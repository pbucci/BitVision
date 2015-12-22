
process.on('message', function(m) {
  console.log('CHILD got message:', m);
});

process.send({ foo: 'bar' });
var five = require("johnny-five");
// console.log("starting")
// // server.js
// var http = require('http');
// var visits = 0;


var t = 0;
var amp = 70;
var randamp = 0;
var hz = 0.1;
var offset = 0;
// { valence: 1, arousal: -1, amp: 30, randamp: 1, hz: 0.1, offset: 0 }

process.on('message', function(m) {
	// amp = m['amp'];
  if('amp' in m) {
  	amp = m['amp'];
  	randamp = m['randamp'];
  	hz = m['hz'];
  	offset = m['offset'];
	// process.send({ foo: m });
  }
  console.log('CHILD got message:', m);
});

// // var cp = require('child_process');
// // var child = cp.fork('./worker');

// // child.on('message', function(m) {
// //   // Receive results from child process
// //   console.log('received: ' + m);
// // });

// // // Send child process some work
// // child.send('Please up-case this string');

// // var cpp = child_process.spawn('node',['board.js']);

// //   cpp.stdout.on('data', function (data) {
// //     console.log('stdout: ' + data);
// //   });
// // cpp.on('close', function (code) {
// //     console.log('child process exited with code ' + code);
// //   });

function random(min,max) {
	return (((max - min) * Math.random()) + min)
}
function sine() {
	var ret = Math.max((((Math.sin(t) * amp) + (random(-1,1) *  randamp) + amp) + offset),0);
	if (t >= 3.14) {
		t = 0;
	}
	t+=hz;
	return ret;
}
board = new five.Board();
var myServo;
board.on("ready", function() {
	myServo = new five.Servo({
		pin:9,
		center:true,
		range: [0,180]
	});
	board.repl.inject({
		servo: myServo
	});
	// io.emit('server_message','Ready to start board.');
 //    	console.log('Sweep away, my captain.');
});
var setint = setInterval(function(){
	if (myServo != undefined) {
		var s = sine();
		myServo.to(s)
	}
},40);
// // http.createServer(function (req, res) {
// //     res.writeHead(200, {'Content-Type': 'text/plain'});
// //     visits += 1;
// //     var msg = 'Visits: ' + visits;
// //     res.end(msg + '\n'); console.log(msg);
// //     // if(visits == 5) {
// //     //     process.exit();
// //     // }
// //     var inter = 
// // }).listen(1337, '127.0.0.1');
// // console.log('Server running at http://127.0.0.1:1337/');
