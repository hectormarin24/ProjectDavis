export default class LeakyFaucet extends Phaser.Scene {
    constructor() {
        super('LeakyFaucet');
    }

    preload() {
        // No assets needed for now — using Phaser Graphics
    }

    create() {
        // Game state
        this.waterLevel = 0;
        this.dripTimer = 0;
        this.wrenchRotation = 0;
        this.leakFixed = false;
        this.gameOver = false;

        // Graphics object for drawing
        this.graphics = this.add.graphics();

        // Keyboard input
        this.input.keyboard.on('keydown', this.handleKey, this);
    }

    handleKey(e) {
        if (this.gameOver) return;

        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            this.wrenchRotation += 15;
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            this.wrenchRotation -= 15;
        }

        // Fix leak when rotated enough
        if (Math.abs(this.wrenchRotation) >= 360) {
            this.leakFixed = true;
            this.endGame(true);
        }
    }

    update() {
        if (this.gameOver) return;

        this.dripTimer++;

        // Every few frames, add water if not fixed
        if (!this.leakFixed && this.dripTimer % 40 === 0) {
            this.waterLevel += 0.5;
            if (this.waterLevel >= 100) {
                this.endGame(false);
            }
        }

        this.drawScene();
    }

    drawScene() {
        const g = this.graphics;
        g.clear();

        // Background
        g.fillStyle(0x222222);
        g.fillRect(0, 0, this.game.config.width, this.game.config.height);

        // Faucet
        g.fillStyle(0x555555);
        g.fillRect(160, 50, 80, 20);
        g.fillRect(195, 20, 10, 30);

        // Sink
        g.fillStyle(0xb0bec5);
        g.fillRect(120, 200, 160, 40);

        // Water
        g.fillStyle(0x4fc3f7);
        g.fillRect(120, 240 - this.waterLevel, 160, this.waterLevel);

        // Wrench (rotating visually)
        const wrenchX = 300;
        const wrenchY = 130;
        const length = 80;
        const angle = Phaser.Math.DegToRad(this.wrenchRotation);

        const x1 = wrenchX - (length / 2) * Math.cos(angle);
        const y1 = wrenchY - (length / 2) * Math.sin(angle);
        const x2 = wrenchX + (length / 2) * Math.cos(angle);
        const y2 = wrenchY + (length / 2) * Math.sin(angle);

        g.lineStyle(8, 0x8d6e63);
        g.beginPath();
        g.moveTo(x1, y1);
        g.lineTo(x2, y2);
        g.strokePath();
        g.fillStyle(0x8d6e63);
        g.fillCircle(x2, y2, 12);
    }

    endGame(success) {
        this.gameOver = true;

        // Overlay
        this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.6
        );

        // Text message
        this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            success ? '✅ Leak Fixed!' : '💦 Sink Overflowed!',
            {
                font: '22px Arial',
                color: '#ffffff',
            }
        ).setOrigin(0.5);
    }
}
