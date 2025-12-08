// game6.js — Clean version with:
// ✔ Correct life system
// ✔ Correct compost-bin hitbox
// ✔ Working keyboard controls
// ✔ Working drag/space
// ✔ No debug visuals

const FRUIT_KEYS = [
    'banana','black-berry-dark','coconut','green-apple','green-grape',
    'lemon','lime','orange','peach','pear','strawberry','watermelon'
];

const PLASTIC_KEYS = ['bag','bottle','cup','Tray','utensil'];

export default class compostSort extends Phaser.Scene {
    constructor() { super('compostSort'); }

    init(data) {
        this.W = data?.xCoord ?? 1000;
        this.H = data?.yCoord ?? 900;

        this.activePiece = null;
        this.spawnQueued = false;

        this.score = 0;
        this.targetScore = 5;
        this.gameOver = false;

        this.finalScore = data?.score ?? 0;

        this.lives = data.lives;

        this.keyMoveSpeedX = 14;
        this.keyMoveSpeedY = 22;
    }

    preload() {
        FRUIT_KEYS.forEach(n => this.load.image(n, `assets/game6assets/${n}.png`));
        PLASTIC_KEYS.forEach(n => this.load.image(n, `assets/game6assets/${n}.png`));

        this.load.image('garden_bg','assets/game6assets/garden.webp');
        this.load.image('compost_bin_img','assets/game6assets/compostbin.png');
    }

