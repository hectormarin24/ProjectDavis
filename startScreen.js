export default class startScreen extends Phaser.Scene {
  constructor() {
    super('startScreen');
  }

  preload() {
    // Load images for the start screen.  These assets mirror the original game
    // and include a play button, trophy button, settings button and the frog
    // idle animation.  Using the same keys preserves compatibility with
    // existing assets.
    this.load.image('background', 'assets/Davis streets-fotor-ai-art-effects-20250918131614.png');
    this.load.image('btnPlay', 'assets/play.png');
    this.load.image('btnTrophy', 'assets/prize.png');
    this.load.image('btnSettings', 'assets/setting.png');
    this.load.spritesheet('frog', 'assets/frog_idle_sheet_horizontal.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
  }

  create() {
    // Cache the screen dimensions so they can be passed to the first game
    // scene.  Doing this once here avoids repeatedly calling
    // this.cameras.main.width/height throughout the file.
    this.xCoord = this.cameras.main.width;
    this.yCoord = this.cameras.main.height;

    console.log('main screen loaded');

    // Add the background and welcome text.  The coordinates mirror the
    // original implementation.
    this.background = this.add
      .image(this.xCoord / 3 + 20, this.yCoord / 2, 'background')
      .setOrigin(0.5);
    this.add
      .text(this.xCoord / 2, this.yCoord / 3, 'Welcome!', {
        fontSize: '156px',
        fontStyle: 'bold',
        fill: '#fff',
      })
      .setOrigin(0.5);

    // Create a simple idle animation for the frog so the start screen feels
    // animated.  Re‑use the existing spritesheet frames.
    this.anims.create({
      key: 'frog-idle',
      frames: this.anims.generateFrameNumbers('frog', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    const frog = this.add.sprite(150, 660, 'frog');
    frog.setScale(4);
    frog.setDepth(1);
    frog.play('frog-idle');

    // Initialise global game state for the session.  The timer runs for five
    // minutes (300000 ms) and the player starts with three lives.  A
    // difficulty multiplier begins at 1 and will increase after each mini
    // game.  The global score starts at zero and increases by 100 points per
    // successful mini game.
    window.globalGameState = {
      startTime: this.time.now,
      totalTime: 5 * 60 * 1000,
      lives: 3,
      score: 0,
      difficulty: 1,          // lowest difficulty
      difficultyEnabled: true // difficulty scaling ON by default
    };

    // Helper to finish a mini game.  Scenes should call this to either
    // advance to the next random game or end the entire session.  The
    // parameter `success` should be true if the player completed the game
    // successfully or false if they failed.  On success the score is
    // incremented by 100 points; on failure a life is removed.  After
    // updating the global state the next scene (or end screen) is started.
    window.finishMiniGame = (success, scene) => {
    const state = window.globalGameState;

    // Score always increases on success
    if (success) {
      state.score += 100;
    } 
    else {
    // Only lose lives if difficulty is ON
    if (state.difficultyEnabled) {
      state.lives -= 1;
    }
    }

    // Only ramp difficulty if enabled; otherwise keep it at 1
    if (state.difficultyEnabled) {
      state.difficulty = Math.min(3, state.difficulty + 0.1);
    } else {
      state.difficulty = 1; // always easiest
    }

    const elapsed = scene.time.now - state.startTime;
    const timeLeft = state.totalTime - elapsed;

    // Game over from lives only if difficulty is ON
    const outOfLives =
    state.difficultyEnabled && state.lives <= 0;

    if (outOfLives || timeLeft <= 0) {
      scene.scene.start('endScreen', {
        score: state.score,
        xCoord: scene.xCoord,
        yCoord: scene.yCoord,
    });
    return;
    }

    // Queue / next scene logic unchanged
    if (!window.gameQueue || window.gameQueue.length === 0) {
      const allList = window.allMiniGames || [];
      const newOrder = Phaser.Utils.Array.Shuffle(allList.slice());
      window.gameQueue = newOrder;
    }
    const nextScene =
      window.gameQueue && window.gameQueue.length > 0
      ? window.gameQueue.shift()
      : 'endScreen';
    scene.scene.start(nextScene, {
      score: state.score,
      xCoord: scene.xCoord,
      yCoord: scene.yCoord,
    });
  };


    // Prepare the list of mini game scene keys.  These keys should match the
    // scene names exported in their respective files.  When the player
    // presses play the array will be shuffled and stored globally on
    // window.gameQueue.  Each game will pop from this queue to determine
    // which game should run next.
    const miniGames = [
      'recycle',
      'closeTheLids',
      'leakyFaucet',
      'raccoon',
      'fruitPicker',
      'compostSort',
      'oilAndWater',
      'boxFlatten',
      'bugFriend',
      'bathroomSort',
      'catchRec',
    ];
    const shuffled = Phaser.Utils.Array.Shuffle(miniGames.slice());
    // Save the full list of mini games globally so that if the queue runs
    // out we can reshuffle and loop the games until the timer expires or
    // the player loses all lives.  Without this the game would stop after
    // one round through the queue.
    window.allMiniGames = miniGames.slice();
    window.gameQueue = shuffled;


    // Play button.  The callback grabs the next scene from the queue and
    // starts it.  If the queue has been exhausted it falls back to
    // endScreen.  A score of 0 is passed at the beginning.
    const playBtn = this.add
      .image(this.xCoord / 2, (3 * this.yCoord) / 3.6, 'btnPlay')
      .setDepth(10)
      .setScale(0.2)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playBtn.setScale(0.23))
      .on('pointerout', () => playBtn.setScale(0.2))
      .on('pointerdown', () => {
        const nextScene =
          window.gameQueue && window.gameQueue.length > 0
            ? window.gameQueue.shift()
            : 'endScreen';
        this.scene.start(nextScene, {
          score: 0,
          xCoord: this.xCoord,
          yCoord: this.yCoord,
        });
      });

    // Trophy and settings buttons retain hover effects but do not start
    // gameplay.  You can wire these up to additional scenes if desired.
    const trophyBtn = this.add
      .image(this.xCoord / 2.7, (3 * this.yCoord) / 3.6, 'btnTrophy')
      .setDepth(10)
      .setScale(0.25)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => trophyBtn.setScale(0.28))
      .on('pointerout', () => trophyBtn.setScale(0.25));

    const settingsBtn = this.add
  .image(this.xCoord / 1.6, (3 * this.yCoord) / 3.6, 'btnSettings')
  .setDepth(10)
  .setScale(0.25)
  .setScrollFactor(0)
  .setInteractive({ useHandCursor: true })
  .on('pointerover', () => settingsBtn.setScale(0.28))
  .on('pointerout', () => settingsBtn.setScale(0.25))
  .on('pointerup', () => {
    // open the settings panel when the gear is clicked
    this.showSettingsMenu();
  });

    // SETTINGS PANEL (initially hidden)
    this.settingsPanel = this.add.rectangle(
    this.xCoord / 2,
    this.yCoord / 2,
    this.xCoord * 0.6,
    this.yCoord * 0.5,
      0x000000,
      0.5
    );
    this.settingsPanel.setDepth(20).setVisible(false);

    // Difficulty text toggle (inside settings panel)
    this.difficultyText = this.add
  .text(
    this.xCoord / 2,
    this.yCoord / 2 - 40,
    '',
    {
      fontSize: '40px',
      fill: '#ffffff',
      align: 'center',
      fontStyle: 'bold',
      wordWrap: {
        width: this.xCoord * 0.5, 
        useAdvancedWrap: true
      }
    }
  )
  .setOrigin(0.5)
  .setDepth(21)
  .setInteractive({ useHandCursor: true })
  .setVisible(false);


// Close button (X)
this.closeSettings = this.add
  .text(
    this.xCoord / 2,
    this.yCoord / 2 + 90,
    'Close',
    {
      fontSize: '32px',
      fill: '#ffffff',
      backgroundColor: '#333',
    }
  )
  .setOrigin(0.5)
  .setDepth(21)
  .setPadding(8, 4, 8, 4)
  .setInteractive({ useHandCursor: true })
  .setVisible(false);

  this.updateDifficultyText = () => {
  const state = window.globalGameState;
  this.difficultyText.setText(
    state.difficultyEnabled
      ? 'Difficulty: ON'
      : 'Difficulty: OFF (Easy Mode)'
  );
};

this.difficultyText.on('pointerup', () => {
    const state = window.globalGameState;
    state.difficultyEnabled = !state.difficultyEnabled;
    if (!state.difficultyEnabled) {
      state.difficulty = 1;
    }
    this.updateDifficultyText();
  });
  this.closeSettings.on('pointerup', () => {
  this.settingsPanel.setVisible(false);
  this.difficultyText.setVisible(false);
  this.closeSettings.setVisible(false);
});



  }

  showSettingsMenu() {
  this.settingsPanel.setVisible(true);
  this.difficultyText.setVisible(true);
  this.closeSettings.setVisible(true);
  this.updateDifficultyText();
}




}
