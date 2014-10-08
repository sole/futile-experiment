var server = require('http').createServer();
var io = require('socket.io')(server);

io.on('connection', function(socket) {
	console.log('something connected');

	socket.emit('thing', { data: 'something' });

	socket.on('hey', function(msg) {
		console.info('got a hey', msg);
	});
	
	socket.on('event', function(data){});
	socket.on('disconnect', function(){});

});
server.listen(4000);

