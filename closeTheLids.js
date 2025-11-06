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

        this.scene.start('LeakyFaucet', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});

    });
    this.score = 0;

    

    //House trash cans set
    this.H1X1Can = this.add.sprite(100,675, 'closedTrashCan').setScale(.15).setInteractive();
    this.H1X1Can.on('pointerdown', () => {
            console.log("House 1A Trash Can clicked!");
            if(this.H1X1Can.texture.key === 'openTrashCan')
            {
                this.H1X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H1X2Can = this.add.sprite(200,675, 'closedTrashCan').setScale(.15).setInteractive();
    this.H1X2Can.on('pointerdown', () => {
            console.log("House 1B Trash Can clicked!");
            if(this.H1X2Can.texture.key === 'openTrashCan')
            {
                this.H1X2Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });
    
    this.H2X1Can = this.add.image(425,675, 'closedTrashCan').setScale(.15).setInteractive();
    this.H2X1Can.on('pointerdown', () => {
            console.log("House 2A Trash Can clicked!");
            if(this.H2X1Can.texture.key === 'openTrashCan')
            {
                this.H2X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H2X2Can = this.add.image(550,675, 'closedTrashCan').setScale(.15).setInteractive();
    this.H2X2Can.on('pointerdown', () => {
            console.log("House 2B Trash Can clicked!");
            if(this.H2X2Can.texture.key === 'openTrashCan')
            {
                this.H2X2Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });
    
    this.H3X1Can = this.add.image(800,675 , 'closedTrashCan').setScale(.15).setInteractive();
    this.H3X1Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X1Can.texture.key === 'openTrashCan')
            {
                this.H3X1Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });

    this.H3X2Can = this.add.image(900,675 , 'closedTrashCan').setScale(.15).setInteractive();
    this.H3X2Can.on('pointerdown', () => {
            console.log("House 3 Trash Can clicked!");
            if(this.H3X2Can.texture.key === 'openTrashCan')
            {
                this.H3X2Can.setTexture('closedTrashCan');
                this.checkScore(this.score);
            }
        });


    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            this.wind();
            this.loseCon();
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
            this.H1X2Can.setTexture('openTrashCan');
            break;
        case 3 : 
            this.H2X1Can.setTexture('openTrashCan');
            break;
        case 4 : 
            this.H2X2Can.setTexture('openTrashCan');
            break;
        case 5 : 
            this.H3X1Can.setTexture('openTrashCan');
            break;
        case 6 : 
            this.H3X2Can.setTexture('openTrashCan');
            break;
    }
    
}

loseCon(){
    if(this.H1X1Can.texture.key === 'openTrashCan'  && 
        this.H1X2Can.texture.key === 'openTrashCan' && 
        this.H2X1Can.texture.key === 'openTrashCan' &&
        this.H2X2Can.texture.key === 'openTrashCan' &&
        this.H3X1Can.texture.key === 'openTrashCan' &&
        this.H3X2Can.texture.key === 'openTrashCan' ){
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
    }
}

}