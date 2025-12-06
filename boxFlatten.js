// game5.js — Mini game where the player flattens cardboard boxes.
// Updated: SPACE now flattens the current box exactly like clicking.

export default class boxFlatten extends Phaser.Scene {
    constructor() {
        super('boxFlatten');
    }

    preload() {
        this.load.image('bigBox', 'assets/Big Box.png');
        this.load.image('mediumBox', 'assets/Medium Box.png');
        this.load.image('smallBox', 'assets/Small Box.png');
        this.load.image('flatBox', 'assets/flatBox.png');
        this.load.image('background', 'assets/background.webp');
    }

    init(data) {
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
        this.isGameOver = false;
        this.localScore = 0;
        this.score = data.score;
        this.lives = data.lives;
    }

    create() {
        const gs = window.globalGameState || {};

        const bg = this.add
            .image(this.xCoord / 3 + 20, this.yCoord / 2, 'background')
            .setOrigin(0.5);

        if (gs.highContrast) bg.setTint(0xffffff);

        this.timerText = this.add.text(20, 20, '', {
            fontSize: '32px',
            fill: '#ffffff'
        }).setDepth(100);

        this.livesText = this.add.text(this.xCoord - 180, 20, {
            fontSize: '32px',
            fill: '#ffffff'
        }).setDepth(100);

        if (!gs.timerEnabled) this.timerText.setVisible(false);
        if (!gs.livesEnabled) this.livesText.setVisible(false);

        // HUD Timer update
        this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                const state = window.globalGameState;
                const elapsed = this.time.now - state.startTime;
                const timeLeft = Math.max(0, state.totalTime - elapsed);
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);

                if (gs.timerEnabled)
                    this.timerText.setText(
                        `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
                    );
                if (gs.livesEnabled)
                    this.livesText.setText(`Lives: ${state.lives}`);

                // Lives exhausted → fail
                if (!this.isGameOver && gs.livesEnabled && state.lives <= 0) {
                    this.isGameOver = true;
                    window.finishMiniGame(false, this, 0);
                }
            }
        });

        const cx = this.cameras.main.centerX;
        this.add
            .text(
                cx,
                50,
                'Click or press SPACE to flatten each box!',
                {
                    font: '26px Arial',
                    color: '#111',
                    align: 'center',
                    wordWrap: { width: this.scale.width - 80 }
                }
            )
            .setOrigin(0.5);

        // --- SPACE KEY FLATTENS THE BOX ---
        this.input.keyboard.on("keydown-SPACE", () => {
            if (this.current && !this.isGameOver) {
                this.handleClickLogic();
            }
        });

        this.clickCount = 0;

        // Spawn first box
        this.nextObject();
    }

    // --------------------------
    // BOX SPAWNING
    // --------------------------
    nextObject() {
        const gs = window.globalGameState || {};

        // remove old box
        if (this.current && this.current.destroy) {
            this.current.destroy();
        }

        const options = [
            { key: 'smallBox', scale: 0.5, clicks: 1 },
            { key: 'mediumBox', scale: 1, clicks: 2 },
            { key: 'bigBox', scale: 1.5, clicks: 3 }
        ];

        this.boxInfo = Phaser.Utils.Array.GetRandom(options);

        const x = Phaser.Math.Between(100, this.xCoord - 100);
        const y = Phaser.Math.Between(150, this.yCoord - 200);

        this.current = this.add
            .image(x, y, this.boxInfo.key)
            .setScale(this.boxInfo.scale)
            .setInteractive({ useHandCursor: true });

        if (gs.highContrast) this.current.setTint(0xffff00);

        this.clickCount = 0;

        // Mouse still works
        this.current.on("pointerdown", () => {
            if (!this.isGameOver) this.handleClickLogic();
        });

        // remove old timer
        if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();

        const difficulty = gs?.difficulty || 1;
        let delay = 5000 / difficulty;
        if (gs.slowMode) delay *= 1.5;

        // per-box timer
        if (gs.timerEnabled) {
            this.boxTimer = this.time.delayedCall(delay, () => {
                if (!this.isGameOver) {
                    if (gs.livesEnabled !== false) {
                        this.loseGame();
                    } else {
                        this.nextObject();
                    }
                }
            });
        }
    }

    // --------------------------
    // CLICK / SPACE LOGIC
    // --------------------------
    handleClickLogic() {
        const gs = window.globalGameState || {};

        this.clickCount++;

        // too many clicks → lose
        if (this.clickCount > this.boxInfo.clicks) {
            if (gs.livesEnabled !== false) {
                this.loseGame();
                return;
            }
            this.clickCount = this.boxInfo.clicks;
        }

        // correct full flatten
        if (this.clickCount === this.boxInfo.clicks) {
            const flat = this.add.image(this.current.x, this.current.y, 'flatBox')
                .setScale(this.boxInfo.scale / 3);

            if (gs.highContrast) flat.setTint(0x00ff00);

            this.current.destroy();
            this.current = null;

            this.localScore++;

            if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();

            if (this.localScore >= 5) {
                this.winGame();
            } else {
                this.nextObject();
            }
        }
    }

    // --------------------------
    // WIN STATE
    // --------------------------
    winGame() {
        if (this.isGameOver) return;
        this.isGameOver = true;

        if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();

        this.add.text(this.xCoord / 2, this.yCoord / 2, 'Great job!', {
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.time.delayedCall(800, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.score,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: true,
                elapsedTime: this.time.now
            });
        });
    }

    // --------------------------
    // LOSS STATE
    // --------------------------
    loseGame() {
        const gs = window.globalGameState || {};
        if (gs.livesEnabled === false) return;
        if (this.isGameOver) return;

        this.isGameOver = true;

        if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();

        this.add.text(this.xCoord / 2, this.yCoord / 2, 'Oops!', {
            fontSize: '64px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        this.time.delayedCall(800, () => {
            this.scene.start('transitionScreen', {
                lives: this.lives,
                score: this.score,
                xCoord: this.xCoord,
                yCoord: this.yCoord,
                won: false,
                elapsedTime: this.time.now
            });
        });
    }
}
