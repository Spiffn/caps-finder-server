import { Server as WebSocketServer } from 'ws';
import app from './express-server';
import roomManager from './services/roomManager';


const server = require('http').createServer();

// Create web socket server on top of a regular http server
const wss = new WebSocketServer({
  server,
});

function deserialize(message) {
  return JSON.parse(message.toString());
}

function serialize(message) {
  return JSON.stringify(message);
}

let id = 0;

function getUserId() {
  id += 1;
  return id;
}

// Also mount the app here
server.on('request', app);
wss.on('connection', (ws, req) => {
  function broadcast(roomId, data) {
    Object.values(roomManager.rooms[roomId].users).forEach((client) => {
      console.log(client.roomId);
      client.send(serialize(data));
    });
  }

  const ip = req.connection.remoteAddress;
  const roomId = req.url.substring(1);

  if (!roomManager.hasRoom(roomId)) {
    ws.close();
  }

  // eslint-disable-next-line no-param-reassign
  ws.userId = getUserId();

  // eslint-disable-next-line no-param-reassign
  ws.chatRoom = roomId;

  // TODO: Add validation for properties
  roomManager.rooms[roomId].users[ws.userId] = ws;

  console.log(req.url);
  console.log(ip);
  console.log(`A user has joined room ${roomId}`);
  ws.on('message', (message) => {
    const receivedMessage = deserialize(message);
    console.log(`received: ${receivedMessage.text}`);
    broadcast(roomId, {
      type: 'message',
      user: ws.userId,
      payload: receivedMessage.text,
    });
  });

  ws.on('close', (code) => {
    console.log(`A user has left the room with code ${code}`);
    delete roomManager.rooms[roomId][ws.userId];
  });
});

export default server;
