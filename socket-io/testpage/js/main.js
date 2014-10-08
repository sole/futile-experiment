(function() {
	var h1 = document.querySelector('h1');
	h1.textContent = document.title;
	console.log('hey');	

	var socket;
	var tag = 'solesocket';
    console.log(tag, 'init');

	//var server = 'localhost';
	var server = '10.246.25.84';
	var port = 4000;
	var serverUri = server + ':' + port;
	var socketIOScript = 'http://' + serverUri + '/socket.io/socket.io.js';

	var script = document.createElement('script');
	script.src = socketIOScript;
	script.onload = function() {
		initSocket();
	};
	document.head.appendChild(script);

	function initSocket() {

		console.log(tag, 'socket initialised');
		socket = io(serverUri);
		socket.emit('hey', { brightness: 0 } );
		/*socket.on('thing', function(msg) {
			console.log('got a thing:', msg);
		});*/
    
	}
    
}).call(this);

