// game10.js — Bathroom sorting game. Items fall toward the toilet; the
// player must let toilet paper fall into the bowl and swipe away other
// objects.

export default class bathroomSort extends Phaser.Scene {

  constructor() {
    super({ key: 'bathroomSort' });
  }

  init(data) {
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
    const gs = window.globalGameState;
    const cx = this.cameras.main.centerX;

    // HUD
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);

    this.livesText = this.add
      .text(this.cameras.main.width - 180, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);

    if (!gs.timerEnabled) this.timerText.setVisible(false);
    if (!gs.livesEnabled) this.livesText.setVisible(false);

    this.time.addEvent({
      delay: 200,
      loop: true,
      callback: () => {
        const state = window.globalGameState;
        const elapsed = this.time.now - state.startTime;
        const timeLeft = Math.max(0, state.totalTime - elapsed);

        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);

        if (gs.timerEnabled)
          this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);

        if (gs.livesEnabled)
          this.livesText.setText(`Lives: ${state.lives}`);

        const timeExpired = gs.timerEnabled && timeLeft <= 0;
        const livesExpired = gs.livesEnabled && state.lives <= 0;

        if (!this.isGameOver && (timeExpired || livesExpired)) {
          this.isGameOver = true;
          window.finishMiniGame(false, this, 0);
        }
      },
    });

    // Background
    const bg = this.add
      .image(0, 0, 'bath_bg')
      .setOrigin(0, 0)
      .setDisplaySize(this.scale.width, this.scale.height);

    // HIGH CONTRAST MODE
    if (gs.highContrast) bg.setTint(0xffffff);

    // Toilet
    this.bowl = this.add.image(cx, this.scale.height - 120, 'toilet')
      .setOrigin(0.5)
      .setScale(1.1);

    // Instructions
    this.message = this.add.text(cx, 50, 'Let toilet paper fall. Swipe other stuff away!\n Use arrow keys or WASD to move around and space to SWIPE AWAY!', {
      font: '26px Arial',
      color: '#111',
      align: 'center',
      wordWrap: { width: this.scale.width - 80 },
    }).setOrigin(0.5);

    this.clears = 0;
    this.mistakes = 0;
    this.targetClears = 8;
    this._activeSprites = new Set();

    // Bowl hit zone
    const bowlW = 560, bowlH = 260;
    this.bowlZone = new Phaser.Geom.Rectangle(
      this.bowl.x - bowlW / 2,
      this.bowl.y - bowlH / 2,
      bowlW,
      bowlH
    );

    // Difficulty + toggles
    const diff = gs.difficulty || 1;

    let spawnDelay = 2500 / diff;
    if (gs.slowMode) spawnDelay *= 1.15; // was 1.8, much gentler now

    this.spawnDelay = spawnDelay;

    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this.spawnFallingItem,
      callbackScope: this,
      loop: true,
    });

    // Difficulty ramp
    this.time.addEvent({
      delay: 10000,
      callback: () => {
        let newDelay = Math.max(600 / diff, this.spawnDelay - 150);
        // no extra slow multiplier here; keep spawn rate reasonable in ADA
        this.spawnDelay = newDelay;

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

  // Spawn timing

        // ================================
        // FIX: Only one item falls at a time
        // ================================
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: () => {
                if (this._activeSprites.size === 0) {
                    this.spawnFallingItem();
                }
            },
            callbackScope: this,
            loop: true,
        });

        this.time.addEvent({
            delay: 10000,
            callback: () => {
                this.spawnDelay = Math.max(600 / diff, this.spawnDelay - 150);
                this.spawnTimer.reset({
                    delay: this.spawnDelay,
                    callback: () => {
                        if (this._activeSprites.size === 0) {
                            this.spawnFallingItem();
                        }
                    },
                    callbackScope: this,
                    loop: true,
                });
            },
            loop: true,
        });

        // ADA Cursor
        this.selector = this.add
            .circle(cx, this.scale.height - 200, 35, 0xffff00, 0.4)
            .setDepth(200);

        this.cursorSpeed = 8;

        this.keys = this.input.keyboard.addKeys({
            up: 'W',
            down: 'S',
            left: 'A',
            right: 'D',
            up2: 'UP',
            down2: 'DOWN',
            left2: 'LEFT',
            right2: 'RIGHT',
            activate: 'SPACE',
            activate2: 'ENTER',
        });
      }
  spawnFallingItem() {
    const gs = window.globalGameState;
    const x = Phaser.Math.Between(100, this.scale.width - 100);

    const isGood = Math.random() < 0.45;
    const key = isGood ? 'tp_good' : Phaser.Utils.Array.GetRandom(['wipes_bad', 'toy_bad', 'trash_bad']);

    const sprite = this.add
      .image(x, -50, key)
      .setOrigin(0.5)
      .setScale(0.4)
      .setInteractive({ draggable: true });

    sprite.isGood = isGood;
    sprite.hasEnded = false;

    // HIGH CONTRAST
    if (gs.highContrast) sprite.setTint(isGood ? 0x00ff00 : 0xff0000);

    let fallDuration = Phaser.Math.Between(4000, 5500) / (gs.difficulty || 1);

    if (gs.slowMode) fallDuration *= 1.25; // was 1.6

    // Falling behavior
    this.tweens.add({
      targets: sprite,
      y: this.scale.height + 100,
      duration: fallDuration,
      ease: 'Linear',
      onUpdate: () => {
        if (!sprite.hasEnded && Phaser.Geom.Rectangle.Contains(this.bowlZone, sprite.x, sprite.y)) {
          this.onItemEnteredBowl(sprite);
        }
      },
      onComplete: () => {
        if (!sprite.hasEnded) this.onItemMissed(sprite);
      },
    });

    // Swipe handling
    this.input.setDraggable(sprite, true);
    this.input.on('drag', (_p, obj, dragX, dragY) => {
      if (obj === sprite && !sprite.hasEnded) {
        obj.x = dragX;
        obj.y = dragY;
      }
    });

    this.input.on('dragend', (_p, obj) => {
      if (obj === sprite && !sprite.hasEnded) {
        const dx = Math.abs(obj.x - this.bowl.x);
        const dy = Math.abs(obj.y - this.bowl.y);
        if (dx > 200 || dy > 200) this.flickAway(obj);
      }
    });

    this._activeSprites.add(sprite);
  }
  
  adaActivateClosestItem() {
        let closest = null;
        let minDist = 9999;

        this._activeSprites.forEach((sprite) => {
            const d = Phaser.Math.Distance.Between(
                this.selector.x,
                this.selector.y,
                sprite.x,
                sprite.y
            );
            if (d < minDist) {
                minDist = d;
                closest = sprite;
            }
        });

        if (!closest || closest.hasEnded) return;

        if (!closest.isGood) {
            this.flickAway(closest);
        }
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
    else this.registerFail('No wipes / toys / trash in toilet.');

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

  registerSuccess(t) {
    this.clears++;
    this.message.setText(`${t}    Cleared: ${this.clears}/${this.targetClears}`);
  }

  registerFail(t) {
    const gs = window.globalGameState;

    if (gs.livesEnabled) this.mistakes++;

    this.message.setText(`${t}    Mistakes: ${this.mistakes}`);
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
    const gs = window.globalGameState || {};
    if (gs.livesEnabled === false) {
      won = true;
    }

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

  update() {
        if (!this.selector || this.isGameOver) return;

        if (this.keys.left.isDown || this.keys.left2.isDown)
            this.selector.x -= this.cursorSpeed;

        if (this.keys.right.isDown || this.keys.right2.isDown)
            this.selector.x += this.cursorSpeed;

        if (this.keys.up.isDown || this.keys.up2.isDown)
            this.selector.y -= this.cursorSpeed;

        if (this.keys.down.isDown || this.keys.down2.isDown)
            this.selector.y += this.cursorSpeed;

        this.selector.x = Phaser.Math.Clamp(this.selector.x, 0, this.xCoord);
        this.selector.y = Phaser.Math.Clamp(this.selector.y, 0, this.yCoord);

        if (
            Phaser.Input.Keyboard.JustDown(this.keys.activate) ||
            Phaser.Input.Keyboard.JustDown(this.keys.activate2)
        ) {
            this.adaActivateClosestItem();
        }
    }
  }



