export class Start extends Phaser.Scene {
    constructor() {
        super('Start');
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

    create() {
        this.add.image(640, 400, 'background');
        this.score = 0;
        
        this.add.image(400, 300, 'tin_can');
        // Recycle button
        let recycleButton = this.add.image(640, 650, 'recycle_bin').setInteractive();
        recycleButton.setScale(0.5);
        recycleButton.on('pointerdown', () => {
            console.log("Recycle clicked!");
        });

        // Trash button
        let trashButton = this.add.image(400, 650, 'trash_bin').setInteractive();
        trashButton.setScale(0.5);
        trashButton.on('pointerdown', () => {
            console.log("Trash clicked!");
        });

        // Compost button
        let compostButton = this.add.image(880, 650, 'compost_bin').setInteractive();
        compostButton.setScale(0.5);
        compostButton.on('pointerdown', () => {
            console.log("Compost clicked!");
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
        this.currentObject = this.add.image(640, 200, this.current.key);
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
            this.add.text(640, 360, "You Win!", { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
        } else {
            this.nextObject();
        }
    }
}
