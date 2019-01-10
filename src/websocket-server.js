import { Server as WebSocketServer } from 'ws';
import app from './express-server';


const server = require('http').createServer();

// Create web socket server on top of a regular http server
const wss = new WebSocketServer({
  server,
});

// Also mount the app here
server.on('request', app);

wss.on('connection', (ws) => {
  console.log('A user has joined');
  ws.on('message', (message) => {
    console.log(`received: ${message}`);
    wss.clients.forEach((client) => {
      client.send(message);
    });
  });
});

export default server;
