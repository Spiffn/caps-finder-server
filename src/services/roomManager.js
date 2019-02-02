import generate from 'adjective-adjective-animal';
import GameController from './gameController';
import PubSub from '../lib/PubSub';

const roomManager = {
  rooms: {},
  /**
   * @deprecated
   * @param {string} roomId
   */
  getUsersByRoomId(roomId) {
    return this.rooms[roomId].users;
  },

  /**
   * Creates a new room with the provided room ID
   * @param {string} roomId
   */
  createRoom(roomId) {
    const controller = new GameController();
    const history = [];
    PubSub.enable(controller);

    controller.on('broadcast', (data) => {
      history.push(data);
      this.publish(roomId, data);
    });

    const room = {
      created: new Date().getDate(),
      users: {},
      history,
      controller,
    };
    this.rooms[roomId] = room;
    controller.game.on('error', error => console.log(error));
  },

  /**
   * Creates a new unique room
   */
  async createNewRoom() {
    let roomId = await generate('pascal');
    while (this.rooms[roomId]) {
      // eslint-disable-next-line no-await-in-loop
      roomId = await generate('pascal'); // generates random AdjectiveAdjectiveAnimal
    }
    this.createRoom(roomId);
    return roomId;
  },
};

roomManager.createRoom('all');

export default roomManager;
