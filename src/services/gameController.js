import EventEmitter from 'events';
import _ from 'lodash';
import CapsGame, { GameStateEnum } from './game';
import Events from './eventNames';

const commandType = {
  message: 'message',
  status: 'status',
  announcement: 'announcement',
  confirmation: 'confirmation',
  start: 'start',
  play: 'play',
  skip: 'skip',
  take: 'take',
  give: 'give',
  pick: 'pick',
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
  commandType.give,
  commandType.take,
  commandType.pick,
];

/**
 * Handles user input and forwards commands to the game
 */
class GameController extends EventEmitter {
  constructor() {
    super();
    this.game = new CapsGame();
    this.game.on(Events.REVEAL, () => {
      this.broadcastStatus();
    });
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
      const data = command.payload ? command.payload.trim() : null;
      const performCommand = {
        [commandType.play]: () => this.game.playCardsByName(userId, data.split(',')),
        [commandType.start]: () => this.game.startGame(),
        [commandType.skip]: () => this.game.skip(),
        [commandType.pick]: () => this.game.pickHand(userId, parseInt(data, 10)),
      };
      performCommand[command.type]();
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
    this.publish(userId, {
      type,
      timestamp: new Date().getTime(),
      payload,
    });
  }
}

export default GameController;
