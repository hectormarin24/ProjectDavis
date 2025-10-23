export default class startScreen extends Phaser.Scene {
  constructor() {
    super('startScreen');
  }

  preload() {
    this.load.image('background', 'assets/Davis streets-fotor-ai-art-effects-20250918131614.png');
    this.load.image('btnPlay', 'assets/play.png');
    this.load.image('btnTrophy', 'assets/prize.png');
    this.load.image('btnSettings', 'assets/setting.png');
    this.load.spritesheet('frog', 'assets/frog_idle_sheet_horizontal.png', {
      frameWidth: 64,
      frameHeight: 64
    });
  }

  create() {
    this.xCoord = this.cameras.main.width;
    this.yCoord = this.cameras.main.height;
    console.log("main screen loaded");
    this.background = this.add.image(this.xCoord / 3 + 20, this.yCoord / 2, 'background').setOrigin(0.5);
    this.add.text(this.xCoord / 2, this.yCoord / 3, "Welcome!", { fontSize: '156px', fontStyle: 'bold',fill: '#fff' }).setOrigin(0.5);

      // --- Define the idle animation ---
    this.anims.create({
      key: 'frog-idle',
      frames: this.anims.generateFrameNumbers('frog', { start: 0, end: 3 }),
      frameRate: 6,
      repeat: -1
    });

      // --- Sprite and play the animation ---
    const frog = this.add.sprite(150, 660, 'frog'); 
    frog.setScale(4);
    frog.setDepth(1);
    frog.play('frog-idle');// start the idle loop

      // --- Play Button ---
    const playBtn = this.add.image(this.xCoord / 2, (3 * this.yCoord) / 3.6, 'btnPlay')
      .setDepth(10)
      .setScale(0.2)
      .setScrollFactor(0) 
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => playBtn.setScale(0.23)) // hover = a bit bigger
      .on('pointerout',  () => playBtn.setScale(0.2))  // leave = back to base
      .on('pointerdown', () => {
        this.scene.start('recycle', {xCoord: this.xCoord, yCoord: this.yCoord});
      });
      // --- Shop Button ---
    const trophyBtn = this.add.image(this.xCoord / 2.7, (3 * this.yCoord) / 3.6, 'btnTrophy')
      .setDepth(10)
      .setScale(0.25)
      .setScrollFactor(0) 
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => trophyBtn.setScale(0.28)) // hover = a bit bigger
      .on('pointerout',  () => trophyBtn.setScale(0.25))  // leave = back to base
    /*  .on('pointerdown', () => {
        this.scene.start('Game1', {xCoord: this.xCoord, yCoord: this.yCoord});
      });  
    */

      // --- Settings Button ---
    const settingsBtn = this.add.image(this.xCoord / 1.6, (3 * this.yCoord) / 3.6, 'btnSettings')
      .setDepth(10)
      .setScale(0.25)
      .setScrollFactor(0) 
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => settingsBtn.setScale(0.28)) // hover = a bit bigger
      .on('pointerout',  () => settingsBtn.setScale(0.25))  // leave = back to base
    /*  .on('pointerdown', () => {
        this.scene.start('Game1', {xCoord: this.xCoord, yCoord: this.yCoord});
      });  
    */
    }
  }
