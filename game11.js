// game11.js (ES module)
// Wildlife Snack Stopper — Don’t feed wild animals!
// Adds: spawn-distance safety, robust click-sync, score system, end-screen transition.

const WIDTH = 1000;
const HEIGHT = 880;
// Minimum pixels between raccoon center and spawned food
const MIN_FOOD_DISTANCE_FROM_RACCOON = 180;
// The distance threshold under which we consider the raccoon to have "reached" the food
const RACCOON_REACH_THRESHOLD = 48;
// Score needed to finish the level
const WIN_SCORE = 5;

class Game11Scene extends Phaser.Scene {
  constructor() {
    super({ key: 'Game11' });
  }

  preload() {
    this.load.image('bgpark', 'assets/bg_park.png');
    this.load.image('hand', 'assets/hand.png');
    this.load.image('food', 'assets/food.png');
    this.load.image('raccoon', 'assets/raccoon.png');
    this.load.audio('pop', 'assets/pop.wav');
  }

  create() {
    // Basic state
    this.score = 0;
    this.raccoonTween = null;
    this.food = null;

    // Background
    if (this.textures.exists('bgpark')) {
      this.add.image(WIDTH / 2, HEIGHT / 2, 'bgpark').setDisplaySize(WIDTH, HEIGHT);
    } else {
      this.cameras.main.setBackgroundColor('#a7d3a6');
    }

    // Hand (visual)
    this.handX = WIDTH / 2;
    this.handY = 90;
    if (this.textures.exists('hand')) {
      this.hand = this.add.image(this.handX, this.handY, 'hand').setScale(0.15);
    }

    // Score display (top-left)
    this.scoreText = this.add.text(16, 16, `Score: ${this.score}`, {
      font: '24px Arial',
      color: '#fff',
      backgroundColor: 'rgba(0,0,0,0.4)',
      padding: { x: 8, y: 6 },
    }).setDepth(10);

    // Raccoon
    this.spawnRaccoon(true); // create raccoon immediately

    // Initial food
    this.spawnFood();

    // Input to click on food before raccoon reaches it
    this.input.on('gameobjectdown', (pointer, obj) => {
      if (!obj || !obj.texture) return;
      if (obj.texture.key === 'food') {
        // Only accept clicks if the food is still active
        if (!obj.active) return;

        // Play pop, increment score, remove food, update UI
        if (this.sound) {
          this.sound.play('pop');
        }
        this.incrementScore();

        // stop raccoon current movement toward old food so it doesn't trigger stale onComplete
        if (this.raccoonTween) {
          this.raccoonTween.stop();
          this.raccoonTween = null;
        }

        // destroy the clicked food and clear reference
        obj.destroy();
        if (this.food === obj) this.food = null;

        // spawn next food after a short delay and resume raccoon movement
        this.time.delayedCall(400, () => {
          this.spawnFood();
          this.moveRaccoon();
        }, [], this);
      }
    });
  }

  incrementScore() {
    this.score += 1;
    if (this.scoreText) this.scoreText.setText(`Score: ${this.score}`);

    // Win condition
    if (this.score >= WIN_SCORE) {
      // Show congratulatory message then transition to end screen
      this.showMessage('Good job! 🎉');
      this.time.delayedCall(1200, () => {
        // Try likely scene keys; warn if not present
        try {
          this.scene.start('LeakyFaucet');
        } catch (e1) {
          try {
            this.scene.start('LeakyFaucet');
          } catch (e2) {
            console.warn('endScreen not found in scene manager; please ensure you have an end screen scene with key "endScreen" or "EndScreen".');
          }
        }
      }, [], this);
    }
  }

  spawnFood() {
    // Choose a location not too close to raccoon
    let x, y;
    const maxAttempts = 50;
    let attempts = 0;
    const pad = 120; // keep food within a safe play area margin

    do {
      x = Phaser.Math.Between(pad, WIDTH - pad);
      y = Phaser.Math.Between(200, HEIGHT - 120);
      attempts++;
      // If no raccoon yet, accept immediately
      if (!this.raccoon) break;
      const dist = Phaser.Math.Distance.Between(x, y, this.raccoon.x, this.raccoon.y);
      if (dist >= MIN_FOOD_DISTANCE_FROM_RACCOON) break;
    } while (attempts < maxAttempts);

    // If we tried many times and couldn't satisfy distance, we still place it (prevents infinite loop)
    if (this.food && this.food.active) {
      this.food.destroy();
    }

    if (this.textures.exists('food')) {
      this.food = this.add.image(x, y, 'food').setInteractive().setScale(0.08);
    } else {
      // if texture missing, at least set a placeholder graphic (optional)
      this.food = this.add.text(x, y, '🍎').setInteractive();
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
        // if called after clicking, start moving toward whatever food exists
        this.moveRaccoon();
      }
    }
  }

  moveRaccoon() {
    // If there's already a tween going to a previous target, stop it before creating a new one
    if (!this.raccoon || !this.food) return;

    if (this.raccoonTween) {
      this.raccoonTween.stop();
      this.raccoonTween = null;
    }

    // Recompute duration proportional to distance so movement looks natural
    const distance = Phaser.Math.Distance.Between(this.raccoon.x, this.raccoon.y, this.food.x, this.food.y);
    const baseSpeed = 600; // px per second baseline (tweakable)
    const duration = Math.max(700, Math.round((distance / baseSpeed) * 1000) + 300);

    this.raccoonTween = this.tweens.add({
      targets: this.raccoon,
      x: this.food.x,
      y: this.food.y,
      duration: duration,
      ease: 'Linear',
      onComplete: () => {
        // Clear the tween ref
        this.raccoonTween = null;

        // Safety: confirm the food is still present and actually near the raccoon
        if (this.food && this.food.active) {
          const reachDist = Phaser.Math.Distance.Between(this.raccoon.x, this.raccoon.y, this.food.x, this.food.y);
          if (reachDist <= RACCOON_REACH_THRESHOLD) {
            // Raccoon legitimately reaches the food
            this.food.destroy();
            this.food = null;
            this.showMessage('Raccoon got the snack!');
            this.time.delayedCall(1000, () => {
              this.spawnFood();
              this.moveRaccoon();
            }, [], this);
            return;
          }
        }

        // If food is gone or not within reach, wait a moment and try again (this prevents false "got snack" messages)
        this.time.delayedCall(400, () => {
          if (this.food) {
            // Start moving toward the current food if it exists
            this.moveRaccoon();
          }
        }, [], this);
      },
    });
  }

  showMessage(msg) {
    // Reuse a single message text to avoid stacking many texts
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
}

// Ensure we don't break ES module isolation — but still expose for quick console testing if desired
if (typeof window !== 'undefined') {
  // The module may be evaluated before window.game is created; exposing the constructor and helper is harmless.
  window.Game11Scene = Game11Scene;
  window.startGame11 = function () {
    if (window.game && window.game.scene) {
      try {
        window.game.scene.start('Game11');
      } catch (e) {
        // fallback or log if missing
        console.warn('Could not start Game11 by key "Game11":', e);
      }
    } else {
      console.warn('Game object not yet available. Ensure main.js created window.game.');
    }
  };
}

export default Game11Scene;
