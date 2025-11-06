export default class LeakyFaucet extends Phaser.Scene {
    constructor() {
        super('LeakyFaucet');
    }

    init(data) {
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
    }

    preload() {
        // --- Background ---
        this.load.image('background', 'assets/g3_bg.png');

        // --- Game assets ---
        this.load.image('faucet', 'assets/faucet.png');
        this.load.image('sink', 'assets/sink.png');
        this.load.image('sink_25', 'assets/sink_25.png');
        this.load.image('sink_50', 'assets/sink_50.png');
        this.load.image('sink_75', 'assets/sink_75.png');
        this.load.image('sink_full', 'assets/sink_full.png');
        this.load.image('droplet', 'assets/droplet.png');
        this.load.image('wrench', 'assets/wrench.png');
    }

    create() {
        this.waterLevel = 0;
        this.leakFixed = false;
        this.gameOver = false;
        this.keyHeld = false;
        this.isAnimating = false;
        this.tightenCount = 0;

        const { width, height } = this.scale;

        // --- Background ---
        this.add
            .image(width / 2, height / 2, 'background')
            .setOrigin(0.5)
            .setDisplaySize(width, height); // scale to fill canvas

        // --- Sink (larger and lower) ---
        this.sink = this.add.image(width * 0.5, height * 0.67, 'sink');
        this.sink.setScale(0.72).setOrigin(0.5, 0.5);

        // --- Faucet ---
        this.faucet = this.add.image(width * 0.5, height * 0.35, 'faucet');
        this.faucet.setScale(0.55).setOrigin(0.5, 0.5);

        // --- Pivot tuned for proper jaw wrap on faucet edge ---
        const pivotX = this.faucet.x + this.faucet.displayWidth * 0.50;
        const pivotY = this.faucet.y - this.faucet.displayHeight * -0.06;
        this.wrenchContainer = this.add.container(pivotX, pivotY);

        // --- Add wrench image ---
        this.wrench = this.add.image(0, 0, 'wrench');
        this.wrench.setScale(-0.4, 0.4);
        this.wrench.x = 10;
        this.wrench.y = 8;
        this.wrench.setAngle(-35);
        this.wrenchContainer.add(this.wrench);

        // --- Make wrench interactive ---
        this.wrench.setInteractive({ useHandCursor: true });
        this.wrench.on('pointerdown', () => this.animateRatcheting());

        // --- Keyboard input ---
        this.input.keyboard.on('keydown', (e) => {
            if ((e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') && !this.keyHeld) {
                this.keyHeld = true;
                this.animateRatcheting();
            }
        });
        this.input.keyboard.on('keyup', (e) => {
            if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') this.keyHeld = false;
        });

        // --- Droplet ---
        this.dropletStartY = this.faucet.y + this.faucet.displayHeight * 0.45;
        this.droplet = this.add.image(this.faucet.x, this.dropletStartY, 'droplet');
        this.droplet.setScale(0.25).setOrigin(0.5, 0);

        // --- Continuous drip loop ---
        this.dripTimer = this.time.addEvent({
            delay: 800,
            loop: true,
            callback: this.drip,
            callbackScope: this,
        });
    }

    animateRatcheting() {
        if (this.gameOver || this.isAnimating) return;
        this.isAnimating = true;

        this.tweens.add({
            targets: this.wrench,
            angle: this.wrench.angle + 25,
            duration: 180,
            ease: 'Sine.easeOut',
            yoyo: true,
            repeat: 0,
            onYoyo: () => {
                this.tightenCount++;
                if (this.tightenCount >= 6) {
                    this.leakFixed = true;
                    this.endGame(true);
                }
            },
            onComplete: () => {
                this.wrench.angle = -35; // resets to correct start position
                this.isAnimating = false;
            },
        });
    }

    drip() {
        if (this.gameOver || this.leakFixed) return;

        const sinkTopY = this.sink.y - this.sink.displayHeight * 0.05;
        this.droplet.y = this.dropletStartY;
        this.droplet.alpha = 1;

        this.tweens.add({
            targets: this.droplet,
            y: sinkTopY,
            duration: 700,
            ease: 'Quad.easeIn',
            onComplete: () => {
                this.increaseWater();
                this.droplet.alpha = 0;
            },
        });
    }

    increaseWater() {
        this.waterLevel += 5;
        if (this.waterLevel >= 100 && !this.leakFixed) {
            this.endGame(false);
            return;
        }

        if (this.waterLevel >= 75) this.sink.setTexture('sink_75');
        else if (this.waterLevel >= 50) this.sink.setTexture('sink_50');
        else if (this.waterLevel >= 25) this.sink.setTexture('sink_25');
        else this.sink.setTexture('sink');
    }

    endGame(success) {
        this.gameOver = true;
        this.sink.setTexture(success ? 'sink' : 'sink_full');

        if (this.dripTimer) this.dripTimer.remove(false);

        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.6
        );

        this.add
            .text(
                this.scale.width / 2,
                this.scale.height / 2,
                success ? '✅ Leak Fixed!' : '💦 Sink Overflowed!',
                { font: '32px Arial', color: '#ffffff' }
            )
            .setOrigin(0.5);

        this.time.delayedCall(2000, () => {
            this.scene.start('Game5', { xCoord: this.xCoord, yCoord: this.yCoord });
        });
    }
}
