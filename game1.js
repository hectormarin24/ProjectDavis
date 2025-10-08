export default class Game1 extends Phaser.Scene {
  constructor() {
    super('Game1');
  }

    preload() {
        this.load.image('background', 'assets/background.webp');
        //Bins       
        this.load.image('recycle_bin', 'assets/Recycle_can.png');
        this.load.image('trash_bin', 'assets/trash_can.png');
        this.load.image('compost_bin', 'assets/compost_can.png');
        //Objects
        this.load.image('tin_can', "assets/tin_can.png");
        this.load.image('banana_peel', "assets/banana_peel.png");
        this.load.image('battery', "assets/battery.png");
        this.load.image('pileOfLeaves', "assets/pileOfLeaves.png");


        
    }

    init(data){
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
    }

  create() {
        this.background = this.add.image(this.xCoord / 2, this.yCoord / 2, 'background').setOrigin(0.5);
        this.background.on('pointerdown', () => {
            this.scene.start('closeTheLids', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
        });
        this.score = 0;
        
        // Recycle button
        this.recycleButton = this.add.image(this.xCoord / 4, (3 * this.yCoord) / 4, 'recycle_bin').setOrigin(0.5).setInteractive();
        this.recycleButton.setScale(0.5);
        this.recycleButton.on('pointerdown', () => {
            console.log("Recycle clicked!");
            this.checkAnswer('recycle');
        });

        // Trash button
        this.trashButton = this.add.image(this.xCoord / 2, (3 * this.yCoord) / 4, 'trash_bin').setOrigin(0.5).setInteractive();
        this.trashButton.setScale(0.5);
        this.trashButton.on('pointerdown', () => {
            console.log("Trash clicked!");
            this.checkAnswer('trash');
        });

        // Compost button
        this.compostButton = this.add.image((3 * this.xCoord) / 4, (3 * this.yCoord) / 4, 'compost_bin').setOrigin(0.5).setInteractive();
        this.compostButton.setScale(0.5);
        this.compostButton.on('pointerdown', () => {
            console.log("Compost clicked!");
            this.checkAnswer('compost');
        });

        this.nextObject();
    }

  nextObject(){
        if(this.currentObject) this.currentObject.destroy();

        //Pick a random object
        const objects = [
            {key: 'banana_peel', correct: 'compost'},
            {key: 'tin_can', correct: 'recycle'},
            {key: 'battery', correct: 'recycle'},
            {key: 'pileOfLeaves', correct: 'compost'}
        ];

        this.current = Phaser.Utils.Array.GetRandom(objects);
        this.currentObject = this.add.image(this.xCoord / 2, this.yCoord / 3, this.current.key).setOrigin(0.5);
    }

    checkAnswer(bin) {
        if (bin === this.current.correct) {
            this.score++;
            console.log("Correct! Score: " + this.score);
        } else {
            console.log("Wrong!");
        }

        if (this.score >= 5) {
            console.log("You win!");
            this.currentObject.destroy();
            this.add.text(this.xCoord / 2, this.yCoord / 2, "You Win!", { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
            this.recycleButton.disableInteractive().setAlpha(0.5);
            this.trashButton.disableInteractive().setAlpha(0.5);
            this.compostButton.disableInteractive().setAlpha(0.5);
            this.background.setInteractive();
        } else {
            this.nextObject();
        }
    }
}