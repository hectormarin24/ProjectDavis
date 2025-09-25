export default class Game2 extends Phaser.Scene {
  constructor() {
    super('Game2');
  }

  create() {
    console.log('Game2 started');

    this.add.text(100, 100, 'Welcome to Game4!', {
      font: '32px Arial',
      fill: '#ffff00',
    });
  }
}
