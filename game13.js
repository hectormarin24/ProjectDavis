// ===========================================================
// game13.js — Placeholder Mini-Game Template
// Integrates with Project Davis global game flow.
// ===========================================================

export default class Game13 extends Phaser.Scene {
    constructor() {
        super('Game13');
    }

    init(data) {
        this.score = data?.score ?? 0;
        this.xCoord = data?.xCoord ?? this.scale.width;
        this.yCoord = data?.yCoord ?? this.scale.height;
    }

    preload() {
        this.load.image('bg_park', 'assets/grass_field.png'); // example placeholder
        this.load.image('ball', 'assets/ball.png'); // example object
    }

    create() {
        console.log('Game13 loaded');

        // --- Background ---
        this.bg = this.add
            .image(this.xCoord / 2, this.yCoord / 2, 'g13_bg')
            .setOrigin(0.5)
            .setDisplaySize(this.xCoord, this.yCoord);

        // --- Game instructions ---
        this.add.text(this.xCoord / 2, 60, 'Catch the Ball!', {
            fontSize: '48px',
            color: '#ffffff',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        // --- Player object ---
        this.player = this.add.rectangle(this.xCoord / 2, this.yCoord - 100, 150, 30, 0x00ff00);
        this.physics.add.existing(this.player);
        this.player.body.setCollideWorldBounds(true);

        // --- Falling object ---
        this.ball = this.physics.add.image(Phaser.Math.Between(100, this.xCoord - 100), 0, 'ball');
        this.ball.setVelocityY(200);

        // --- Score ---
        this.scoreText = this.add.text(40, 40, `Score: ${this.score}`, {
            fontSize: '32px',
            color: '#fff',
        });

        // --- Controls ---
        this.cursors = this.input.keyboard.createCursorKeys();

        // --- Collision Detection ---
        this.physics.add.overlap(this.player, this.ball, () => {
            this.score += 100;
            this.scoreText.setText(`Score: ${this.score}`);

            this.ball.setY(0);
            this.ball.setX(Phaser.Math.Between(100, this.xCoord - 100));

            // You can end mini-game on condition (e.g., after 5 catches)
            if (this.score >= 500) {
                this.finish(true);
            }
        });

        // --- Timer to auto-fail after 15 seconds ---
        this.time.delayedCall(15000, () => this.finish(false));
    }

    update() {
        // --- Move Player Left / Right ---
        if (this.cursors.left.isDown) {
            this.player.x -= 10;
        } else if (this.cursors.right.isDown) {
            this.player.x += 10;
        }
    }

    finish(success) {
        // Call global finish function to go to next game or end screen
        if (window.finishMiniGame) {
            window.finishMiniGame(success, this);
        } else {
            console.warn('finishMiniGame not found — returning to startScreen');
            this.scene.start('startScreen');
        }
    }
}
