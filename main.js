import Game1 from './game1.js';
import Game5 from './game5.js';
import Game9 from './game9.js';
import LeakyFaucet from './game3.js';
import closeTheLids from './closeTheLids.js';
import Game6 from './game6.js';  
import endScreen from './endScreen.js';
import startScreen from './startScreen.js';
import Game11 from './game11.js';

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  backgroundColor: '#222222',

  scene: [ startScreen, Game1, Game5, Game6, LeakyFaucet, Game9, Game11, endScreen, closeTheLids ],

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

// keep a reference for debugging in browser console
const game = new Phaser.Game(config);
window.game = game;

// Status check for game9 and game11. For debug.
if (typeof window !== 'undefined') {
  Object.assign(window, {
    startGame9: () => window.game.scene.start('Game9'),
    startGame11: () => window.game.scene.start('Game11'),
  });
  console.log('startGame9() and startGame11() attached to window:', window.startGame11);
}