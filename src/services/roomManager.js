import generate from 'adjective-adjective-animal';
import Game from './game';

export default {
  rooms: {
    all: {
      created: new Date().getDate(),
      users: {},
      history: [],
    },
  },

  hasRoom(roomId) {
    return Object.prototype.hasOwnProperty.call(this.rooms, roomId);
  },

  getRoomsList() {
    return Object.keys(this.rooms);
  },

  getUsersByRoomId(roomId) {
    return this.getRoom(roomId).users;
  },

  getRoom(roomId) {
    return this.rooms[roomId];
  },

  addUserToRoom(userId, roomId, ws) {
    this.getUsersByRoomId(roomId)[userId] = ws;
  },

  deleteUserFromRoom(userId, roomId) {
    delete this.getUsersByRoomId(roomId)[userId];
  },

  async createRoom() {
    let roomId = await generate('pascal');
    while (this.hasRoom(roomId)) {
      // eslint-disable-next-line no-await-in-loop
      roomId = await generate('pascal'); // generates random AdjectiveAdjectiveAnimal
    }
    this.rooms[roomId] = {
      created: new Date().getDate(),
      users: {},
      history: [],
      game: new Game(),
    };
    return roomId;
  },
};
