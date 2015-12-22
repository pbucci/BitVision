var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var kinect = require('./kinect');
var context = kinect();
var cp = require('child_process');
// Start Kinect depth sensor 
// Tilt seems to make the connetion work better (why, I don't know)
// Led is to signal that the process has started
context.tilt(15);
context.start('depth');
context.led("red");
context.resume();

// Handle calls to the arduino/servo in a seperate thread so that
// expensive depth calls do not block (node.js is single-threaded by default)
// code is from node.js docs 
var n = cp.fork(__dirname + '/board.js');
n.on('message', function(m) {
  console.log('PARENT got message:', m);
});

// Since depth calls are so expensive, only process every 3 frames that the Kinect
// sends. This could also be multithreaded, however, buffer size is too large for
// an easy fix at the moment.
var count = 0;
// Called whenever a new depth frame is sent
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

// Server sends from rooot
app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Start server sending index.html
http.listen(3000, function(){
  console.log('listening on *:3000');
});

// Socket.io init function
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

// Takes depth buffer and processes it
// Each pixel in depth buffer is 2 bytes, little endian
// maximum value per pixel should be 2048
// minimum value should be 0, but seems to hover around 400
function buf2pic(buff) {
  var arr = []
  // read 
	for (var i=0; i<buff.length;i=i+2) {
		var num = buff.readInt16LE(i);
		var bb = buff.readInt16LE(i);
		arr.push(bb);
	}	
  handleBuffer(arr);
}


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
}
function checkSample(arr) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] > 2048 || arr[i] < 0) {
      console.log("Error: sample array has value at " + arr[i]);
    }
  }
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

// very short horizon for now, more horizon == more computation, less noise
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