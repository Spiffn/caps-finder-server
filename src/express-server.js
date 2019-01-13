import express from 'express';
import { json } from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import ip from 'ip';
import configs from './configs';
import roomManager from './services/roomManager';

const app = express();
app.use(morgan('combined'));
app.use(json());
const allowedOrigins = [
  'http://localhost:8080',
  `http://${ip.address()}:8080`,
];

app.use(cors({
  origin(origin, callback) {
    // allow requests with no origin
    // (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not '
                + 'allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
}));

function getWsUrl(id) {
  return `ws://${ip.address()}:${configs.port}/${id}`;
}

// creates a room
app.get('/room/new', (req, res) => {
  roomManager.createRoom()
    .then(id => res.send({ id, url: getWsUrl(id) }));
});

// gets list of all the rooms
app.get('/rooms', (req, res) => {
  res.send({ rooms: roomManager.getRoomsList() });
});

// checks if room exists
app.get('/room/has/:id', (req, res) => {
  const exists = roomManager.hasRoom(req.params.id);
  res.send({ exists });
});

// gets room message history
app.get('/room/:id/history', (req, res) => {
  res.send({ history: roomManager.getRoom(req.params.id).history });
});

export default app;
