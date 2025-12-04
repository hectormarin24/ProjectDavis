// bugFriend.js — A mini game where players decide which insects are friends
// and which are foes.  Upon victory or defeat the next random scene from
// the global queue is started when the player clicks the background.

export default class bugFriend extends Phaser.Scene {

  constructor() {
    super('bugFriend');
  }

  preload() {
    this.load.image('fly', 'assets/flie.png');
    this.load.image('ant', 'assets/ant.png');
    this.load.image('wasp', 'assets/wasp.png');
    this.load.image('bee', 'assets/honeybee.png');
    this.load.image('ladybug', 'assets/ladybug.png');
    this.load.image('cockroach', 'assets/cockroach.png');
    this.load.image('bg', 'assets/flowerfieldbg.png');
    this.load.image('aphid', 'assets/aphid.png');
    this.load.image('grasshopper', 'assets/grasshopper.png');
    this.load.image('butterfly', 'assets/butterfly.png');
  }

  init(data) {
    // Carry over screen size
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.isGameOver = false;
    this.goodSquashed = 0;
    this.score = data.score;
    this.lives = data.lives;
  }

    
  create() {
       const gs = window.globalGameState || {};
        this.goodSquashed = 0;

        // Background
        this.background = this.add
            .image(0, 0, 'bg')
            .setOrigin(0, 0)
            .setInteractive();
        this.background.displayWidth = this.sys.game.config.width;
        this.background.displayHeight = this.sys.game.config.height;
        if (gs.highContrast) {
            this.background.setTint(0xffffff);
        }
        // No scene advance here — finishMiniGame handles progression.

        // Insects
        this.insects = [];
        this.createInsect('butterfly', 400, 300, false);
        this.createInsect('wasp', 600, 500, true);
        this.createInsect('cockroach', 800, 800, true);
        this.createInsect('ladybug', 200, 100, false);
        this.createInsect('fly', 180, 160, true);
        this.createInsect('bee', 750, 150, false);
        this.createInsect('aphid', 100, 600, true);
        this.createInsect('grasshopper', 800, 500, true);

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

        this.setDirections();

        const cx = this.cameras.main.centerX;
        this.message = this.add
            .text(cx, 50, 'Squash all the bad bugs from the garden!\n Use the arrow keys or WASD to move around and space to squash!', {
                font: '26px Arial',
                color: '#111',
                align: 'center',
                wordWrap: { width: this.scale.width - 80 },
            })
            .setOrigin(0.5, 0.5);

        this.gameEnded = false;

        // ==================================================
        // ADA ACCESSIBILITY ADDITIONS (Keyboard Controls)
        // ==================================================

        // 1. Keyboard Selector Cursor
        this.selector = this.add.circle(
            this.xCoord / 2,
            this.yCoord / 2,
            35,
            0xffff00,
            0.35
        ).setDepth(200);

        this.cursorSpeed = 10;

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

        // 2. Outline used to highlight nearest insect
        this.highlight = this.add.circle(0, 0, 55, 0xffff00, 0.15)
            .setDepth(199)
            .setVisible(false);
    }

  createInsect(key, x, y, isGood) {
    const gs = window.globalGameState || {};
    const insect = this.physics.add.image(x, y, key).setInteractive();
    const scales = {
      ant: 0.4,
      wasp: 0.5,
      cockroach: 0.5,
      ladybug: 0.3,
      fly: 0.3,
      bee: 0.3,
      aphid: 0.3,
      grasshopper: 0.7,
    };
    insect.setScale(scales[key] ?? 0.5);
    insect.setCollideWorldBounds(true);

    if (gs.highContrast) {
      if (isGood) {
        insect.setTint(0xff0000);
      } else {
        insect.setTint(0x00ff00);
      }
    }

    insect.on('pointerdown', () => {
      insect.setVisible(false);
      insect.setActive(false);
      this.checkAnswer(isGood);
    });
    if (!this.insects) this.insects = [];
    this.insects.push(insect);
    insect.setData('typeKey', key);
  }

  setDirections() {
    this.insects.forEach((insect) => {
      this.setRandomDirection(insect);
      this.time.addEvent({
        delay: Phaser.Math.Between(2000, 4000),
        callback: () => this.setRandomDirection(insect),
        loop: true,
      });
    });
  }

  setRandomDirection(insect) {
    if (!insect.active) return;
    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
    const base = Phaser.Math.Between(50, 120);
    const difficulty = window.globalGameState?.difficulty || 1;
    let speed = base * difficulty;
    if (window.globalGameState?.slowMode) {
      speed *= 0.7;
    }
    insect.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    insect.setAngle(Phaser.Math.RadToDeg(angle));
  }

  
    // ==================================================
    // ADA — Find nearest insect for keyboard selection
    // ==================================================
    getNearestInsect() {
        let nearest = null;
        let minDist = Infinity;

        for (const insect of this.insects) {
            if (!insect.active) continue;
            const d = Phaser.Math.Distance.Between(
                this.selector.x,
                this.selector.y,
                insect.x,
                insect.y
            );
            if (d < minDist) {
                minDist = d;
                nearest = insect;
            }
        }
        return nearest;
    }

    // ==================================================
    // ADA — Keyboard “click”
    // ==================================================
    keyboardSquash(insect) {
        if (!insect || !insect.active) return;

        insect.setVisible(false);
        insect.setActive(false);
        this.checkAnswer(insect.getData('isGood'));
    }  

  checkAnswer(isGood) {
    if (this.isGameOver) return;
    const gs = window.globalGameState || {};
    if (isGood) {
      this.goodSquashed++;
      if (this.goodSquashed >= 5) {
        this.endGame(true);
      }
    } else {
      this.endGame(false);
    }
  }

  endGame(won) {
    const gs = window.globalGameState || {};
    if (gs.livesEnabled === false) {
      won = true;
    }

    if (this.isGameOver) return;
    this.isGameOver = true;
    this.gameEnded = true;
    if (this.insects) {
      this.insects.forEach((insect) => {
        if (insect && insect.destroy) insect.destroy();
      });
    }
    const msg = won ? 'You Win!' : 'You Lost...';
    this.add
      .text(this.xCoord / 2, this.yCoord / 2, msg, {
        fontSize: '84px',
        fill: '#ffffff',
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

    // ==================================================
    // UPDATE — handle keyboard movement + activation
    // ==================================================
    update() {
        if (this.isGameOver) return;

        // Cursor movement
        if (this.keys.left.isDown || this.keys.left2.isDown)
            this.selector.x -= this.cursorSpeed;

        if (this.keys.right.isDown || this.keys.right2.isDown)
            this.selector.x += this.cursorSpeed;

        if (this.keys.up.isDown || this.keys.up2.isDown)
            this.selector.y -= this.cursorSpeed;

        if (this.keys.down.isDown || this.keys.down2.isDown)
            this.selector.y += this.cursorSpeed;

        // Clamp
        this.selector.x = Phaser.Math.Clamp(this.selector.x, 0, this.xCoord);
        this.selector.y = Phaser.Math.Clamp(this.selector.y, 0, this.yCoord);

        // Highlight nearest insect
        const nearest = this.getNearestInsect();
        if (nearest) {
            this.highlight.setVisible(true);
            this.highlight.x = nearest.x;
            this.highlight.y = nearest.y;
        } else {
            this.highlight.setVisible(false);
        }

        // Keyboard “click” → squash
        if (
            Phaser.Input.Keyboard.JustDown(this.keys.activate) ||
            Phaser.Input.Keyboard.JustDown(this.keys.activate2)
        ) {
            this.keyboardSquash(nearest);
        }
    }

}
