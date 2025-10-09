export default class LeakyFaucet extends Phaser.Scene {
    constructor() {
        super('LeakyFaucet');
    }

    preload() {
        // Preload image assets from the assets folder.  Ensure these files are
        // placed in `<project root>/assets`.
        this.load.image('faucet', 'assets/faucet.png');
        this.load.image('sink', 'assets/sink2.png');
        this.load.image('droplet', 'assets/droplet.png');
        this.load.image('wrench', 'assets/wrench.png');
    }

    create() {
        // Track game state
        this.waterLevel = 0;        // Logical water level (0–100)
        this.dripTimer = 0;         // Timer used for dripping cadence
        this.wrenchRotation = 0;    // Accumulated rotation of the wrench
        this.leakFixed = false;     // Flag set when leak is repaired
        this.gameOver = false;      // Flag set once game ends

        // Add the sink and faucet images to the scene.  Position them closer
        // together vertically so the gameplay feels more compact.  Scale the
        // sink slightly larger than before to better contain the rising water.
        const { width, height } = this.scale;
        this.sink = this.add.image(width * 0.5, height * 0.55, 'sink');
        // Increase the sink's scale so it appears larger on screen.
        this.sink.setScale(0.6);
        this.sink.setOrigin(0.5, 0.5);

        this.faucet = this.add.image(width * 0.5, height * 0.35, 'faucet');
        // Make the faucet larger as well for better visibility.
        this.faucet.setScale(0.55);
        this.faucet.setOrigin(0.5, 0.5);

        // Create a graphics object to draw the water level bar.  We reuse
        // this each frame instead of creating new rectangles.
        this.waterGraphics = this.add.graphics();

        // Add the wrench image.  The wrench will orbit the faucet instead of
        // sitting at a fixed location.  We'll compute its position dynamically
        // in update() based on its rotation.
        this.wrench = this.add.image(0, 0, 'wrench');
        // Enlarge the wrench so it looks substantial next to the faucet.
        this.wrench.setScale(0.4);
        this.wrench.setOrigin(0.5, 0.5);

        // Determine the radius of the wrench's orbit.  Use a proportion of
        // the faucet's width to produce a reasonable distance.  Store this
        // value on the scene for later use.
        // Determine the radius of the wrench's orbit.  Use a proportion of
        // the faucet's width to produce a reasonable distance.  Larger
        // multiplier draws the wrench closer to the faucet so it appears to
        // tighten the valve.
        this.wrenchRadius = this.faucet.displayWidth * 0.9;

        // Add a droplet that repeatedly falls from the faucet.  We'll reset
        // its position when it reaches the sink.  The starting Y offset is
        // relative to the faucet image.
        this.dropletStartY = this.faucet.y + (this.faucet.displayHeight * 0.5);
        this.droplet = this.add.image(this.faucet.x, this.dropletStartY, 'droplet');
        // Increase droplet size so it is more visible falling from the faucet.
        this.droplet.setScale(0.25);
        this.droplet.setOrigin(0.5, 0);

        // Set up keyboard input handlers for rotating the wrench.  We bind
        // the handler to the scene so `this` refers to the scene instance.
        this.input.keyboard.on('keydown', this.handleKey, this);

        // Position the wrench initially based on the current rotation state.
        this.updateWrenchPosition();
    }

    /**
     * Respond to key presses.  The left arrow or 'A' rotates the wrench
     * counter‑clockwise; the right arrow or 'D' rotates it clockwise.  Once
     * the accumulated rotation reaches ±360 degrees the leak is considered
     * fixed and the game ends successfully.
     *
     * @param {KeyboardEvent} e The key event
     */
    handleKey(e) {
        if (this.gameOver) return;
        const key = e.key;
        if (key === 'ArrowRight' || key.toLowerCase() === 'd') {
            this.wrenchRotation += 15;
        } else if (key === 'ArrowLeft' || key.toLowerCase() === 'a') {
            this.wrenchRotation -= 15;
        }

        // Check if the wrench has completed a full rotation
        if (Math.abs(this.wrenchRotation) >= 360) {
            this.leakFixed = true;
            this.endGame(true);
        }
    }

    update() {
        if (this.gameOver) return;

        // Update the wrench sprite's angle so the user sees it rotate
        // Position the wrench around the faucet and rotate it to follow the
        // current rotation state.  This call sets both its position and
        // orientation so that it visually orbits the faucet as the user
        // turns it.
        this.updateWrenchPosition();

        // Drip logic: move the droplet downward; when it reaches the sink,
        // reset it to the faucet and increment the water level.  As the
        // water level rises we update the blue bar.  If it reaches the
        // threshold the game ends with a failure.
        const sinkBottomY = this.sink.y + (this.sink.displayHeight * 0.3);
        this.droplet.y += 4;
        if (this.droplet.y >= sinkBottomY) {
            this.droplet.y = this.dropletStartY;
            this.waterLevel += 2; // Increase the logical water level
            if (this.waterLevel >= 100 && !this.leakFixed) {
                this.endGame(false);
            }
        }

        // Draw water level bar inside the sink.  We map the water level (0–100)
        // to a pixel height.  The bar originates from the bottom of the sink
        // and grows upward as the level rises.
        this.waterGraphics.clear();
        const barWidth = this.sink.displayWidth * 0.5;
        const barHeightMax = this.sink.displayHeight * 0.4;
        const waterHeight = (this.waterLevel / 100) * barHeightMax;
        const barX = this.sink.x - barWidth / 2;
        const barY = (this.sink.y + this.sink.displayHeight * 0.2) - waterHeight;
        this.waterGraphics.fillStyle(0x4fc3f7);
        this.waterGraphics.fillRect(barX, barY, barWidth, waterHeight);
    }

    /**
     * Called when the game has ended.  Displays a translucent overlay
     * and a result message and then transitions to the `endScreen` scene
     * after a short delay.
     *
     * @param {boolean} success Whether the leak was fixed before overflow
     */
    endGame(success) {
        this.gameOver = true;
        // Dark overlay
        this.add.rectangle(
            this.scale.width / 2,
            this.scale.height / 2,
            this.scale.width,
            this.scale.height,
            0x000000,
            0.6
        );
        // Result text
        const message = success ? '✅ Leak Fixed!' : '💦 Sink Overflowed!';
        this.add.text(
            this.scale.width / 2,
            this.scale.height / 2,
            message,
            {
                font: '32px Arial',
                color: '#ffffff',
            }
        ).setOrigin(0.5);
        // After 2 seconds transition to the end screen
        this.time.delayedCall(2000, () => {
            this.scene.start('endScreen');
        });
    }

    /**
     * Updates the wrench's position and orientation based on the current
     * rotation state.  The wrench orbits around the faucet at a fixed
     * radius and is rotated tangentially so it appears to be tightening
     * the valve.  Called from update() and after initial creation.
     */
    updateWrenchPosition() {
        // Convert the stored rotation (degrees) to radians for trig functions.
        const angleRad = Phaser.Math.DegToRad(this.wrenchRotation);
        // Compute the wrench's centre based on the faucet position and orbit radius.
        const x = this.faucet.x + Math.cos(angleRad) * this.wrenchRadius;
        const y = this.faucet.y + Math.sin(angleRad) * this.wrenchRadius;
        this.wrench.setPosition(x, y);
        // Rotate the wrench so it stays tangential to its orbit.  Add 90 degrees
        // so that the wrench's jaws face inward towards the faucet.
        this.wrench.setAngle(this.wrenchRotation + 90);
    }
}