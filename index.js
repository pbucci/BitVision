var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var kinect = require('./kinect');
var context = kinect();
// var five = require("johnny-five");
var child_process = require('child_process');

context.tilt(15);
context.start('depth');
context.led("red");
context.resume();
count = 0;

var t = 0;
var amp = 70;
var randamp = 0;
var hz = 0.1;
var offset = 0;

var cp = require('child_process');

var n = cp.fork(__dirname + '/board.js');
n.on('message', function(m) {
  console.log('PARENT got message:', m);
});
n.send({ hello: 'world' });

// var cp = require('child_process');
// var child = cp.fork('./worker');

// child.on('message', function(m) {
//   // Receive results from child process
//   console.log('received: ' + m);
// });

// // Send child process some work
// child.send('Please up-case this string');

// var cpp = child_process.spawn('node',['board.js']);

//   cpp.stdout.on('data', function (data) {
//     console.log('stdout: ' + data);
//   });
// cpp.on('close', function (code) {
//     console.log('child process exited with code ' + code);
//   });

// function random(min,max) {
// 	return (((max - min) * Math.random()) + min)
// }
// function sine() {
// 	var ret = Math.max((((Math.sin(t) * amp) + (random(-1,1) *  randamp) + amp) + offset),0);
// 	if (t >= 3.14) {
// 		t = 0;
// 	}
// 	t+=hz;
// 	return ret;
// }
// var async = setInterval(function(){
//     if (myServo != undefined) {
//       var s = sine();
//       myServo.to(s,200);
//       // console.log('send servo to : ',s);
//     }
//   },200);

context.on('depth', function(buf) {
  // each depth pixel in buf has 2 bytes, 640 x 480, 11 bit resolution
  if(count % 3 == 0) {
	  var b = buf2pic(buf);
		console.log("sent");
  	count = 1;
  }
  else {
  	count++
  }
});
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});
io.on('connection', function(socket){
	socket.on('touching',function(data) {
    n.send(data);
	});
	socket.on('start_sample',function(){
		startSample();
	});
	socket.on('stop_sample',function(){
		stopSample();
	});
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

function buf2pic(buff) {
	// console.log(buff.length)
	
  // console.log("sending to other thread")
  // readBuff(buff);
  var arr = []
  var max = 0;
  var min = 2048;
	for (var i=0; i<buff.length;i=i+2) {
		var num = buff.readInt16LE(i);
		var bb = buff.readInt16LE(i);
		if (num > max) {
			max = num;
		}
		if (num < min) {
			min = num;
		}
		arr.push(bb);
	}	
  handleBuffer(arr);
	// console.log(arr.length, max, min)
}
var worker;
var reading = false;
// function readBuff(buff) {
//   if (!reading) {
//     reading = true;
//     worker = child_process.spawn('node',['board.js',buff]);
//     worker.stdout.on('data', function (data) {
//         reading = false;
//         console.log("data recieved")
//         handleBuffer(data);
//      });
//   }
// }

/////////////////////////////////
/////////////////////////////////
///// J O H N N Y - F I V E /////
/////////////////////////////////
/////////////////////////////////

// board = new five.Board();
// var myServo;
// board.on("ready", function() {
// 	myServo = new five.Servo({
// 		pin:9,
// 		center:true,
// 		range: [0,180]
// 	});
// 	board.repl.inject({
// 		servo: myServo
// 	});
// 	io.emit('server_message','Ready to start board.');
//     	console.log('Sweep away, my captain.');
// });

/////////////////////////////////
/////////////////////////////////
//// M O V E D  F R O M  U I ////
/////////////////////////////////
/////////////////////////////////

      function scalarVector(s,v) {
        for(var i = 0; i < v.length; i++) {
          v[i] = v[i] * s;
        }
        return v;
      }
      function max(a,b) {
        if (a>b) {
          return a;
        } else {
          return b;
        }
      }
      function min(a,b) {
        if (a<b) {
          return a;
        } else {
          return b;
        }
      }
      function minElement(v1,v2) {
        for(var i = 0; i < v1.length; i++) {
          v1[i] = min(v1[i],v2[i]);
        }
        return v1;
      }

      var samplr = [];
      var sample_count = 0;
      var sample_allowed = true;
      var sample_happening = false;
      function startSample() {
        sample_allowed = true;
        sample_happening = true;
      }
      function sample(arr) {
        if(samplr.length == 0) {
          samplr = arr;
        } else {
          samplr = minElement(samplr,arr); // get reading closest to Kinect
        }
        sample_count++;
      }
      function stopSample() {
        sample_allowed = false;
        sample_happening = false;
        // console.log("Sample : " + samplr)
        // averageSample();
      }
      function checkSample(arr) {
        for (var i = 0; i < arr.length; i++) {
          if (arr[i] > 2048 || arr[i] < 0) {
            console.log("Error: sample array has value at " + arr[i]);
          }
        }
      }
      function averageSample() {
        sample = scalarVector((1/sample_count),sample);
        checkSample(sample);
      }
      function check_last_sample() {
        var counter = 0;
        for (i in last_sample[0]) {
          if (last_sample[0][i] == last_sample[1][i]) {
            counter++;
          }
        }
        if (counter == last_sample[0].length) {
          console.log("Bad last sample.");
        }
      }
      var horizon = 1;
      var last_sample = new Array(horizon);
      function shortHorizon(data) {
        var ret = [];
        check_last_sample();
        for (i in data) {
          ret.push(data[i] & (last_sample[0][i] & last_sample[1][i]));
        }
        return ret;
      }
      
      function minimizer(data) {
        var ret = [];
        for (i in data) {
          if ((data[i] + 10) < samplr[i]) {
            ret.push(255)
          } else {
            ret.push(0);
          }
        }
        return ret;
      }

      function ranger(data) {
        var ret = []
        for (i in data) {
          var d = parseInt((data[i] / 2048) * 255);
          ret.push(d);
        }
        return ret;
      }

      function longHorizon(cur) {
        var ret = cur.slice();
        for (i in last_sample) {
          for (j in last_sample[i]) {
            ret[j] = ret[j] & last_sample[i][j];
          }
        }
        return ret;
      }

      function process(data) {
        var current = minimizer(data);
        if (last_sample[0] == null) {
          console.log("yes it was null");
          for (var i in last_sample) {
            last_sample[i] = current.slice();
          }
        }
        makePix(longHorizon(current));
        last_sample.unshift(current.slice());
        last_sample.pop()
      }
      function centroid(arr,w,h) {
        var x_sum = 0;
        var y_sum = 0;
        var val_sum = 0;

        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            var val = arr[y*w + x];
            val_sum += val;
            x_sum += val * x;
            y_sum += val * y;
          }
        }
        var ret = {
          'x':x_sum / val_sum,
          'y':y_sum / val_sum,
        }
        return ret;
      }
      function lockCentroid() {
        centroid_locked = true;
        zeroAgain();
      }
      function zeroAgain() {
        sample_allowed = true;
      }

      function handleBuffer(msg) {
        if (sample_happening && sample_allowed) {
          sample(msg);
        } else if (!sample_allowed) {
          process(msg);
        } else {
          makePix(ranger(msg));
        }
      }
      function bufferize(msg) {
      	var buf = new Buffer(640*480*2);
      	for (i in msg) {
      		

      	}
      }
      function makePix(msg) {
      	io.emit('not a chat',msg)
      }