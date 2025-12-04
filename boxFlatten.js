// game5.js — Mini game where the player flattens cardboard boxes.  Each
// box requires a specific number of clicks to flatten.  The player must
// flatten five boxes within a time limit to win.  Difficulty reduces the
// time allowed for each box.  Wrong clicks or running out of time
// triggers a loss.  At the end, finishMiniGame() is called to update
// global score/lives and start the next random mini game.

export default class boxFlatten extends Phaser.Scene {
  constructor() {
    super('boxFlatten');
  }

  preload() {
    this.load.image('bigBox', 'assets/Big Box.png');
    this.load.image('mediumBox', 'assets/Medium Box.png');
    this.load.image('smallBox', 'assets/Small Box.png');
    this.load.image('flatBox', 'assets/flatBox.png');
    this.load.image('background', 'assets/background.webp');
  }

  init(data) {
    this.xCoord = data.xCoord;
    this.yCoord = data.yCoord;
    this.isGameOver = false;
    this.localScore = 0;
  // timer toggle
    this.timerEnabled = true;

    // Keyboard / selection state
    this.tabKey = null;
    this.spaceKey = null;
    this.boxSelected = false;
    this.highlight = null;

    // time bar data for per-box timer
    this.timeBarBg = null;
    this.timeBarFill = null;
    this.boxTimeTotal = 0;   // ms allowed for current box
    this.boxStartTime = 0;   // when current box started
  }

