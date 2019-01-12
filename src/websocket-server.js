import { Server as WebSocketServer } from 'ws';
import app from './express-server';


const server = require('http').createServer();

// Create web socket server on top of a regular http server
const wss = new WebSocketServer({
  server,
});

// Also mount the app here
server.on('request', app);
wss.on('connection', (ws, req) => {
  const ip = req.connection.remoteAddress;
  ws.chatRoom = req.url;
  console.log(req.url);
  console.log(ip);
  console.log(`A user has joined room ${req.url}`);
  ws.on('message', (message) => {
    let receivedMessage = deserializeMessage(message);
    console.log(`received: ${receivedMessage.text}`);
    wss.clients.forEach((client) => {
      if (client.chatRoom === req.url) {
        client.send(receivedMessage.text);
      }
    });
  });

  ws.on('close', (code) => {
    console.log(`A user has left the room with code ${code}`);
  });

});

function deserializeMessage(message) {
  return JSON.parse(message.toString());
}

export default server;
