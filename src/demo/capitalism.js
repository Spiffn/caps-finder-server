
import CapsGame from '../services/game';

const stdin = process.openStdin();

const game = new CapsGame();

game.addPlayer('James');
game.addPlayer('Tim');
game.addPlayer('Lawrence');

game.startGame();

game.printHands();

const currentPlayerName = game.players[game.currentPlayerIndex].name;

console.log(`It is ${currentPlayerName}'s turn`);
