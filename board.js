// Run servo in a child process to avoid servo being blocked by 
// computationally expensive depth processing calls
process.on('message', function(m) {
  console.log('CHILD got message:', m);
});
var five = require("johnny-five");
var t = 0;
var amp = 70;
var randamp = 0;
var hz = 0.1;
var offset = 0;

// Will recieve a message from parent process when a touch
// behaviour is detected and parameters must be changed
process.on('message', function(m) {
  if('amp' in m) {
  	amp = m['amp'];
  	randamp = m['randamp'];
  	hz = m['hz'];
  	offset = m['offset'];
  }
});

/////////////////////////////////
/////////////////////////////////
///// J O H N N Y - F I V E /////
/////////////////////////////////
/////////////////////////////////

// Start a new connection to the arduino + servo
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
});

// random ---------------------------------
// Returns random float between min and max
function random(min,max) {
	return (((max - min) * Math.random()) + min)
}

// sine -----------------------------------
// Returns the next sample from a sine wave
// and ticks time ahead by one hz
function sine() {
	var ret = Math.max((((Math.sin(t) * amp) + (random(-1,1) *  randamp) + amp) + offset),0);
	if (t >= 3.14) {
		t = 0;
	}
	t+=hz;
	return ret;
}

// Loop for running servo motor, tuned
// for about 25 hz on 'neutral'
var setint = setInterval(function(){
	if (myServo != undefined) {
		var s = sine();
		myServo.to(s)
	}
},40);
