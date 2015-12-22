var cp = require('child_process');

var n = cp.fork(__dirname + '/board.js');

n.on('message', function(m) {
  console.log('PARENT got message:', m);
});

n.send({ hello: 'world' });
// // script.js
// var spawn = require('child_process').spawn;
// var child = spawn('slave.js');
// // child('slave.js', function(error, stdout, stderr) {
// //     console.log('stdout: ', stdout);
// //     console.log('stderr: ', stderr);
// //     if (error !== null) {
// //         console.log('exec error: ', error);
// //     }
// // });
// child.on("data",function(data){
//     console.log(data);
// });
// // child.stdin.write('fukk');
// var a = 0
// for (var i = 0; i < 1000000000000; i++) {
//     a++
// }
// // console./log("fuuuuck")
amp = 0;
setInterval(function(){
    n.send({ amp: amp });
    amp+=1;
},500);