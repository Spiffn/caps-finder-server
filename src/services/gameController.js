import EventEmitter from 'events';
import _ from 'lodash';
import CapsGame, { GameStateEnum } from './game';

const commandType = {
  message: 'message',
  status: 'status',
  announcement: 'announcement',
  confirmation: 'confirmation',
  start: 'start',
  play: 'play',
  skip: 'skip',
  offer: 'offer',
  handUpdate: 'handUpdate',
  gameUpdate: 'gameUpdate',
};

const chatCommands = [
  commandType.message,
  commandType.status,
  commandType.announcement,
];

const gameCommands = [
  commandType.start,
  commandType.play,
  commandType.skip,
  commandType.offer,
];

/**
 * Handles user input and forwards commands to the game
 */
class GameController extends EventEmitter {
  constructor() {
    super();
    this.game = new CapsGame();
  }

  /**
   *
   * @param {string} userId
   * @param {*} command
   */
  handleInput(userId, command) {
    if (chatCommands.includes(command.type)) {
      this.broadcast(command.type, userId, command.payload);
      return;
    }
    if (gameCommands.includes(command.type)) {
      switch (command.type) {
        case commandType.play:
          this.game.playCardsByName(userId, command.payload.trim().split(','));
          break;
        case commandType.start:
          this.game.startGame();
          break;
        case commandType.skip:
          this.game.skip(userId);
          break;
        default:
          break;
      }
      this.publish(userId, {
        type: commandType.confirmation,
        timestamp: new Date().getTime(),
        payload: command.type,
      });
      try {
        this.broadcastStatus();
      } catch (e) {
        console.log(e);
      }
    }
  }

  /**
   * Sends out game update to all players in the room
   */
  broadcastStatus() {
    this.game.players.forEach((player) => {
      this.sendTo(player.name, commandType.handUpdate, player.hand);
    });
    this.announce(`It's ${this.game.currentPlayer.name}'s turn`);
    this.broadcast(commandType.gameUpdate, null, this.game.gameStatus);
  }

  /**
   *
   * @param {string} userId
   */
  addPlayer(userId) {
    if (this.game.gameState === GameStateEnum.STANDBY) {
      this.game.addPlayer(userId);
      this.announce(`${userId} has joined the game!`);
    } else if (_.mapKeys(this.game.players, player => player.name)[userId]) {
      this.announce(`${userId} has reconnected!`);
      this.broadcastStatus();
      // not sending the cards to the reconecting player somehow
    } else {
      this.announce(`${userId} is spectating the game!`);
    }
  }

  /**
   *
   * @param {string} userId
   */
  removePlayer(userId) {
    this.announce(`${userId} has left the game`);
  }

  broadcast(type, user, payload) {
    this.emit('broadcast', {
      type,
      timestamp: new Date().getTime(),
      user,
      payload,
    });
  }

  announce(message) {
    this.broadcast(commandType.announcement, null, message);
  }

  sendTo(userId, type, payload) {
    console.log(`sending to ${userId}`);
    this.publish(userId, {
      type,
      timestamp: new Date().getTime(),
      payload,
    });
  }
}

export default GameController;
