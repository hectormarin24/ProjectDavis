import Game1 from './game1.js';
import Game2 from './game2.js';
import Game9 from './game9.js';
import LeakyFaucet from './game3.js';
import closeTheLids from './closeTheLids.js';

import endScreen from './endScreen.js';
import startScreen from './startScreen.js';

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  backgroundColor: '#222222',
  scene: [ startScreen, Game1, Game2, Game9, LeakyFaucet, endScreen, CloseTheLids ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

// keep a reference for debugging in browser console
const game = new Phaser.Game(config);
window.game = game;
