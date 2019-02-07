import _ from 'lodash';

export default class Player {
  constructor(name) {
    this.name = name;
    this.hand = [];
  }

  setHand(hand) {
    if (hand.constructor !== Array) {
      throw TypeError('some booty');
    }
    this.hand = hand;
  }

  addCard(card) {
    if (typeof (card) !== 'string') {
      throw TypeError('not a card');
    }
    // TODO: check if card is a valid card;
    this.hand.push(card);
  }

  removeCards(cards) {
    if (_.difference(cards, this.hand).length !== 0) {
      throw Error('cards not in hand');
    }
    _.remove(this.hand, n => cards.includes(n));
  }
}