    create() {
        const gs = window.globalGameState || {};
        // Background
        const bg = this.add.image(this.W/2, this.H/2, 'garden_bg')
            .setOrigin(0.5)
            .setDepth(-10);
        bg.setScale(Math.max(this.W / bg.width, this.H / bg.height));

        this.scoreText = this.add.text(this.W/2,20,`Score: 0/${this.targetScore}`,{
            fontSize: '28px',
            fill: '#000000ff', 
            fontStyle: 'bold'
        })
        .setOrigin(0.5, 0)
        .setDepth(51);

        this.missPanel = this.add
            .graphics()
            .fillStyle(0xf9cb9c, 1)
            .fillRoundedRect(this.W / 2 - 110, 9, 220, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(this.W  / 2 - 110, 9, 220, 50)
            .setDepth(50);

        this.timerText = this.add.text(20, 20, '', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' }).setDepth(51);

        this.timerPanel = this.add
            .graphics()
            .fillStyle(0xf9cb9c, 1)
            .fillRoundedRect(5, 9, 200, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(5, 9, 200, 50)
            .setDepth(50);

        this.livesText = this.add.text(this.W - 170, 20, '', { fontSize: '28px', fill: '#000000ff', fontStyle: 'bold' }).setDepth(51);

        this.livesPanel = this.add
            .graphics()
            .fillStyle(0xf9cb9c, 1)
            .fillRoundedRect(this.W - 190, 9, 180, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(this.W - 190, 9, 180, 50)
            .setDepth(50);

        this.message = this.add
            .text(this.W / 2, 103, 'Drag the fruits into the compost bin and don\'t let the garbage fall in.', {
                font: '26px Arial',
                color: '#111',
                align: 'center',
                wordWrap: { width: this.scale.width - 80 },
            })
            .setOrigin(0.5, 0.5).setDepth(51);

        this.messagePanel = this.add
            .graphics()
            .fillStyle(0xffffff, 1)
            .fillRoundedRect(this.W / 2 - 400, 78, 800, 50)
            .lineStyle(4, 0x000000, 1)
            .strokeRoundedRect(this.W / 2 - 400, 78, 800, 50)
            .setDepth(50);

        if (!gs.timerEnabled) {this.timerText.setVisible(false); this.timerPanel.setVisible(false);}
        if (!gs.livesEnabled) {this.livesText.setVisible(false); this.livesPanel.setVisible(false);}

        this.time.addEvent({
            delay: 200,
            loop: true,
            callback: () => {
                const state = window.globalGameState;
                const elapsed = this.time.now - state.startTime;
                const timeLeft = Math.max(0, state.totalTime - elapsed);
                const minutes = Math.floor(timeLeft / 60000);
                const seconds = Math.floor((timeLeft % 60000) / 1000);

                if (state.timerEnabled)
                    this.timerText.setText(
                        `Time: ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
                    );

                if (state.livesEnabled)
                    this.livesText.setText(`Lives: ${state.lives}`);

                if (!this.isGameOver && state.livesEnabled && state.lives <= 0) {
                    this.isGameOver = true;
                    window.finishMiniGame(false, this, 0);
                }
            },
        });

        // Compost bin (unchanged placement)
        this.bin = this.add.image(this.W/2, this.H - 110, 'compost_bin_img')
            .setScale(1.4)
            .setOrigin(0.5);

        // Compute hitbox once
        this.computeHitbox();

        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            A:'A', D:'D',
            LEFT:'LEFT', RIGHT:'RIGHT',
            S:'S', DOWN:'DOWN',
            SPACE:'SPACE'
        });

        this.spawnNextPiece();
    }

    // --------------------------------------------------------
    // COMPOST BIN HITBOX — matches the FULL bin image
    // --------------------------------------------------------
    computeHitbox() {
        const bw = this.bin.displayWidth;
        const bh = this.bin.displayHeight;

        this.hitLeft   = this.bin.x - bw / 2;
        this.hitRight  = this.bin.x + bw / 2;
        this.hitTop    = this.bin.y - bh / 2;
        this.hitBottom = this.bin.y + bh / 2;
    }

    touchesBin(item) {
        const x = item.x;
        const y = item.y;

        return (
            x >= this.hitLeft &&
            x <= this.hitRight &&
            y >= this.hitTop &&
            y <= this.hitBottom
        );
    }

    // --------------------------------------------------------
    // GAME LOGIC
    // --------------------------------------------------------

    spawnNextPiece() {
        if (this.gameOver) return;

        if (this.activePiece) {
            this.stopStepFall(this.activePiece);
            this.activePiece.destroy();
        }

        const isFruit = Math.random() < 0.6;
        const x = Phaser.Math.Between(this.W * 0.25, this.W * 0.75);
        const y = this.H * 0.20;

        const piece = isFruit ? this.makeFruit(x, y) : this.makePlastic(x, y);

        this.makeDraggable(piece);
        this.startStepFall(piece);

        this.activePiece = piece;
    }

    makeFruit(x, y) {
        const key = Phaser.Utils.Array.GetRandom(FRUIT_KEYS);
        const img = this.add.image(x, y, key);

        const src = this.textures.get(key).getSourceImage();
        img.setScale(120 / Math.max(src.width, src.height));
        img.setData('type', 'compost');

        return img;
    }

    makePlastic(x, y) {
        const key = Phaser.Utils.Array.GetRandom(PLASTIC_KEYS);
        const img = this.add.image(x, y, key);

        const src = this.textures.get(key).getSourceImage();
        img.setScale(140 / Math.max(src.width, src.height));
        img.setData('type', 'noncomp');

        return img;
    }

    startStepFall(item) {
        const STEP = 28;
        const TIME = 160;
        const PAUSE = 480;

        const fall = () => {
            if (!item.active || item.getData('dragging') || this.gameOver)
                return;

            // BIN → resolve
            if (this.touchesBin(item)) {
                this.resolveBinContact(item, true);
                return;
            }

            // FLOOR → resolve
            if (item.y >= this.H - 40) {
                this.resolveBinContact(item, false);
                return;
            }

            const nextY = item.y + STEP;

            const tween = this.tweens.add({
                targets: item,
                y: nextY,
                duration: TIME,
                ease: "Linear",
                onComplete: () => {
                    item.setData("stepTimer",
                        this.time.addEvent({ delay: PAUSE, callback: fall })
                    );
                }
            });

            item.setData("stepTween", tween);
        };

        fall();
    }

    stopStepFall(item) {
        const t = item.getData("stepTween");
        if (t) t.remove();

        const timer = item.getData("stepTimer");
        if (timer) timer.remove();
    }

    // --------------------------------------------------------
    // CORRECT LIFE LOGIC — all life changes happen HERE ONLY
    // --------------------------------------------------------
    resolveBinContact(item, inBin) {
        const type = item.getData("type");
        const isFruit = type === "compost";

        this.stopStepFall(item);
        item.destroy();

        if (inBin) {
            if (isFruit) {
                // Correct → Score
                this.score++;
                this.scoreText.setText(`Score: ${this.score}/${this.targetScore}`);

                if (this.score >= this.targetScore) {
                    this.endGame(true);
                    return;
                }
            } else {
                // WRONG → plastic in bin → lose life
                this.endGame(false);
                return;
            }
        } else {
            if (isFruit) {
                // WRONG → fruit fell → lose life
                this.endGame(false);
                return;
            }
            // Plastic on ground = ignore
        }

        this.spawnNextPiece();
    }

    // --------------------------------------------------------
    // DRAGGING SUPPORT
    // --------------------------------------------------------
    makeDraggable(item) {
        item.setInteractive({ draggable: true });
        this.input.setDraggable(item);

        item.on("dragstart", () => {
            item.setData("dragging", true);
            this.stopStepFall(item);
        });

        item.on("drag", (_pointer, dragX, dragY) => {
            item.x = dragX;
            if (dragY > item.y) item.y = dragY;

            this.clampX(item);

            // BIN
            if (this.touchesBin(item)) {
                item.setData("dragging", false);
                this.resolveBinContact(item, true);
                return;
            }

            // FLOOR
            if (item.y >= this.H - 40) {
                item.setData("dragging", false);
                this.resolveBinContact(item, false);
                return;
            }
        });

        item.on("dragend", () => {
            if (!this.gameOver) {
                item.setData("dragging", false);
                this.startStepFall(item);
            }
        });
    }

    clampX(item) {
        const b = item.getBounds();
        if (b.left < 0) item.x = b.width / 2;
        if (b.right > this.W) item.x = this.W - b.width / 2;
    }

    // --------------------------------------------------------
    // KEYBOARD MOVEMENT (FULLY RESTORED)
    // --------------------------------------------------------
    update() {
        if (!this.activePiece || this.gameOver) return;

        const p = this.activePiece;
        let moved = false;

        // Left / Right
        if (this.keys.A.isDown || this.cursors.left.isDown) {
            p.x -= this.keyMoveSpeedX;
            moved = true;
        }
        if (this.keys.D.isDown || this.cursors.right.isDown) {
            p.x += this.keyMoveSpeedX;
            moved = true;
        }

        // Fast drop
        if (this.keys.S.isDown || this.cursors.down.isDown) {
            p.y += this.keyMoveSpeedY;
            moved = true;
        }

        if (moved) {
            this.clampX(p);

            if (this.touchesBin(p)) {
                this.resolveBinContact(p, true);
                return;
            }

            if (p.y >= this.H - 40) {
                this.resolveBinContact(p, false);
                return;
            }
        }

        // Space = force drop
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            p.setData('dragging', false);
            if (this.touchesBin(p)) this.resolveBinContact(p, true);
            else this.startStepFall(p);
        }
    }

    // --------------------------------------------------------
    // END GAME — NO LIFE SUBTRACTION HERE
    // --------------------------------------------------------
    endGame(won = true) {
        this.gameOver = true;

        if (this.activePiece) this.activePiece.destroy();

        this.add.rectangle(this.W/2, this.H/2, this.W, this.H, 0x000000, 0.45);
        this.add.text(this.W/2, this.H/2, won ? "You Win!" : "Oops!", {
            fontSize: "64px",
            color: "#ffffff"
        }).setOrigin(0.5);

        this.input.once("pointerdown", () => {
            this.scene.start("transitionScreen", {
                score: this.finalScore,
                lives: this.lives,
                xCoord: this.W,
                yCoord: this.H,
                won: won,
                elapsedTime: this.time.now,
            });
        });
    }
}
