export default class helpScene extends Phaser.Scene {
  constructor() {
    super('helpScene');
  }

  preload() {
    this.load.image('help_bg', 'assets/help_bg.jpg');
    this.load.image('boxFlatten', 'assets/help_boxFlatten.png');
    this.load.image('catchRec', 'assets/help_catchRec.png');
    this.load.image('catchFruit', 'assets/help_catchFruit.png');
    this.load.image('closeLids', 'assets/help_closeLids.png');
    this.load.image('compostSort', 'assets/help_compostSort.png');
    this.load.image('garden', 'assets/help_garden.png');
    this.load.image('leakyFaucet', 'assets/help_leakyFaucet.png');
    this.load.image('oilWater', 'assets/help_OilVWater.png');
    this.load.image('raccoon', 'assets/help_raccoon.png');
    this.load.image('recycle', 'assets/help_recycle.png');
    this.load.image('toiletSort', 'assets/help_toiletSort.png');
  }

  init(data) {
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.score = data.score;
    this.lives = data.lives;
  }

  create() {

    // --- BACKGROUND (fallback to orange if missing image) ---
    if (this.textures.exists('help_bg')) {
      this.add.image(this.xCoord / 2, this.yCoord / 2, 'help_bg')
        .setOrigin(0.5)
        .setDisplaySize(this.xCoord, this.yCoord);
    } else {
      this.cameras.main.setBackgroundColor('#0d7729'); // orange
    }

    // --- SCROLLING ---
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.cameras.main.scrollY += deltaY * 0.5;
    });

    const x = 140;     // text start
    const imgX = 60;   // image start
    let y = 40;        // top offset

    //---------------- HELP ENTRY FUNCTION ----------------
    const addHelpEntry = (title, desc, imageKey) => {
      // image
      this.add.image(imgX, y + 20, imageKey).setOrigin(0.5).setDisplaySize(80, 80);

      // title
      this.add.text(x, y, title, {
        font: '32px Arial',
        fill: '#ffffff'
      });

      // description
      this.add.text(x, y + 35, desc, {
        font: '16px Arial',
        fill: '#ffffff'
      });

      // spacing
      y += 140;
    };

    //---------------- HELP ITEMS ----------------
    addHelpEntry(
      'Bathroom Sort',
      'Click and drag the object either into or away from the toilet.\nHINT: Only toilet items belong inside!',
      'toiletSort'
    );

    addHelpEntry(
      'Box Flatten',
      'Click the boxes to flatten them, then drag them into the recycle bin.',
      'boxFlatten'
    );

    addHelpEntry(
      'Bug Friend',
      'Protect your garden from invasive bugs. Squash the bad ones and protect the good ones.',
      'garden'
    );

    addHelpEntry(
      'Catch Recycle',
      'Click the object that does NOT belong in the recycle bin.\nHINT: Plastic bags!',
      'catchRec'
    );

    addHelpEntry(
      'Compost Sort',
      'Drag compostable items into the compost box and others into the trash.',
      'compostSort'
    );

    addHelpEntry(
      'Fruitpicker',
      'Don\'t let the fruit fall! Move the basket to catch them.',
      'catchFruit'
    );

    addHelpEntry(
      'Leaky Faucet',
      'Water is leaking! Click to turn the wrench until the leak stops.',
      'leakyFaucet'
    );

    addHelpEntry(
      'Close The Lids',
      'Click the cans to close them before the wind blows them open.',
      'closeLids'
    );

    addHelpEntry(
      'Oil And Water',
      'Sort the liquids into the correct containers.',
      'oilWater'
    );

    addHelpEntry(
      'Raccoon',
      'Click the food before the raccoon grabs it.',
      'raccoon'
    );

    addHelpEntry(
      'Recycle',
      'Drag each piece of trash into the correct bin.',
      'recycle'
    );
  }
}
