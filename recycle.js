// recycle.js — mini game to sort items into recycle/trash/compost bins.
// Updated: Full keyboard accessibility (A/D to move between bins, SPACE to choose)

export default class recycle extends Phaser.Scene {
    constructor() {
        super('recycle');
    }

    preload() {
        this.load.image('background', 'assets/background.webp');

        this.load.image('paper_bin', 'assets/Recycle_can.png');
        this.load.image('trash_bin', 'assets/trash_can.png');
        this.load.image('compost_bin', 'assets/compost_can.png');
        this.load.image('bottles_bin', 'assets/bottlesAndCans.png');
        this.load.image('tin_can', 'assets/tin_can.png');
        this.load.image('banana_peel', 'assets/banana_peel.png');
        this.load.image('pileOfLeaves', 'assets/pileOfLeaves.png');
        this.load.image('smallBox', 'assets/Small Box.png');
        this.load.image('milkCarton', 'assets/milk_carton.webp');
    }

    init(data) {
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
        this.score = data.score;
        this.lives = data.lives;

        this.isGameOver = false;
        this.localScore = 0;

        this.selectedIndex = 0; // 0 = recycle, 1 = trash, 2 = compost
    }

    create() {
        const gs = window.globalGameState || {};

        // Background
        if (this.textures.exists('background')) {
            this.background = this.add
                .image(this.xCoord / 2, this.yCoord / 2, 'background')
                .setOrigin(0.5)
                .setDisplaySize(this.xCoord, this.yCoord);
        } else {
            this.cameras.main.setBackgroundColor(0x333333);
        }

        // HUD
        const cx = this.cameras.main.centerX;
        this.message = this.add
            .text(cx, 90, 'Use A/D or ←/→ to choose a bin. Press SPACE to sort.', {
                font: '26px Arial',
                color: '#111',
                align: 'center',
                wordWrap: { width: this.scale.width - 80 },
            })
            .setOrigin(0.5)
            .setDepth(51);
        
        this.messagePanel = this.add
            .graphics()
            .fillStyle(0xffffff, 1)
            .fillRoundedRect(cx - 350, 66, 700, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(cx - 350, 66, 700, 50)
            .setDepth(50);

        this.timerText = this.add.text(20, 20, '', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' }).setDepth(51);

        this.timerPanel = this.add
            .graphics()
            .fillStyle(0xf9cb9c, 1)
            .fillRoundedRect(5, 9, 200, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(5, 9, 200, 50)
            .setDepth(50);

        this.livesText = this.add.text(this.xCoord - 170, 20, '', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' }).setDepth(51);

        this.livesPanel = this.add
            .graphics()
            .fillStyle(0xf9cb9c, 1)
            .fillRoundedRect(this.xCoord - 190, 9, 180, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(this.xCoord - 190, 9, 180, 50)
            .setDepth(50);

        if (!gs.timerEnabled) {this.timerText.setVisible(false); this.timerPanel.setVisible(false);}
        if (!gs.livesEnabled) {this.livesText.setVisible(false); this.livesPanel.setVisible(false);}

        // Background updates: timer & lives
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

                if (!this.isGameOver && gs.livesEnabled && state.lives <= 0) {
                    this.isGameOver = true;
                    window.finishMiniGame(false, this, 0);
                }
            },
        });

        // BINS
        this.bottleButton = this.add  
            .image(this.xCoord / 5, (3 * this.yCoord) / 4, 'bottles_bin')
            .setScale(0.5)
            .setInteractive();

        this.paperButton = this.add
            .image(2 * this.xCoord / 5, (3 * this.yCoord) / 4, 'paper_bin')
            .setScale(0.5)
            .setInteractive();

        this.trashButton = this.add
            .image(3 * this.xCoord / 5, (3 * this.yCoord) / 4, 'trash_bin')
            .setScale(0.5)
            .setInteractive();

        this.compostButton = this.add
            .image(4 * this.xCoord / 5, (3 * this.yCoord) / 4, 'compost_bin')
            .setScale(0.5)
            .setInteractive();

        // Mouse clicks
        this.paperButton.on("pointerdown", () => this.checkAnswer("paper"));
        this.trashButton.on("pointerdown", () => this.checkAnswer("trash"));
        this.compostButton.on("pointerdown", () => this.checkAnswer("compost"));
        this.bottleButton.on("pointerdown", ()=> this.checkAnswer("bottle"));

        if (gs.highContrast) {
            this.background && this.background.setTint(0xffffff);
            this.paperButton.setTint(0x00ffff);
            this.trashButton.setTint(0xff6666);
            this.compostButton.setTint(0x66ff66);
            this.bottleButton.setTint(0x66ff66);
        }

        // Keyboard input
        this.registerKeyboard();

        // Bin array for easy index-based selection
        this.binOrder = ["bottle", "paper", "trash", "compost"];
        this.binSprites = [
            this.bottleButton,
            this.paperButton,
            this.trashButton,
            this.compostButton,
        ];

        this.updateHighlight();
        this.nextObject();
    }

    registerKeyboard() {
        // Move left
        this.input.keyboard.on("keydown-A", () => {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.updateHighlight();
        });
        this.input.keyboard.on("keydown-LEFT", () => {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.updateHighlight();
        });

        // Move right
        this.input.keyboard.on("keydown-D", () => {
            this.selectedIndex = Math.min(3, this.selectedIndex + 1);
            this.updateHighlight();
        });
        this.input.keyboard.on("keydown-RIGHT", () => {
            this.selectedIndex = Math.min(3, this.selectedIndex + 1);
            this.updateHighlight();
        });

        // Select
        const choose = () => {
            if (!this.isGameOver) {
                const selectedBin = this.binOrder[this.selectedIndex];
                this.checkAnswer(selectedBin);
            }
        };

        this.input.keyboard.on("keydown-SPACE", choose);
        this.input.keyboard.on("keydown-ENTER", choose);
    }

    updateHighlight() {
        this.binSprites.forEach((bin, i) => {
            if (i === this.selectedIndex) {
                bin.setScale(0.6); // highlighted
            } else {
                bin.setScale(0.5); // normal size
            }
        });
    }

    nextObject() {
        const gs = window.globalGameState || {};

        if (this.currentObject && this.currentObject.destroy)
            this.currentObject.destroy();

        const objects = [
            { key: "banana_peel", correct: "compost" },
            { key: "tin_can", correct: "bottle" },
            { key: "pileOfLeaves", correct: "compost" },
            { key: "smallBox", correct: "paper" },
            { key: "milkCarton", correct: "paper" },
        ];

        this.current = Phaser.Utils.Array.GetRandom(objects);

        this.currentObject = this.add
            .image(this.xCoord / 2, this.yCoord / 3, this.current.key)
            .setOrigin(0.5);

        if (gs.highContrast) {
            this.currentObject.setTint(0xffff00);
        }

        // Timer per object
        if (this.objectTimer && this.objectTimer.remove)
            this.objectTimer.remove();

        const difficulty = window.globalGameState?.difficulty || 1;
        let delay = 10000 / difficulty;
        if (gs.slowMode) delay *= 1.5;

        if (gs.timerEnabled) {
            this.objectTimer = this.time.delayedCall(delay, () => {
                if (!this.isGameOver) {
                    this.isGameOver = true;
                    this.add
                        .text(this.xCoord / 2, this.yCoord / 2, "Time's up!", {
                            fontSize: "64px",
                            fill: "#ffffff",
                        })
                        .setOrigin(0.5);

                    this.time.delayedCall(500, () => {
                        this.scene.start("transitionScreen", {
                            lives: this.lives,
                            score: this.score,
                            xCoord: this.xCoord,
                            yCoord: this.yCoord,
                            won: gs.livesEnabled === false,
                            elapsedTime: this.time.now,
                        });
                    });
                }
            });
        }
    }

    checkAnswer(bin) {
        const gs = window.globalGameState || {};
        if (this.isGameOver) return;

        if (this.objectTimer && this.objectTimer.remove)
            this.objectTimer.remove();

        if (bin === this.current.correct) {
            this.localScore++;

            if (this.localScore >= 5) {
                this.isGameOver = true;
                this.time.delayedCall(800, () => {
                    this.scene.start("transitionScreen", {
                        lives: this.lives,
                        score: this.score,
                        xCoord: this.xCoord,
                        yCoord: this.yCoord,
                        won: true,
                        elapsedTime: this.time.now,
                    });
                });
            } else {
                this.nextObject();
            }
        } else {
            this.isGameOver = true;
            this.time.delayedCall(800, () => {
                this.scene.start("transitionScreen", {
                    lives: this.lives,
                    score: this.score,
                    xCoord: this.xCoord,
                    yCoord: this.yCoord,
                    won: false,
                    elapsedTime: this.time.now,
                });
            });
        }
    }
}
