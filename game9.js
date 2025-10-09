

class Game9 extends Phaser.Scene {
  constructor() {
    super({ key: 'game9' });
    this.potContents = null; // "water" or "oil"
  }

  preload() {
    this.load.image('bg', 'assets/bg.png');           
    this.load.image('pot', 'assets/pot.png');         
    this.load.image('water', 'assets/liquid_water.png'); 
    this.load.image('oil', 'assets/liquid_oil.png');     
    this.load.image('sink', 'assets/sink.png');
    this.load.image('bucket', 'assets/bucket.png');
    this.load.image('button_next', 'assets/button_next.png');
    this.load.audio('pour', 'assets/pour.wav');
    this.load.audio('wrong', 'assets/wrong.wav');
  }

  create() {
    this.oilFillCount = 0;
    this.maxOilFills = 3;
    const cx = this.cameras.main.centerX;
    const cy = this.cameras.main.centerY;

    
    if (this.textures.exists('bg')) {
      this.add.image(cx, cy, 'bg').setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    } else {
      this.cameras.main.setBackgroundColor(0xf0f0f0);
    }

    // random pot contents
    this.potContents = (Math.random() < 0.5) ? 'water' : 'oil';
    console.log('Game9 potContents:', this.potContents);

    // targets...sink left, bucket right
    this.sink = this.add.image(cx - 270, cy + 60, 'sink').setInteractive({ cursor: 'pointer' });
    this.bucket = this.add.image(cx + 310, cy + 60, 'bucket').setInteractive({ cursor: 'pointer' });

    this.sink.setScale(0.2);
    this.bucket.setScale(0.2);

    // pot above center
    this.pot = this.add.image(cx, cy - 40, 'pot').setDepth(2);
    this.pot.setScale(0.3);

    // label showing pot content
    this.hintText = this.add.text(cx, cy - 150, 'Pot contains: ' + this.potContents, { font: '20px Arial', color: '#000' }).setOrigin(0.5);

    // invis "liquid" sprite used for pouring animation.
    const liquidKey = (this.potContents === 'water') ? 'water' : 'oil';
    this.liquid = this.add.image(this.pot.x, this.pot.y + 30, liquidKey).setOrigin(0.5, 0.5);
    this.liquid.setScale(0.3, 0.3);
    this.liquid.setAlpha(0); // start invis

    // Liquid filling after animation
    this.sinkFill = this.add.rectangle(this.sink.x, this.sink.y + 40, 120, 1, 0x3aa6ff).setOrigin(0.5, 1).setAlpha(0.9);
    this.bucketFill = this.add.rectangle(this.bucket.x, this.bucket.y + 60, 90, 1, 0x9b6b2b).setOrigin(0.5, 1).setAlpha(0.9);

    this.sinkFillHeight = 0;
    this.bucketFillHeight = 0;

    // text bottom
    this.message = this.add.text(cx, cy + 180, 'Click the correct container', { font: '20px Arial', color: '#222' }).setOrigin(0.5);

    this.pourSound = this.sound.add('pour', { volume: 0.1 });
    this.wrongSound = this.sound.add('wrong', { volume: 0.2 });

    // interactive
    this.sink.on('pointerdown', () => this.onTargetClicked('sink'));
    this.bucket.on('pointerdown', () => this.onTargetClicked('bucket'));
    
    // next button
    
    //this.nextBtn = this.add.image(cx, cy + 320, 'button_next').setInteractive({ cursor: 'pointer' }).setVisible(false);
    //this.nextBtn.setScale(0.4);
    //this.nextBtn.on('pointerdown', () => {
    //  this.nextBtn.setVisible(false);
    //  this.scene.start('startScreen'); // default: back to start screen; change as you like
    //});
    
    
    // keyboard testing
    this.input.keyboard.on('keydown-R', () => this.resetRound());
  }

  onTargetClicked(target) {
    // disable input while animating
    this.sink.disableInteractive();
    this.bucket.disableInteractive();

    const correctTarget = (this.potContents === 'water') ? 'sink' : 'bucket';
    const isCorrect = (target === correctTarget);

    if (isCorrect) {
      this.message.setText('Correct! Pouring...');
      this.pourTo(target);
    } else {
      this.message.setText('Wrong! Try again.');
      this.wrongSound.play();
      this.shakeTarget(target).then(() => {
        // re-enable after short delay
        this.sink.setInteractive({ cursor: 'pointer' });
        this.bucket.setInteractive({ cursor: 'pointer' });
      });
    }
  }

