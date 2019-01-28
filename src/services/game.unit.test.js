import Game, { isLegalPlay } from './game';

test('Test that 2 is a legal play', () => {
  expect(isLegalPlay(['2H'])).toBe(true);
});

test('Test that a pair of 3s is a legal play', () => {
  expect(isLegalPlay(['3H', '3S'])).toBe(true);
});

test('Test that a 3 and 5 is a not legal play', () => {
  expect(isLegalPlay(['3H', '5S'])).toBe(false);
});

test('Test that a pair of 2\'s is not a legal play', () => {
  expect(isLegalPlay(['2S', '2D'])).toBe(false);
});

describe('A new game', () => {
  test('has a 52 card deck', () => {
    const game = new Game();
    expect(game.deck.remaining()).toBe(52);
  });

  test('has 0 games played', () => {
    const game = new Game();
    expect(game.gamesPlayed).toBe(0);
  });

  test('has 0 players', () => {
    const game = new Game();
    expect(game.players.length).toBe(0);
  });

  test('has a player index of 0', () => {
    const game = new Game();
    expect(game.currentPlayerIndex).toBe(0);
  });

  test('has no cards played', () => {
    const game = new Game();
    expect(game.cardsPlayed.length).toBe(0);
  });
});

describe('Game mode', () => {
  test('is null when no cards have been played', () => {
    const game = new Game();
    expect(game.mode).toBe(null);
  });

  test('is 1 when one card is played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H']];
    expect(game.mode).toBe(1);
  });

  test('is 2 when two cards are played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H', '3S']];
    expect(game.mode).toBe(2);
  });
});

describe('Game lastCards', () => {
  test('is null when no cards have been played', () => {
    const game = new Game();
    expect(game.lastCards).toBe(null);
  });

  test('is correct when 2 cards have been played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H'], ['3S']];
    expect(game.lastCards).toEqual(['3S']);
  });
});

describe('Game lastRank', () => {
  test('is null when no cards have been played', () => {
    const game = new Game();
    expect(game.lastRank).toBe(null);
  });

  test('is correct when 2 cards have been played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H'], ['5S']];
    expect(game.lastRank).toEqual('5');
  });

  test('is null when no cards have been played', () => {
    const game = new Game();
    expect(game.lastRank).toBe(null);
  });

  test('is correct when 2 cards have been played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H'], ['5S']];
    expect(game.lastRank).toEqual('5');
  });
});

describe('Game numInARow', () => {
  test('is 0 when no cards have been played', () => {
    const game = new Game();
    expect(game.numInARow).toBe(0);
  });

  test('is correct when 1 card has been played in a row', () => {
    const game = new Game();
    game.cardsPlayed = [['3H'], ['5S']];
    expect(game.numInARow).toBe(1);
  });

  test('is correct when 2 cards have been played in a row', () => {
    const game = new Game();
    game.cardsPlayed = [['3H'], ['3S']];
    expect(game.numInARow).toBe(2);
  });

  test('is correct when 3 cards has been played in a row', () => {
    const game = new Game();
    game.cardsPlayed = [['3H'], ['3S'], ['3D']];
    expect(game.numInARow).toBe(3);
  });

  test('is correct when a pair has been played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H', '3C'], ['5S', '5D']];
    expect(game.numInARow).toBe(2);
  });

  test('is correct when a triple has been played', () => {
    const game = new Game();
    game.cardsPlayed = [['3H', '3C', '3D']];
    expect(game.numInARow).toBe(3);
  });
});

describe('Game isCompletion', () => {
  test('is true for pairs', () => {
    const game = new Game();
    game.cardsPlayed = [['3H', '3S'], ['4H', '4S']];
    expect(game.isCompletion(['4D', '4C'])).toBe(true);
  });

  test('is true for playing one card on a triple', () => {
    const game = new Game();
    game.cardsPlayed = [['3H', '3C', '3D']];
    expect(game.isCompletion(['3S'])).toBe(true);
  });

  test('is true for playing a triple on one card', () => {
    const game = new Game();
    game.cardsPlayed = [['3S']];
    expect(game.isCompletion(['3H', '3C', '3D'])).toBe(true);
  });

  test('is true for playing a double on two cards', () => {
    const game = new Game();
    game.cardsPlayed = [['3S'], ['3D']];
    expect(game.isCompletion(['3H', '3C'])).toBe(true);
  });
});
