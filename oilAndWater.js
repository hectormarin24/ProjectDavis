// game9.js — Oil vs. water mini game.  The player must pour the liquid
// from a pot into the correct container (sink for water, bucket for oil).
// Complete three successful pours to win.  Wrong choice or time
// expiration causes a failure.  A per‑round timer decreases with
// difficulty.  The HUD shows the global timer and lives.  When the
// mini game ends finishMiniGame() is invoked to update global state.

export default class oilAndWater extends Phaser.Scene {
  constructor() {
    super({ key: 'oilAndWater' });
  }

  init(data) {
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.isGameOver = false;
    this.successfulPourCount = 0;
    this.maxSuccessfulPours = 3;
  }

  preload() {
    this.load.image('oil_bg', 'assets/kitchenbg.png');
    this.load.image('pot', 'assets/pot.png');
    this.load.image('water', 'assets/liquid_water.png');
    this.load.image('oil', 'assets/liquid_oil.png');
    this.load.image('sink', 'assets/sink.png');
    this.load.image('bucket', 'assets/bucket.png');
  }

  create() {
    // Background
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    if (this.textures.exists('oil_bg')) {
      this.add
        .image(cx, cy, 'oil_bg')
        .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    } else {
      this.cameras.main.setBackgroundColor(0xf0f0f0);
    }
    // HUD for global timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.cameras.main.width - 180, 20, '', { fontSize: '28px', fill: '#ffffff' })
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
    // Prepare pot and targets
    this.pot = this.add.image(cx, cy - 50, 'pot').setScale(0.3);
    this.sink = this.add.image(cx - 270, cy + 60, 'sink').setScale(0.2).setInteractive({ useHandCursor: true });
    this.bucket = this.add.image(cx + 270, cy + 60, 'bucket').setScale(0.2).setInteractive({ useHandCursor: true });
    this.message = this.add.text(cx, cy + 180, 'Click the correct container', {
      font: '20px Arial',
      color: '#222',
    }).setOrigin(0.5);
    // Set up round
    this.startRound();
    // Attach click handlers
    this.sink.on('pointerdown', () => this.onTarget('sink'));
    this.bucket.on('pointerdown', () => this.onTarget('bucket'));
  }

  startRound() {
    if (this.isGameOver) return;
    // Randomly choose pot contents
    this.potContents = Math.random() < 0.5 ? 'water' : 'oil';
    if (this.hintText && this.hintText.destroy) this.hintText.destroy();
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.hintText = this.add
      .text(cx, cy - 150, 'Pot contains: ' + this.potContents, {
        font: '22px Arial',
        color: '#000',
      })
      .setOrigin(0.5);
    // Reset instruction message each round so players know what to do
    if (this.message && this.message.setText) {
      this.message.setText('Click the correct container');
    }
    // Start a timer for this round; shorter time with higher difficulty
    if (this.roundTimer && this.roundTimer.remove) this.roundTimer.remove();
    const difficulty = window.globalGameState?.difficulty || 1;
    const delay = 6000 / difficulty;
    this.roundTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.loseGame();
      }
    });
  }

  onTarget(target) {
    if (this.isGameOver) return;
    // Stop round timer
    if (this.roundTimer && this.roundTimer.remove) this.roundTimer.remove();
    const correct = this.potContents === 'water' ? 'sink' : 'bucket';
    if (target === correct) {
      this.successfulPourCount++;
      this.message.setText('Correct!');
      if (this.successfulPourCount >= this.maxSuccessfulPours) {
        this.winGame();
      } else {
        // Start next round after short pause
        this.time.delayedCall(500, () => {
          this.startRound();
        });
      }
    } else {
      this.loseGame();
    }
  }

  winGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.message.setText('Great job!');
    this.time.delayedCall(800, () => {
      window.finishMiniGame(true, this);
    });
  }

  loseGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.message.setText('Wrong choice!');
    this.time.delayedCall(800, () => {
      window.finishMiniGame(false, this);
    });
  }
}