import Deck from 'card-deck';
import Player from './player';

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

class Game {
  constructor() {
    this.deck = new Deck(generateCards());
    this.gamesPlayed = 0;
    this.deck.shuffle();
    this.players = [];
    this.currentPlayerIndex = 0;
    this.cardsPlayed = [];
  }

  addPlayer(name) {
    this.players.push(new Player(name));
  }

  dealCardsToPlayers() {
    let lastDealt = 0;
    while (this.deck.remaining()) {
      this.players[lastDealt % this.players.length].addCard(this.deck.draw());
      lastDealt += 1;
    }
  }

  printHands() {
    this.players.forEach((player) => {
      console.log(`${player.name}: ${player.hand}`);
    });
  }

  canHandComplete(hand) {
    const lastPlayed = this.cardsPlayed[this.cardsPlayed.length - 1];
    const currentRank = getRank(lastPlayed[0]);
    const matching = hand.filter(card => card.startsWith(currentRank));
    if (!matching) {
      return false;
    }
    if (this.getMode() === 1) {
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
    return this.getMode() + matching.length === 4;
  }


  skipPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  // TODO: Implement me !
  playCard() {
    const mode = this.getMode();
    if (mode == null) {
      // Play anything
      // If player *only* has a 2. XDXD
    } else if (mode === 1) {
      // Play single card
    } else if (mode === 2) {
      // Play doubles
    } else if (mode === 3) {
      // Play triples
    }

    throw new Error('Some Booty Once Told Me');
  }

  getMode() {
    if (this.cardsPlayed.length === 0) {
      return null;
    }
    const lastCards = this.cardsPlayed[this.cardsPlayed - 1];
    return lastCards.length;
  }

  // only if first game
  startGame() {
    this.deck.shuffle();
    if (this.gamesPlayed === 0) {
      this.dealCardsToPlayers();
      this.currentPlayerIndex = this.getPlayerIndexFor('3C');
    } else {
      // TODO: IMPLEMENT ME!
    }
  }

  // TODO: IMPLEMENT ME!
  endGame() {
    this.gamesPlayed += 1;
    console.log('All your cards are belong to us');
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
