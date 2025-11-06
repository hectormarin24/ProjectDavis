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
  }

  create() {
    // Reset counts
    this.goodSquashed = 0;
    // Background
    this.background = this.add
      .image(0, 0, 'bg')
      .setOrigin(0, 0)
      .setInteractive();
    this.background.displayWidth = this.sys.game.config.width;
    this.background.displayHeight = this.sys.game.config.height;
    // When the player clicks the background and the game has ended, move to the next scene
    this.background.on('pointerdown', () => {
      // Background no longer advances scenes; finishMiniGame handles progression
    });
    // Create insects
    this.createInsect('butterfly', 400, 300, false);
    this.createInsect('wasp', 600, 500, true);
    this.createInsect('cockroach', 800, 800, true);
    this.createInsect('ladybug', 200, 100, false);
    this.createInsect('fly', 180, 160, true);
    this.createInsect('bee', 750, 150, false);
    this.createInsect('aphid', 100, 600, true);
    this.createInsect('grasshopper', 800, 500, true);
    // HUD for global timer and lives
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
          window.finishMiniGame(false, this);
        }
      },
    });
    this.setDirections();
    this.rulesText = this.add.text(500, 100, "Protect Your Garden, Squash The Unwelcome Bugs", {
                        fontSize: '34px', fill: '#000000ff' }).setOrigin(0.5);
    this.time.delayedCall(2000, () => {
        this.rulesText.destroy();
    });
    this.gameEnded = false;
  }

  createInsect(key, x, y, isGood) {
    // Create a physics-enabled insect that can be clicked.  Good insects
    // should not be squashed; bad insects should be.
    const insect = this.physics.add.image(x, y, key).setInteractive();
    // Scale each insect type differently for visibility
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
    insect.on('pointerdown', () => {
      insect.setVisible(false);
      insect.setActive(false);
      this.checkAnswer(isGood);
    });
    // Store references for later removal
    if (!this.insects) this.insects = [];
    this.insects.push(insect);
    // Keep track of velocity resetting
    insect.setData('typeKey', key);
  }

  setDirections() {
    // Give each insect a random velocity and periodically change it
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
    const speed = base * difficulty;
    insect.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    insect.setAngle(Phaser.Math.RadToDeg(angle));
  }

  checkAnswer(isGood) {
    if (this.isGameOver) return;
    // isGood == true indicates this insect is harmful (needs to be squashed) or friendly?
    // In this mini game, the third parameter passed to createInsect() was
    // 'isGood' where true meant the insect was harmful (foe) and false
    // meant friend.  Squashing a friend should trigger a failure, while
    // squashing foes counts toward victory.
    if (isGood) {
      // Player squashed a foe; increment count
      this.goodSquashed++;
      if (this.goodSquashed >= 5) {
        this.endGame(true);
      }
    } else {
      // Player squashed a friend; immediate failure
      this.endGame(false);
    }
  }

  endGame(won) {
    if (this.isGameOver) return;
    this.isGameOver = true;
    this.gameEnded = true;
    // Stop all insects from moving and destroy them
    this.insects.forEach((insect) => {
      if (insect && insect.destroy) insect.destroy();
    });
    const msg = won ? 'You Win!' : 'You Lost...';
    this.add
      .text(this.xCoord / 2, this.yCoord / 2, msg, {
        fontSize: '84px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      window.finishMiniGame(won, this);
    });
  }
}