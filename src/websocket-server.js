import { Server as WebSocketServer } from 'ws';
import generate from 'adjective-adjective-animal';
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

async function generateUsername(roomId) {
  return await generate({ adjectives: 1, format: 'pascal' });
}

// Also mount the app here
server.on('request', app);
wss.on('connection', async (ws, req) => {
  function broadcast(roomId, data) {
    Object.values(roomManager.getUsersByRoomId(roomId)).forEach((client) => {
      client.send(serialize(data));
    });
  }

  const ip = req.connection.remoteAddress;
  const roomId = req.url.substring(1);

  if (!roomManager.hasRoom(roomId)) {
    ws.close();
  }

  // eslint-disable-next-line no-param-reassign
  ws.userId = await generateUsername(roomId);

  // eslint-disable-next-line no-param-reassign
  ws.chatRoom = roomId;

  roomManager.addUserToRoom(ws.userId, roomId, ws);

  console.log(req.url);
  console.log(ip);
  console.log(`User ${ws.userId} has joined room ${roomId}`);
  ws.on('message', (message) => {
    const receivedMessage = deserialize(message);
    if (['message', 'status'].includes(receivedMessage.type)) {
      console.log(`received: ${receivedMessage.payload}`);
      broadcast(roomId, {
        type: receivedMessage.type,
        timestamp: new Date().getTime(),
        user: ws.userId,
        payload: receivedMessage.payload,
      });
    } else {
      console.log(receivedMessage);
    }
  });

  ws.on('close', (code) => {
    console.log(`A user has left the room with code ${code}`);
    roomManager.deleteUserFromRoom(ws.userId, roomId);
  });
});

export default server;
