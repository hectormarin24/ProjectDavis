import Game1 from './game1.js';
import Game2 from './game2.js';
import endScreen from './endScreen.js';
import startScreen from './startscreen.js';

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  backgroundColor: '#222222',
  scene: [Game1, Game2, startScreen, endScreen],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

new Phaser.Game(config);
