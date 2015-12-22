// test script for multithreading
var cp = require('child_process');
var n = cp.fork(__dirname + '/board.js');

n.on('message', function(m) {
  console.log('PARENT got message:', m);
});

n.send({ hello: 'world' });

amp = 0;

setInterval(function(){
    n.send({ amp: amp });
    amp+=1;
},500);