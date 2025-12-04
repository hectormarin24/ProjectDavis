// closeTheLids.js — mini game where the player must shut trash can lids
// opened by the wind.  This version uses the global timer, lives and
// difficulty settings.  The player wins by closing five lids before the
// mini game timer runs out.  Closing the wrong lid (already closed) or
// letting time expire counts as a failure.  When the mini game ends,
// finishMiniGame() is invoked to update global state and advance to the
// next random game.

export default class closeTheLids extends Phaser.Scene {
  constructor() {
    super('closeTheLids');
  }

  preload() {
    this.load.image('neighborhood', 'assets/neighborhoodStreetView.jpg');
    this.load.image('closedTrashCan', 'assets/trash_can.png');
    this.load.image('openTrashCan', 'assets/trash_can_open.png');
    this.load.image('closedRecCan', 'assets/Recycle_can.png');
    this.load.image('openRecCan', 'assets/recycle_can_open.png');
  }

  init(data) {
    // Dimensions from previous scene
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.isGameOver = false;
    this.localScore = 0;
    this.finalScore = data.score;
    this.lives = data.lives;
  }

  create() {
    const gs = window.globalGameState;

    // Background
    this.background = this.add
      .image(0, 0, 'neighborhood')
      .setOrigin(0, 0);
    this.background.displayWidth = this.sys.game.config.width;
    this.background.displayHeight = this.sys.game.config.height;
    this.score = 0;

    if (gs.highContrast) {
      this.background.setTint(0xffffff);
    }

    //House trash cans set
    this.H1X1Can = this.add.sprite(100,675, 'closedTrashCan').setScale(.25).setInteractive();
    if (gs.highContrast) this.H1X1Can.setTint(0xff0000);
    this.H1X1Can.on('pointerdown', () => {
            console.log("House 1A Trash Can clicked!");
            if(this.H1X1Can.texture.key === 'openTrashCan')
            {
                this.H1X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H1X2Can = this.add.sprite(200,675, 'closedRecCan').setScale(.25).setInteractive();
    if (gs.highContrast) this.H1X2Can.setTint(0x00ff00);
    this.H1X2Can.on('pointerdown', () => {
            console.log("House 1B Trash Can clicked!");
            if(this.H1X2Can.texture.key === 'openRecCan')
            {
                this.H1X2Can.setTexture('closedRecCan');
                this.checkScore(this.score);
            }
        });
    
    this.H2X1Can = this.add.image(425,675, 'closedTrashCan').setScale(.25).setInteractive();
    if (gs.highContrast) this.H2X1Can.setTint(0xff0000);
    this.H2X1Can.on('pointerdown', () => {
            console.log("House 2A Trash Can clicked!");
            if(this.H2X1Can.texture.key === 'openTrashCan')
            {
                this.H2X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H2X2Can = this.add.image(550,675, 'closedRecCan').setScale(.25).setInteractive();
    if (gs.highContrast) this.H2X2Can.setTint(0x00ff00);
    this.H2X2Can.on('pointerdown', () => {
            console.log("House 2B Trash Can clicked!");
            if(this.H2X2Can.texture.key === 'openRecCan')
            {
                this.H2X2Can.setTexture('closedRecCan');
                this.checkScore(this.score);
            }
        });
    
    this.H3X1Can = this.add.image(800,675 , 'closedTrashCan').setScale(.25).setInteractive();
    if (gs.highContrast) this.H3X1Can.setTint(0xff0000);
    this.H3X1Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X1Can.texture.key === 'openTrashCan')
            {
                this.H3X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H3X2Can = this.add.image(900,675 , 'closedRecCan').setScale(.25).setInteractive();
    if (gs.highContrast) this.H3X2Can.setTint(0x00ff00);
    this.H3X2Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X2Can.texture.key === 'openRecCan')
            {
                this.H3X2Can.setTexture('closedRecCan');
                this.checkScore(this.score);
            }
        });

    const difficulty = gs?.difficulty || 1;
    let windLoopDelay = 1000 / difficulty;
    if (gs.slowMode) windLoopDelay *= 1.5;

    this.time.addEvent({
        delay: windLoopDelay,
        loop: true,
        callback: () => {
            this.wind();
            this.loseCon();
  }})

    // HUD for timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.sys.game.config.width - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
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

        const livesExpired = gs.livesEnabled && state.lives <= 0;

        if (!this.isGameOver && livesExpired) {
          this.isGameOver = true;
          window.finishMiniGame(false, this, 0);
        }
      },
    });

    this.rulesText = this.add.text(500, 200, "Don't Let All The Lids Open!", {
                        fontSize: '38px', fill: '#000000ff' }).setOrigin(0.5);
    this.time.delayedCall(2000, () => {
        this.rulesText.destroy();
    });
    
    
    
}

wind(){
    const max = 6;
    const min = 1;
    let flag = Math.floor(Math.random() * max) + min;
    console.log(flag);
    switch(flag){
        case 1 : 
            this.H1X1Can.setTexture('openTrashCan');
            break;
        case 2 : 
            this.H1X2Can.setTexture('openRecCan');
            break;
        case 3 : 
            this.H2X1Can.setTexture('openTrashCan');
            break;
        case 4 : 
            this.H2X2Can.setTexture('openRecCan');
            break;
        case 5 : 
            this.H3X1Can.setTexture('openTrashCan');
            break;
        case 6 : 
            this.H3X2Can.setTexture('openRecCan');
            break;
    }
    
}

loseCon(){
    if(this.H1X1Can.texture.key === 'openTrashCan'  && 
        this.H1X2Can.texture.key === 'openRecCan' && 
        this.H2X1Can.texture.key === 'openTrashCan' &&
        this.H2X2Can.texture.key === 'openRecCan' &&
        this.H3X1Can.texture.key === 'openTrashCan' &&
        this.H3X2Can.texture.key === 'openRecCan' ){
            this.H1X1Can.disableInteractive().setAlpha(0.5);
            this.H2X1Can.disableInteractive().setAlpha(0.5);
            this.H3X1Can.disableInteractive().setAlpha(0.5);
            this.failGame();
    }
}

checkScore(score){
    this.score++;
    if(score == 7){
        this.H1X1Can.disableInteractive().setAlpha(0.5);
        this.H2X1Can.disableInteractive().setAlpha(0.5);
        this.H3X1Can.disableInteractive().setAlpha(0.5);
        this.winGame();
    }

    // Wind timer to open lids periodically; speed increases with difficulty
    const gs = window.globalGameState;
    const difficulty = gs?.difficulty || 1;
    let windDelay = 1500 / difficulty;
    if (gs.slowMode) windDelay *= 1.5;

    this.windTimer = this.time.addEvent({
      delay: windDelay,
      loop: true,
      callback: this.wind,
      callbackScope: this,
    });
    // Mini game timer: fail if not completed in time
    let gameDelay = 20000 / difficulty;
    if (gs.slowMode) gameDelay *= 1.5;

    if (gs.timerEnabled) {
      this.miniTimer = this.time.delayedCall(gameDelay, () => {
        if (!this.isGameOver) {
          this.failGame();
        }
      });
    }
  }


  winGame() {
    // Stop timers
    if (this.windTimer) this.windTimer.remove();
    if (this.miniTimer) this.miniTimer.remove();
    // Display message
    this.add
      .text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Nice job!', {
        fontSize: '64px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      this.scene.start('transitionScreen', {
        lives: this.lives,
        score: this.finalScore,
        xCoord: this.xCoord,
        yCoord: this.yCoord,
        won: true,
        elapsedTime: this.time.now
      });
    });
  }

failGame() {
  const gs = window.globalGameState || {};
  if (gs.livesEnabled === false) {
    this.winGame();
    return;
  }

  if (this.windTimer) this.windTimer.remove();
  if (this.miniTimer) this.miniTimer.remove();
  this.add
    .text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Oops!', {
      fontSize: '64px',
      fill: '#ffffff',
    })
    .setOrigin(0.5);
  this.time.delayedCall(800, () => {
    this.scene.start('transitionScreen', {
      lives: this.lives,
      score: this.finalScore,
      xCoord: this.xCoord,
      yCoord: this.yCoord,
      won: false,
      elapsedTime: this.time.now
    });
  });
}

}
