// game6.js — Compost sorting mini game.  Players drag compost items into
// the bin while avoiding plastic.  Once the target score is reached the
// next random game from the queue is started.

// Fruit images
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

export default class Game6 extends Phaser.Scene {
  constructor() {
    super('Game6');
  }

  init(data) {
    // Screen dimensions
    this.W = data?.xCoord ?? 1000;
    this.H = data?.yCoord ?? 900;
    this.activePiece = null;
    this.spawnQueued = false;
    // This mini game uses local scoring only; global score is tracked
    // via globalGameState when finishMiniGame() is called.
    this.score = 0;
    // Local score target for this mini game
    this.targetScore = 5;
    this.gameOver = false;
  }

  preload() {
    this.load.spritesheet('frog', 'assets/frog_idle_sheet_horizontal.png', {
      frameWidth: 64,
      frameHeight: 64,
    });
    FRUIT_KEYS.forEach((name) => {
      this.load.image(name, `assets/game6assets/${name}.png`);
    });
    this.load.image('garden_bg', 'assets/game6assets/garden.webp');
    PLASTIC_KEYS.forEach((name) => {
      this.load.image(name, `assets/game6assets/${name}.png`);
    });
    this.load.image('compost_bin_img', 'assets/game6assets/compostbin.png');
  }

  // Utility to create plastic items
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

  // Utility to create fruit items
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
    // Background
    const bg = this.add.image(this.W / 2, this.H / 2, 'garden_bg');
    bg.setOrigin(0.5);
    bg.setDepth(-10);
    const scaleX = this.W / bg.width;
    const scaleY = this.H / bg.height;
    const scale = Math.max(scaleX, scaleY);
    bg.setScale(scale);
    // Frog idle animation to match other scenes
    this.anims.create({
      key: 'frog-idle',
      frames: this.anims.generateFrameNumbers('frog', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1,
    });
    const frog = this.add.sprite(150, 700, 'frog');
    frog.setScale(4);
    frog.setDepth(1);
    frog.play('frog-idle');
    // Score display shows global and target score for this mini game
    this.scoreText = this.add.text(16, 16, `Score: ${this.score} / ${this.targetScore}`, {
      fontSize: '26px',
      color: '#5cbc08ff',
      fontFamily: 'system-ui',
    });
    // HUD for global timer and lives
    this.timerText = this.add
      .text(16, 48, '', { fontSize: '26px', color: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.W - 180, 16, '', { fontSize: '26px', color: '#ffffff' })
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
        if (!this.gameOver && (timeLeft <= 0 || state.lives <= 0)) {
          this.gameOver = true;
          window.finishMiniGame(false, this);
        }
      },
    });
    // Compost bin
    const binY = this.H - 100;
    this.bin = this.add
      .image(this.W / 2, binY, 'compost_bin_img')
      .setOrigin(0.5, 0.5)
      .setScale(1.4);
    // Spawn first piece
    this.spawnNextPiece();
  }

  // Spawning logic
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
    const piece = type === 'compost' ? this.makeRandomFruit(x, y) : this.makeRandomPlastic(x, y);
    piece.setData('type', type);
    this.makeDraggable(piece);
    this.startStepFall(piece);
    this.activePiece = piece;
  }

  // Gravity simulation
  startStepFall(item) {
    const STEP_PX = 28;
    // Speed up falling with difficulty: shorter step and pause times
    const difficulty = window.globalGameState?.difficulty || 1;
    const STEP_TIME = 160 / difficulty;
    const PAUSE_TIME = 480 / difficulty;
    const stepOnce = () => {
      if (!item.active || item.getData('dragging') || this.gameOver) return;
      const bottomLimit = this.H - 10;
      if (item.y >= bottomLimit) {
        // Piece has reached the bottom of the screen.  Start a bounce
        // animation then remove it.  Do not queue a second spawn here;
        // the bounce itself will trigger spawning via queueNextOnce().
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
        // Pause the falling motion while dragging
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
        // On drag end check if over bin
        if (this.isOverBin(obj)) {
          this.handleDrop(obj);
        } else {
          // If the player did not drop into bin, resume falling
          this.stopStepFall(obj);
          this.startStepFall(obj);
        }
      }
    });
  }

  // Determine if item is over the compost bin
  isOverBin(item) {
    const binBounds = this.bin.getBounds();
    const itemBounds = item.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(itemBounds, binBounds);
  }

  // Called when an item is dropped onto the bin
  handleDrop(item) {
    if (this.gameOver) return;
    const type = item.getData('type');
    // Remove any fall timers and destroy the item
    this.stopStepFall(item);
    item.destroy();
    if (type === 'compost') {
      // Increase local score
      this.score++;
      this.scoreText.setText(`Score: ${this.score} / ${this.targetScore}`);
      if (this.score >= this.targetScore) {
        // Player wins this mini game
        this.endGame(true);
      } else {
        this.spawnNextPiece();
      }
    } else {
      // Dropping plastic into the bin counts as a failure
      this.endGame(false);
    }
  }

  // Shake the camera briefly on errors
  flashCamera(color, duration) {
    const r = (color >> 16) & 255,
      g = (color >> 8) & 255,
      b = color & 255;
    this.cameras.main.flash(duration, r, g, b);
  }

  // Start a bounce when items hit the ground
  startBounce(item) {
    // When a piece touches the ground it should simply disappear and
    // spawn another piece.  Previously this counted as a failure,
    // removing a life immediately, but that made the game unwinnable.
    // A brief bounce is shown before the piece is removed.  No life
    // is lost; we just queue the next spawn.
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
          // Schedule the next piece
          this.queueNextOnce();
        }
      },
    });
  }

  // Queue a single spawn after a delay
  queueNextOnce() {
    if (this.spawnQueued) return;
    this.spawnQueued = true;
    this.time.delayedCall(500, () => {
      this.spawnNextPiece();
    });
  }

  endGame(won) {
    if (this.gameOver) return;
    this.gameOver = true;
    if (this.activePiece) {
      this.stopStepFall(this.activePiece);
      this.activePiece.destroy();
      this.activePiece = null;
    }
    // Remove any pending spawns
    this.spawnQueued = false;
    // Display message based on win or fail
    const msg = won ? 'Nice composting!' : 'Oops!';
    this.add
      .text(this.W / 2, this.H / 2, msg, {
        fontSize: '48px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    // After a short pause, call finishMiniGame
    this.time.delayedCall(800, () => {
      window.finishMiniGame(won, this);
    });
  }
}