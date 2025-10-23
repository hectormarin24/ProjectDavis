import recycle from './recycle.js';
import Game5 from './game5.js';
import Game9 from './game9.js';
import LeakyFaucet from './game3.js';
import closeTheLids from './closeTheLids.js';
import Game6 from './game6.js';  
import endScreen from './endScreen.js';
import startScreen from './startScreen.js';
import bugFriend from './bugFriend.js';

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

  scene: [ startScreen, bugFriend, closeTheLids, Game5, recycle,  Game6, LeakyFaucet, Game9,  endScreen ],

  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
};

// keep a reference for debugging in browser console
const game = new Phaser.Game(config);
window.game = game;
