import Player from './player';

describe('When creating a player', () => {
  test('their name should be set correctly', () => {
    const player = new Player('Bob');
    expect(player.name).toBe('Bob');
  });

  test('their hand is empty', () => {
    const player = new Player('Bob');
    expect(player.hand).toEqual([]);
  });
});

describe('Player setHand()', () => {
  test('should throw an error when setting a hand that is not an array', () => {
    const t = () => {
      const player = new Player('Bob');
      player.setHand('');
    };
    expect(t).toThrow(TypeError);
  });

  test('should set the hand correctly', () => {
    const player = new Player('Bob');
    player.setHand(['AS', '5H', '2C', '3H']);
    expect(player.hand).toEqual(['AS', '5H', '2C', '3H']);
  });
});

describe('Player addCard(card)', () => {
  test('should throw an error when card is not a string', () => {
    const t = () => {
      const player = new Player('Bob');
      player.addCard(1);
    };
    expect(t).toThrow(TypeError);
  });

  test('should add a card correctly', () => {
    const player = new Player('Bob');
    player.addCard('AS');
    expect(player.hand).toEqual(['AS']);
  });
});

describe('Player removeCards', () => {
  test('should throw an error when trying to remove cards not in hand', () => {
    const t = () => {
      const player = new Player('Bob');
      player.setHand(['AS', '5H', '2C', '3H']);
      player.removeCards(['AH', '5H']);
    };
    expect(t).toThrow(Error);
  });

  test('should remove cards correctly', () => {
    const player = new Player('Bob');
    player.setHand(['AS', '5H', '2C', '3H']);
    player.removeCards(['AS', '5H']);
    expect(player.hand).toEqual(['2C', '3H']);
  });
});

describe('Player finished', () => {
  let player;
  beforeEach(() => {
    player = new Player('Bob');
  });
  test('is true if the player has removed all cards', () => {
    player.setHand(['AS']);
    expect(player.finished()).toBeFalsy();
    player.removeCards(['AS']);
    expect(player.finished()).toBeTruthy();
  });
});
