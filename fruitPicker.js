/* global Phaser */
// ===========================================================
// Game12.js — Fruit Picker (Collect fruit before it spoils)
//
// This scene implements a mini-game where apples fall from a tree and the
// player must drag a basket to collect them before they spoil.  If any
// apple spoils, the player loses one life and the mini‑game ends after a
// brief delay, automatically advancing to the next randomized scene.
// The basket can be controlled with the mouse (drag) or with the A and D
// keys on the keyboard.  A status message appears when fruit spoils to
// reinforce why picking up fruit promptly is important.

export default class fruitPicker extends Phaser.Scene {
  constructor() {
    super('fruitPicker');
  }

  /**
   * Receive initial data such as accumulated score and screen dimensions.
   */
  init(data) {
    this.xCoord = data?.xCoord ?? this.scale.width;
    this.yCoord = data?.yCoord ?? this.scale.height;
    this.finalScore = data.score;
    this.lives = data.lives;
    this.difficulty = window.globalGameState?.difficulty ?? 1;
  }

  /**
   * Preload the assets required for this mini‑game.  Images are stored
   * within the project's assets folder.  A spoiled version of the apple is
   * used to visually indicate when the fruit has been ruined by bugs.
   */
  preload() {
    this.load.image('tree', 'assets/tree.png');
    this.load.image('basket', 'assets/basket.png');
    this.load.image('fruit', 'assets/apple.png');
    this.load.image('apple_spoiled', 'assets/apple_spoiled.png');
    this.load.image('bug', 'assets/bug.png');
    this.load.image('ff_bg', 'assets/fruit_field_bg.png');
  }

