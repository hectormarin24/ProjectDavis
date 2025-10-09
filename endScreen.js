export default class endScreen extends Phaser.Scene {
  constructor() {
    super('endScreen');
  }

  preload() {
    this.load.image('background', 'assets/background.webp');
  }

  init(data){
    this.score = data.score;
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
  }

  create() {
    this.background = this.add.image(this.xCoord / 2, this.yCoord / 2, 'background').setOrigin(0.5);
    this.add.text(this.xCoord / 2, this.yCoord / 3, "You Win!", { fontSize: '156px', fontStyle: 'bold',fill: '#fff' }).setOrigin(0.5);
    this.add.text(this.xCoord / 2, this.yCoord / 2, `Score: ${this.score}`, { fontSize: '64px', fontStyle: 'bold', fill: '#fff' }).setOrigin(0.5);

    const button = this.add.text(this.xCoord / 2, (3 * this.yCoord) / 4, 'Menu', {
      fontSize: '64px', 
      fill: '#000000ff', 
      backgroundColor: '#aaa2a2ff', 
      padding: {x: 20, y:10}, 
      align: 'center'})
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.start('startScreen');
      });
  }
}

// expose if using script tags. This allows using consol to jump to the game
if (typeof window !== 'undefined') {
  window.Game9 = Game9;
}