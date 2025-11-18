// game5.js — Mini game where the player flattens cardboard boxes.  Each
// box requires a specific number of clicks to flatten.  The player must
// flatten five boxes within a time limit to win.  Difficulty reduces the
// time allowed for each box.  Wrong clicks or running out of time
// triggers a loss.  At the end, finishMiniGame() is called to update
// global score/lives and start the next random mini game.

export default class boxFlatten extends Phaser.Scene {
  constructor() {
    super('boxFlatten');
  }

  preload() {
    this.load.image('bigBox', 'assets/Big Box.png');
    this.load.image('mediumBox', 'assets/Medium Box.png');
    this.load.image('smallBox', 'assets/Small Box.png');
    this.load.image('flatBox', 'assets/flatBox.png');
    this.load.image('background', 'assets/background.webp');
  }

  init(data) {
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.isGameOver = false;
    this.localScore = 0;
    this.score = data.score;
    this.lives = data.lives;
  }

  create() {
    // Background
    this.add
      .image(this.xCoord / 3 + 20, this.yCoord / 2, 'background')
      .setOrigin(0.5);
    // HUD
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.xCoord - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
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
          window.finishMiniGame(false, this, 0);
        }
      },
    });
    // Spawn first box
    this.clickCount = 0;
    this.nextObject();
  }

  nextObject() {
    if (this.current && this.current.destroy) {
      this.current.destroy();
    }
    // Choose a box type with required clicks
    const options = [
      { key: 'smallBox', scale: 0.5, clicks: 1 },
      { key: 'mediumBox', scale: 1, clicks: 2 },
      { key: 'bigBox', scale: 1.5, clicks: 3 },
    ];
    this.boxInfo = Phaser.Utils.Array.GetRandom(options);
    const x = Phaser.Math.Between(100, this.xCoord - 100);
    const y = Phaser.Math.Between(150, this.yCoord - 200);
    this.current = this.add
      .image(x, y, this.boxInfo.key)
      .setScale(this.boxInfo.scale)
      .setInteractive({ useHandCursor: true });
    // Reset click counter
    this.clickCount = 0;
    this.current.on('pointerdown', () => {
      if (this.isGameOver) return;
      this.clickCount++;
      // If the player clicks more than required, they lose
      if (this.clickCount > this.boxInfo.clicks) {
        this.loseGame();
        return;
      }
      // If reached required number of clicks, flatten box
      if (this.clickCount === this.boxInfo.clicks) {
        // Replace with flattened box
        this.add
          .image(x, y, 'flatBox')
          .setScale(this.boxInfo.scale / 3);
        this.current.destroy();
        this.current = null;
        this.localScore++;
        // Cancel existing timer for this box
        if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();
        if (this.localScore >= 5) {
          this.winGame();
        } else {
          this.nextObject();
        }
      }
    });
    // Start a timer for this box; lose if time runs out
    if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();
    const difficulty = window.globalGameState?.difficulty || 1;
    const delay = 5000 / difficulty;
    this.boxTimer = this.time.delayedCall(delay, () => {
      if (!this.isGameOver) {
        this.loseGame();
      }
    });
  }

  winGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();
    this.add
      .text(this.xCoord / 2, this.yCoord / 2, 'Great job!', {
        fontSize: '64px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      this.scene.start('transitionScreen', {
        lives: this.lives,
        score: this.score,
        xCoord: this.xCoord,
        yCoord: this.yCoord,
        won: true,
        elapsedTime: this.time.now
      });
    });
  }

  loseGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();
    this.add
      .text(this.xCoord / 2, this.yCoord / 2, 'Oops!', {
        fontSize: '64px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      this.scene.start('transitionScreen', {
        lives: this.lives,
        score: this.score,
        xCoord: this.xCoord,
        yCoord: this.yCoord,
        won: false,
        elapsedTime: this.time.now
      });
    });
  }
}