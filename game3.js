export default class LeakyFaucet extends Phaser.Scene {
    constructor() {
        super('LeakyFaucet');
    }

    preload() {
        // load assets here if needed
    }

    create() {
        this.waterLevel = 0;
        this.dripTimer = 0;
        this.wrenchRotation = 0;
        this.leakFixed = false;

        this.graphics = this.add.graphics();
        this.input.keyboard.on('keydown', this.handleKey, this);
    }

    handleKey(e) {
        if (this.leakFixed) return;

        if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
            this.wrenchRotation += 15;
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
            this.wrenchRotation -= 15;
        }

        if (Math.abs(this.wrenchRotation) >= 360) {
            this.leakFixed = true;
            this.endGame(true);
        }
    }

    update() {
        if (this.leakFixed) return;

        this.dripTimer++;
        if (this.dripTimer % 40 === 0) {
            this.waterLevel += 0.5;
            if (this.waterLevel >= 100) this.endGame(false);
        }

        this.drawScene();
    }

    drawScene() {
        const g = this.graphics;
        g.clear();

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

        // Wrench
        g.save();
        g.translate(300, 130);
        g.rotate((this.wrenchRotation * Math.PI) / 180);
        g.fillStyle(0x8d6e63);
        g.fillRect(-40, -10, 80, 20);
        g.fillCircle(40, 0, 12);
        g.restore();
    }

    endGame(success) {
        this.add.rectangle(200, 150, 400, 300, 0x000000, 0.6);
        this.add.text(200, 150, success ? '✅ Leak Fixed!' : '💦 Sink Overflowed!', {
            font: '22px Arial',
            color: '#fff',
        }).setOrigin(0.5);
    }
}
