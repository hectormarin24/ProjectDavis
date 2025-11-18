import recycle from './recycle.js';
import boxFlatten from './boxFlatten.js';
import oilAndWater from './oilAndWater.js';
import leakyFaucet from './leakyFaucet.js';
import closeTheLids from './closeTheLids.js';
import compostSort from './compostSort.js';
import bathroomSort from './bathroomSort.js';
import endScreen from './endScreen.js';
import startScreen from './startScreen.js';
import bugFriend from './bugFriend.js';
import raccoon from './raccoon.js';
import catchRec from './catchRec.js';
import fruitPicker from './fruitPicker.js';
import tranistionScreen from './transitionScreen.js';


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
    leakyFaucet,
    boxFlatten,
    compostSort,
    oilAndWater,
    bathroomSort,
    raccoon,
    bugFriend,
    catchRec,
    fruitPicker,
    endScreen,
    tranistionScreen
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