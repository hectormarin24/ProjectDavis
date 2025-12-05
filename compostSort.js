// game6.js — Compost sorting mini game with downward-only movement and proper bottom detection.

const FRUIT_KEYS = [
    'banana','black-berry-dark','coconut','green-apple','green-grape',
    'lemon','lime','orange','peach','pear','strawberry','watermelon'
];

const PLASTIC_KEYS = ['bag','bottle','cup','Tray','utensil'];

export default class compostSort extends Phaser.Scene {
    constructor() {
        super('compostSort');
    }

    init(data) {
        this.W = data?.xCoord ?? 1000;
        this.H = data?.yCoord ?? 900;

        this.activePiece = null;
        this.spawnQueued = false;

        this.score = 0;
        this.targetScore = 5;
        this.gameOver = false;

        this.finalScore = data.score;
        this.lives = data.lives;

        this.keyMoveSpeedX = 14;   // left/right
        this.keyMoveSpeedY = 22;   // fast drop speed
    }

    preload() {
        FRUIT_KEYS.forEach(n => this.load.image(n, `assets/game6assets/${n}.png`));
        PLASTIC_KEYS.forEach(n => this.load.image(n, `assets/game6assets/${n}.png`));

        this.load.image('garden_bg','assets/game6assets/garden.webp');
        this.load.image('compost_bin_img','assets/game6assets/compostbin.png');
    }

    create() {
        const bg = this.add.image(this.W/2, this.H/2, 'garden_bg');
        bg.setOrigin(0.5).setDepth(-10);
        bg.setScale(Math.max(this.W/bg.width, this.H/bg.height));

        this.scoreText = this.add.text(16,16,`Score: 0 / ${this.targetScore}`,{
            fontSize:'26px', color:'#5cbc08ff'
        });

        // Compost bin
        this.bin = this.add.image(this.W/2, this.H-110,'compost_bin_img')
            .setOrigin(0.5)
            .setScale(1.4);

        // keyboard
        this.cursors = this.input.keyboard.createCursorKeys();
        this.keys = this.input.keyboard.addKeys({
            A:'A', D:'D',
            LEFT:'LEFT', RIGHT:'RIGHT',
            S:'S', DOWN:'DOWN',
            SPACE:'SPACE'
        });

        this.spawnNextPiece();
    }

    // ---------------------------------------------------------
    // Detects contact with compost bin
    // ---------------------------------------------------------
    touchesBin(item) {
        const i = item.getBounds();
        const b = this.bin.getBounds();

        return (
            i.bottom >= b.top &&
            i.right >= b.left &&
            i.left <= b.right
        );
    }

    // ---------------------------------------------------------
    // SPAWNING
    // ---------------------------------------------------------

