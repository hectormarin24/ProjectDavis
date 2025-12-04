// game6.js — Compost sorting mini game.

const FRUIT_KEYS = [
  'banana',
  'black-berry-dark',
  'coconut',
  'green-apple',
  'green-grape',
  'lemon',
  'lime',
  'orange',
  'peach',
  'pear',
  'strawberry',
  'watermelon',
];

const PLASTIC_KEYS = ['bag', 'bottle', 'cup', 'Tray', 'utensil'];

export default class compostSort extends Phaser.Scene {
  constructor() {
    super('compostSort');
  }

  init(data) {
    this.W = data?.xCoord ?? 1000;
    this.H = data?.yCoord ?? 900;
    this.activePiece = null;
    this.spawnQueued = false;
    this.score = 0;
    this.targetScore = 5;
    this.gameOver = false;
    this.finalScore = data.score;
    this.lives = data.lives;
  }

  preload() {
    FRUIT_KEYS.forEach((name) => {
      this.load.image(name, `assets/game6assets/${name}.png`);
    });
    this.load.image('garden_bg', 'assets/game6assets/garden.webp');
    PLASTIC_KEYS.forEach((name) => {
      this.load.image(name, `assets/game6assets/${name}.png`);
    });
    this.load.image('compost_bin_img', 'assets/game6assets/compostbin.png');
  }

  makeRandomPlastic(x, y) {
    const key = Phaser.Utils.Array.GetRandom(PLASTIC_KEYS);
    const img = this.add.image(x, y, key);
    const src = this.textures.get(key).getSourceImage();
    const maxDim = Math.max(src.width, src.height);
    const target = 140;
    img.setScale(target / maxDim);
    img.setData('type', 'noncomp');
    return img;
  }

  makeRandomFruit(x, y) {
    const key = Phaser.Utils.Array.GetRandom(FRUIT_KEYS);
    const img = this.add.image(x, y, key);
    const src = this.textures.get(key).getSourceImage();
    const maxDim = Math.max(src.width, src.height);
    const target = 120;
    img.setScale(target / maxDim);
    img.setData('type', 'compost');
    return img;
  }

  create() {
    const gs = window.globalGameState;

    // Background
    const bg = this.add.image(this.W / 2, this.H / 2, 'garden_bg');
    bg.setOrigin(0.5);
    bg.setDepth(-10);
    const scaleX = this.W / bg.width;
    const scaleY = this.H / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);

    const cx = this.cameras.main.centerX;
    this.message = this.add
            .text(cx, 50, 'Drag the items into the compost or the paper bag.', {
                font: '26px Arial',
                color: '#111',
                align: 'center',
                wordWrap: { width: this.scale.width - 80 },
            })
            .setOrigin(0.5, 0.5);
    // Score display shows global and target score for this mini game
    if (gs.highContrast) bg.setTint(0xffffff);

    // Score
    this.scoreText = this.add.text(16, 16, `Score: ${this.score} / ${this.targetScore}`, {
      fontSize: '26px',
      color: '#5cbc08ff',
      fontFamily: 'system-ui',
    });

    // Timer / Lives
    this.timerText = this.add
      .text(16, 48, '', { fontSize: '26px', color: '#ffffff' })
      .setDepth(100);

    this.livesText = this.add
      .text(this.W - 180, 16, '', { fontSize: '26px', color: '#ffffff' })
      .setDepth(100);

    if (!gs.timerEnabled) this.timerText.setVisible(false);
    if (!gs.livesEnabled) this.livesText.setVisible(false);

