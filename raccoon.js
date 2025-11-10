// game11.js — Raccoon feeding mini game.  Players click on food before
// the raccoon reaches it.  When enough points are collected, the game
// transitions to the next random scene instead of a fixed one.

const WIDTH = 1000;
const HEIGHT = 880;
// Distance threshold for food spawn
const MIN_FOOD_DISTANCE_FROM_RACCOON = 180;
// Score needed to finish the level
const WIN_SCORE = 5;

class raccoon extends Phaser.Scene {
  constructor() {
    super({ key: 'raccoon' });
  }

  init(data = {}) {
    this.xCoord = data.xCoord ?? WIDTH;
    this.yCoord = data.yCoord ?? HEIGHT;
    // Track whether the game has finished
    this.finished = false;
  }

  preload() {
    this.load.image('bgpark', 'assets/bg_park.png');
    this.load.image('hand', 'assets/hand.png');
    this.load.image('food', 'assets/food.png');
    this.load.image('raccoon', 'assets/raccoon.png');
    this.load.audio('pop', 'assets/pop.wav');
  }

  create() {
    this.scoreLocal = 0;
    this.misses = 0;
    this.maxMisses = 3;
    this.raccoonTween = null;
    this.food = null;
    // Increase raccoon speed as difficulty grows
    this.raccoonSpeedMultiplier = window.globalGameState?.difficulty || 1;
    this.hasFinished = false;
    // HUD: show global timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(WIDTH - 180, 20, '', { fontSize: '28px', fill: '#ffffff' })
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
        if (!this.finished && (timeLeft <= 0 || state.lives <= 0)) {
          this.finished = true;
          window.finishMiniGame(false, this);
        }
      },
    });
    // Background
    if (this.textures.exists('bgpark')) {
      this.add.image(WIDTH / 2, HEIGHT / 2, 'bgpark').setDisplaySize(WIDTH, HEIGHT);
    } else {
      this.cameras.main.setBackgroundColor('#a7d3a6');
    }
    // Hand graphic
    this.handX = WIDTH / 2;
    this.handY = 90;
    if (this.textures.exists('hand')) {
      this.hand = this.add.image(this.handX, this.handY, 'hand').setScale(0.15);
    }
    // Score and miss displays
    this.scoreText = this.add.text(16, 16, `Score: ${this.scoreLocal}`, {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { x: 8, y: 6 },
    }).setDepth(10);
    this.missText = this.add.text(16, 52, `Misses: ${this.misses}/${this.maxMisses}`, {
      font: '20px Arial',
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.3)',
      padding: { x: 8, y: 4 },
    }).setDepth(10);
    // Spawn raccoon and food
    this.spawnRaccoon(true);
    this.spawnFood();
    this.updateHUD();
    // Begin movement toward food
    this.moveRaccoon();
    // Input to click on food
    this.input.on('gameobjectdown', (pointer, obj) => {
      if (!obj || !obj.texture) return;
      if (obj.texture.key === 'food') {
        if (!obj.active) return;
        if (this.sound) {
          this.sound.play('pop', { volume: 0.25 });
        }
        this.incrementScore();
        if (this.raccoonTween) {
          this.raccoonTween.stop();
          this.raccoonTween = null;
        }
        obj.destroy();
        if (this.food === obj) this.food = null;
        this.time.delayedCall(400, () => {
          if (!this.hasFinished) {
            this.spawnFood();
            this.moveRaccoon();
          }
        }, [], this);
      }
    });
  }

  updateHUD() {
    if (this.scoreText) {
      this.scoreText.setText(`Score: ${this.scoreLocal}`);
    }
    if (this.missText) {
      this.missText.setText(`Misses: ${this.misses}/${this.maxMisses}`);
    }
  }

  incrementScore() {
    this.scoreLocal += 1;
    this.updateHUD();
    if (this.scoreLocal >= WIN_SCORE) {
      this.showMessage('Good job!');
      this.finishLevel();
    }
  }

  spawnFood() {
    let x, y;
    const maxAttempts = 50;
    let attempts = 0;
    const pad = 120;
    do {
      x = Phaser.Math.Between(pad, WIDTH - pad);
      y = Phaser.Math.Between(200, HEIGHT - 120);
      attempts++;
      if (!this.raccoon) break;
      const dist = Phaser.Math.Distance.Between(x, y, this.raccoon.x, this.raccoon.y);
      if (dist >= MIN_FOOD_DISTANCE_FROM_RACCOON) break;
    } while (attempts < maxAttempts);
    if (this.food && this.food.active) {
      this.food.destroy();
    }
    if (this.textures.exists('food')) {
      this.food = this.add.image(x, y, 'food').setInteractive().setScale(0.08);
    } else {
      this.food = this.add.text(x, y, '').setInteractive();
    }
  }

  spawnRaccoon(initial = false) {
    const startX = Phaser.Math.Between(50, WIDTH - 50);
    const startY = HEIGHT - 100;
    if (this.textures.exists('raccoon')) {
      if (this.raccoon && this.raccoon.destroy) {
        this.raccoon.destroy();
      }
      this.raccoon = this.add.image(startX, startY, 'raccoon').setScale(0.3);
      if (!initial) {
        this.moveRaccoon();
      }
    }
  }

  moveRaccoon() {
    if (!this.raccoon || !this.food) return;
    if (this.raccoonTween) {
      this.raccoonTween.stop();
    }
    const destX = this.food.x;
    const destY = this.food.y;
    const dist = Phaser.Math.Distance.Between(this.raccoon.x, this.raccoon.y, destX, destY);
    const speed = 150 * this.raccoonSpeedMultiplier;
    const duration = (dist / speed) * 1000;
    this.raccoonTween = this.tweens.add({
      targets: this.raccoon,
      x: destX,
      y: destY,
      duration: duration,
      onComplete: () => {
        // If raccoon reaches the food before the player, count as a miss
        if (!this.hasFinished) {
          this.misses++;
          this.updateHUD();
          if (this.misses >= this.maxMisses) {
            this.showMessage('Too many misses!');
            // Immediately end the mini game with failure
            this.hasFinished = true;
            this.time.delayedCall(600, () => {
              window.finishMiniGame(false, this);
            });
            return;
          }
          // Spawn new food and reset raccoon
          this.spawnFood();
          this.spawnRaccoon();
          this.moveRaccoon();
        }
      },
    });
  }

  showMessage(msg) {
    if (this._msgText && this._msgText.destroy) {
      this._msgText.destroy();
    }
    this._msgText = this.add.text(WIDTH / 2, HEIGHT / 2, msg, {
      font: '28px Arial',
      color: '#000',
      backgroundColor: '#fff',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setDepth(20);
    this.time.delayedCall(900, () => {
      if (this._msgText && this._msgText.destroy) {
        this._msgText.destroy();
        this._msgText = null;
      }
    }, [], this);
  }

  finishLevel() {
    if (this.hasFinished) return;
    this.hasFinished = true;
    if (this.raccoonTween) {
      this.raccoonTween.stop();
      this.raccoonTween = null;
    }
    if (this.food && this.food.disableInteractive) {
      this.food.disableInteractive();
    }
    this.input.enabled = false;
    // Determine success based on scoreLocal relative to required WIN_SCORE
    const success = this.scoreLocal >= WIN_SCORE;
    this.time.delayedCall(800, () => {
      window.finishMiniGame(success, this);
    });
  }
}

export default Game11Scene;