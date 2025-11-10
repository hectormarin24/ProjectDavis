// game7.js — Catch the recyclables mini game.  Items fall from the top
// and the player must tap on harmful (bad) items to score points and
// avoid letting them hit the ground.  Good items reduce the score.  The
// mini game lasts for a short period that decreases with difficulty.  At
// the end, finishMiniGame() is called with success if the score is
// nonnegative, otherwise failure.  The HUD shows global timer and lives.

export default class catchRec extends Phaser.Scene {
  constructor() {
    super('catchRec');
  }

  preload() {
    this.load.image('bag', 'assets/recycle_bag.png');
    this.load.image('bottle', 'assets/game6assets/bottle.png');
    this.load.image('can', 'assets/tin_can.png');
    this.load.image('paper', 'assets/crumpled_paper.png');
    this.load.image('background', 'assets/background.webp');
  }

  init(data) {
    this.xCoord = data?.xCoord ?? this.cameras.main.width;
    this.yCoord = data?.yCoord ?? this.cameras.main.height;
    this.scoreLocal = 0;
    this.isGameOver = false;
  }

  create() {
    // Background
    this.add.image(0, 0, 'background').setOrigin(0, 0);
    // HUD for global timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.xCoord - 180, 20, '', { fontSize: '28px', fill: '#ffffff' })
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
    // Group for falling items
    this.items = this.physics.add.group();
    // Spawn rate adjusted by difficulty
    const difficulty = window.globalGameState?.difficulty || 1;
    const spawnDelay = 800 / difficulty;
    this.spawnTimer = this.time.addEvent({
      delay: spawnDelay,
      loop: true,
      callback: this.spawnItem,
      callbackScope: this,
    });
    // Mini game duration decreases with difficulty
    const gameDuration = 6000 / difficulty;
    this.miniTimer = this.time.delayedCall(gameDuration, () => {
      if (!this.isGameOver) {
        this.endGame();
      }
    });
    // Score display for this mini game
    this.scoreText = this.add
      .text(20, 60, 'Score: 0', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);
  }

  spawnItem() {
    if (this.isGameOver) return;
    const types = [
      { key: 'bag', bad: true, scale: 0.5 },
      { key: 'bag', bad: true, scale: 0.5 },
      { key: 'bag', bad: true, scale: 0.5 },
      { key: 'bottle', bad: false, scale: 0.1 },
      { key: 'can', bad: false, scale: 0.5 },
      { key: 'paper', bad: false, scale: 0.5 },
    ];
    const data = Phaser.Utils.Array.GetRandom(types);
    const x = Phaser.Math.Between(50, this.xCoord - 50);
    const y = -50;
    const item = this.items
      .create(x, y, data.key)
      .setScale(data.scale)
      .setInteractive({ useHandCursor: true });
    item.setData('bad', data.bad);
    // Fall speed increases with difficulty
    const diff = window.globalGameState?.difficulty || 1;
    const speed = Phaser.Math.Between(100, 200) * diff;
    item.setVelocityY(speed);
    item.on('pointerdown', () => {
      if (this.isGameOver) return;
      if (data.bad) {
        this.scoreLocal += 5;
        this.tweens.add({
          targets: item,
          scale: 0,
          alpha: 0,
          duration: 150,
          onComplete: () => item.destroy(),
        });
      } else {
        this.scoreLocal -= 2;
        this.cameras.main.shake(100, 0.01);
        item.destroy();
      }
      this.scoreText.setText('Score: ' + this.scoreLocal);
    });
  }

  update() {
    if (this.isGameOver) return;
    this.items.getChildren().forEach((item) => {
      if (item.y >= this.yCoord - 10) {
        if (item.getData('bad')) {
          this.scoreLocal -= 3;
          this.scoreText.setText('Score: ' + this.scoreLocal);
        }
        item.destroy();
      }
    });
  }

  endGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.spawnTimer) this.spawnTimer.remove();
    if (this.miniTimer) this.miniTimer.remove();
    this.items.clear(true, true);
    // Determine win or fail based on score
    const won = this.scoreLocal >= 0;
    this.add
      .text(this.xCoord / 2, this.yCoord / 2 - 20, 'Score: ' + this.scoreLocal, {
        fontSize: '48px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    // Show short message before finishing
    this.time.delayedCall(800, () => {
      window.finishMiniGame(won, this);
    });
  }
}