    // GLOBAL TIMER — OPTION B (do not end minigame on time)
    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const state = gs;
        const elapsed = this.time.now - state.startTime;
        const timeLeft = Math.max(0, state.totalTime - elapsed);

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);

        if (gs.timerEnabled)
          this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);

        if (gs.livesEnabled)
          this.livesText.setText(`Lives: ${state.lives}`);

        // OPTION B — ONLY lives can end the game
        const livesExpired = gs.livesEnabled && state.lives <= 0;

        if (!this.gameOver && livesExpired) {
          this.gameOver = true;
          window.finishMiniGame(false, this, 0);
        }
      },
    });

    // Compost Bin
    const binY = this.H - 100;
    this.bin = this.add
      .image(this.W / 2, binY, 'compost_bin_img')
      .setOrigin(0.5)
      .setScale(1.4);

    // First piece
    this.spawnNextPiece();
  }

  spawnNextPiece() {
    if (this.gameOver) return;
    this.spawnQueued = false;

    if (this.activePiece && this.activePiece.destroy) {
      this.stopStepFall(this.activePiece);
      this.activePiece.destroy();
    }

    const type = Math.random() < 0.6 ? 'compost' : 'noncomp';
    const x = Phaser.Math.Between(this.W * 0.25, this.W * 0.75);
    const y = this.H * 0.2;

    const piece = type === 'compost'
      ? this.makeRandomFruit(x, y)
      : this.makeRandomPlastic(x, y);

    if (window.globalGameState.highContrast) {
      piece.setTint(type === 'compost' ? 0x00ff00 : 0xff0000);
    }

    piece.setData('type', type);
    this.makeDraggable(piece);
    this.startStepFall(piece);
    this.activePiece = piece;
  }

  // Falling animation modified by slowMode + difficulty
  startStepFall(item) {
    const STEP_PX = 28;

    const difficulty = window.globalGameState?.difficulty || 1;

    let STEP_TIME = 160 / difficulty;
    let PAUSE_TIME = 480 / difficulty;

    if (window.globalGameState.slowMode) {
      STEP_TIME *= 1.5;
      PAUSE_TIME *= 1.6;
    }

    const stepOnce = () => {
      if (!item.active || item.getData('dragging') || this.gameOver) return;

      const bottomLimit = this.H - 10;

      if (item.y >= bottomLimit) {
        this.startBounce(item);
        return;
      }

      const targetY = Math.min(item.y + STEP_PX, bottomLimit);

      const t = this.tweens.add({
        targets: item,
        y: targetY,
        duration: STEP_TIME,
        ease: 'Linear',
        onComplete: () => {
          item.setData('stepTween', null);
          const timer = this.time.addEvent({
            delay: PAUSE_TIME,
            callback: stepOnce,
          });
          item.setData('stepTimer', timer);
        },
      });

      item.setData('stepTween', t);
    };

    stepOnce();
  }

  stopStepFall(item) {
    const t = item.getData('stepTween');
    if (t && t.remove) t.remove();
    const timer = item.getData('stepTimer');
    if (timer && timer.remove) timer.remove();
  }

  makeDraggable(item) {
    item.setInteractive({ draggable: true, cursor: 'grab' });
    item.setData('dragging', false);

    this.input.setDraggable(item, true);

    this.input.on('dragstart', (_p, obj) => {
      if (obj === item) {
        obj.setData('dragging', true);
        this.stopStepFall(obj);
      }
    });

    this.input.on('drag', (_p, obj, dragX, dragY) => {
      if (obj === item) {
        obj.x = dragX;
        obj.y = dragY;
      }
    });

    this.input.on('dragend', (_p, obj) => {
      if (obj === item) {
        obj.setData('dragging', false);

        if (this.isOverBin(obj)) {
          this.handleDrop(obj);
        } else {
          this.stopStepFall(obj);
          this.startStepFall(obj);
        }
      }
    });
  }

  isOverBin(item) {
    const binBounds = this.bin.getBounds();
    const itemBounds = item.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(itemBounds, binBounds);
  }

  handleDrop(item) {
    if (this.gameOver) return;

    const type = item.getData('type');
    this.stopStepFall(item);
    item.destroy();

    if (type === 'compost') {
      this.score++;
      this.scoreText.setText(`Score: ${this.score} / ${this.targetScore}`);

      if (this.score >= this.targetScore) {
        this.endGame(true);
      } else {
        this.spawnNextPiece();
      }
    } else {
      this.endGame(false);
    }
  }

  flashCamera(color, duration) {
    const r = (color >> 16) & 255,
      g = (color >> 8) & 255,
      b = color & 255;
    this.cameras.main.flash(duration, r, g, b);
  }

  startBounce(item) {
    this.tweens.add({
      targets: item,
      y: item.y - 20,
      duration: 200,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        if (!this.gameOver) {
          this.stopStepFall(item);
          item.destroy();
          this.queueNextOnce();
        }
      },
    });
  }

  queueNextOnce() {
    if (this.spawnQueued) return;
    this.spawnQueued = true;

    this.time.delayedCall(500, () => {
      this.spawnNextPiece();
    });
  }

endGame(won) {
  const gs = window.globalGameState || {};
  if (gs.livesEnabled === false) {
    won = true;
  }

  if (this.gameOver) return;
  this.gameOver = true;
  if (this.activePiece) {
    this.stopStepFall(this.activePiece);
    this.activePiece.destroy();
    this.activePiece = null;
  }
  this.spawnQueued = false;
  const msg = won ? 'Nice composting!' : 'Oops!';
  this.add
    .text(this.W / 2, this.H / 2, msg, {
      fontSize: '48px',
      fill: '#ffffff',
    })
    .setOrigin(0.5);
  this.time.delayedCall(800, () => {
    this.scene.start('transitionScreen', {
      lives: this.lives,
      score: this.finalScore,
      xCoord: this.xCoord,
      yCoord: this.yCoord,
      won: won,
      elapsedTime: this.time.now
    });
  });
}

}
