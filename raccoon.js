// game11.js — Raccoon feeding mini game.

const WIDTH = 1000;
const HEIGHT = 880;
const MIN_FOOD_DISTANCE_FROM_RACCOON = 180;
const WIN_SCORE = 5;

class raccoon extends Phaser.Scene {
    constructor() {
        super({ key: 'raccoon' });
    }

    init(data = {}) {
        this.xCoord = data.xCoord ?? WIDTH;
        this.yCoord = data.yCoord ?? HEIGHT;
        this.finished = false;
        this.score = data.score;
        this.lives = data.lives;
    }

    preload() {
        this.load.image('bgpark', 'assets/bg_park.png');
        // REMOVED: this.load.image('hand', 'assets/hand.png');
        this.load.image('food', 'assets/food.png');
        this.load.image('raccoon', 'assets/raccoon.png');
        this.load.audio('pop', 'assets/pop.wav');
    }

    create() {
        this.scoreLocal = 0;
        this.misses = 0;
        this.maxMisses = 3;
        this.raccoonTween = null;
        this.food = null;
        this.raccoonSpeedMultiplier = window.globalGameState?.difficulty || 1;
        this.hasFinished = false;

        // === HUD ===
        this.timerText = this.add
            .text(20, 20, '', { fontSize: '28px', fill: '#ffffff' })
            .setDepth(100);

        this.livesText = this.add
            .text(WIDTH - 180, 20, '', { fontSize: '28px', fill: '#ffffff' })
            .setDepth(100);

        // Centered Misses Counter
        this.missText = this.add
            .text(WIDTH / 2, 20, `Misses: ${this.misses}/${this.maxMisses}`, {
                fontSize: '28px',
                fill: '#ffffff',
            })
            .setOrigin(0.5, 0)
            .setDepth(100);

        // Timer/lives update
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

                if (!this.finished && (timeLeft <= 0 || state.lives <= 0)) {
                    this.finished = true;
                    window.finishMiniGame(false, this, 0);
                }
            },
        });

        // === Background ===
        if (this.textures.exists('bgpark')) {
            this.add.image(WIDTH / 2, HEIGHT / 2, 'bgpark').setDisplaySize(WIDTH, HEIGHT);
        } else {
            this.cameras.main.setBackgroundColor('#a7d3a6');
        }

        // === REMOVED HAND COMPLETELY ===
        // no handX, handY, hand sprite

        // Spawn raccoon + food
        this.spawnRaccoon(true);
        this.spawnFood();
        this.updateHUD();

        this.moveRaccoon();

        // Click food
        this.input.on('gameobjectdown', (pointer, obj) => {
            if (!obj || !obj.texture) return;
            if (obj.texture.key === 'food' && obj.active) {
                if (this.sound) this.sound.play('pop', { volume: 0.25 });
                this.incrementScore();

                if (this.raccoonTween) {
                    this.raccoonTween.stop();
                    this.raccoonTween = null;
                }

                obj.destroy();
                if (this.food === obj) this.food = null;

                this.time.delayedCall(400, () => {
                    if (!this.hasFinished) {
                        this.spawnFood();
                        this.moveRaccoon();
                    }
                });
            }
        });
    }

    updateHUD() {
        this.missText.setText(`Misses: ${this.misses}/${this.maxMisses}`);
    }

    incrementScore() {
        this.scoreLocal += 1;
        if (this.scoreLocal >= WIN_SCORE) {
            this.showMessage('Good job!');
            this.finishLevel();
        }
    }

    spawnFood() {
        let x, y;
        const maxAttempts = 50;
        let attempts = 0;
        const pad = 120;

        do {
            x = Phaser.Math.Between(pad, WIDTH - pad);
            y = Phaser.Math.Between(200, HEIGHT - 120);
            attempts++;
            if (!this.raccoon) break;
            const dist = Phaser.Math.Distance.Between(x, y, this.raccoon.x, this.raccoon.y);
            if (dist >= MIN_FOOD_DISTANCE_FROM_RACCOON) break;
        } while (attempts < maxAttempts);

        if (this.food && this.food.active) this.food.destroy();

        this.food = this.add.image(x, y, 'food').setInteractive().setScale(0.08);
    }

    spawnRaccoon(initial = false) {
        const startX = Phaser.Math.Between(50, WIDTH - 50);
        const startY = HEIGHT - 100;

        if (this.raccoon) this.raccoon.destroy();

        this.raccoon = this.add.image(startX, startY, 'raccoon').setScale(0.3);

        if (!initial) this.moveRaccoon();
    }

    moveRaccoon() {
        if (!this.raccoon || !this.food) return;

        if (this.raccoonTween) this.raccoonTween.stop();

        const dist = Phaser.Math.Distance.Between(this.raccoon.x, this.raccoon.y, this.food.x, this.food.y);
        const speed = 150 * this.raccoonSpeedMultiplier;
        const duration = (dist / speed) * 1000;

        this.raccoonTween = this.tweens.add({
            targets: this.raccoon,
            x: this.food.x,
            y: this.food.y,
            duration,
            onComplete: () => {
                if (!this.hasFinished) {
                    this.misses++;
                    this.updateHUD();

                    if (this.misses >= this.maxMisses) {
                        this.showMessage('Too many misses!');
                        this.hasFinished = true;

                        this.time.delayedCall(600, () => {
                            this.scene.start('transitionScreen', {
                                lives: this.lives,
                                score: this.score,
                                xCoord: this.xCoord,
                                yCoord: this.yCoord,
                                won: false,
                                elapsedTime: this.time.now,
                            });
                        });
                        return;
                    }

                    this.spawnFood();
                    this.spawnRaccoon();
                    this.moveRaccoon();
                }
            },
        });
    }

    showMessage(msg) {
        if (this._msgText) this._msgText.destroy();

        this._msgText = this.add
            .text(WIDTH / 2, HEIGHT / 2, msg, {
                font: '28px Arial',
                color: '#000',
                backgroundColor: '#fff',
                padding: { x: 12, y: 8 },
            })
            .setOrigin(0.5)
            .setDepth(20);

        this.time.delayedCall(900, () => {
            if (this._msgText) this._msgText.destroy();
            this._msgText = null;
        });
    }

    finishLevel() {
        if (this.hasFinished) return;
        this.hasFinished = true;

        if (this.raccoonTween) this.raccoonTween.stop();
        if (this.food && this.food.disableInteractive) this.food.disableInteractive();

        this.input.enabled = false;

        this.time.delayedCall(800, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.score,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: true,
                elapsedTime: this.time.now,
            });
        });
    }
}

export default raccoon;
