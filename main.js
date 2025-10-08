import Game1 from './game1.js';
import Game2 from './game2.js';
import closeTheLids from './closeTheLids.js';
import endScreen from './endScreen.js';
import startScreen from './startScreen.js';

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  backgroundColor: '#222222',
  scene: [startScreen, Game1, Game2, endScreen, closeTheLids],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

new Phaser.Game(config);
