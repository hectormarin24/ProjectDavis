import Game1 from './game1.js';
import Game2 from './game2.js';

const config = {
  type: Phaser.AUTO,
  width: 1600,
  height: 900,
  backgroundColor: '#222222',
  scene: [Game1, Game2],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

new Phaser.Game(config);
