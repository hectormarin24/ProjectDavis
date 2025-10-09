// fruit images
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
  'watermelon'
];

const PLASTIC_KEYS = [
  'bag',
  'bottle',
  'cup',
  'Tray', 
  'utensil'
];
export default class Game6 extends Phaser.Scene {
  constructor() { super('Game6'); }

init(data) {
    this.W = data?.xCoord ?? 1000;
    this.H = data?.yCoord ?? 900;
    this.activePiece = null;
    this.spawnQueued = false;

    // Score Tracking
    this.score = 0;
    this.targetScore = 5;
    this.gameOver = false;
}

preload() {
this.load.spritesheet('frog', 'assets/frog_idle_sheet_horizontal.png', {
    frameWidth: 64,
    frameHeight: 64
});
  FRUIT_KEYS.forEach((name) => {
    this.load.image(name, `assets/game6assets/${name}.png`);
  });

  this.load.image('garden_bg', 'assets/game6assets/garden.webp');

  PLASTIC_KEYS.forEach(name => {
    this.load.image(name, `assets/game6assets/${name}.png`);
  });

  this.load.image('compost_bin_img', 'assets/game6assets/compostbin.png');
}

makeRandomPlastic(x, y) {
  const key = Phaser.Utils.Array.GetRandom(PLASTIC_KEYS);
  const img = this.add.image(x, y, key);

  // scale to a consistent on-screen size (plastics are large PNGs)
  const src = this.textures.get(key).getSourceImage();
  const maxDim = Math.max(src.width, src.height);
  const target = 140;             // a bit bigger than fruit so kids can see it
  img.setScale(target / maxDim);

  img.setData('type', 'noncomp'); // ❗️these should be counted as incorrect items
  return img;
}


makeRandomFruit(x, y) {
  const key = Phaser.Utils.Array.GetRandom(FRUIT_KEYS);
  const img = this.add.image(x, y, key);

  // Scale to a consistent on-screen size (~48px on the longest side)
  const src = this.textures.get(key).getSourceImage();
  const maxDim = Math.max(src.width, src.height);
  const target = 120; // adjust if you want bigger/smaller
  img.setScale(target / maxDim);

  img.setData('type', 'compost');
  return img;
}




create() {
  // Add background centered and scaled to fit screen
  const bg = this.add.image(this.W / 2, this.H / 2, 'garden_bg');
  bg.setOrigin(0.5);
  bg.setDepth(-10);  // send to back behind all objects

  //scale to fit game size
  const scaleX = this.W / bg.width;
  const scaleY = this.H / bg.height;
  const scale = Math.max(scaleX, scaleY); // or Math.min if you prefer no cropping
  bg.setScale(scale);

  // --- Define the idle animation ---
this.anims.create({
    key: 'frog-idle',
    frames: this.anims.generateFrameNumbers('frog', { start: 0, end: 3 }),
    frameRate: 6,
    repeat: -1
});

    // --- Sprite and play the animation ---
const frog = this.add.sprite(150, 700, 'frog'); 
frog.setScale(4);
frog.setDepth(1);
frog.play('frog-idle');// start the idle loop

// --- Score display ---
this.scoreText = this.add.text(16, 16, `Score: 0 / ${this.targetScore}`, {
    fontSize: '26px',
    color: '#5cbc08ff',
    fontFamily: 'system-ui'
});

// --- Compost bin ---

const binY = this.H - 100;                  // about 60px above bottom; tweak as needed
this.bin = this.add.image(this.W / 2, binY, 'compost_bin_img')
  .setOrigin(0.5, 0.5)
  .setScale(1.4);                           // scale to fit your scene; tweak if needed


    this.spawnNextPiece();
  }

  // ---------- Spawning ----------
  spawnNextPiece() {
    if (this.gameOver) return;
    this.spawnQueued = false;

    if (this.activePiece && this.activePiece.destroy) {
      this.stopStepFall(this.activePiece);
      this.activePiece.destroy();
    }

    const type = Math.random() < 0.6 ? 'compost' : 'noncomp';
    const x = Phaser.Math.Between(this.W * 0.25, this.W * 0.75);
    const y = this.H * 0.20;

    const piece =
      type === 'compost'
        ? this.makeRandomFruit(x, y)
        : this.makeRandomPlastic(x, y); 

    piece.setData('type', type);
    this.makeDraggable(piece);
    this.startStepFall(piece);
    this.activePiece = piece;
  }