    spawnNextPiece() {
        if (this.gameOver) return;

        this.spawnQueued = false;

        if (this.activePiece) {
            this.stopStepFall(this.activePiece);
            this.activePiece.destroy();
        }

        const fruit = Math.random() < 0.6;
        const x = Phaser.Math.Between(this.W * 0.25, this.W * 0.75);
        const y = this.H * 0.20;

        const piece = fruit ? this.makeFruit(x, y) : this.makePlastic(x, y);

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

    // ---------------------------------------------------------
    // AUTOMATIC FALLING
    // ---------------------------------------------------------

    startStepFall(item) {
        const STEP = 28;
        const TIME = 160;
        const PAUSE = 480;

        const fall = () => {
            if (!item.active || item.getData('dragging') || this.gameOver)
                return;

            // 1. Check if touching bin
            if (this.touchesBin(item)) {
                this.resolveBinContact(item);
                return;
            }

            // 2. NEW: bottom boundary detection (noncomp fix)
            if (item.y >= this.H - 40) {
                this.resolveBinContact(item);
                return;
            }

            // Continue falling normally
            const newY = item.y + STEP;
            item.y = newY;

            const t = this.tweens.add({
                targets: item,
                y: newY,
                duration: TIME,
                ease: 'Linear',
                onComplete: () => {
                    const timer = this.time.addEvent({ delay: PAUSE, callback: fall });
                    item.setData('stepTimer', timer);
                }
            });

            item.setData('stepTween', t);
        };

        fall();
    }

    stopStepFall(item) {
        const t = item.getData('stepTween');
        if (t) t.remove();

        const timer = item.getData('stepTimer');
        if (timer) timer.remove();
    }

    // ---------------------------------------------------------
    // RESOLVE BIN CONTACT
    // ---------------------------------------------------------

    resolveBinContact(item) {
        const type = item.getData('type');

        this.stopStepFall(item);
        item.destroy();

        if (type === 'compost') {
            this.score++;
            this.scoreText.setText(`Score: ${this.score} / ${this.targetScore}`);

            if (this.score >= this.targetScore) {
                this.endGame(true);
                return;
            }
        } else {
            this.lives--;
            if (this.lives <= 0) {
                this.endGame(false);
                return;
            }
        }

        this.spawnNextPiece();
    }

    // ---------------------------------------------------------
    // MOUSE DRAG — LEFT, RIGHT, DOWN ONLY
    // ---------------------------------------------------------

    makeDraggable(item) {
        item.setInteractive({ draggable: true });
        this.input.setDraggable(item);

        item.on('dragstart', () => {
            item.setData('dragging', true);
            this.stopStepFall(item);
        });

        item.on('drag', (_pointer, dragX, dragY) => {
            // horizontal allowed
            item.x = dragX;

            // downward allowed only
            if (dragY > item.y) {
                item.y = dragY;
            }

            this.clampX(item);

            // bin check
            if (this.touchesBin(item)) {
                this.resolveBinContact(item);
                return;
            }

            // bottom boundary check
            if (item.y >= this.H - 40) {
                this.resolveBinContact(item);
                return;
            }
        });

        item.on('dragend', () => {
            item.setData('dragging', false);
            this.startStepFall(item);
        });
    }

    clampX(item) {
        const b = item.getBounds();
        if (b.left < 0) item.x = b.width/2;
        if (b.right > this.W) item.x = this.W - b.width/2;
    }

    // ---------------------------------------------------------
    // KEYBOARD — LEFT, RIGHT, DOWN ONLY
    // ---------------------------------------------------------

    update() {
        if (!this.activePiece || this.gameOver) return;

        const p = this.activePiece;
        let moved = false;

        // left / right
        if (this.keys.A.isDown || this.cursors.left.isDown) {
            p.x -= this.keyMoveSpeedX;
            moved = true;
        }
        if (this.keys.D.isDown || this.cursors.right.isDown) {
            p.x += this.keyMoveSpeedX;
            moved = true;
        }

        // down (fast drop)
        if (this.keys.S.isDown || this.cursors.down.isDown) {
            p.y += this.keyMoveSpeedY;
            moved = true;
        }

        if (moved) {
            this.clampX(p);

            // bin contact check
            if (this.touchesBin(p)) {
                this.resolveBinContact(p);
                return;
            }

            // bottom boundary fix
            if (p.y >= this.H - 40) {
                this.resolveBinContact(p);
                return;
            }
        }

        // SPACE = force drop
        if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
            p.setData('dragging', false);

            if (this.touchesBin(p)) this.resolveBinContact(p);
            else this.startStepFall(p);
        }
    }

    // ---------------------------------------------------------
    // END GAME
    // ---------------------------------------------------------

    endGame(won = true) {
        this.gameOver = true;

        if (this.activePiece) this.activePiece.destroy();

        this.add.rectangle(this.W/2,this.H/2,this.W,this.H,0x000000,0.45);
        this.add.text(this.W/2,this.H/2, won ? 'You Win!' : 'Oops!', {
            fontSize:'64px', color:'#ffffff'
        }).setOrigin(0.5);

        this.input.once('pointerdown', () => {
            this.scene.start('transitionScreen', {
                score:this.finalScore,
                lives:this.lives,
                xCoord:this.W,
                yCoord:this.H,
                won
            });
        });
    }
}