  create() {
  // Background
  this.add
    .image(this.xCoord / 3 + 20, this.yCoord / 2, 'background')
    .setOrigin(0.5);

  // HUD
  this.timerText = this.add
    .text(20, 20, '', { fontSize: '32px', fill: '#ffffff' })
    .setDepth(100);
  this.livesText = this.add
    .text(this.xCoord - 180, 20, '', { fontSize: '32px', fill: '#ffffff' })
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
      this.timerText.setText(
        `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
      );
      this.livesText.setText(`Lives: ${state.lives}`);
      if (!this.isGameOver && (timeLeft <= 0 || state.lives <= 0)) {
        this.isGameOver = true;
        window.finishMiniGame(false, this);
      }
    },
  });
  // ─────────────── Per-box Time Bar (top center) ───────────────
const barWidth = 300;
const barHeight = 14;
const barX = this.xCoord / 2 - barWidth / 2;
const barY = 120;

// Background of bar
this.timeBarBg = this.add.graphics().setDepth(90);
this.timeBarBg.fillStyle(0x000000, 0.6);
this.timeBarBg.fillRect(barX, barY, barWidth, barHeight);

// Fill of bar (changes as time passes)
this.timeBarFill = this.add.graphics().setDepth(91);

// ─────────────── Timer Toggle Button ───────────────
this.timerButton = this.add
  .text(this.xCoord - 16, 16, '', {
    fontSize: '20px',
    color: '#ffffff',
    backgroundColor: '#000000',
  })
  .setOrigin(1, 0)
  .setPadding(6, 4, 6, 4)
  .setDepth(999)
  .setInteractive({ useHandCursor: true });

this.timerButton.on('pointerup', () => {
  this.timerEnabled = !this.timerEnabled;
  this.updateTimerButtonText();

  if (!this.timerEnabled) {
    // Turn timer OFF: stop timer + clear bar
    if (this.boxTimer && this.boxTimer.remove) {
      this.boxTimer.remove();
      this.boxTimer = null;
    }
    this.redrawTimeBar(0);
  } else {
    // Turn timer ON: restart timer for the current box (full time again)
    if (this.current && this.boxTimeTotal > 0) {
      const delay = this.boxTimeTotal;
      if (this.boxTimer && this.boxTimer.remove) {
        this.boxTimer.remove();
      }
      this.boxTimer = this.time.delayedCall(delay, () => {
        if (!this.isGameOver && this.timerEnabled) {
          this.loseGame();
        }
      });
      this.boxStartTime = this.time.now;
      this.redrawTimeBar(1);
    }
  }
});


this.updateTimerButtonText();

  // text that explains required / remaining clicks
  this.clickInfoText = this.add
    .text(this.xCoord / 2, 80, '', {
      fontSize: '28px',
      fill: '#ffffff',
    })
    .setOrigin(0.5, 0.5)
    .setDepth(100);

  // Keyboard controls: Tab to select box, Space to "press" it
  this.tabKey = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.TAB
  );
  this.spaceKey = this.input.keyboard.addKey(
    Phaser.Input.Keyboard.KeyCodes.SPACE
  );

  // Spawn first box
  this.clickCount = 0;
  this.nextObject();
}

redrawTimeBar(fraction) {
  if (!this.timeBarFill) return;

  this.timeBarFill.clear();

  // If timer is off, bar should be empty
  if (!this.timerEnabled) return;

  const barWidth = 300;
  const barHeight = 14;
  const barX = this.xCoord / 2 - barWidth / 2;
  const barY = 120;

  const clamped = Phaser.Math.Clamp(fraction, 0, 1);

  this.timeBarFill.fillStyle(0x4caf50, 1); // green bar
  this.timeBarFill.fillRect(barX, barY, barWidth * clamped, barHeight);
}

  // Shared logic for clicking / pressing the current box
  handleBoxInteraction() {
  if (this.isGameOver || !this.current) return;

  this.clickCount++;

  // If the player clicks more than required, they lose
  if (this.clickCount > this.boxInfo.clicks) {
    if (this.clickInfoText) {
      this.clickInfoText.setText('Too many clicks! You squished it.');
    }
    this.loseGame();
    return;
  }

  // 🔹 NEW: update remaining clicks text
  const remaining = this.boxInfo.clicks - this.clickCount;
  if (this.clickInfoText) {
    if (remaining > 0) {
      const label =
        remaining === 1
          ? 'Press 1 more time to flatten this box'
          : `Press ${remaining} more times to flatten this box`;
      this.clickInfoText.setText(label);
    } else {
      // We just reached exact number, will flatten below
      this.clickInfoText.setText('Box flattened!');
    }
  }

  // If reached required number of clicks, flatten box
  if (this.clickCount === this.boxInfo.clicks) {
    const x = this.current.x;
    const y = this.current.y;
    const scale = this.boxInfo.scale;

    // Remove highlight before destroying
    if (this.highlight && this.highlight.destroy) {
      this.highlight.destroy();
      this.highlight = null;
    }

    // Replace with flattened box
    this.add.image(x, y, 'flatBox').setScale(scale / 3);

    this.current.destroy();
    this.current = null;
    this.localScore++;

    // Cancel existing timer for this box
    if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();

    if (this.localScore >= 5) {
      this.winGame();
    } else {
      this.nextObject();
    }
  }
}


  // Visual highlight for which box is selected via keyboard
updateBoxFocus() {
  // Remove any leftover highlight graphics (even if unused now)
  if (this.highlight && this.highlight.destroy) {
    this.highlight.destroy();
    this.highlight = null;
  }

  if (!this.current) return;

  if (this.boxSelected) {
    // BRIGHT GREEN TINT
    this.current.setTint(0x00ff00);   // bright neon green

    // Optional: even brighter filled tint version
    // this.current.setTintFill(0x00ff00);
  } else {
    this.current.clearTint();
  }
}





  update(time, delta) {
  if (this.isGameOver) return;

  // Keyboard: Tab select, Space press
  if (this.current && this.tabKey && this.spaceKey) {
    if (Phaser.Input.Keyboard.JustDown(this.tabKey)) {
      this.boxSelected = true;
      this.updateBoxFocus();
    }

    if (this.boxSelected && Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.handleBoxInteraction();
    }
  }

  // ─────────────── Per-box Time Bar ───────────────
  if (this.timerEnabled && this.current && this.boxTimeTotal > 0) {
    const elapsed = this.time.now - this.boxStartTime;
    const remaining = Math.max(0, this.boxTimeTotal - elapsed);
    const fraction = remaining / this.boxTimeTotal;
    this.redrawTimeBar(fraction);
  }
}



  nextObject() {
    if (this.current && this.current.destroy) {
      if (this.highlight && this.highlight.destroy) {
        this.highlight.destroy();
        this.highlight = null;
      }
      this.current.destroy();
    }

    // Choose a box type with required clicks
    const options = [
      { key: 'smallBox', scale: 0.5, clicks: 1 },
      { key: 'mediumBox', scale: 1, clicks: 2 },
      { key: 'bigBox', scale: 1.5, clicks: 3 },
    ];
    this.boxInfo = Phaser.Utils.Array.GetRandom(options);

    const x = Phaser.Math.Between(100, this.xCoord - 100);
    const y = Phaser.Math.Between(150, this.yCoord - 200);

    this.current = this.add
      .image(x, y, this.boxInfo.key)
      .setScale(this.boxInfo.scale)
      .setInteractive({ useHandCursor: true });

    // Reset click counter and selection
    this.clickCount = 0;
    this.boxSelected = false;
    this.updateBoxFocus();

    // show how many clicks are needed for this box
    if (this.clickInfoText) {
      const needed = this.boxInfo.clicks;
      const label = needed === 1
        ? 'Press 1 time to flatten this box'
        : `Press ${needed} times to flatten this box`;
    this.clickInfoText.setText(label);
    }

    // Mouse input: clicking the box
    this.current.on('pointerdown', () => {
      if (this.isGameOver) return;
      this.handleBoxInteraction();
    });

    // Start a timer for this box; lose if time runs out
    if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();
    const difficulty = window.globalGameState?.difficulty || 1;
const delay = 5000 / difficulty;

// Save timing info for this box
this.boxTimeTotal = delay;
this.boxStartTime = this.time.now;

// Clear any previous bar and draw full bar if timer is on
this.redrawTimeBar(1);

// Stop any old timer
if (this.boxTimer && this.boxTimer.remove) {
  this.boxTimer.remove();
  this.boxTimer = null;
}

// Only start the timer if timerEnabled is true
if (this.timerEnabled) {
  this.boxTimer = this.time.delayedCall(delay, () => {
    if (!this.isGameOver && this.timerEnabled) {
      this.loseGame();
    }
  });
}


  }
  startBoxTimer(delay) {
  if (this.boxTimer && this.boxTimer.remove) this.boxTimer.remove();

  this.boxTimer = this.time.delayedCall(delay, () => {
    if (!this.isGameOver && this.timerEnabled) {
      this.loseGame();
    }
  });

  // store timing data (for future things like time bars)
  this.boxTimeTotal = delay;
  this.boxStartTime = this.time.now;
}

updateTimerButtonText() {
  this.timerButton.setText(this.timerEnabled ? 'Timer: ON' : 'Timer: OFF');
}

  winGame() {
  if (this.isGameOver) return;
  this.isGameOver = true;

  // Stop per-box timer
  if (this.boxTimer && this.boxTimer.remove) {
    this.boxTimer.remove();
    this.boxTimer = null;
  }

  // CLEAR AND HIDE TIME BAR
  if (this.timeBarFill) {
    this.timeBarFill.clear();
    this.timeBarFill.setVisible(false);
  }
  if (this.timeBarBg) {
    this.timeBarBg.clear();
    this.timeBarBg.setVisible(false);
  }

  if (this.highlight && this.highlight.destroy) {
    this.highlight.destroy();
    this.highlight = null;
  }

  this.add
    .text(this.xCoord / 2, this.yCoord / 2, 'Great job!', {
      fontSize: '64px',
      fill: '#ffffff',
    })
    .setOrigin(0.5);

  this.time.delayedCall(800, () => {
    window.finishMiniGame(true, this);
  });
}


  loseGame() {
  if (this.isGameOver) return;
  this.isGameOver = true;

  // Stop per-box timer
  if (this.boxTimer && this.boxTimer.remove) {
    this.boxTimer.remove();
    this.boxTimer = null;
  }

  // CLEAR AND HIDE TIME BAR
  if (this.timeBarFill) {
    this.timeBarFill.clear();
    this.timeBarFill.setVisible(false);
  }
  if (this.timeBarBg) {
    this.timeBarBg.clear();
    this.timeBarBg.setVisible(false);
  }

  if (this.highlight && this.highlight.destroy) {
    this.highlight.destroy();
    this.highlight = null;
  }

  this.add
    .text(this.xCoord / 2, this.yCoord / 2, 'Oops!', {
      fontSize: '64px',
      fill: '#ffffff',
    })
    .setOrigin(0.5);

  this.time.delayedCall(800, () => {
    window.finishMiniGame(false, this);
  });
}

}
