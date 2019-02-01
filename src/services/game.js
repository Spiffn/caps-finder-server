import Deck from 'card-deck';
import _ from 'lodash';
import Player from './player';

const EventEmitter = require('events');

const ranks = '3456789TJQKA2';
const suits = 'HSDC';

function generateCards() {
  const allCards = [];
  [...ranks]
    .forEach(rank => [...suits]
      .forEach(suit => allCards.push(`${rank}${suit}`)));
  return allCards;
}

function getRank(card) {
  return card.substring(0, 1);
}

function isLegalPlay(cards) {
  if (!cards) {
    return false;
  }
  const rank = cards[0].substring(0, 1);
  // play only one 2 at a time;
  if (rank === '2' && cards.length !== 1) {
    return false;
  }
  // check all cards are same rank
  if (!cards.every(card => card.startsWith(rank))) {
    return false;
  }
  return true;
}

const GameStateEnum = {
  STANDBY: 'STANDBY',
  PICK_HAND: 'PICK HAND',
  EXCHANGE: 'EXCHANGE',
  PLAYING: 'PLAYING',
};

export { isLegalPlay };

function dealCards(numPiles) {
  const deckie = new Deck(generateCards());
  deckie.shuffle();

  let pilesOfAss = [];

  pilesOfAss = _.map(new Array(numPiles), () => []);

  let lastDealt = 0;
  while (deckie.remaining()) {
    pilesOfAss[lastDealt % numPiles].push(deckie.draw());
    lastDealt += 1;
  }

  return pilesOfAss;
}

class Game extends EventEmitter {
  constructor() {
    super();
    this.deck = new Deck(generateCards());
    this.gamesPlayed = 0;
    this.players = [];
    this.currentPlayerIndex = -1;
    this.lastPlayedIndex = null;
    this.cardsPlayed = [];
    this.finished = [];
    this.scum = [];
    this.piles = [];
    this.isFirstPlay = true;
    this.gameState = null;
    this.advanceGameState(GameStateEnum.STANDBY);
  }

  get currentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  get mode() {
    if (!this.lastCards) {
      return null;
    }
    return this.lastCards.length;
  }

  get lastCards() {
    if (this.cardsPlayed.length === 0) {
      return null;
    }
    return this.cardsPlayed[this.cardsPlayed.length - 1];
  }

  get lastRank() {
    if (!this.lastCards) {
      return null;
    }
    return this.lastCards[0].substring(0, 1);
  }

  get numInARow() {
    if (!this.mode) {
      return 0;
    }
    // we could just check all cards with a rank matching lastRank
    if (this.mode === 1) {
      let inARow = 1;
      let indexToCheck = this.cardsPlayed.length - 2;
      while (indexToCheck >= 0) {
        if (this.cardsPlayed[indexToCheck][0].startsWith(this.lastRank)) {
          inARow += 1;
          indexToCheck -= 1;
        } else {
          break;
        }
      }
      return inARow;
    }
    return this.mode;
  }

  get hierarchy() {
    return _.merge(this.finished, this.scum);
  }

  get needyPlayers() {
    return _.filter(this.players, player => player.hands === []);
  }

  addPlayer(name) {
    this.players.push(new Player(name));
  }

  printStatus() {
    this.players.forEach((player) => {
      player.hand.sort();
      console.log(`${player.name}: ${player.hand}`);
    });
    console.log('cards played');
    console.log(this.cardsPlayed);
    const { mode, numInARow, lastRank } = this;
    console.log({ mode });
    console.log({ numInARow });
    console.log({ lastRank });
    console.log(`It is ${this.currentPlayer.name}'s turn`);
    // console.log(`${this.players[this.lastPlayedIndex].name} last played`);
  }

  canHandComplete(hand) {
    const lastPlayed = this.cardsPlayed[this.cardsPlayed.length - 1];
    const currentRank = getRank(lastPlayed[0]);
    const matching = hand.filter(card => card.startsWith(currentRank));
    if (!matching) {
      return false;
    }
    if (this.mode === 1) {
      let inARow = 1;
      let indexToCheck = this.cardsPlayed.length - 2;
      while (indexToCheck >= 0) {
        if (this.cardsPlayed[indexToCheck][0].startsWith(currentRank)) {
          inARow += 1;
          indexToCheck -= 1;
        } else {
          break;
        }
      }
      return inARow + matching.length === 4;
    }
    return this.mode + matching.length === 4;
  }

  isPlayable(cards) {
    if (!isLegalPlay(cards)) {
      return false;
    }
    if (this.isCompletion(cards)) {
      return true;
    }
    const rank = cards[0].substring(0, 1);
    if (!this.mode) {
      return rank !== '2';
    }
    if (rank === '2') {
      return true;
    }
    if (cards.length !== this.mode) {
      return false;
    }
    return ranks.indexOf(rank) >= ranks.indexOf(this.lastRank);
  }

