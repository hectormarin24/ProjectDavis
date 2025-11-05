// game4.js
export default class Game4 extends Phaser.Scene {
  constructor() { super('Game4'); }

  init(data) {
  this.W = data?.xCoord ?? 1000;
  this.H = data?.yCoord ?? 900;

  this.score = 0;
  this.strikes = 0;
  this.targetScore = 12;  
  this.maxStrikes = 5;
  }

  preload() {
    // Backgrounds
    this.load.image('bg_day',   'assets/game4assets/DayBG.png');  
    this.load.image('bg_night', 'assets/game4assets/NightBG.png');

    // Sprinklers + Water
    this.load.image('sprinkler', 'assets/game4assets/Sprinkler nbg.png');
    this.load.image('water',     'assets/game4assets/Water nbg.png');
  }

  create() {
    // --- Background image holder  ---
    this.bg = this.add.image(this.W / 2, this.H / 2, 'bg_day')
      .setOrigin(0.5)
      .setDepth(-20);

    // Scale background to cover screen
    const scaleX = this.W / this.bg.width;
    const scaleY = this.H / this.bg.height;
    this.bg.setScale(Math.max(scaleX, scaleY));

    // --- Instruction text ---
    this.instruction = this.add.text(this.W / 2, 36, '', {
      fontSize: '28px',
      fontStyle: 'bold',
      color: '#ffffff',
      fontFamily: 'system-ui',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    this.hud = this.add.text(this.W - 24, 24, '', {
  fontSize: '26px',
  color: '#ffffff',
  fontFamily: 'system-ui',
  stroke: '#000000',
  strokeThickness: 4,
  align: 'right'
}).setOrigin(1, 0);

this.updateHUD();

    // --- 4 sprinklers along the bottom ---
    const COUNT = 4;
    const BOTTOM_Y = this.H * 0.88;  
    const SIDE_MARGIN = 80;
    const TARGET_HEIGHT = 120;

    const usableW = this.W - SIDE_MARGIN * 2;
    const slotW = usableW / COUNT;

    this.sprinklers = [];
    for (let i = 0; i < COUNT; i++) {
      const x = SIDE_MARGIN + (i + 0.5) * slotW;

      const s = this.add.image(x, BOTTOM_Y, 'sprinkler')
        .setOrigin(0.5, 1);

      const srcS = this.textures.get('sprinkler').getSourceImage();
      s.setScale(TARGET_HEIGHT / srcS.height);

      this.sprinklers.push(s);
    }

    // --- Water sprites above each sprinkler ---
    this.waters = [];
    this.waterOn = this.sprinklers.map(() => true);
    const WATER_TARGET_H = 70;

    for (let i = 0; i < this.sprinklers.length; i++) {
      const s = this.sprinklers[i];
      const wx = s.x;
      const wy = s.y - s.displayHeight + 100; 
      const w = this.add.image(wx, wy, 'water')
        .setOrigin(0.5, 1)
        .setDepth(s.depth + 1)
        .setAlpha(0.2);

      const srcW = this.textures.get('water').getSourceImage();
      w.setScale(WATER_TARGET_H * 1.3 / srcW.height);
      this.waters.push(w);
    }

    // --- water blink ---
    this.tweens.killTweensOf(this.waters);
    this.waterBlink = { a: 0.5 };
    this.waterBlinkTween = this.tweens.add({
      targets: this.waterBlink,
      a: 0.95,
      duration: 300,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.InOut',
      onUpdate: () => {
        const alpha = this.waterBlink.a;
        this.waters.forEach((w, i) => {
          if (this.waterOn[i] && w.visible) w.setAlpha(alpha);
        });
      }
    });

    // --- Interactivity: hover + click toggles sprinkler's water ---
    this.setupSprinklerInteractivity();

    // --- Day/Night mode with random switch timings ---
    this.isDay = true; // start in day
    this.applyMode(true, true);

    // Switch cadence
    this.DAY_RANGE_MS = [4000, 6000];   // 4-6 sec of day
    this.NIGHT_RANGE_MS = [4000, 6000]; // 4-6 sec of night

    this.scheduleNextMode();
  }

  // Toggle hover + click per sprinkler
  setupSprinklerInteractivity() {
    this.sprinklers.forEach((sprinkler, i) => {
      sprinkler.setData('baseScale', sprinkler.scale);

      sprinkler.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          const base = sprinkler.getData('baseScale');
          sprinkler.setScale(base * 1.06);
          sprinkler.setTint(0x9ef7b5);
        })
        .on('pointerout', () => {
          const base = sprinkler.getData('baseScale');
          sprinkler.setScale(base);
          sprinkler.clearTint();
        })
        .on('pointerdown', () => {
          const nowOn = !this.waterOn[i];
          this.waterOn[i] = nowOn;

          const w = this.waters[i];
          if (!w) return;

          if (nowOn) {
            w.setVisible(true);
            // immediately sync alpha to shared blink value
            w.setAlpha(this.waterBlink ? this.waterBlink.a : 0.9);
          } else {
            w.setVisible(false);
          }
        });
    });
  }

