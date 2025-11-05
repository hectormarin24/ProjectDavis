export default class closeTheLids extends Phaser.Scene {
    constructor() {
    super('closeTheLids');
  }

    preload(){
    this.load.image('neighborhood', 'assets/neighborhoodStreetView.jpg');
    this.load.image('closedTrashCan', 'assets/closedTrashCan.png');
    this.load.image('openTrashCan', 'assets/openTrashCan.png');
}


init(data){
    this.score = data.score;
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
}

create() {

    this.background = this.add.image(0, 0, 'neighborhood').setOrigin(0,0);
    this.background.displayWidth = this.sys.game.config.width;
    this.background.displayHeight = this.sys.game.config.height;
    this.background.on('pointerdown', () => {
<<<<<<< Updated upstream
<<<<<<< Updated upstream
        this.scene.start('Game9', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
=======
        this.scene.start('LeakyFaucet', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
>>>>>>> Stashed changes
=======
        this.scene.start('LeakyFaucet', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
>>>>>>> Stashed changes
    });
    this.score = 0;

    //House trash cans set
    this.H1X1Can = this.add.image(100,675, 'closedTrashCan').setScale(.15).setInteractive();
    this.H1X1Can.on('pointerdown', () => {
            console.log("House 1 Trash Can clicked!");
            if(this.H1X1Can.texture.key === 'openTrashCan')
            {
                this.H1X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });
    this.H2X1Can = this.add.image(500,675, 'closedTrashCan').setScale(.15).setInteractive();
    this.H2X1Can.on('pointerdown', () => {
            console.log("House 2 Trash Can clicked!");
            if(this.H2X1Can.texture.key === 'openTrashCan')
            {
                this.H2X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });
    this.H3X1Can = this.add.image(900,675 , 'closedTrashCan').setScale(.15).setInteractive();
    this.H3X1Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X1Can.texture.key === 'openTrashCan')
            {
                this.H3X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });
    
    this.time.addEvent({
        delay: 1500,
        loop: true,
        callback: () => {
            this.wind();
        }
    });
    
}

wind(){
    const max = 3;
    const min = 1;
    let flag = Math.floor(Math.random() * max) + min;
    console.log(flag);
    switch(flag){
        case 1 : 
            this.H1X1Can.setTexture('openTrashCan');
            break;
        case 2 : 
            this.H2X1Can.setTexture('openTrashCan');
            break;
        case 3 : 
            this.H3X1Can.setTexture('openTrashCan');
            break;
    }
    
}

checkScore(score){
    this.score++;
    if(score == 5){
    this.add.text(this.xCoord / 2, this.yCoord / 2, "You Win!", { fontSize: '64px', fill: '#fff' }).setOrigin(0.5);
    this.H1X1Can.disableInteractive().setAlpha(0.5);
    this.H2X1Can.disableInteractive().setAlpha(0.5);
    this.H3X1Can.disableInteractive().setAlpha(0.5);
    this.background.setInteractive();
    }
}

}