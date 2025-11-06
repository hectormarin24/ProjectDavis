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
import Game12 from './game12.js';


// Phaser game configuration.  All scenes are registered here but their order
// is irrelevant because the start screen shuffles the mini games using
// window.gameQueue.  Each scene pops the next game from the queue when
// finished.  If the queue is empty the end screen is shown.
const config = {
  type: Phaser.AUTO,
  width: 1000,
  height: 900,
  backgroundColor: '#222222',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 },
    },
  },
  scene: [
     startScreen,
    recycle,
    closeTheLids,
    LeakyFaucet,
    Game5,
    Game6,
    Game9,
    Game10,
    Game11,
    bugFriend,
    Game7,
      Game12,
    endScreen,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Create and expose the Phaser game instance.  Keeping a reference on
// window makes it easy to debug scenes from the browser console.
const game = new Phaser.Game(config);
window.game = game;