  // Switch between Day/Night with fade + instruction update
  applyMode(day, instant = false) {
    this.isDay = day;
    const tex = day ? 'bg_day' : 'bg_night';

    // update instructions
    this.instruction.setText(day ? 'DAY: Turn sprinklers OFF' : 'NIGHT: Turn sprinklers ON');

    if (instant) {
      this.bg.setTexture(tex);
      return;
    }

    // fade out, swap, fade in
    this.tweens.add({
      targets: this.bg,
      alpha: 0,
      duration: 220,
      onComplete: () => {
        this.bg.setTexture(tex);
        // rescale in case textures differ
        const scaleX = this.W / this.bg.width;
        const scaleY = this.H / this.bg.height;
        this.bg.setScale(Math.max(scaleX, scaleY));
        this.tweens.add({ targets: this.bg, alpha: 1, duration: 220 });
      }
    });
  }
  updateHUD() {
  this.hud.setText(`Score: ${this.score}   Strikes: ${this.strikes}`);
}


phaseFeedback(requiredOn) {
  // requiredOn = true if night (ON required), false if day (OFF required)
  this.sprinklers.forEach((spr, i) => {
    const ok = (this.waterOn[i] === requiredOn);
    spr.setTint(ok ? 0x7fffb0 : 0xff7f7f);
  });
  this.time.delayedCall(300, () => {
    this.sprinklers.forEach(s => s.clearTint());
  });
}

// Evaluate all 4 at end of the current phase (before switching)
evaluatePhase() {
  // If it’s day *right now*, rule is OFF; if night, rule is ON.
  const requiredOn = !this.isDay;

  // count and score
  let correct = 0;
  for (let i = 0; i < this.waterOn.length; i++) {
    if (this.waterOn[i] === requiredOn) correct++;
  }
  const incorrect = this.waterOn.length - correct;

  // update tallies
  this.phaseFeedback(requiredOn);
  this.score += correct;
  this.strikes += incorrect;
  this.updateHUD();

  // end conditions
  if (this.score >= this.targetScore) {
    this.endGame(true);
    return false; 
  }
  if (this.strikes >= this.maxStrikes) {
    this.endGame(false);
    return false; 
  }
  return true;
}

// End Screen
endGame(won) {
  // Stop timers/tweens
  this.time.removeAllEvents();
  this.tweens.killAll();

  // Overlay
  this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0x000000, 0.55).setDepth(100);
  this.add.text(this.W/2, this.H/2 - 20, won ? 'You Win!' : 'Try Again', {
    fontSize: '64px',
    fontStyle: 'bold',
    color: '#ffffff',
    fontFamily: 'system-ui'
  }).setOrigin(0.5).setDepth(101);
  this.add.text(this.W/2, this.H/2 + 40, 'Tap to continue', {
    fontSize: '24px',
    color: '#ffffff',
    fontFamily: 'system-ui'
  }).setOrigin(0.5).setDepth(101);

  this.input.once('pointerdown', () => {
    // go to whatever scene you want next:
    this.scene.start('endScreen', { score: this.score });
  });
}


scheduleNextMode() {
  const [minMs, maxMs] = this.isDay ? this.DAY_RANGE_MS : this.NIGHT_RANGE_MS;
  const dur = Phaser.Math.Between(minMs, maxMs);

  this.time.delayedCall(dur, () => {
    // 1) Evaluate the phase you just finished
    const keepGoing = this.evaluatePhase();
    if (!keepGoing) return;

    // 2) Switch mode
    this.applyMode(!this.isDay, /*instant*/ false);

    // 3) Schedule next phase
    this.scheduleNextMode();
  });
}


}
