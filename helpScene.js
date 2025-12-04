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

    // Preload placeholder audio for each help entry. Replace the file paths with
    // your specific audio clips when they are available.
    const helpAudioManifest = [
      { key: 'audio_bathroomSort', path: 'assets/HELP_BathroomSort.wav' },
      { key: 'audio_boxFlatten', path: 'assets/HELP_BoxFlatten.wav' },
      { key: 'audio_bugFriend', path: 'assets/HELP_BugFriend.wav' },
      { key: 'audio_catchRec', path: 'assets/HELP_CatchRecycle.wav' },
      { key: 'audio_compostSort', path: 'assets/HELP_CompostSort.wav' },
      { key: 'audio_fruitpicker', path: 'assets/HELP_Fruitpicker.wav' },
      { key: 'audio_leakyFaucet', path: 'assets/HELP_LeakyFaucet.wav' },
      { key: 'audio_closeLids', path: 'assets/HELP_CloseTheLids.wav' },
      { key: 'audio_oilWater', path: 'assets/HELP_OilAndWater.wav' },
      { key: 'audio_raccoon', path: 'assets/HELP_Raccoon.wav' },
      { key: 'audio_recycle', path: 'assets/HELP_Recycle.wav' }
    ];

    helpAudioManifest.forEach((entry) => {
      this.load.audio(entry.key, entry.path);
    });
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

    // --- RETURN TO START BUTTON ---
    const backButton = this.add
      .rectangle(this.xCoord - 120, 40, 200, 60, 0x1e88e5, 0.9)
      .setOrigin(0.5)
      .setStrokeStyle(3, 0xffffff)
      .setInteractive({ useHandCursor: true })
      .setScrollFactor(0);

    const backLabel = this.add
      .text(this.xCoord - 120, 40, 'Back to Start', {
        font: '20px Arial',
        fill: '#ffffff'
      })
      .setOrigin(0.5)
      .setScrollFactor(0);

    backButton
      .on('pointerover', () => backButton.setFillStyle(0x2196f3, 1))
      .on('pointerout', () => backButton.setFillStyle(0x1e88e5, 0.9))
      .on('pointerdown', () => {
        this.scene.start('startScreen');
      });


    // --- SCROLLING ---
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      this.cameras.main.scrollY += deltaY * 0.5;
    });

    const x = 140;     // text start
    const imgX = 60;   // image start

    // --- AUDIO PROMPT ---
    this.add
      .text(this.xCoord / 2, 10, 'Click on the blue button to read them out loud.', {
        font: '22px Arial',
        fill: '#ffffff',
        align: 'center'
      })
      .setOrigin(0.5, 0);

    let y = 80;        // top offset

    //---------------- HELP ENTRY FUNCTION ----------------
    const addHelpEntry = (title, desc, imageKey, audioKey) => {
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

      // audio play button
      const buttonX = this.xCoord - 120;
      const buttonY = y + 35;

      const playButton = this.add
        .rectangle(buttonX, buttonY, 50, 50, 0x1e88e5, 0.85)
        .setOrigin(0.5)
        .setStrokeStyle(2, 0xffffff)
        .setInteractive({ useHandCursor: true });

      const playIcon = this.add.polygon(buttonX, buttonY, [-8, -12, -8, 12, 14, 0], 0xffffff, 1);

      const playSound = () => {
        const cachedSound = this.sound.get(audioKey);

        if (cachedSound) {
          cachedSound.play({ seek: 0 });
          return;
        }

        if (this.cache.audio.has(audioKey)) {
          this.sound.add(audioKey).play({ seek: 0 });
        } else {
          console.warn(`Audio clip for ${title} was not found. Ensure it is loaded with key "${audioKey}".`);
        }
      };

      playButton
        .on('pointerover', () => playButton.setFillStyle(0x2196f3, 1))
        .on('pointerout', () => playButton.setFillStyle(0x1e88e5, 0.85))
        .on('pointerdown', playSound);

      // spacing
      y += 140;
    };

    //---------------- HELP ITEMS ----------------
    addHelpEntry(
      'Bathroom Sort',
      'Click and drag the object either into or away from the toilet.\nHINT: Only toilet items belong inside!',
      'toiletSort',
      'audio_bathroomSort'
    );

    addHelpEntry(
      'Box Flatten',
      'Click the boxes to flatten them, then drag them into the recycle bin.',
      'boxFlatten',
      'audio_boxFlatten'
    );

    addHelpEntry(
      'Bug Friend',
      'Protect your garden from invasive bugs. Squash the bad ones and protect the good ones.',
      'garden',
      'audio_bugFriend'
    );

    addHelpEntry(
      'Catch Recycle',
      'Click the object that does NOT belong in the recycle bin.\nHINT: Plastic bags!',
      'catchRec',
      'audio_catchRec'
    );

    addHelpEntry(
      'Compost Sort',
      'Drag compostable items into the compost box and others into the trash.',
      'compostSort',
      'audio_compostSort'
    );

    addHelpEntry(
      'Fruitpicker',
      'Don\'t let the fruit fall! Move the basket to catch them.',
      'catchFruit',
      'audio_fruitpicker'
    );

    addHelpEntry(
      'Leaky Faucet',
      'Water is leaking! Click to turn the wrench until the leak stops.',
      'leakyFaucet',
      'audio_leakyFaucet'
    );

    addHelpEntry(
      'Close The Lids',
      'Click the cans to close them before the wind blows them open.',
      'closeLids',
      'audio_closeLids'
    );

    addHelpEntry(
      'Oil And Water',
      'Sort the liquids into the correct containers.',
      'oilWater',
      'audio_oilWater'
    );

    addHelpEntry(
      'Raccoon',
      'Click the food before the raccoon grabs it.',
      'raccoon',
      'audio_raccoon'
    );

    addHelpEntry(
      'Recycle',
      'Drag each piece of trash into the correct bin.',
      'recycle',
      'audio_recycle'
    );
  }
}
