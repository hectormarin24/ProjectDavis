// game9.js — Oil vs. water mini game.
export default class oilAndWater extends Phaser.Scene {
    constructor() {
        super({ key: 'oilAndWater' });
    }

    init(data) {
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
        this.isGameOver = false;
        this.successfulPourCount = 0;
        this.maxSuccessfulPours = 3;
        this.finalScore = data.score;
        this.lives = data.lives;
    }

    preload() {
        this.load.image('oil_bg', 'assets/kitchenbg.png');
        this.load.image('pot', 'assets/pot.png');
        this.load.image('water', 'assets/liquid_water.png');
        this.load.image('oil', 'assets/liquid_oil.png');
        this.load.image('osink', 'assets/oilSink.png');
        this.load.image('bucket', 'assets/bucket.png');
    }

    create() {
        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        if (this.textures.exists('oil_bg')) {
            this.add.image(cx, cy, 'oil_bg')
                .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        } else {
            this.cameras.main.setBackgroundColor(0xf0f0f0);
        }

        this.timerText = this.add.text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
            .setDepth(100);

        this.livesText = this.add.text(this.cameras.main.width - 180, 20, '', {
            fontSize: '28px', fill: '#ffffff'
        }).setDepth(100);

        this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                const state = window.globalGameState;
                const elapsed = this.time.now - state.startTime;
                const timeLeft = Math.max(0, state.totalTime - elapsed);
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);
                this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                this.livesText.setText(`Lives: ${state.lives}`);
                if (!this.isGameOver && (timeLeft <= 0 || state.lives <= 0)) {
                    this.isGameOver = true;
                    window.finishMiniGame(false, this, 0);
                }
            },
        });

        // EDIT: Move pot higher + smaller for proper stovetop placement
        this.pot = this.add.image(cx - 8, cy - 170, 'pot')
            .setScale(0.22);

        this.sink = this.add.image(cx - 220, cy + 60, 'osink')
            .setScale(0.2)
            .setInteractive({ useHandCursor: true });

        // Bucket now correct — unchanged
        this.bucket = this.add.image(cx + 180, cy - 10, 'bucket')
            .setScale(0.2)
            .setInteractive({ useHandCursor: true });

        this.message = this.add.text(cx, cy + 180, 'Click the correct container', {
            font: '20px Arial',
            color: '#222',
        }).setOrigin(0.5);

        this.startRound();

        this.sink.on('pointerdown', () => this.onTarget('osink'));
        this.bucket.on('pointerdown', () => this.onTarget('bucket'));
    }

    startRound() {
        if (this.isGameOver) return;

        this.potContents = Math.random() < 0.5 ? 'water' : 'oil';

        if (this.hintText && this.hintText.destroy) this.hintText.destroy();

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;

        this.hintText = this.add.text(cx, cy + 130, 'Pot contains: ' + this.potContents, {
            font: '28px Arial',
            color: '#000',
            fontStyle: 'bold',
        }).setOrigin(0.5);

        this.message.setText('Click the correct container');

        if (this.roundTimer && this.roundTimer.remove) this.roundTimer.remove();
        const difficulty = window.globalGameState?.difficulty || 1;
        const delay = 6000 / difficulty;

        this.roundTimer = this.time.delayedCall(delay, () => {
            if (!this.isGameOver) this.loseGame();
        });
    }

    onTarget(target) {
        if (this.isGameOver) return;
        if (this.roundTimer && this.roundTimer.remove) this.roundTimer.remove();

        const correct = this.potContents === 'water' ? 'osink' : 'bucket';

        if (target === correct) {
            this.successfulPourCount++;
            this.message.setText('Correct!');
            if (this.successfulPourCount >= this.maxSuccessfulPours) {
                this.winGame();
            } else {
                this.time.delayedCall(500, () => this.startRound());
            }
        } else {
            this.loseGame();
        }
    }

    winGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.message.setText('Great job!');
        this.time.delayedCall(800, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.finalScore,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: true,
                elapsedTime: this.time.now,
            });
        });
    }

    loseGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;
        this.message.setText('Wrong choice!');
        this.time.delayedCall(800, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.finalScore,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: false,
                elapsedTime: this.time.now,
            });
        });
    }
}