  handleOilFilled() {
  this.oilFillCount++;

  // quick message
  const cx = this.cameras.main.centerX;
  const cy = this.cameras.main.centerY - 200;
  const msg = this.add.text(cx, cy, `Liquid filled: ${this.oilFillCount}/${this.maxOilFills}`, {
    font: '30px Arial',
    fill: '#2f4f4f'
  }).setOrigin(0.5);
  // fade out after 1s
  this.tweens.add({
    targets: msg,
    alpha: 0,
    duration: 1900,
    onComplete: () => msg.destroy()
  });

  // decide whether to end the game
  if (this.oilFillCount >= this.maxOilFills) {
    this.endGame();
  } else {
    // proceed to next phase (previously you showed nextBtn here)
    // call any function that resets the level / spawns new pipes / shows instructions
    if (typeof this.startNextPhase === 'function') {
      this.startNextPhase();
    }
    // otherwise, put whatever logic used to run after the "next" event here.
  }
}



  pourTo(target) {
    const liquidKey = (this.potContents === 'water') ? 'water' : 'oil';
    // position liquid at rim of pot
    this.liquid.setTexture(liquidKey);
    this.liquid.setAlpha(1);
    this.liquid.x = this.pot.x;
    this.liquid.y = this.pot.y + 30;
    this.liquid.setScale(0.1, 0.1);

    // compute target world position (a point inside target)
    const targetX = (target === 'sink') ? this.sink.x : this.bucket.x;
    const targetY = (target === 'sink') ? (this.sink.y + 20) : (this.bucket.y + 10);

    // rotate pot a little toward chosen container
    const rotateAngle = (target === 'sink') ? -0.5 : 0.5; // radians
    this.tweens.add({
      targets: this.pot,
      angle: Phaser.Math.RadToDeg(rotateAngle),
      duration: 300,
      ease: 'Sine.easeOut'
    });

    // animate "pour"
    this.pourSound.play();

    this.tweens.add({
      targets: this.liquid,
      x: targetX,
      y: targetY,
      scaleX: 0.2,
      scaleY: 0.2,
      alpha: 0.2,
      duration: 800,
      ease: 'Cubic.easeIn',
      onComplete: () => {
        // increment the container fill representation
        if (target === 'sink') {
          this.sinkFillHeight = Phaser.Math.Clamp(this.sinkFillHeight + 30, 0, 100);
          this.sinkFill.height = this.sinkFillHeight;
          this.sinkFill.y = this.sink.y + 60; // align bottom
          this.sinkFill.setDisplaySize(120, this.sinkFillHeight);
        } else {
          this.bucketFillHeight = Phaser.Math.Clamp(this.bucketFillHeight + 30, 0, 100);
          this.bucketFill.height = this.bucketFillHeight;
          this.bucketFill.y = this.bucket.y + 80;
          this.bucketFill.setDisplaySize(90, this.bucketFillHeight);
        }

        // hide liquid and reset pot orientation
        this.tweens.add({
          targets: this.pot,
          angle: 0,
          duration: 200,
          ease: 'Sine.easeIn'
        });
        this.liquid.setAlpha(0);
        this.message.setText('Nice!');

        // show next button or finish
        this.time.delayedCall(600, () => {
          this.handleOilFilled();
        }, [], this);
      }
    });
  }

  shakeTarget(target) {
    return new Promise(resolve => {
      const obj = (target === 'sink') ? this.sink : this.bucket;
      this.tweens.add({
        targets: obj,
        x: obj.x + 8,
        duration: 60,
        yoyo: true,
        repeat: 3,
        onComplete: () => resolve()
      });
    });
  }

  resetRound() {
    // replay, broken
    this.potContents = (Math.random() < 0.5) ? 'water' : 'oil';
    this.hintText.setText('Pot contains: ' + this.potContents);
    this.message.setText('Click the correct container');
    this.sink.setInteractive({ cursor: 'pointer' });
    this.bucket.setInteractive({ cursor: 'pointer' });
    //this.nextBtn?.setVisible(false);
  }

  endGame() {
  // scene freeze
  if (this.physics && this.physics.pause) this.physics.pause();
  if (this.time && this.time.removeAllEvents) this.time.removeAllEvents();
  this.input.enabled = false;

  const cx = this.cameras.main.centerX;
  const cy = this.cameras.main.centerY;
  const style = { font: '48px Arial', fill: '#ffdddd', align: 'center' };
  //this.add.rectangle(cx, cy, 400, 140, 0x000000, 0.7).setOrigin(0.5);
  //this.add.text(cx, cy - 10, 'Game Over', style).setOrigin(0.5);
  //this.add.text(cx, cy + 35, 'Moving to menu...', { font: '16px Arial', fill: '#fff' }).setOrigin(0.5);

  // go back to menu or restart after a short delay
  this.time.delayedCall(1800, () => {
    this.scene.start('endScreen');
  });
}

  // if you need per-frame logic
  update() {}
}

// expose if using script tags. This allows using consol to jump to the game
if (typeof window !== 'undefined') {
  window.Game9 = Game9;
}
export default Game9;
