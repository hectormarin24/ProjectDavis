export default class Game5 extends Phaser.Scene {
  constructor() {
    super('Game5');
  }

  preload() {
    this.load.image('bigBox', 'assets/Big Box.png');
    this.load.image('mediumBox', 'assets/Medium Box.png');  
    this.load.image('smallBox', 'assets/Small Box.png');
    this.load.image('flatBox', 'assets/flatBox.png');
  }

  init(data){
    this.score = 0;
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
  }

  create() {
    this.background = this.add.image(this.xCoord / 3 + 20, this.yCoord / 2, 'background').setOrigin(0.5);
    this.background.on('pointerdown', () => {
      this.scene.start('endScreen', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
    });

    this.clickCount = 0;
    this.nextObject();
  }

  nextObject(){
    if(this.current) this.current.destroy();

    const images = [
      {key: 'smallBox', scale: 0.5, clicks: 1},
      {key: 'mediumBox', scale: 1, clicks: 2},
      {key: 'bigBox', scale: 1.5, clicks: 3}
    ];
    const randomImage = Phaser.Utils.Array.GetRandom(images);
    const imageX = Phaser.Math.Between(100, 800);
    const imageY = Phaser.Math.Between(100, 600);

    this.current = this.add.image(imageX, imageY, randomImage.key).setScale(randomImage.scale).setInteractive();
    this.current.on('pointerdown', () => {
      if(randomImage.clicks == this.clickCount + 1) {
        this.add.image(imageX, imageY, 'flatBox').setScale(randomImage.scale / 3);
        this.score++;
        if(this.score == 5){
          this.scene.start('Game10', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
        } else {
          this.nextObject();
          this.clickCount = 0;
        }
      } else {
        this.clickCount++;
      }
    });
  }
}
