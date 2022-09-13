///////////////////////////////////////////////
///////////// IMPORTS + VARIABLES /////////////
///////////////////////////////////////////////

const CONSTANTS = require('./utils/constants.js');
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

// Constants
const { PORT, MAX_TIME, CLIENT, SERVER } = CONSTANTS;

// Application Variables;
let nextPlayerIndex = 0;

///////////////////////////////////////////////
///////////// HTTP SERVER LOGIC ///////////////
///////////////////////////////////////////////

// Create the HTTP server
const server = http.createServer((req, res) => {
  // get the file path from req.url, or '/public/index.html' if req.url is '/'
  const filePath = ( req.url === '/' ) ? '/public/index.html' : req.url;

  // determine the contentType by the file extension
  const extname = path.extname(filePath);
  let contentType = 'text/html';
  if (extname === '.js') contentType = 'text/javascript';
  else if (extname === '.css') contentType = 'text/css';

  // pipe the proper file to the res object
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(`${__dirname}/${filePath}`, 'utf8').pipe(res);
});

///////////////////////////////////////////////
////////////////// WS LOGIC ///////////////////
///////////////////////////////////////////////

// TODO: Create the WebSocket Server (ws) using the HTTP server
const wsServer = new WebSocket.WebSocketServer({ server: server})


// TODO: Define the websocket server 'connection' handler

wsServer.on( 'connection', (socket) => {
  socket.on('message', (data) => {
    message = JSON.parse(data)
    messageHandler(message, socket)
  });
});

// TODO: Define the socket 'message' handler
function messageHandler(message, socket=null) {
  let {type, payload} = message;
  switch (type) {
    case CLIENT.MESSAGE.NEW_USER:
      handleNewUser(socket);
      break;
    case CLIENT.MESSAGE.PASS_POTATO:
      passThePotatoTo(payload.newPotatoHolderIndex)
      break;
    /*case SERVER.MESSAGE.PLAYER_ASSIGNMENT :
      break;
    case SERVER.MESSAGE.GAME_FULL:
      break;
    case SERVER.BROADCAST.COUNTDOWN :
      break;
    case SERVER.BROADCAST.NEW_POTATO_HOLDER:
      break;
    case SERVER.BROADCAST.GAME_OVER:
      break;
      */
    default:
      break;
  }
}
  // 'NEW_USER' => handleNewUser(socket)
  // 'PASS_POTATO' => passThePotatoTo(newPotatoHolderIndex)


///////////////////////////////////////////////
////////////// HELPER FUNCTIONS ///////////////
///////////////////////////////////////////////

// TODO: Implement the broadcast pattern
function broadcast(data, socketToOmit) {
  wsServer.clients.forEach( (client) => {
    if (client.readyState === WebSocket.OPEN && client !== socketToOmit) {
      client.send(JSON.stringify(data))
    }
  });
}

function handleNewUser(socket) {
  // Until there are 4 players in the game....
  let message = {}
  if (nextPlayerIndex < 4) {
    // TODO: Send PLAYER_ASSIGNMENT to the socket with a clientPlayerIndex
    message = {
      type: SERVER.MESSAGE.PLAYER_ASSIGNMENT,
      payload: { clientPlayerIndex: nextPlayerIndex },
    }
    socket.send(JSON.stringify(message))
    
    // Then, increment the number of players in the game
    nextPlayerIndex++;
    
    // If they are the 4th player, start the game
    if (nextPlayerIndex === 4) {
      // Choose a random potato holder to start
      const randomFirstPotatoHolder = Math.floor(Math.random() * 4);
      passThePotatoTo(randomFirstPotatoHolder);
      
      // Start the timer
      startTimer();
    }
  } 
  
  // If 4 players are already in the game...
  else {
    // TODO: Send GAME_FULL to the socket
    message = {
      type: SERVER.MESSAGE.GAME_FULL,
    }
    socket.send(JSON.stringify(message))

  }
}


function passThePotatoTo(newPotatoHolderIndex) {
  // TODO: Broadcast a NEW_POTATO_HOLDER message with the newPotatoHolderIndex
  const message = {
    type: SERVER.BROADCAST.NEW_POTATO_HOLDER,
    payload: { newPotatoHolderIndex: newPotatoHolderIndex },
  };
  console.log("Potato passed! " + newPotatoHolderIndex);
  broadcast(message);
}

function startTimer() {
  // Set the clock to start at MAX_TIME (30)
  let clockValue = MAX_TIME;
  
  // Start the clock ticking
  const interval = setInterval(() => {
    if (clockValue > 0) {
      // TODO: broadcast 'COUNTDOWN' with the clockValue
      const message = {
        type: SERVER.BROADCAST.COUNTDOWN,
        payload: {clockValue: clockValue}
      }

      // decrement until the clockValue reaches 0
      clockValue--;
    }

    // At 0...
    else {
      clearInterval(interval); // stop the timer
      nextPlayerIndex = 0; // reset the players index
      
      // TODO: Broadcast 'GAME_OVER'
   
    }
  }, 1000);
}

// Start the server listening on localhost:8080
server.listen(PORT, () => {
  console.log(`Listening on: http://localhost:${server.address().port}`);
});
