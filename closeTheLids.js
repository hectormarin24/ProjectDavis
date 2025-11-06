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
  }

  create() {
    // Background
    this.background = this.add
      .image(0, 0, 'neighborhood')
      .setOrigin(0, 0);
    this.background.displayWidth = this.sys.game.config.width;
    this.background.displayHeight = this.sys.game.config.height;

    this.background.on('pointerdown', () => {

        this.scene.start('LeakyFaucet', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});

    });
    this.score = 0;

    

    //House trash cans set
    this.H1X1Can = this.add.sprite(100,675, 'closedTrashCan').setScale(.25).setInteractive();
    this.H1X1Can.on('pointerdown', () => {
            console.log("House 1A Trash Can clicked!");
            if(this.H1X1Can.texture.key === 'openTrashCan')
            {
                this.H1X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H1X2Can = this.add.sprite(200,675, 'closedRecCan').setScale(.25).setInteractive();
    this.H1X2Can.on('pointerdown', () => {
            console.log("House 1B Trash Can clicked!");
            if(this.H1X2Can.texture.key === 'openRecCan')
            {
                this.H1X2Can.setTexture('closedRecCan');
                this.checkScore(this.score);
            }
        });
    
    this.H2X1Can = this.add.image(425,675, 'closedTrashCan').setScale(.25).setInteractive();
    this.H2X1Can.on('pointerdown', () => {
            console.log("House 2A Trash Can clicked!");
            if(this.H2X1Can.texture.key === 'openTrashCan')
            {
                this.H2X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H2X2Can = this.add.image(550,675, 'closedRecCan').setScale(.25).setInteractive();
    this.H2X2Can.on('pointerdown', () => {
            console.log("House 2B Trash Can clicked!");
            if(this.H2X2Can.texture.key === 'openRecCan')
            {
                this.H2X2Can.setTexture('closedRecCan');
                this.checkScore(this.score);
            }
        });
    
    this.H3X1Can = this.add.image(800,675 , 'closedTrashCan').setScale(.25).setInteractive();
    this.H3X1Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X1Can.texture.key === 'openTrashCan')
            {
                this.H3X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H3X2Can = this.add.image(900,675 , 'closedRecCan').setScale(.25).setInteractive();
    this.H3X2Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X2Can.texture.key === 'openRecCan')
            {
                this.H3X2Can.setTexture('closedRecCan');
                this.checkScore(this.score);
            }
        });


    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            this.wind();
            this.loseCon();

    // HUD for timer and lives
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(this.sys.game.config.width - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
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

        }
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
            this.add.text(this.xCoord / 2, this.yCoord / 2, "You Lose!", { fontSize: '64px', fill: '#000000ff' }).setOrigin(0.5);
            this.H1X1Can.disableInteractive().setAlpha(0.5);
            this.H2X1Can.disableInteractive().setAlpha(0.5);
            this.H3X1Can.disableInteractive().setAlpha(0.5);
            this.background.setInteractive();
    }
}

checkScore(score){
    this.score++;
    if(score == 7){
        this.add.text(this.xCoord / 2, this.yCoord / 2, "You Win!", { fontSize: '64px', fill: '#000000ff' }).setOrigin(0.5);
        this.H1X1Can.disableInteractive().setAlpha(0.5);
        this.H2X1Can.disableInteractive().setAlpha(0.5);
        this.H3X1Can.disableInteractive().setAlpha(0.5);
        this.background.setInteractive();

    // Wind timer to open lids periodically; speed increases with difficulty
    const difficulty = window.globalGameState?.difficulty || 1;
    const windDelay = 1500 / difficulty;
    this.windTimer = this.time.addEvent({
      delay: windDelay,
      loop: true,
      callback: this.wind,
      callbackScope: this,
    });
    // Mini game timer: fail if not completed in time
    const gameDelay = 20000 / difficulty;
    this.miniTimer = this.time.delayedCall(gameDelay, () => {
      if (!this.isGameOver) {
        this.failGame();
      }
    });
  }
}

  handleClose() {
    this.localScore++;
    if (this.localScore >= 5) {
      this.winGame();

    }
  }

  winGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
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
      window.finishMiniGame(true, this);
    });
  }

  failGame() {
    if (this.isGameOver) return;
    this.isGameOver = true;
    if (this.windTimer) this.windTimer.remove();
    if (this.miniTimer) this.miniTimer.remove();
    this.add
      .text(this.sys.game.config.width / 2, this.sys.game.config.height / 2, 'Oops!', {
        fontSize: '64px',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.time.delayedCall(800, () => {
      window.finishMiniGame(false, this);
    });
  }
}
