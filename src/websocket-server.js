import { Server as WebSocketServer } from 'ws';
import url from 'url';
import http from 'http';
import app from './express-server';
import PubSub from './lib/PubSub';
import roomManager from './services/roomManager';
import READYSTATES from './constants';

const server = http.createServer();

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

PubSub.enable(roomManager);

// Also mount the app here
server.on('request', app);
wss.on('connection', async (ws, req) => {
  const queryParameters = url.parse(req.url, true).query;
  const roomId = queryParameters.room;
  const userId = queryParameters.user;

  if (!roomManager.rooms[roomId]) {
    ws.close();
    return;
  }

  const roomToken = roomManager.subscribe(roomId, (data) => {
    if (ws.readyState === READYSTATES.OPEN) {
      ws.send(serialize(data));
    }
  });

  const { controller } = roomManager.rooms[roomId];

  controller.addPlayer(userId);
  const userToken = controller.subscribe(userId, (data) => {
    ws.send(serialize(data));
  });

  ws.on('message', (data) => {
    const command = deserialize(data);
    console.log(command);
    controller.handleInput(userId, command);
  });

  ws.on('close', (code) => {
    console.log(`A user has left the room with code ${code}`);
    controller.removePlayer(userId);
    roomManager.unsubscribe(roomToken);
    roomManager.unsubscribe(userToken);
  });
});

export default server;
