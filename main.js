import recycle from './recycle.js';
import Game5 from './game5.js';
import Game9 from './game9.js';
import LeakyFaucet from './game3.js';
import closeTheLids from './closeTheLids.js';
import Game6 from './game6.js';
import Game10 from './game10.js';
import endScreen from './endScreen.js';
import startScreen from './startScreen.js';
import bugFriend from './bugFriend.js';
import Game11 from './game11.js';
import Game7 from './game7.js';

const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  backgroundColor: '#222222',

  physics:{
    default: 'arcade',
    arcade: {
        debug: false,
        gravity: {y:0}
      }
  },


  scene: [startScreen, bugFriend, Game7 ,Game11,  closeTheLids, Game5, recycle,  Game6, LeakyFaucet, Game9, Game10, endScreen],


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