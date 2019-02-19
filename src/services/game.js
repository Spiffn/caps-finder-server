import Deck from 'card-deck';
import _ from 'lodash';
import EventEmitter from 'events';
import Player from './player';
import Events from './eventNames';

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

export { GameStateEnum, isLegalPlay };

/**
 * allocates the deck to n piles where n = numPiles
 * @param {int} numPiles
 */
function dalloc(numPiles) {
  const deck = new Deck(generateCards());
  deck.shuffle();

  let piles = [];

  piles = _.map(new Array(numPiles), () => []);

  let lastDealt = 0;
  while (deck.remaining()) {
    piles[lastDealt % numPiles].push(deck.draw());
    lastDealt += 1;
  }

  return piles;
}

class Game extends EventEmitter {
  constructor() {
    super();
    this.deck = new Deck(generateCards());
    this.gamesPlayed = 0;
    this.players = [];
    this.currentPlayerIndex = -1;
    this.lastPlayedIndex = null;
    this.finished = [];
    this.scum = [];
    this.piles = [];
    this.isFirstPlay = true;
    this.gameState = null;
    this.advanceGameState(GameStateEnum.STANDBY);
    this.cardsPlayed = [];
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
    return getRank(this.lastCards[0]);
  }

  get numInARow() {
    if (!this.mode) {
      return 0;
    }
    if (this.mode === 1) {
      return _.filter(this.cardsPlayed, x => x[0].startsWith(this.lastRank)).length;
    }
    return this.mode;
  }

  get hierarchy() {
    return _.merge(this.finished, this.scum);
  }

  get needyPlayers() {
    return _.filter(this.players, player => player.hands === []);
  }

  get gameStatus() {
    return {
      state: this.gameState,
      cardsPlayed: this.cardsPlayed,
      currentPlayer: this.currentPlayer.name,
      players: _.map(this.players, player => ({
        name: player.name,
        handSize: player.hand.length,
      })),
      pile: this.piles,
      ranking: this.hierarchy,
    };
  }

  addPlayer(name) {
    if (_.filter(this.scum, s => s.name === name).length === 0) {
      this.scum.push(new Player(name));
    }
  }

  printStatus() {
    for (let i = 0; i < this.players.length; i += 1) {
      const { name, hand } = this.players[i];
      console.log(`[${i}] ${name}: ${hand}`);
    }

    console.log('cards played');
    console.log(this.cardsPlayed);
    const { mode, numInARow, lastRank } = this;
    console.log({ mode });
    console.log({ numInARow });
    console.log({ lastRank });
    console.log(`It is ${this.currentPlayer.name}'s turn`);
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

  /**
   * Clears the board and sends a board update
   */
  bomb() {
    this.cardsPlayed = [];
    this.emit(Events.BOARDUPDATE, this.cardsPlayed);
  }

  /**
   *
   * @param {string} playerName
   */
  skip(playerName) {
    if (this.currentPlayer.name === playerName
      && this.cardsPlayed.length > 0) {
      this.nextTurn();
      this.emit(Events.SKIP);
    }
  }

  /**
   * Attempt to play cards
   * @param {string} playerName
   * @param {Array} cards
   */
  playCardsByName(playerName, cards) {
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      if (player.name === playerName) {
        return this.playCards(i, cards);
      }
    }
    this.emit(Events.ERROR, `${playerName} is not playing`);
    return null;
  }

  playCards(playerIndex, cards) {
    if (this.gameState !== GameStateEnum.PLAYING) {
      this.emit(Events.ERROR, 'We haven\'t started playing yet!');
      return null;
    }

    const player = this.players[playerIndex];
    this.lastPlayedIndex = playerIndex;

    if (_.difference(cards, this.hand).length === 0) {
      this.emit(Events.ERROR, `${player.name} does not have the cards ${cards}`);
      return null;
    }

    if (!this.isPlayable(cards)) {
      this.emit(Events.ERROR, `${cards} cannot be played`);
      return null;
    }

    if (this.isFirstPlay) {
      if (!cards.includes('3C')) {
        this.emit(Events.ERROR, 'First play must include the 3 of clubs');
        return null;
      }
      this.isFirstPlay = false;
    }

    if (this.isCompletion(cards)) {
      player.removeCards(cards);
      this.bomb();
      this.currentPlayerIndex = playerIndex;
      this.emit(Events.COMPLETION, this.cardsPlayed);
      return player.hand;
    }

    if (this.currentPlayerIndex !== playerIndex) {
      this.emit(Events.ERROR, `it's not your turn ${this.players[playerIndex].name}!`);
      return null;
    }

    const rank = cards[0].substring(0, 1);

    if (rank === '2') {
      player.removeCards(cards);
      this.bomb();
      return player.hand;
    }

    if (this.mode === 1 && this.lastRank === rank) {
      this.nextTurn();
    }

    player.removeCards(cards);
    this.cardsPlayed.push(cards);
    this.nextTurn();
    this.emit(Events.BOARDUPDATE, this.cardsPlayed);
    return player.hand;
  }