  // ---------- Step Fall ----------
  startStepFall(item) {
    const STEP_PX    = 28;
    const STEP_TIME  = 160;
    const PAUSE_TIME = 480;

    const stepOnce = () => {
      if (!item.active || item.getData('dragging') || this.gameOver) return;

      const bottomLimit = this.H - 10;
      if (item.y >= bottomLimit) {
        this.startBounce(item);
        this.queueNextOnce();
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
            callback: stepOnce
          });
          item.setData('stepTimer', timer);
        }
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
    item.setData('stepTween', null);
    item.setData('stepTimer', null);
  }

  resumeStepFall(item) {
    this.startStepFall(item);
  }

  // ---------- Bounce ----------
  startBounce(item) {
    this.tweens.add({
    targets: item,
    scaleX: item.scaleX * 1.05,
    scaleY: item.scaleY * 0.95,
    duration: 120,
    yoyo: true,
    repeat: 0
    });

  }

  queueNextOnce() {
    if (this.spawnQueued || this.gameOver) return;
    this.spawnQueued = true;
    this.time.delayedCall(200, () => this.spawnNextPiece());
  }

  // ---------- Drag & Drop ----------
  makeDraggable(item) {
    item.setInteractive({ useHandCursor: true });
    this.input.setDraggable(item);

    item.on('dragstart', () => {
      item.setData('dragging', true);
      this.stopStepFall(item);
      item.setAlpha(0.9);
      item.setDepth(10);
    });

    item.on('drag', (_pointer, dragX, dragY) => {
      item.x = dragX;
      item.y = dragY;
    });

    item.on('dragend', () => {
      item.setData('dragging', false);
      item.setAlpha(1);
      item.setDepth(0);

      if (this.isOverBin(item)) {
        const isCompost = item.getData('type') === 'compost';
        this.flashCamera(isCompost ? 0x2ecc71 : 0xff5c5c, 160);

        if (isCompost) {
          // update score
          this.score++;
          this.updateScoreText();

          this.tweens.add({
            targets: item,
            y: this.bin.y - 10,
            duration: 120,
            onComplete: () => { item.destroy(); }
          });

          // check win
          if (this.score >= this.targetScore) {
            this.endGame();
            return;
          }
        } else {
          this.tweens.add({
            targets: item,
            x: item.x < this.W / 2 ? item.x - 80 : item.x + 80,
            y: item.y - 40,
            duration: 150,
            onComplete: () => { item.destroy(); }
          });
        }

        this.queueNextOnce();
        return;
      }

      this.resumeStepFall(item);
    });
  }

  updateScoreText() {
    this.scoreText.setText(`Score: ${this.score} / ${this.targetScore}`);
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
      yoyo: true
    });
  }

  // ---------- End Game ----------
  endGame() {
    this.gameOver = true;
    this.tweens.killAll();
    this.time.removeAllEvents();

    if (this.activePiece && this.activePiece.active) {
      this.activePiece.destroy();
      this.activePiece = null;
    }

    this.add.rectangle(this.W / 2, this.H / 2, this.W, this.H, 0x000000, 0.55).setDepth(100);
    this.add.text(this.W / 2, this.H / 2 - 20, 'You Win!', {
      fontSize: '64px',
      fontStyle: 'bold',
      color: '#eaf2e3',
      fontFamily: 'system-ui'
    }).setOrigin(0.5).setDepth(101);
    this.add.text(this.W / 2, this.H / 2 + 40, 'Great sorting! (Click to continue)', {
      fontSize: '24px',
      color: '#cfe7d6',
      fontFamily: 'system-ui'
    }).setOrigin(0.5).setDepth(101);

    this.input.once('pointerdown', () => {
      this.scene.start('Game5', {score: this.score, xCoord: this.W, yCoord: this.H});
    });
  }

  // ---------- Utils ----------
  isOverBin(item) {
    const binBounds = this.bin.getBounds();
    const itemBounds = item.getBounds();
    return Phaser.Geom.Intersects.RectangleToRectangle(itemBounds, binBounds);
  }

  flashCamera(color, duration) {
    const r = (color >> 16) & 255, g = (color >> 8) & 255, b = color & 255;
    this.cameras.main.flash(duration, r, g, b);
  }
}
