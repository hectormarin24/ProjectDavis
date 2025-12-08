export default class closeTheLids extends Phaser.Scene {
    constructor() {
        super('closeTheLids');
    }

    preload() {
        this.load.image('neighborhood', 'assets/neighborhoodStreetView.jpg');
        this.load.image('closedTrashCan', 'assets/trash_can.png');
        this.load.image('openTrashCan', 'assets/trash_can_open.png');
        this.load.image('closedRecCan', 'assets/Recycle_can.png');
        this.load.image('openRecCan', 'assets/recycle_can_open.png');
    }

    init(data) {
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
        this.isGameOver = false;
        this.localScore = 0;
        this.finalScore = data.score;
        this.lives = data.lives;
    }

    create() {
        const gs = window.globalGameState;

        // Background
        this.background = this.add.image(0, 0, 'neighborhood').setOrigin(0, 0);
        this.background.displayWidth = this.sys.game.config.width;
        this.background.displayHeight = this.sys.game.config.height;

        if (gs.highContrast) this.background.setTint(0xffffff);

        this.score = 0;

        // --- Trash Can List ---
        this.cans = [
            this.H1X1Can = this.add.sprite(100, 675, 'closedTrashCan').setScale(.25).setInteractive(),
            this.H1X2Can = this.add.sprite(200, 675, 'closedRecCan').setScale(.25).setInteractive(),
            this.H2X1Can = this.add.sprite(425, 675, 'closedTrashCan').setScale(.25).setInteractive(),
            this.H2X2Can = this.add.sprite(550, 675, 'closedRecCan').setScale(.25).setInteractive(),
            this.H3X1Can = this.add.sprite(800, 675, 'closedTrashCan').setScale(.25).setInteractive(),
            this.H3X2Can = this.add.sprite(900, 675, 'closedRecCan').setScale(.25).setInteractive()
        ];

        // High contrast tint
        if (gs.highContrast) {
            this.H1X1Can.setTint(0xff0000);
            this.H1X2Can.setTint(0x00ff00);
            this.H2X1Can.setTint(0xff0000);
            this.H2X2Can.setTint(0x00ff00);
            this.H3X1Can.setTint(0xff0000);
            this.H3X2Can.setTint(0x00ff00);
        }

        // Mouse click logic (original)
        this.H1X1Can.on('pointerdown', () => this.handleManualClick(this.H1X1Can));
        this.H1X2Can.on('pointerdown', () => this.handleManualClick(this.H1X2Can));
        this.H2X1Can.on('pointerdown', () => this.handleManualClick(this.H2X1Can));
        this.H2X2Can.on('pointerdown', () => this.handleManualClick(this.H2X2Can));
        this.H3X1Can.on('pointerdown', () => this.handleManualClick(this.H3X1Can));
        this.H3X2Can.on('pointerdown', () => this.handleManualClick(this.H3X2Can));

        // ------------- KEYBOARD SYSTEM -------------
        this.selectedIndex = 0;
        this.highlightSelectedCan();

        this.input.keyboard.on('keydown-A', () => {
            this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            this.highlightSelectedCan();
        });

        this.input.keyboard.on('keydown-D', () => {
            this.selectedIndex = Math.min(this.cans.length - 1, this.selectedIndex + 1);
            this.highlightSelectedCan();
        });

        this.input.keyboard.on('keydown-SPACE', () => {
            const can = this.cans[this.selectedIndex];
            this.handleManualClick(can);
        });

        // Wind loop
        const difficulty = gs?.difficulty || 1;
        let windLoopDelay = 1000 / difficulty;
        if (gs.slowMode) windLoopDelay *= 1.5;

        this.time.addEvent({
            delay: windLoopDelay,
            loop: true,
            callback: () => {
                this.wind();
                this.loseCon();
            }
        });

        // HUD
        const cx = this.cameras.main.centerX;
        this.message = this.add
            .text(cx, 90, "Click or press SPACE to close lids! Use A and D to move between bins.", {
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
            .fillRoundedRect(cx - 425, 66, 850, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(cx - 425, 66, 850, 50)
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
                    this.timerText.setText(`Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
                if (gs.livesEnabled)
                    this.livesText.setText(`Lives: ${state.lives}`);

                const livesExpired = gs.livesEnabled && state.lives <= 0;

                if (!this.isGameOver && livesExpired) {
                    this.isGameOver = true;
                    window.finishMiniGame(false, this, 0);
                }
            },
        });
    }

    // --- Adds highlight to selected can ---
    highlightSelectedCan() {
        this.cans.forEach((can, i) => {
            if (i === this.selectedIndex) {
                can.setScale(0.32);   // slightly bigger highlight
            } else {
                can.setScale(0.25);   // normal size
            }
        });
    }


    // --- Shared click logic for mouse + space ---
    handleManualClick(can) {
        const key = can.texture.key;

        if (key === 'openTrashCan') {
            can.setTexture('closedTrashCan');
            this.checkScore(this.score);
        }
        if (key === 'openRecCan') {
            can.setTexture('closedRecCan');
            this.checkScore(this.score);
        }
    }

    wind() {
        const flag = Phaser.Math.Between(1, 6);
        switch (flag) {
            case 1: this.H1X1Can.setTexture('openTrashCan'); break;
            case 2: this.H1X2Can.setTexture('openRecCan'); break;
            case 3: this.H2X1Can.setTexture('openTrashCan'); break;
            case 4: this.H2X2Can.setTexture('openRecCan'); break;
            case 5: this.H3X1Can.setTexture('openTrashCan'); break;
            case 6: this.H3X2Can.setTexture('openRecCan'); break;
        }
    }

    loseCon() {
        if (
            this.H1X1Can.texture.key === 'openTrashCan' &&
            this.H1X2Can.texture.key === 'openRecCan' &&
            this.H2X1Can.texture.key === 'openTrashCan' &&
            this.H2X2Can.texture.key === 'openRecCan' &&
            this.H3X1Can.texture.key === 'openTrashCan' &&
            this.H3X2Can.texture.key === 'openRecCan'
        ) {
            this.failGame();
        }
    }

    checkScore(score) {
        this.score++;
        if (score == 7) {
            this.winGame();
        }
    }

    winGame() {
        if (this.windTimer) this.windTimer.remove();
        if (this.miniTimer) this.miniTimer.remove();
        this.time.delayedCall(800, () => {
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

    failGame() {
        const gs = window.globalGameState || {};
        
        this.time.delayedCall(800, () => {
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