  onlyOnePlayerRemaining() {
    return (_.filter(this.players, player => !player.isFinished())).length === 1;
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    // Find next player that has not finished yet
    while (this.players[this.currentPlayerIndex].isFinished()) {
      this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    }

    if (this.onlyOnePlayerRemaining()) {
      console.log('GAME IS OVER YO');
      this.endGame();

      // TODO: Perform the exchange now LOL
    }

    if (this.currentPlayerIndex === this.lastPlayedIndex) {
      this.bomb();
    }
    this.emit(Events.NEXTTURN, this.currentPlayerIndex);
    if (this.hierarchy.includes(this.currentPlayerIndex)) {
      this.nextTurn();
    }
  }

  startGame() {
    if (this.gameState !== GameStateEnum.STANDBY) {
      return;
    }
    this.reorderPlayers();
    const numPlayers = this.players.length;
    this.piles = dalloc(numPlayers);
    this.bomb();

    if (this.gamesPlayed === 0) {
      this.isFirstPlay = true;
      // Deal piles to players
      this.players.forEach((player) => {
        player.setHand(this.piles.shift());
        player.hand.sort();
      });
      // Set starting player index to player with 3C card
      this.currentPlayerIndex = this.getPlayerIndexFor('3C');
      this.advanceGameState(GameStateEnum.PLAYING);
    } else {
      this.isFirstPlay = false;
      // Setup relationships between exchangers
      this.reorderPlayers();
      this.exchangeSetup();
    }
  }

  /**
   * Pick a hand
   * @param {string} playerName
   * @param {int} pileIndex
   */
  pickHand(playerName, pileIndex) {
    if (this.gameState !== GameStateEnum.PICK_HAND) {
      this.emit(Events.ERROR, 'It\'s not time to pick your hand ya goof');
      return;
    }
    const playerIndex = this.players.findIndex(player => player.name === playerName);
    if (playerIndex < 0) {
      this.emit(Events.ERROR, 'Player doesn\'t exist');
      return;
    }
    const pickingPlayerIndex = this.players.length - this.needyPlayers.length;
    if (playerIndex !== pickingPlayerIndex) {
      this.emit(Events.ERROR, 'Who do ya think you are??');
      return;
    }
    // TODO: check pileIndex is valid
    if (pileIndex >= this.needyPlayers.length) {
      this.emit(Events.ERROR, 'Nah no pile there bub');
      return;
    }
    this.players[playerIndex].setHand(this.piles[pileIndex]);

    // Remove the good ole' selected pile
    this.piles = this.piles.splice(pileIndex, 1);
    
    if (!this.needyPlayers) {
      // Time to give up your cards, scum bum
      this.advanceGameState(GameStateEnum.STANDBY);
      this.exchangeSetup();
    }
  }

  exchangeSetup() {
    this.advanceGameState(GameStateEnum.EXCHANGE);
    this.exchangers = {
      prez: this.players[0],
      scum: this.players[this.players.length - 1],
    };

    if (this.players.length > 3) {
      [_, this.exchangers.vicePrez] = this.players;
      this.exchangers.viceScum = this.players[this.players.length - 2];
    }

    // Show card at top of each pile
    this.emit(Events.REVEAL, _.map(this.piles, pile => pile[0]));
  }

  reorderPlayers() {
    this.players = this.hierarchy;
    // Initially set current player's index to position of president
    this.currentPlayerIndex = 0;
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
    this.emit(Events.STATECHANGE, { prev: this.gameState, next: state });
    this.gameState = state;
  }

  endGame() {
    this.gamesPlayed += 1;
    console.log('All your cards are belong to us');
    this.emit(Events.END, _.map(this.hierarchy, p => p.name));

    // The good ole' loggin' statements, for debuggin' and the such
    console.error(_.map(this.hierarchy, p => p.name));
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
