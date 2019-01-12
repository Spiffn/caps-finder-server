import { Server as WebSocketServer } from 'ws';
import app from './express-server';


const server = require('http').createServer();

// Create web socket server on top of a regular http server
const wss = new WebSocketServer({
  server,
});

function deserializeMessage(message) {
  return JSON.parse(message.toString());
}

// Also mount the app here
server.on('request', app);
wss.on('connection', (ws, req) => {
  function broadcast(roomId, data) {
    wss.clients.forEach((client) => {
      if (client.chatRoom === roomId) {
        client.send(data);
      }
    });
  }

  const ip = req.connection.remoteAddress;
  const roomId = req.url.substring(1);
  ws.chatRoom = roomId;
  console.log(req.url);
  console.log(ip);
  console.log(`A user has joined room ${roomId}`);
  ws.on('message', (message) => {
    const receivedMessage = deserializeMessage(message);
    console.log(`received: ${receivedMessage.text}`);
    broadcast(roomId, receivedMessage.text);
  });

  ws.on('close', (code) => {
    console.log(`A user has left the room with code ${code}`);
  });
});

export default server;
