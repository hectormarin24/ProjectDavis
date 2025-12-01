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

        this.keyboardSelection = null;
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
        }

        const hudStyle = {
            fontFamily: 'Arial',
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        this.timerText = this.add.text(24, 24, '', hudStyle).setDepth(100);
        this.livesText = this.add.text(this.cameras.main.width - 200, 24, '', hudStyle).setDepth(100);

        this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                const state = window.globalGameState;
                const elapsed = this.time.now - state.startTime;
                const timeLeft = Math.max(0, state.totalTime - elapsed);
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);

                this.timerText.setText(
                    `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
                );
                this.livesText.setText(`Lives: ${state.lives}`);

                if (!this.isGameOver && (timeLeft <= 0 || state.lives <= 0)) {
                    this.isGameOver = true;
                    window.finishMiniGame(false, this, 0);
                }
            }
        });

        this.pot = this.add.image(cx - 8, cy - 170, 'pot')
            .setScale(0.22)
            .setDepth(5);

        this.sink = this.add.image(cx - 220, cy + 60, 'osink')
            .setScale(0.2)
            .setInteractive({ useHandCursor: true });

        this.bucket = this.add.image(cx + 180, cy + 10, 'bucket')
            .setScale(0.22)
            .setInteractive({ useHandCursor: true });

        const txtStyle = {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };

        this.hintText = this.add.text(cx, cy + 120, '', txtStyle).setOrigin(0.5);
        this.message = this.add.text(cx, cy + 160, 'Click the correct container', txtStyle).setOrigin(0.5);

        const addHover = (sprite) => {
            const baseX = sprite.scaleX;
            const baseY = sprite.scaleY;

            sprite.on("pointerover", () => {
                this.tweens.add({
                    targets: sprite,
                    scaleX: baseX * 1.08,
                    scaleY: baseY * 1.08,
                    duration: 100
                });
            });

            sprite.on("pointerout", () => {
                this.tweens.add({
                    targets: sprite,
                    scaleX: baseX,
                    scaleY: baseY,
                    duration: 100
                });
            });
        };

        addHover(this.sink);
        addHover(this.bucket);

        this.startRound();

        this.sink.on('pointerdown', () => this.onTarget('osink'));
        this.bucket.on('pointerdown', () => this.onTarget('bucket'));

        this.input.keyboard.on('keydown', (key) => {
            if (this.isGameOver) return;

            if (key.code === "ArrowLeft" || key.code === "KeyA") {
                this.setKeyboardSelection("osink");
            }

            if (key.code === "ArrowRight" || key.code === "KeyD") {
                this.setKeyboardSelection("bucket");
            }

            if (key.code === "Space") {
                if (this.keyboardSelection) {
                    this.onTarget(this.keyboardSelection);
                }
            }
        });
    }

    setKeyboardSelection(optionKey) {
        this.keyboardSelection = optionKey;

        this.sink.setScale(0.2);
        this.bucket.setScale(0.22);

        if (optionKey === "osink") {
            this.sink.setScale(0.25);
        } else if (optionKey === "bucket") {
            this.bucket.setScale(0.27);
        }
    }

    startRound() {
        if (this.isGameOver) return;

        this.keyboardSelection = null;
        this.sink.setScale(0.2);
        this.bucket.setScale(0.22);

        this.potContents = Math.random() < 0.5 ? 'water' : 'oil';
        this.hintText.setText('Pot contains: ' + this.potContents);
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

        const correctKey = this.potContents === 'water' ? 'osink' : 'bucket';
        const isCorrect = target === correctKey;

        if (isCorrect) {
            this.successfulPourCount++;
            this.message.setText('Correct!');

            if (this.successfulPourCount >= this.maxSuccessfulPours) {
                this.winGame();
            } else {
                this.time.delayedCall(600, () => this.startRound());
            }
        } else {
            this.loseGame();
        }
    }

    winGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.message.setText('Great job!');

        this.time.delayedCall(900, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.finalScore,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: true,
                elapsedTime: this.time.now
            });
        });
    }

    loseGame() {
        if (this.isGameOver) return;

        this.isGameOver = true;
        this.message.setText('Wrong choice!');

        this.time.delayedCall(900, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.finalScore,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: false,
                elapsedTime: this.time.now
            });
        });
    }
}