  /**
   * Create and configure all game objects, timers and input handlers.
   */
  create() {
    console.log('Game12 loaded');

    // Draw the background and tree.  The tree is purely decorative.
    this.add.image(this.xCoord / 2, this.yCoord / 2, 'ff_bg')
      .setDisplaySize(this.xCoord, this.yCoord);
    this.add.image(this.xCoord / 2, this.yCoord / 2.5, 'tree')
      .setScale(2);

    // Create the draggable basket.  Use Arcade physics so that we can
    // constrain movement easily and detect overlaps, but disable gravity.
    this.basket = this.add.image(this.xCoord / 2, this.yCoord - 100, 'basket')
      .setScale(1.2);
    this.physics.add.existing(this.basket);
    this.basket.body.setAllowGravity(false);
    this.basket.body.setImmovable(true);

    // Register keyboard input for A/D movement.  These keys allow
    // horizontal movement in addition to mouse dragging.
    this.keys = this.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Enable dragging of the basket with the mouse.  Limit its horizontal
    // movement to within the play area.
    this.basket.setInteractive({ draggable: true });
    this.input.setDraggable(this.basket);
    this.input.on('drag', (_, gameObject, dragX) => {
      gameObject.x = Phaser.Math.Clamp(dragX, 100, this.xCoord - 100);
    });

    // Initialise arrays for spawned fruit.  Difficulty influences spawn
    // speed and spoil delay.  Track how many fruits have been collected
    // this session to determine when to automatically end on success.
    this.fruits = [];
    this.fruitFallSpeed = 280 * this.difficulty;
    this.spawnDelay = 2200 / this.difficulty;
    this.fruitCaught = 0;
    this.basketSpeed = 400;

    // HUD: display timer and lives.  A transient message appears when
    // fruit spoils so players understand why they lost the mini‑game.
    this.timeLeft = 25;
    this.timerText = this.add.text(40, 40, `Time: ${this.timeLeft}`, {
      fontSize: '32px',
      color: '#fff',
    });
    this.livesText = this.add.text(this.xCoord - 180, 40, `Lives: ${this.lives}`, {
      fontSize: '32px',
      color: '#fff',
    });
    this.messageText = this.add.text(this.xCoord / 2, 80, '', {
      fontSize: '32px',
      color: '#ff4f4f',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Spawn fruits at regular intervals.  The spawn loop stops when the
    // mini‑game finishes early due to a spoiled fruit or time running out.
    this.spawnLoop = this.time.addEvent({
      delay: this.spawnDelay,
      callback: this.spawnFruit,
      callbackScope: this,
      loop: true,
    });

    // Countdown timer: decreases every second and ends the mini‑game if
    // time reaches zero.  The mini‑game can also end earlier if a fruit
    // spoils or enough fruits are collected.
    this.timerEvent = this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.timeLeft--;
        this.timerText.setText(`Time: ${this.timeLeft}`);
        if (this.timeLeft <= 0) {
          this.finish(true);
        }
      },
      loop: true,
    });
  }

  /**
   * Spawn a new fruit falling from the top of the screen.  When the fruit
   * touches the ground it stops moving and a spoil timer begins.  Fruits
   * are stored in an array so they can be checked for basket overlap in
   * update().
   */
  spawnFruit() {
    const fruitX = Phaser.Math.Between(150, this.xCoord - 150);
    const fruit = this.physics.add.image(fruitX, 150, 'fruit').setScale(1);
    fruit.setVelocityY(this.fruitFallSpeed);
    fruit.body.setAllowGravity(true);
    fruit.state = 'falling';
    fruit.isSpoiled = false;

    const groundY = this.yCoord - 130;
    // Continuously check if the fruit has reached the ground.  Once it
    // lands, freeze it and schedule it to spoil if not collected in time.
    this.time.addEvent({
      delay: 30,
      loop: true,
      callback: () => {
        if (!fruit.active) return;
        if (fruit.y >= groundY && fruit.state === 'falling') {
          fruit.y = groundY;
          fruit.body.setVelocity(0, 0);
          fruit.body.setAllowGravity(false);
          fruit.state = 'grounded';
          this.scheduleSpoil(fruit);
        }
      },
    });
    this.fruits.push(fruit);
  }

  /**
   * Schedule a fruit to spoil after a short delay.  The delay decreases
   * with higher difficulty to make the mini‑game progressively harder.
   */
  scheduleSpoil(fruit) {
    const spoilDelay = Phaser.Math.Clamp(2000 / this.difficulty, 700, 2000);
    this.time.delayedCall(spoilDelay, () => {
      if (fruit.active && fruit.state === 'grounded' && !fruit.isSpoiled) {
        this.spawnBugOnFruit(fruit);
      }
    });
  }

  /**
   * Spawn a bug directly on the apple to indicate it has spoiled.  The
   * message is shown and after a short delay the mini‑game ends with a
   * failure state.  No further fruit are processed once finish() is called.
   */
  spawnBugOnFruit(fruit) {
    if (!fruit.active) return;
    // Place the bug at the same coordinates as the fruit.  The bug is
    // decorative and does not need physics since it will be destroyed
    // shortly after.
    const bug = this.add.image(fruit.x, fruit.y, 'bug').setScale(1);
    fruit.setTexture('apple_spoiled');
    fruit.isSpoiled = true;
    this.showMessage('Fruit spoiled due to bugs!');
    // After a brief pause, end the mini‑game with failure.  Calling
    // finish(false) will deduct a life via finishMiniGame and move to
    // the next scene.  We intentionally do not call loseLife() here to
    // avoid decrementing lives twice (once here and once in finish()).
    this.time.delayedCall(2000, () => {
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

  /**
   * Update runs on every frame.  This method handles keyboard movement
   * for the basket and checks for collisions between the basket and
   * grounded, unspoiled fruit.  Collected fruits increase the score and
   * when enough are collected the mini‑game ends successfully.
   */
  update(_, delta) {
    // Keyboard controls: adjust basket position based on A/D keys.
    if (this.keys.left.isDown) {
      this.basket.x -= this.basketSpeed * (delta / 1000);
    } else if (this.keys.right.isDown) {
      this.basket.x += this.basketSpeed * (delta / 1000);
    }
    // Constrain basket within bounds.
    this.basket.x = Phaser.Math.Clamp(this.basket.x, 100, this.xCoord - 100);

    // Check for overlap between basket and each grounded fruit.  Only
    // collect fruit that have not spoiled.  If enough are collected,
    // finish the mini‑game successfully.
    for (const fruit of this.fruits) {
      if (fruit.active && fruit.state === 'grounded' && !fruit.isSpoiled) {
        const dist = Phaser.Math.Distance.Between(
          fruit.x,
          fruit.y,
          this.basket.x,
          this.basket.y
        );
        if (dist < 100) {
          this.collectFruit(fruit);
        }
      }
    }
  }

  /**
   * Remove a collected fruit, increase the score and check if enough
   * fruits have been caught to finish with success.  The message is
   * cleared when a fruit is collected.
   */
  collectFruit(fruit) {
    if (!fruit.active || fruit.isSpoiled) return;
    fruit.destroy();
    this.score += 100;
    this.fruitCaught++;
    this.clearMessage();
    // End successfully after collecting five fruits.  Adjust this
    // threshold as desired for game length.
    if (this.fruitCaught >= 5) {
      this.finish(true);
    }
  }

  /**
   * Display a temporary message to the player.  The message clears after
   * a short duration.  This is used to notify about spoiled fruit.
   */
  showMessage(text) {
    this.messageText.setText(text);
    this.time.delayedCall(1800, () => this.clearMessage());
  }

  /**
   * Clear any displayed message.  Called automatically after messages
   * expire or when a fruit is collected.
   */
  clearMessage() {
    this.messageText.setText('');
  }

  /**
   * Finish the mini‑game.  Remove timers and destroy sprites.  If
   * success is true, the next scene is loaded and the score is
   * incremented; otherwise a life is deducted and the next scene is
   * started.  Lives are managed via finishMiniGame, so local lives do
   * not need to be decremented here.
   */
  finish(success) {
    if (this.spawnLoop) {
      this.spawnLoop.remove();
    }
    if (this.timerEvent) {
      this.timerEvent.remove();
    }
    // Destroy remaining fruits.
    for (const f of this.fruits) {
      if (f && f.active) {
        f.destroy();
      }
    }

    this.scene.start('transitionScreen', {
        lives: this.lives,
        score: this.finalScore,
        xCoord: this.xCoord,
        yCoord: this.yCoord,
        won: true,
        elapsedTime: this.time.now
      });
  }
}