  isCompletion(cards) {
    if (!isLegalPlay(cards)) {
      return false;
    }
    if (!this.numInARow && cards.length !== 4) {
      return false;
    }
    const rank = cards[0].substring(0, 1);
    return this.lastRank === rank && this.numInARow + cards.length === 4;
  }

  bomb() {
    this.cardsPlayed = [];
    this.emit('bomb');
  }

  skip() {
    this.nextTurn();
    this.emit('skip');
  }

  // TODO: Implement me !
  playCards(playerIndex, cards) {
    if (this.gameState !== GameStateEnum.PLAYING) {
      throw Error('We haven\'t started playing yet!');
    }

    const player = this.players[playerIndex];

    if (_.difference(cards, this.hand).length === 0) {
      throw Error(`${player.name} does not have the cards ${cards}`);
    }

    if (!this.isPlayable(cards)) {
      throw Error(`${cards} cannot be played`);
    }

    if (this.isFirstPlay) {
      if (!cards.includes('3C')) {
        throw Error('First play must include the 3 of clubs');
      }
      this.isFirstPlay = false;
    }

    if (this.isCompletion(cards)) {
      player.removeCards(cards);
      this.bomb();
      this.lastPlayedIndex = playerIndex;
      this.currentPlayerIndex = playerIndex;
      return;
    }

    if (this.currentPlayerIndex !== playerIndex) {
      throw Error(`it's not your turn ${this.players[playerIndex].name}!`);
    }

    const rank = cards[0].substring(0, 1);

    if (rank === '2') {
      player.removeCards(cards);
      this.bomb();
      this.lastPlayedIndex = playerIndex;
      return;
    }

    this.lastPlayedIndex = playerIndex;

    if (this.mode === 1 && this.lastRank === rank) {
      this.nextTurn();
    }

    player.removeCards(cards);
    this.cardsPlayed.push(cards);
    this.nextTurn();
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    if (this.currentPlayerIndex === this.lastPlayedIndex) {
      this.bomb();
    }
    this.emit('nextTurn', this.currentPlayerIndex);
    if (this.hierarchy.includes(this.currentPlayerIndex)) {
      this.nextTurn();
    }
  }

  startGame() {
    const numPlayers = this.players.length;
    this.piles = dealCards(numPlayers);

    if (this.gamesPlayed === 0) {
      this.isFirstPlay = true;
      // Deal piles to players
      this.players.forEach((player) => {
        player.setHand(this.piles.shift());
      });
      this.currentPlayerIndex = this.getPlayerIndexFor('3C');
      this.advanceGameState(GameStateEnum.PLAYING);
    } else {
      this.isFirstPlay = false;
      this.emit('reveal', _.map(this.piles, pile => pile[0]));
      this.reorderPlayers();
      // President resides at index 0 of reordered players
      this.currentPlayerIndex = 0;
    }
  }

  pickHand(playerIndex, pileIndex) {
    if (this.gameState !== GameStateEnum.PICK_HAND) {
      throw Error('NICE TRY!!');
    }
    const pickingPlayerIndex = this.players.length - this.needyPlayers.length;
    if (playerIndex !== pickingPlayerIndex) {
      throw Error('Nice try');
    }
    // TODO: check pileIndex is valid
    // TODO: check playerIndex is valid
    this.players[playerIndex].setHand(this.piles[pileIndex]);
    if (!this.needyPlayers) {
      // Time to give up your cards, scum bum
      this.advanceGameState(GameStateEnum.EXCHANGE);
      this.exchangeSetup();
    }
  }

  exchangeSetup() {
    this.exchangers = {
      prez: this.players[0],
      scum: this.players[this.players.length - 1],
    }
    
    if (this.players.length > 3) {
      this.exchangers.vicePrez = this.players[1];
      this.exchangers.viceScum = this.players[this.players.length - 2];
    }
  }

  reorderPlayers() {
    this.players = _.map(this.hierarchy, idx => this.players[idx]);
  }

  finishExchange() {
    if (this.gameState !== GameStateEnum.EXCHANGE) {
      throw Error('Bandersnatched');
    }
    this.exchangers = null;
    this.finished = [];
    this.scum = [];
    this.advanceGameState(GameStateEnum.PLAYING);
  }

  advanceGameState(state) {
    this.emit('stateChange', { prev: this.gameState, next: state });
    // console.log(`advancing state from ${this.gameState} to ${state}`);
    this.gameState = state;
  }

  endGame() {
    this.gamesPlayed += 1;
    console.log('All your cards are belong to us');
    this.emit('end', this.gamesPlayed);
  }

  getPlayerIndexFor(target) {
    for (let i = 0; i < this.players.length; i += 1) {
      const { hand } = this.players[i];
      for (let j = 0; j < hand.length; j += 1) {
        if (hand[j] === target) {
          return i;
        }
      }
    }
    throw new Error(404);
  }
}

export default Game;
