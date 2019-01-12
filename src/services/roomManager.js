import generate from 'adjective-adjective-animal';

export default {
  rooms: {
    all: {
      created: new Date().getDate(),
      users: {},
    },
  },

  hasRoom(roomId) {
    return Object.prototype.hasOwnProperty.call(this.rooms, roomId);
  },

  async getNewRoom() {
    let roomId = await generate('pascal');
    while (this.hasRoom(roomId)) {
      // eslint-disable-next-line no-await-in-loop
      roomId = await generate('pascal'); // generates random AdjectiveAdjectiveAnimal
    }
    this.rooms[roomId] = {
      created: new Date().getDate(),
      users: {},
    };
    return roomId;
  },
};
