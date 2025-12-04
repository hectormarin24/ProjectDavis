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
    this.load.image('rbag', 'assets/recycle_bag.png');
    this.load.image('bottle', 'assets/game6assets/bottle.png');
    this.load.image('can', 'assets/tin_can.png');
    this.load.image('paper', 'assets/crumpled_paper.png');
    this.load.image('background', 'assets/background.webp');
  }

  init(data) {
    this.xCoord = data?.xCoord ?? this.cameras.main.width;
    this.yCoord = data?.yCoord ?? this.cameras.main.height;
    this.score = data.score;
    this.lives = data.lives;
    this.scoreLocal = 0;
    this.isGameOver = false;
  }

  create() {
    const gs = window.globalGameState;

    // Background
    const bg = this.add.image(0, 0, 'background').setOrigin(0, 0);

    // High contrast mode
    if (gs.highContrast) {
      bg.setTint(0xffffff);
    }

    // HUD for global timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);

    this.livesText = this.add
      .text(this.xCoord - 180, 20, '', { fontSize: '28px', fill: '#ffffff' })
      .setDepth(100);

    // TIMER TOGGLE
    if (!gs.timerEnabled) {
      this.timerText.setVisible(false);
    }

    // LIVES TOGGLE
    if (!gs.livesEnabled) {
      this.livesText.setVisible(false);
    }

    // GLOBAL TIMER (respects timerEnabled, but not if slow mode accesibility option was checked in menu)
this.time.addEvent({
  delay: 200,
  loop: true,
  callback: () => {
    const state = window.globalGameState;
    const elapsed = this.time.now - state.startTime;
    const timeLeft = Math.max(0, state.totalTime - elapsed);

    const minutes = Math.floor(timeLeft / 60000);
    const seconds = Math.floor((timeLeft % 60000) / 1000);

    if (gs.timerEnabled) {
      this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
    }

    if (gs.livesEnabled) {
      this.livesText.setText(`Lives: ${state.lives}`);
    }

    const livesExpired = gs.livesEnabled && state.lives <= 0;

    if (!this.isGameOver && livesExpired) {
      this.isGameOver = true;
      window.finishMiniGame(false, this, 0);
    }
  },
});


    // Group for falling items
    this.items = this.physics.add.group();

    // Difficulty
    const difficulty = gs.difficulty || 1;

    // SLOW MODE modifies spawn rate & game duration
    let spawnDelay = 800 / difficulty;
    let gameDuration = 6000 / difficulty;

    if (gs.slowMode) {
      spawnDelay *= 1.8;
      gameDuration *= 1.8;
    }

    // Spawn timer
    this.spawnTimer = this.time.addEvent({
      delay: spawnDelay,
      loop: true,
      callback: this.spawnItem,
      callbackScope: this,
    });

    // Minigame end timer
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

    const gs = window.globalGameState;

    const types = [
      { key: 'rbag', bad: true, scale: 0.5 },
      { key: 'rbag', bad: true, scale: 0.5 },
      { key: 'bottle', bad: false, scale: 0.1 },
      { key: 'can', bad: false, scale: 0.5 },
      { key: 'paper', bad: false, scale: 0.5 },
    ];

    const data = Phaser.Utils.Array.GetRandom(types);
    const x = Phaser.Math.Between(50, this.xCoord - 50);
    const item = this.items
      .create(x, -50, data.key)
      .setScale(data.scale)
      .setInteractive({ useHandCursor: true });

    item.setData('bad', data.bad);

    const diff = gs.difficulty || 1;

    // BASE speed
    let speed = Phaser.Math.Between(100, 200) * diff;

    // SLOW MODE modifies fall speed
    if (gs.slowMode) {
      speed *= 0.4;
    }

    // HIGH CONTRAST tint
    if (gs.highContrast) {
      item.setTint(data.bad ? 0xff0000 : 0x00ff00);
    }

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

  const gs = window.globalGameState || {};
  let won = this.scoreLocal >= 0;
  if (gs.livesEnabled === false) {
    won = true;
  }

  this.add
    .text(this.xCoord / 2, this.yCoord / 2 - 20, 'Score: ' + this.scoreLocal, {
      fontSize: '48px',
      color: '#ffffff',
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

}
