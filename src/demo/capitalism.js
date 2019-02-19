import CapsGame from '../services/game';
import Events from '../services/eventNames';

const stdin = process.openStdin();

const game = new CapsGame();

function playingListener(d) {
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
  } catch (e) {
    console.log(e.message);
  }
}

stdin.addListener('data', playingListener);

game.on(Events.STATECHANGE, (change) => {
  console.log(`advancing to ${change.next}`);
  console.log('PLSSSSS');
  if (change.next === 'PLAYING') {
    game.printStatus();
  }

  if (change.next === 'EXCHANGE') {
    console.log('RAZPUTIN');
    stdin.removeListener('data', playingListener);
  }
});

game.on(undefined, () => console.log('save the bees'));

game.on(Events.REVEAL, (tops) => {
  console.log('Toops + Poops');
  console.log(`${tops}`);
});

game.on(Events.COMPLETION, (cardsPlayed) => {
  console.log(`CARDS PLAYED: ${cardsPlayed}`);
});

game.addPlayer('James');
// game.addPlayer('Tim');

game.startGame();
