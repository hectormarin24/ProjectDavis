export default class Game7 extends Phaser.Scene {
    constructor() {
        super('Game7');
    }

    preload() {
        this.load.image('bag', 'assets/recycle_bag.png');
        this.load.image('bottle', 'assets/game6assets/bottle.png');
        this.load.image('can', 'assets/tin_can.png');
        this.load.image('paper', 'assets/crumpled_paper.png');
    }

    init(data){
        this.score = 0;
        this.xCoord = this.cameras.main.width;
        this.yCoord = this.cameras.main.height;
        this.timeLeft = 5;
    }

    create() {
        this.background = this.add.image(0, 0, 'background').setOrigin(0,0);

        this.scoreText = this.add.text(20, 20, 'Score: 0', { fontSize: '36px', color: '#000', fontStyle: 'bold'});
        this.timerText = this.add.text(20, 70, 'Time: ' + this.timeLeft, { fontSize: '36px', color: '#000', fontStyle: 'bold'});

        this.items = this.physics.add.group();

        this.spawnTimer = this.time.addEvent({
            delay: 800,
            callback: this.spawnItem,
            callbackScope: this,
            loop: true
        });

        this.timer = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.timeLeft--;
                this.timerText.setText('Time: ' + this.timeLeft);
                if (this.timeLeft <= 0) {
                    this.gameOver();
                }
            },
            loop: true
        });
    }

    spawnItem() {
        const types = [
            { key: 'bag', bad: true, scale: 0.5},
            { key: 'bag', bad: true, scale: 0.5},
            { key: 'bag', bad: true, scale: 0.5},
            { key: 'bottle', bad: false, scale: 0.1},
            { key: 'can', bad: false, scale: 0.5},
            { key: 'paper', bad: false, scale: 0.5}
        ];

        const data = Phaser.Utils.Array.GetRandom(types);
        const item = this.items.create(Phaser.Math.Between(50, 750), -50, data.key).setScale(data.scale);
        item.setData('bad', data.bad);
        item.setInteractive();
        item.setVelocityY(Phaser.Math.Between(100, 200));

        item.on('pointerdown', () => {
            if (data.bad) {
                this.score += 5;
                this.tweens.add({
                    targets: item,
                    scale: 0,
                    alpha: 0,
                    duration: 150,
                    onComplete: () => item.destroy()
                });
            } else {
                this.score -= 2;
                this.cameras.main.shake(100, 0.01);
                item.destroy()
            }

            this.scoreText.setText('Score: ' + this.score);
        });
    }

    update(){
        if (this.timeLeft <= 0) return;

        this.items.getChildren().forEach(item => {
        if (item.y >= this.yCoord - 10) {
            if (item.getData('bad')) {
                this.score -= 3;
                this.scoreText.setText('Score: ' + this.score);
            }
            item.destroy();
        }
        });
    }

    gameOver() {
        if (this.spawnTimer) this.spawnTimer.remove();
        if (this.timer) this.timer.remove();
        this.scoreText.destroy();
        this.timerText.destroy();
        this.items.clear(true, true);

        this.end = this.add.text(this.xCoord / 2, this.yCoord / 2 - 20, 'Score: ' + this.score, { 
            fontSize: '48px', 
            color: '#000', 
            fontStyle: 'bold' 
        }).setOrigin(0.5);


        console.log('text gone');

        this.button = this.add.text(this.xCoord / 2, this.yCoord / 2 + 50, 'Next', {
            fontSize: '32px',
            color: '#fff',
            backgroundColor: '#3a3a3aff',
            padding: { x: 20, y: 10 },
            align: 'center'
        }).setOrigin(0.5).setInteractive().on('pointerdown', () => {
            this.scene.start('endScreen', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
        });
    }
}
