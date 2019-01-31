import CapsGame from '../services/game';

const stdin = process.openStdin();

const game = new CapsGame();

game.addPlayer('James');
game.addPlayer('Tim');
game.addPlayer('Lawrence');

game.startGame();

game.printStatus();

game.on('stateChange', (change) => {
  console.log(`advancing to ${change.next}`);
});

stdin.addListener('data', (d) => {
  let index = -1;
  let cards = [];
  try {
    const input = d.toString().trim();
    index = parseInt(input.substring(0, 1), 10);
    cards = input.substring(2).split(',');
    console.log(input.substring(2));
  } catch (e) {
    console.log(e);
    console.log('invalid input');
  }

  try {
    console.log(`${game.players[index].name} is playing ${cards}`);
    game.playCards(index, cards);
    game.printStatus();
  } catch (e) {
    console.log(e.message);
  }
});
