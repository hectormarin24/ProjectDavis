// game10.js — Bathroom sorting game.  Items fall toward the toilet; the
// player must let toilet paper fall into the bowl and swipe away other
// objects.  This version uses the global gameQueue to decide the next
// scene after winning or losing and carries forward the cumulative score.

export default class bathroomSort extends Phaser.Scene {
  constructor() {
    super({ key: 'bathroomSort' });
  }

  init(data) {
    // Carry over screen dimensions.  Score is managed globally.
    this.xCoord = data?.xCoord ?? this.scale.width;
    this.yCoord = data?.yCoord ?? this.scale.height;
    this.isGameOver = false;
    this.score = data.score;
    this.lives = data.lives;
  }

  preload() {
    this.load.image('bath_bg', 'assets/bathroom_bg.png');
    this.load.image('toilet', 'assets/toilet_bowl.png');
    this.load.image('tp_good', 'assets/item_toilet_paper.png');
    this.load.image('wipes_bad', 'assets/item_wipes.png');
    this.load.image('toy_bad', 'assets/item_toy.png');
    this.load.image('trash_bad', 'assets/item_trash.png');
  }

  create() {
    const cx = this.cameras.main.centerX;
    // HUD for timer and lives
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
          window.finishMiniGame(false, this, 0);
        }
      },
    });
    // background
    if (this.textures.exists('bath_bg')) {
      this.add
        .image(0, 0, 'bath_bg')
        .setOrigin(0, 0)
        .setDisplaySize(this.scale.width, this.scale.height);
    } else {
      this.cameras.main.setBackgroundColor(0xbdefff);
    }
    // Enlarged toilet
    this.bowl = this.add.image(cx, this.scale.height - 120, 'toilet').setOrigin(0.5, 0.5).setScale(1.1);
    // instruction text
    this.message = this.add.text(cx, 50, 'Let toilet paper fall. Swipe other stuff away!', {
      font: '26px Arial',
      color: '#111',
      align: 'center',
      wordWrap: { width: this.scale.width - 80 },
    }).setOrigin(0.5, 0.5);
    // scoring
    this.clears = 0;
    this.mistakes = 0;
    this.targetClears = 8;
    this._activeSprites = new Set();
    // toilet hit zone
    const bowlW = 320,
      bowlH = 160;
    this.bowlZone = new Phaser.Geom.Rectangle(
      this.bowl.x - bowlW / 2,
      this.bowl.y - bowlH / 2,
      bowlW,
      bowlH,
    );
    // spawn timing adjusted by difficulty
    const diff = window.globalGameState?.difficulty || 1;
    this.spawnDelay = 2500 / diff;
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this.spawnFallingItem,
      callbackScope: this,
      loop: true,
    });
    // gentle difficulty increase with minimum delay adjusted by difficulty
    this.time.addEvent({
      delay: 10000,
      callback: () => {
        this.spawnDelay = Math.max(600 / diff, this.spawnDelay - 150);
        this.spawnTimer.reset({
          delay: this.spawnDelay,
          callback: this.spawnFallingItem,
          callbackScope: this,
          loop: true,
        });
      },
      callbackScope: this,
      loop: true,
    });
  }

  spawnFallingItem() {
    const x = Phaser.Math.Between(100, this.scale.width - 100);
    const y = -50;
    const isGood = Math.random() < 0.45;
    const key = isGood ? 'tp_good' : Phaser.Utils.Array.GetRandom(['wipes_bad', 'toy_bad', 'trash_bad']);
    const sprite = this.add
      .image(x, y, key)
      .setOrigin(0.5)
      .setScale(0.4)
      .setInteractive({ draggable: true, cursor: 'grab' });
    sprite.isGood = isGood;
    sprite.hasEnded = false;
    // falling tween
    const diff = window.globalGameState?.difficulty || 1;
    this.tweens.add({
      targets: sprite,
      y: this.scale.height + 100,
      duration: Phaser.Math.Between(4000, 5500) / diff,
      ease: 'Linear',
      onUpdate: () => {
        if (sprite.hasEnded) return;
        if (Phaser.Geom.Rectangle.Contains(this.bowlZone, sprite.x, sprite.y)) {
          this.onItemEnteredBowl(sprite);
        }
      },
      onComplete: () => {
        if (!sprite.hasEnded) this.onItemMissed(sprite);
      },
    });
    // swipe logic
    this.input.setDraggable(sprite, true);
    this.input.on('drag', (_pointer, obj, dragX, dragY) => {
      if (obj === sprite && !sprite.hasEnded) {
        obj.x = dragX;
        obj.y = dragY;
      }
    });
    this.input.on('dragend', (_pointer, obj) => {
      if (obj === sprite && !sprite.hasEnded) {
        const dx = Math.abs(obj.x - this.bowl.x);
        const dy = Math.abs(obj.y - this.bowl.y);
        if (dx > 200 || dy > 200) this.flickAway(obj);
      }
    });
    this._activeSprites.add(sprite);
  }

  flickAway(obj) {
    obj.hasEnded = true;
    this.tweens.add({
      targets: obj,
      x: obj.x + Phaser.Math.Between(-400, 400),
      y: obj.y - Phaser.Math.Between(180, 260),
      alpha: 0,
      angle: Phaser.Math.Between(-35, 35),
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        if (obj.isGood) this.registerFail('That belongs in the toilet!');
        else this.registerSuccess('Nice swipe!');
        obj.destroy();
        this._activeSprites.delete(obj);
        this.checkEnd();
      },
    });
  }

  onItemEnteredBowl(obj) {
    if (obj.hasEnded) return;
    obj.hasEnded = true;
    if (obj.isGood) this.registerSuccess('Correct: TP goes in.');
    else this.registerFail('No wipes / toys / trash in toilet!');
    this.tweens.add({
      targets: obj,
      scaleX: 0.5,
      scaleY: 0.5,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        obj.destroy();
        this._activeSprites.delete(obj);
        this.checkEnd();
      },
    });
  }

  onItemMissed(obj) {
    if (obj.hasEnded) return;
    obj.hasEnded = true;
    if (obj.isGood) this.registerFail('TP should go in the toilet.');
    else this.registerSuccess('Dodged it!');
    obj.destroy();
    this._activeSprites.delete(obj);
    this.checkEnd();
  }

  registerSuccess(text) {
    this.clears++;
    this.message.setText(text + `   Cleared: ${this.clears}/${this.targetClears}`);
  }

  registerFail(text) {
    this.mistakes++;
    this.message.setText(text + `   Mistakes: ${this.mistakes}`);
  }

  checkEnd() {
    if (this.isGameOver) return;
    if (this.clears >= this.targetClears) {
      this.isGameOver = true;
      this.endGame(true);
    } else if (this.mistakes >= 3) {
      this.isGameOver = true;
      this.endGame(false);
    }
  }

  endGame(won) {
    this.time.removeAllEvents();
    this.input.enabled = false;
    if (this._activeSprites) {
      this._activeSprites.forEach((s) => s.destroy());
      this._activeSprites.clear();
    }
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;
    this.add
      .text(cx, cy - 40, won ? 'Great job!' : 'Try again!', {
        font: '52px Arial',
        fill: '#fff',
      })
      .setOrigin(0.5);
    // After a short delay, call finishMiniGame to update global state.
    this.time.delayedCall(800, () => {
      this.scene.start('transitionScreen', {
        lives: this.lives,
        score: this.score,
        xCoord: this.xCoord,
        yCoord: this.yCoord,
        won: won,
        elapsedTime: this.time.now
      });
    });
  }
}