// endScreen.js — Display final score and allow the player to return to the
// menu.  This screen is shown after all mini games have been played.

export default class endScreen extends Phaser.Scene {
  constructor() {
    super('endScreen');
  }

  preload() {
    this.load.image('background', 'assets/background.webp');
  }

  init(data) {
    this.score = data?.score ?? 0;
    // Width and height may not always be passed.  Copy from data if
    // available; otherwise fall back to camera dimensions in create().
    this.xCoord = data?.xCoord;
    this.yCoord = data?.yCoord;
  }

  create() {
    // Use stored dimensions if present; otherwise use camera dimensions
    const w = this.xCoord || this.cameras.main.width;
    const h = this.yCoord || this.cameras.main.height;
    // Background fills the screen if the texture exists.  Fallback to
    // plain colour if missing.
    if (this.textures.exists('background')) {
      this.background = this.add
        .image(w / 2, h / 2, 'background')
        .setOrigin(0.5)
        .setDisplaySize(w, h);
    } else {
      this.cameras.main.setBackgroundColor(0x111111);
    }
    // Title and score text
    this.add
      .text(w / 2, h / 3, 'Game Over', {
        fontSize: '96px',
        fontStyle: 'bold',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    this.add
      .text(w / 2, h / 2, `Score: ${this.score}`, {
        fontSize: '64px',
        fontStyle: 'bold',
        fill: '#ffffff',
      })
      .setOrigin(0.5);
    // Menu button returns to the start screen
    const button = this.add
      .text(w / 2, (3 * h) / 4, 'Menu', {
        fontSize: '48px',
        fill: '#000',
        backgroundColor: '#cccccc',
        padding: { x: 20, y: 10 },
        align: 'center',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.scene.start('startScreen');
      });
  }
}