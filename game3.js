// game3.js (LeakyFaucet) — Fix the leaking faucet by tightening a wrench
// before the sink overflows.  Once the mini game ends, proceed to the next
// random scene from the global queue.

export default class LeakyFaucet extends Phaser.Scene {
  constructor() {
    super('LeakyFaucet');
  }

  init(data) {
    // Carry over coordinates from the previous scene.  Score is managed
    // globally and is not tracked here.
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    // Prevent multiple completions
    this.finished = false;
  }

  preload() {
    // Background and assets
    this.load.image('faucet_bg', 'assets/g3_bg.png');
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
    // HUD: display global time left and lives
    const screenW = this.scale.width;
    this.timerText = this.add
      .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
    this.livesText = this.add
      .text(screenW - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
      .setDepth(100);
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
        if (!this.gameOver && (timeLeft <= 0 || state.lives <= 0)) {
          this.gameOver = true;
          window.finishMiniGame(false, this);
        }
      },
      callbackScope: this,
    });

    const { width, height } = this.scale;
    // Background
    this.add
      .image(width / 2, height / 2, 'faucet_bg')
      .setOrigin(0.5)
      .setDisplaySize(width, height);
    // Sink
    this.sink = this.add.image(width * 0.5, height * 0.67, 'sink');
    this.sink.setScale(0.72).setOrigin(0.5, 0.5);
    // Faucet
    this.faucet = this.add.image(width * 0.5, height * 0.35, 'faucet');
    this.faucet.setScale(0.55).setOrigin(0.5, 0.5);
    // Wrench container and image for rotation
    const pivotX = this.faucet.x + this.faucet.displayWidth * 0.5;
    const pivotY = this.faucet.y - this.faucet.displayHeight * -0.06;
    this.wrenchContainer = this.add.container(pivotX, pivotY);
    this.wrench = this.add.image(0, 0, 'wrench');
    this.wrench.setScale(-0.4, 0.4);
    this.wrench.x = 10;
    this.wrench.y = 8;
    this.wrench.setAngle(-35);
    this.wrenchContainer.add(this.wrench);
    // Make wrench interactive
    this.wrench.setInteractive({ useHandCursor: true });
    this.wrench.on('pointerdown', () => this.animateRatcheting());
    // Keyboard controls
    this.input.keyboard.on('keydown', (e) => {
      if ((e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') && !this.keyHeld) {
        this.keyHeld = true;
        this.animateRatcheting();
      }
    });
    this.input.keyboard.on('keyup', (e) => {
      if (e.key.toLowerCase() === 'd' || e.key === 'ArrowRight') {
        this.keyHeld = false;
      }
    });
    // Droplet
    this.dropletStartY = this.faucet.y + this.faucet.displayHeight * 0.45;
    this.droplet = this.add.image(this.faucet.x, this.dropletStartY, 'droplet');
    this.droplet.setScale(0.25).setOrigin(0.5, 0);
    // Continuous drip
    // Drip frequency increases with difficulty.  Use a shorter delay as
    // difficulty rises.
    const difficulty = window.globalGameState?.difficulty || 1;
    this.dripTimer = this.time.addEvent({
      delay: 800 / difficulty,
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
        this.wrench.angle = -35;
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
    // Mark the game as over to stop further interactions
    this.gameOver = true;
    this.sink.setTexture(success ? 'sink' : 'sink_full');
    if (this.dripTimer) this.dripTimer.remove(false);
    // Darken screen and show result message
    this.add.rectangle(
      this.scale.width / 2,
      this.scale.height / 2,
      this.scale.width,
      this.scale.height,
      0x000000,
      0.6,
    );
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        success ? '✅ Leak Fixed!' : ' Sink Overflowed!',
        { font: '32px Arial', color: '#ffffff' },
      )
      .setOrigin(0.5);
    // After a short delay, invoke finishMiniGame to update global state
    this.time.delayedCall(1200, () => {
      window.finishMiniGame(success, this);
    });
  }
}