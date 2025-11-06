// closeTheLids.js — mini game where the player must shut trash can lids
// opened by the wind.  This version uses the global timer, lives and
// difficulty settings.  The player wins by closing five lids before the
// mini game timer runs out.  Closing the wrong lid (already closed) or
// letting time expire counts as a failure.  When the mini game ends,
// finishMiniGame() is invoked to update global state and advance to the
// next random game.

export default class closeTheLids extends Phaser.Scene {
  constructor() {
    super('closeTheLids');
  }

  preload() {
    this.load.image('neighborhood', 'assets/neighborhoodStreetView.jpg');
    this.load.image('closedTrashCan', 'assets/closedTrashCan.png');
    this.load.image('openTrashCan', 'assets/openTrashCan.png');
  }

  init(data) {
    // Dimensions from previous scene
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.isGameOver = false;
    this.localScore = 0;
  }

  create() {
    // Background
    this.background = this.add
      .image(0, 0, 'neighborhood')
      .setOrigin(0, 0);
    this.background.displayWidth = this.sys.game.config.width;
    this.background.displayHeight = this.sys.game.config.height;
    // HUD for timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.sys.game.config.width - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
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
    });
    // Create three cans with interactive closing
    this.cans = [];
    const positions = [100, 500, 900];
    positions.forEach((x) => {
      const can = this.add
        .image(x, this.sys.game.config.height - 100, 'closedTrashCan')
        .setScale(0.15)
        .setInteractive({ useHandCursor: true });
      can.on('pointerdown', () => {
        if (this.isGameOver) return;
        if (can.texture.key === 'openTrashCan') {
          can.setTexture('closedTrashCan');
          this.handleClose();
        } else {
          // Closing a can that isn't open counts as a mistake
          this.failGame();
        }
      });
      this.cans.push(can);
    });
    // Wind timer to open lids periodically; speed increases with difficulty
    const difficulty = window.globalGameState?.difficulty || 1;
    const windDelay = 1500 / difficulty;
    this.windTimer = this.time.addEvent({
      delay: windDelay,
      loop: true,
      callback: this.wind,
      callbackScope: this,
    });
    // Mini game timer: fail if not completed in time
    const gameDelay = 20000 / difficulty;
    this.miniTimer = this.time.delayedCall(gameDelay, () => {
      if (!this.isGameOver) {
        this.failGame();
      }
    });
  }

  wind() {
    // Randomly open one of the cans
    if (this.isGameOver) return;
    const idx = Math.floor(Math.random() * this.cans.length);
    const can = this.cans[idx];
    can.setTexture('openTrashCan');
  }

  handleClose() {
    this.localScore++;
    if (this.localScore >= 5) {
      this.winGame();
    }
  }

  winGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    // Stop timers
    if (this.windTimer) this.windTimer.remove();
    if (this.miniTimer) this.miniTimer.remove();
    // Display message
    this.add
      .text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Nice job!', {
        fontSize: '64px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      window.finishMiniGame(true, this);
    });
  }

  failGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.windTimer) this.windTimer.remove();
    if (this.miniTimer) this.miniTimer.remove();
    this.add
      .text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Oops!', {
        fontSize: '64px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      window.finishMiniGame(false, this);
    });
  }
}