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
    this.load.image('recbin', 'assets/recycle_can_open_empty.png');
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
    //Text
    const cx = this.cameras.main.centerX;
    this.message = this.add
            .text(cx, 100, 'Catch the plastic bags! Don\'t let them fall.', {
                font: '26px Arial',
                color: '#111',
                align: 'center',
                wordWrap: { width: this.scale.width - 80 },
            })
            .setOrigin(0.5, 0.5).setDepth(51);

    this.messagePanel = this.add
            .graphics()
            .fillStyle(0xffffff, 1)
            .fillRoundedRect(cx - 375, 75, 750, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(cx - 375, 75, 750, 50)
            .setDepth(50);

    // HUD for global timer and lives
    this.timerText = this.add.text(20, 20, '', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' }).setDepth(51);

    this.timerPanel = this.add
      .graphics()
      .fillStyle(0xf9cb9c, 1)
      .fillRoundedRect(5, 9, 200, 50)
      .lineStyle(4, 0x000000, 1)
      .strokeRoundedRect(5, 9, 200, 50)
      .setDepth(50);

    this.livesText = this.add.text(this.xCoord - 170, 20, '', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' }).setDepth(51);

    this.livesPanel = this.add
      .graphics()
      .fillStyle(0xf9cb9c, 1)
      .fillRoundedRect(this.xCoord - 190, 9, 180, 50)
      .lineStyle(4, 0x000000, 1)
      .strokeRoundedRect(this.xCoord - 190, 9, 180, 50)
      .setDepth(50);

    if (!gs.timerEnabled) {this.timerText.setVisible(false); this.timerPanel.setVisible(false);}
    if (!gs.livesEnabled) {this.livesText.setVisible(false); this.livesPanel.setVisible(false);}

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
    let gameDuration = 15000 / difficulty;

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
      .text(this.xCoord / 2, 20, 'Score: 0', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' })
      .setDepth(51).setOrigin(0.5,0);

    this.scorePanel = this.add
      .graphics()
      .fillStyle(0xf9cb9c, 1)
      .fillRoundedRect(this.xCoord / 2 - 110, 9, 220, 50)
      .lineStyle(4, 0x000000, 1)
      .strokeRoundedRect(this.xCoord / 2 - 110, 9, 220, 50)
      .setDepth(50);
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

  this.add
    .text(this.xCoord / 2, this.yCoord / 2 - 20, 'Score: ' + this.scoreLocal, {
      fontSize: '48px',
      color: '#000000ff',
      fontStyle: 'bold'
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
