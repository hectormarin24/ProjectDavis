// recycle.js — mini game to sort items into recycle/trash/compost bins.
// Updated to integrate with a global timer, lives and difficulty system.
// The player must correctly sort five items in a row to win.  Each
// object must be sorted within a time limit that shrinks as difficulty
// increases.  On success or failure, finishMiniGame() is called to
// update the global score/lives and move to the next random mini game.

export default class recycle extends Phaser.Scene {
  constructor() {
    super('recycle');
  }

  preload() {
    this.load.image('background', 'assets/background.webp');
    // Bins
    this.load.image('recycle_bin', 'assets/Recycle_can.png');
    this.load.image('trash_bin', 'assets/trash_can.png');
    this.load.image('compost_bin', 'assets/compost_can.png');
    // Objects to sort
    this.load.image('tin_can', 'assets/tin_can.png');
    this.load.image('banana_peel', 'assets/banana_peel.png');
    this.load.image('pileOfLeaves', 'assets/pileOfLeaves.png');
  }

  init(data) {
    // Dimensions passed from the previous scene
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    // Prevent multiple finish calls
    this.isGameOver = false;
    // Track correct answers within this mini game
    this.localScore = 0;
  }

  create() {
    console.log('Recycle scene loaded');
    // Static background; fill the screen and centre it.  Scaling the
    // background to the full game dimensions avoids it being offset
    // incorrectly on wide screens.  If the texture is missing,
    // fallback to a plain colour.  (Previously the background was
    // anchored at xCoord/3 which caused grey areas.)
    if (this.textures.exists('background')) {
      this.background = this.add
        .image(this.xCoord / 2, this.yCoord / 2, 'background')
        .setOrigin(0.5)
        .setDisplaySize(this.xCoord, this.yCoord);
    } else {
      this.cameras.main.setBackgroundColor(0x333333);
    }
    // HUD for timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.xCoord - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    // Regularly update the HUD and check for global timeout or lives depletion
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const state = window.globalGameState;
        const elapsed = this.time.now - state.startTime;
        const timeLeft = Math.max(0, state.totalTime - elapsed);
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
        this.livesText.setText(`Lives: ${state.lives}`);
        if (!this.isGameOver && (timeLeft <= 0 || state.lives <= 0)) {
          this.isGameOver = true;
          window.finishMiniGame(false, this);
        }
      },
      callbackScope: this,
    });
    // Create buttons for the three bins
    this.recycleButton = this.add
      .image(this.xCoord / 4, (3 * this.yCoord) / 4, 'recycle_bin')
      .setOrigin(0.5)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });
    this.recycleButton.on('pointerdown', () => this.checkAnswer('recycle'));
    this.trashButton = this.add
      .image(this.xCoord / 2, (3 * this.yCoord) / 4, 'trash_bin')
      .setOrigin(0.5)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });
    this.trashButton.on('pointerdown', () => this.checkAnswer('trash'));
    this.compostButton = this.add
      .image((3 * this.xCoord) / 4, (3 * this.yCoord) / 4, 'compost_bin')
      .setOrigin(0.5)
      .setScale(0.5)
      .setInteractive({ useHandCursor: true });
    this.compostButton.on('pointerdown', () => this.checkAnswer('compost'));
    // Spawn first object
    this.nextObject();
  }

  nextObject() {
    // Destroy existing object if present
    if (this.currentObject && this.currentObject.destroy) {
      this.currentObject.destroy();
    }
    // Randomly choose a new item and its correct bin.  Avoid using
    // Phaser.Utils.Array.GetRandom because the Phaser global may not
    // always be available in module scope (which can cause blank
    // screens).  Use a plain random index instead.
    const objects = [
      { key: 'banana_peel', correct: 'compost' },
      { key: 'tin_can', correct: 'recycle' },
      { key: 'pileOfLeaves', correct: 'compost' },
    ];
    const idx = Math.floor(Math.random() * objects.length);
    this.current = objects[idx];
    this.currentObject = this.add
      .image(this.xCoord / 2, this.yCoord / 3, this.current.key)
      .setOrigin(0.5);
    // Start per‑object timer.  The duration shrinks as difficulty grows.
    if (this.objectTimer && this.objectTimer.remove) {
      this.objectTimer.remove();
    }
    const difficulty = window.globalGameState?.difficulty || 1;
    const delay = 5000 / difficulty;
    this.objectTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.isGameOver = true;
        // Show timeout message
        this.add
          .text(this.xCoord / 2, this.yCoord / 2, "Time's up!", {
            fontSize: '64px',
            fill: '#ffffff',
          })
          .setOrigin(0.5);
        // Trigger finishMiniGame after a short delay to allow the message to display
        this.time.delayedCall(500, () => {
          window.finishMiniGame(false, this);
        });
      }
    });
  }

  checkAnswer(bin) {
    if (this.isGameOver) return;
    // Cancel the current object timer
    if (this.objectTimer && this.objectTimer.remove) {
      this.objectTimer.remove();
    }
    if (bin === this.current.correct) {
      this.localScore++;
      if (this.localScore >= 5) {
        // Player wins this mini game
        this.isGameOver = true;
        this.add
          .text(this.xCoord / 2, this.yCoord / 2, 'Great sorting!', {
            fontSize: '64px',
            fill: '#ffffff',
          })
          .setOrigin(0.5);
        this.time.delayedCall(800, () => {
          window.finishMiniGame(true, this);
        });
      } else {
        // Continue to next item
        this.nextObject();
      }
    } else {
      // Wrong bin chosen; fail immediately
      this.isGameOver = true;
      this.add
        .text(this.xCoord / 2, this.yCoord / 2, 'Wrong!', {
          fontSize: '64px',
          fill: '#ffffff',
        })
        .setOrigin(0.5);
      this.time.delayedCall(800, () => {
        window.finishMiniGame(false, this);
      });
    }
  }
}