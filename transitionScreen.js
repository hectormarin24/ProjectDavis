export default class tranistionScreen extends Phaser.Scene {
  constructor() {
    super('transitionScreen');
  }

  preload() {
    this.load.image('background', 'assets/background.webp');
    this.load.image('heart', 'assets/heart.png')
  }

  init(data) {
    this.xCoord = data?.xCoord ?? this.cameras.main.width;
    this.yCoord = data?.yCoord ?? this.cameras.main.height;
    this.score = data.score;
    this.lives = data.lives;
    this.won = data.won;
    this.elapsedTime = data.elapsedTime;
    }

    create() {
        this.add.image(0, 0, 'background').setOrigin(0, 0);

        this.scoreText = this.add
        .text(this.xCoord / 2 , this.yCoord / 4, 'Score: ' + this.score, { 
            fontSize: '60px', 
            color: '#000', 
            stroke: '#000',
            strokeThickness: 4
        })
        .setOrigin(0.5)
        .setDepth(100);

        this.scoreBg = this.add
        .graphics()
        .fillStyle(0xf9cb9c, 1)
        .fillRoundedRect(this.xCoord / 2 - 275, this.yCoord / 4 - 75, 550, 150, 20)
        .lineStyle(4, 0x000000, 1)
        .strokeRoundedRect(this.xCoord / 2 - 275, this.yCoord / 4 - 75, 550, 150, 20);

        this.livesText = this.add
        .text(this.xCoord / 2, this.yCoord / 2, 'Lives: ' + this.lives, { 
            fontSize: '48px', 
            color: '#000', 
            stroke: '#000',
            strokeThickness: 3
        })
        .setOrigin(0.5)
        .setDepth(100);

        this.livesBg = this.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(this.xCoord / 2 - 150, this.yCoord / 2 - 75, 300, 300, 20)
        .lineStyle(4, 0x000000, 1)
        .strokeRoundedRect(this.xCoord / 2 - 150, this.yCoord / 2 - 75, 300, 300, 20);

        this.nextButton = this.add
        .text(this.xCoord / 2, this.yCoord / 2 + 300, 'Next Game', { 
            fontSize: '36px', 
            color: '#000', 
            stroke: '#000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(100)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.nextButton.setScale(1.1))
        .on('pointerout', () => this.nextButton.setScale(1))
        .on('pointerdown', () => {
            this.pausedTime = this.time.now - this.elapsedTime;
            window.finishMiniGame(this.won, this, this.pausedTime);
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.pausedTime = this.time.now - this.elapsedTime;
            window.finishMiniGame(this.won, this, this.pausedTime);
        });

        this.nextButtonBg = this.add
        .graphics()
        .fillStyle(0xc3c3c3, 1)
        .fillRoundedRect(this.xCoord / 2 - 125, this.yCoord / 2 + 260, 250, 80, 20)
        .lineStyle(4, 0x000000, 1)
        .strokeRoundedRect(this.xCoord / 2 - 125, this.yCoord / 2 + 260, 250, 80, 20)

        this.tempScoreText = this.add
        .text(this.xCoord / 2 + 125, this.yCoord / 4 - 45, '', {
            font: '32px',
            color: '#000',
            stroke: '#000',
            strokeThickness: 3
        })
        .setDepth(100)
        .setOrigin(0.5);

        this.tempLivesText = this.add
        .text(this.xCoord / 2 + 90, this.yCoord / 2 - 40, '', {
            font: '28px',
            color: '#000',
            stroke: '#000',
            strokeThickness: 2
        })
        .setDepth(100)
        .setOrigin(0.5);

        this.heart1 = this.add
        .image(this.xCoord / 2 - 100, this.yCoord / 2 + 120, 'heart')
        .setScale(0.12)
        .setOrigin(0.5);
        this.heart2 = this.add
        .image(this.xCoord / 2, this.yCoord / 2 + 120, 'heart')
        .setScale(0.12)
        .setOrigin(0.5);
        this.heart3 = this.add
        .image(this.xCoord / 2  + 100, this.yCoord / 2 + 120, 'heart')
        .setScale(0.12)
        .setOrigin(0.5);

        this.setLivesTint(this.lives);

        if(this.won) {
            this.tempScoreText.setText('+ 100');
            this.time.delayedCall(1200, () => {
                this.tweens.add({
                    targets: this.tempScoreText,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power1',
                    onComplete: () => {
                        this.tempScoreText.destroy();
                    }
                });
            });

            this.i = 0;

            const increaseScore = this.time.addEvent({
                delay: 25,
                loop: true,
                callback: () => {
                    this.i++;
                    this.scoreText.setText('Score: ' + (this.score += 1));
                    if(this.i >= 100) {
                        increaseScore.remove();
                    }
                }
            });
        } else {
            this.tempLivesText.setText('- 1');
            this.time.delayedCall(800, () => {
                this.tweens.add({
                    targets: this.tempLivesText,
                    alpha: 0,
                    duration: 400,
                    ease: 'Power1',
                    onComplete: () => {
                        this.tempLivesText.destroy();
                        this.livesText.setText('Lives: ' + (this.lives - 1));
                        this.setLivesTint(this.lives - 1);
                    }
                });
            });
        }
    }

    setLivesTint(lives) {
        switch(lives) {
            case 2:
                this.heart3.setTint(0x888888);
                break;
            case 1:
                this.heart3.setTint(0x888888);
                this.heart2.setTint(0x888888);
                break;
            case 0:
                this.heart3.setTint(0x888888);
                this.heart2.setTint(0x888888);
                this.heart1.setTint(0x888888);
                this.nextButton.setText('Game Over');
                break;
        }
    }
}