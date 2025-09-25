export default class startScreen extends Phaser.Scene {
  constructor() {
    super('startScreen');
  }

  preload() {
    this.load.image('background', 'assets/background.webp');
  }

  create() {
    this.xCoord = this.cameras.main.width;
    this.yCoord = this.cameras.main.height;

    this.background = this.add.image(this.xCoord / 2, this.yCoord / 2, 'background').setOrigin(0.5);
    this.add.text(this.xCoord / 2, this.yCoord / 3, "Welcome!", { fontSize: '156px', fontStyle: 'bold',fill: '#fff' }).setOrigin(0.5);
    const button = this.add.text(this.xCoord / 2, (3 * this.yCoord) / 4, 'Play Game', {
      fontSize: '64px', 
      fill: '#000000ff', 
      backgroundColor: '#aaa2a2ff', 
      padding: {x: 20, y:10}, 
      align: 'center'})
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('Game1', {xCoord: this.xCoord, yCoord: this.yCoord});
      });
  }
}