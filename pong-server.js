var app = require('http').createServer(handler)
, io = require('socket.io').listen(app)
, fs = require('fs');

// logging
io.set('log level', 1);

app.listen(8080);

function handler (req, res) {
    fs.readFile(__dirname + '/index.html',
		function (err, data) {
		    if (err) {
			res.writeHead(500);
			return res.end('Error loading client.html');
		    }

		    res.writeHead(200);
		    res.end(data);
		});
}

// game params
var fieldWidth = 800;
var fieldHeight = 500;
var ballRadius = 20;
var playerWidth = 20;
var playerHeight = 100;

var games = [[]];
io.sockets.on('connection', function (socket) {
    var players;
    if(games[games.length - 1].length >= 2) {
	players = [];
	games.push(players);
    } else {
	players = games[games.length - 1];
    }
    var player = {
	'number': players.length,
	'position': 0,
	'socket': socket
    }
    players.push(player);

    // let player know his number
    socket.emit('player-number', player.number);

    // player sends position data
    socket.on('player-position', function(data) {
	if(players.length == 2) {
	    players[(player.number + 1) % 2].socket.emit('opponents-position', data);
	    player.position = data;
	}
    });

/*
    // on disconnect
    socket.on('disconnect', function(data) {
	if(players.length == 2) {
    	    // let opponent know 
    	    players[(player.number + 1) % 2].socket.emit('opponent-disconnected');
	}
	// remove from games
	var i = games.indexOf(players);
	games.splice(i);
	// stop the ball
	ballVector = [0, 0]
    });
*/
    // let the game begin...
    var ballVector = [2,1];
    ball = {
	'x': fieldWidth / 2, 
	'y': fieldHeight / 2
    };
    setInterval(function() {
	if(players.length == 2 && player.number == 0) {
	    if(ball.x <= (playerWidth + ballRadius)) {
		// player 1 side
		if(players[0].position > ball.y || (players[0].position + playerHeight) < ball.y) {
		    // player 1 lost
		    console.log('player 1 lost - reset ball posigion');
		    ball.x = fieldWidth/2,
		    ball.y = fieldHeight/2
		} 
		console.log('positive vector.x');
		ballVector[0] = Math.abs(ballVector[0]);
	    }
	    if(ball.x >= (fieldWidth - playerWidth - ballRadius)) {
		// player 2 side
		if(players[1].position > ball.y || (players[1].position + playerHeight) < ball.y) {
		    // player 2 lost
		    console.log('player 2 lost - reset ball posigion');
		    ball.x = fieldWidth/2,
		    ball.y = fieldHeight/2
		} 
		console.log('negative vector.x');
		ballVector[0] = -Math.abs(ballVector[0]);
	    }
	    // upper wall
	    if(ball.y <= ballRadius) {
		console.log('positive vector.y');
		ballVector[1] = Math.abs(ballVector[1]);
	    }
	    // lower wall
	    if(ball.y >= (fieldHeight - ballRadius)) {
		console.log('negative vector.y');
		ballVector[1] = -Math.abs(ballVector[1]);
	    }
	    console.log('player.number: ' + player.number + ', ball.x: ' + ball.x + ', ball.y: ' + ball.y + ', ballVector: ' + ballVector);
	    ball.x += ballVector[0];
	    ball.y += ballVector[1];
	    players[0].socket.emit('ball-position', { 'x': ball.x, 'y': ball.y});
	    players[1].socket.emit('ball-position', { 'x': ball.x, 'y': ball.y});
	}
    }, 5);
});
