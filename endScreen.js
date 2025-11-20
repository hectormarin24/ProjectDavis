// endScreen.js — Display final score and allow the player to return to the
// menu.  This screen is shown after all mini games have been played.

export default class endScreen extends Phaser.Scene {
  constructor() {
    super('endScreen');
  }

  preload() {
    this.load.image('background', 'assets/background.webp');
  }

  init(data) {
    this.score = data?.score ?? 0;
    // Width and height may not always be passed.  Copy from data if
    // available; otherwise fall back to camera dimensions in create().
    this.xCoord = data?.xCoord;
    this.yCoord = data?.yCoord;
  }

  create() {
    // Use stored dimensions if present; otherwise use camera dimensions
    const w = this.xCoord || this.cameras.main.width;
    const h = this.yCoord || this.cameras.main.height;
    // Background fills the screen if the texture exists.  Fallback to
    // plain colour if missing.
    if (this.textures.exists('background')) {
      this.background = this.add
        .image(w / 2, h / 2, 'background')
        .setOrigin(0.5)
        .setDisplaySize(w, h);
    } else {
      this.cameras.main.setBackgroundColor(0x111111);
    }
    // Title and score text
    this.add
      .text(this.xCoord / 2 , this.yCoord / 4, 'Game Over', {
        fontSize: '96px',
        fontStyle: 'bold',
        fill: '#000',
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.add
        .graphics()
        .fillStyle(0xf9cb9c, 1)
        .fillRoundedRect(this.xCoord / 2 - 275, this.yCoord / 4 - 75, 550, 150, 20)
        .lineStyle(4, 0x000000, 1)
        .strokeRoundedRect(this.xCoord / 2 - 275, this.yCoord / 4 - 75, 550, 150, 20);

    this.add
      .text(this.xCoord / 2, this.yCoord / 2, `Score: ${this.score}`, {
        fontSize: '64px',
        fontStyle: 'bold',
        fill: '#000',
      })
      .setOrigin(0.5)
      .setDepth(100);

      this.add
        .graphics()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(this.xCoord / 2 - 225, this.yCoord / 2 - 40, 450, 80, 20)
        .lineStyle(4, 0x000000, 1)
        .strokeRoundedRect(this.xCoord / 2 - 225, this.yCoord / 2 - 40, 450, 80, 20);

      this.menuButton = this.add
        .text(this.xCoord / 2, this.yCoord / 2 + 300, 'Main Menu', {
            fontSize: '36px', 
            color: '#000', 
            stroke: '#000',
            strokeThickness: 2
        })
        .setOrigin(0.5)
        .setDepth(100)
        .setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.menuButton.setScale(1.1))
        .on('pointerout', () => this.menuButton.setScale(1))
        .on('pointerdown', () => {
            this.scene.start('startScreen');
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            this.scene.start('startScreen');
        });

        this.add
        .graphics()
        .fillStyle(0xc3c3c3, 1)
        .fillRoundedRect(this.xCoord / 2 - 125, this.yCoord / 2 + 260, 250, 80, 20)
        .lineStyle(4, 0x000000, 1)
        .strokeRoundedRect(this.xCoord / 2 - 125, this.yCoord / 2 + 260, 250, 80, 20)
  }
}