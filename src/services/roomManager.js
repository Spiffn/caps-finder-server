import generate from 'adjective-adjective-animal';

export default {
  rooms: new Set(['all']),

  async getNewRoom() {
    let result = await generate('pascal');
    while (this.rooms.has(result)) {
      // eslint-disable-next-line no-await-in-loop
      result = await generate('pascal'); // generates random AdjectiveAdjectiveAnimal
    }
    this.rooms.add(result);
    return result;
  },
};
