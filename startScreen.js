export default class startScreen extends Phaser.Scene {
    constructor() {
        super('startScreen');
    }

    preload() {
        this.load.image('background', 'assets/Davis streets-fotor-ai-art-effects-20250918131614.png');
        this.load.image('btnPlay', 'assets/play.png');
        this.load.image('btnTrophy', 'assets/help.png');
        this.load.image('btnSettings', 'assets/setting.png');

        // Still Professor Davis Green
        this.load.image('profDavis', 'assets/ProfDavisGreen.png');

        // NEW — New Title banner
        this.load.image('titleBanner', 'assets/Title Screen.png');
    }

    create() {
        this.xCoord = this.cameras.main.width;
        this.yCoord = this.cameras.main.height;

        console.log("main screen loaded");

        // Background
        this.background = this.add
            .image(this.xCoord / 3 + 20, this.yCoord / 2, 'background')
            .setOrigin(0.5);

        // --- NEW: REMOVE OLD TITLE BOX + TEXT ---
        // (The old graphics + text block is gone)

        // --- NEW TITLE IMAGE ---
        const banner = this.add.image(this.xCoord / 2, this.yCoord / 4, 'titleBanner');
        banner.setOrigin(0.5);
        banner.setScale(0.9); // adjust if needed
        banner.setDepth(100);

        // --- Still Professor Davis ---
        const prof = this.add.image(220, 660, 'profDavis');
        prof.setScale(1.3);
        prof.setDepth(1);

        // Initialize global game session state
        window.globalGameState = {
            startTime: this.time.now,
            totalTime: 5 * 60 * 1000,
            lives: 3,
            score: 0,
            difficulty: 1,
            difficultyEnabled: true,
            slowMode: false,
            timerEnabled: true,
            livesEnabled: true,
            highContrast: false
        };

        const state = window.globalGameState;
        window.finishMiniGame = (success, scene, time) => {
            if (success) {
                state.score += 100;
            } else if(state.livesEnabled) {
                state.lives -= 1;
            }

            state.difficulty = Math.min(3, state.difficulty + 0.1);
            state.startTime += time;

            const elapsed = scene.time.now - state.startTime;
            const timeLeft = state.totalTime - elapsed;

            if (state.lives <= 0 || timeLeft <= 0) {
                scene.scene.start('endScreen', {
                    score: state.score,
                    xCoord: scene.xCoord,
                    yCoord: scene.yCoord
                });
                return;
            }

            if (!window.gameQueue || window.gameQueue.length === 0) {
                const allList = window.allMiniGames || [];
                const newOrder = Phaser.Utils.Array.Shuffle(allList.slice());
                window.gameQueue = newOrder;
            }

            const nextScene =
                window.gameQueue.length > 0 ? window.gameQueue.shift() : 'endScreen';

            scene.scene.start(nextScene, {
                score: state.score,
                lives: state.lives,
                xCoord: scene.xCoord,
                yCoord: scene.yCoord
            });
        };

        // Game list
        const miniGames = [
            'recycle',
            'closeTheLids',
            'leakyFaucet',
            'raccoon',
            'fruitPicker',
            'compostSort',
            'oilAndWater',
            'boxFlatten',
            'bugFriend',
            'bathroomSort',
            'catchRec'
        ];

        window.allMiniGames = miniGames.slice();
        window.gameQueue = Phaser.Utils.Array.Shuffle(miniGames.slice());

        // Play Button
        this.playBtn = this.add
            .image(this.xCoord / 2, (3 * this.yCoord) / 3.6, 'btnPlay')
            .setDepth(10)
            .setScale(0.2)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.playBtn.setScale(0.23))
            .on('pointerout', () => this.playBtn.setScale(0.2))
            .on('pointerdown', () => {
                const nextScene =
                    window.gameQueue.length > 0 ? window.gameQueue.shift() : 'endScreen';
                state.startTime = this.time.now;

                this.scene.start(nextScene, {
                    score: 0,
                    lives: 3,
                    xCoord: this.xCoord,
                    yCoord: this.yCoord
                });
            });

        // Help Button
        this.trophyBtn = this.add
            .image(this.xCoord / 2.7, (3 * this.yCoord) / 3.6, 'btnTrophy')
            .setDepth(10)
            .setScale(0.25)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.trophyBtn.setScale(0.28))
            .on('pointerout', () => this.trophyBtn.setScale(0.25))
            .on('pointerdown', () => {
                    this.scene.start('helpScene', {
                    xCoord: this.xCoord,
                    yCoord: this.yCoord
                });
            });
            

        // Settings Button
        this.settingsBtn = this.add
            .image(this.xCoord / 1.6, (3 * this.yCoord) / 3.6, 'btnSettings')
            .setDepth(10)
            .setScale(0.25)
            .setScrollFactor(0)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.settingsBtn.setScale(0.28))
            .on('pointerout', () => this.settingsBtn.setScale(0.25))
            .on('pointerdown', () => {
                this.showSettingsMenu();
            });

        this.settingsPanel = this.add
            .graphics()
            .fillStyle(0xf9cb9c, 1)
            .fillRoundedRect(this.xCoord / 5, this.yCoord / 10, this.xCoord * 0.6, this.yCoord * 0.8, 20)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(this.xCoord / 5, this.yCoord / 10, this.xCoord * 0.6, this.yCoord * 0.8, 20)
            .setDepth(50)
            .setVisible(false);

                // Difficulty text object
        this.difficultyText = this.add
            .text(
                this.xCoord / 2,
                this.yCoord / 2 + 140,
                '',
                {
                    fontSize: '32px',
                    fill: '#000000ff',
                    align: 'center',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    wordWrap: {
                        width: this.xCoord * 0.5,
                        useAdvancedWrap: true
                    }
                }
            )
            .setOrigin(0.5)
            .setDepth(51)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        // Function to refresh difficulty label text
        this.updateDifficultyText = () => {
            const { difficultyEnabled } = window.globalGameState;
            this.difficultyText.setText(
                difficultyEnabled ? 'Difficulty: Normal' : 'Difficulty: Easy'
            );
        };

        // Toggle difficulty on click
        this.difficultyText.on('pointerup', () => {
            const state = window.globalGameState;

            state.difficultyEnabled = !state.difficultyEnabled;

            // Reset difficulty level when turned off
            if (!state.difficultyEnabled) {
                state.difficulty = 1;
            }

            this.updateDifficultyText();
        });

        
        this.slowModeText = this.add
            .text(
                this.xCoord / 2,
                this.yCoord / 2 - 60,
                '',
                {
                    fontSize: '32px',
                    fill: '#000000ff',
                    align: 'center',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    wordWrap: {
                        width: this.xCoord * 0.5,
                        useAdvancedWrap: true
                    }
                }
            )
            .setOrigin(0.5)
            .setDepth(51)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.slowModeText.on('pointerdown', () => {
            const gs = window.globalGameState;
            gs.slowMode = !gs.slowMode;
            this.updateSlowModeText();
        });

        this.timerToggleText = this.add
            .text(
                this.xCoord / 2,
                this.yCoord / 2 - 10,
                '',
                {
                    fontSize: '32px',
                    fill: '#000000ff',
                    align: 'center',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    wordWrap: {
                        width: this.xCoord * 0.5,
                        useAdvancedWrap: true
                    }
                }
            )
            .setOrigin(0.5)
            .setDepth(51)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.timerToggleText.on('pointerdown', () => {
            const gs = window.globalGameState;
            gs.timerEnabled = !gs.timerEnabled;
            this.updateTimerToggleText();
        });

        this.livesToggleText = this.add
            .text(
                this.xCoord / 2,
                this.yCoord / 2 + 40,
                '',
                {
                    fontSize: '32px',
                    fill: '#000000ff',
                    align: 'center',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    wordWrap: {
                        width: this.xCoord * 0.5,
                        useAdvancedWrap: true
                    }
                }
            )
            .setOrigin(0.5)
            .setDepth(51)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.livesToggleText.on('pointerdown', () => {
            const gs = window.globalGameState;
            gs.livesEnabled = !gs.livesEnabled;
            this.updateLivesToggleText();
        });

        this.highContrastText = this.add
            .text(
                this.xCoord / 2,
                this.yCoord / 2 + 90,
                '',
                {
                    fontSize: '32px',
                    fill: '#000000ff',
                    align: 'center',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    wordWrap: {
                        width: this.xCoord * 0.5,
                        useAdvancedWrap: true
                    }
                }
            )
            .setOrigin(0.5)
            .setDepth(51)
            .setVisible(false)
            .setInteractive({ useHandCursor: true });

        this.highContrastText.on('pointerdown', () => {
            const gs = window.globalGameState;
            gs.highContrast = !gs.highContrast;
            this.updateHighContrastText();
        });

        this.closeSettingsBtn = this.add
            .text(
                this.xCoord / 2,
                this.yCoord / 2 + 250,
                'Close',
                {
                    fontSize: '42px',
                    fill: '#000000ff',
                    fontStyle: 'bold',
                    fontFamily: 'Arial'
                }
            )
            .setOrigin(0.5)
            .setDepth(52)
            .setVisible(false)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => this.closeSettingsBtn.setScale(1.1))
            .on('pointerout', () => this.closeSettingsBtn.setScale(1))
            .on('pointerdown', () => {this.hideSettingsMenu();});



        this.closeBtnUI = this.add
            .graphics()
            .fillStyle(0xc3c3c3, 1)
            .fillRoundedRect(this.xCoord / 2 - 125, this.yCoord / 2 + 209, 250, 82, 20)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(this.xCoord / 2 - 125, this.yCoord / 2 + 209, 250, 82, 20)
            .setDepth(51)
            .setVisible(false);

        this.updateSlowModeText();
        this.updateTimerToggleText();
        this.updateLivesToggleText();
        this.updateHighContrastText();
    }

    showSettingsMenu() {
        this.settingsPanel.setVisible(true);
        this.difficultyText.setVisible(true);
        this.updateDifficultyText();
        this.slowModeText.setVisible(true);
        this.timerToggleText.setVisible(true);
        this.livesToggleText.setVisible(true);
        this.highContrastText.setVisible(true);
        this.closeSettingsBtn.setVisible(true);
        this.closeBtnUI.setVisible(true);
        this.trophyBtn.disableInteractive();
        this.playBtn.disableInteractive();
        this.settingsBtn.disableInteractive();
    }

    hideSettingsMenu() {
        this.settingsPanel.setVisible(false);
        this.slowModeText.setVisible(false);
        this.difficultyText.setVisible(false);
        this.timerToggleText.setVisible(false);
        this.livesToggleText.setVisible(false);
        this.highContrastText.setVisible(false);
        this.closeSettingsBtn.setVisible(false);
        this.closeBtnUI.setVisible(false);
        this.trophyBtn.setInteractive();
        this.playBtn.setInteractive();
        this.settingsBtn.setInteractive();
    }

updateSlowModeText() {
    const gs = window.globalGameState;
    const label = gs.slowMode ? 'Slow Mode: ON' : 'Slow Mode: OFF (default)';
    if (this.slowModeText) {
        this.slowModeText.setText(label);
    }
}

updateTimerToggleText() {
    const gs = window.globalGameState;
    const label = gs.timerEnabled ? 'Timer: ON (default)' : 'Timer: OFF';
    if (this.timerToggleText) {
        this.timerToggleText.setText(label);
    }
}

updateLivesToggleText() {
    const gs = window.globalGameState;
    const label = gs.livesEnabled ? 'Lives: ON (default)' : 'Lives: OFF';
    if (this.livesToggleText) {
        this.livesToggleText.setText(label);
    }
}

updateHighContrastText() {
    const gs = window.globalGameState;
    const label = gs.highContrast ? 'High Contrast: ON' : 'High Contrast: OFF (default)';
    if (this.highContrastText) {
        this.highContrastText.setText(label);
    }
}

}
