// game10.js
export default class Game10 extends Phaser.Scene {
    constructor() {
        super({ key: 'Game10' });
    }

    init(data) {
        this.score = data?.score ?? 0;
        this.xCoord = data?.xCoord ?? this.scale.width;
        this.yCoord = data?.yCoord ?? this.scale.height;
    }

    preload() {
        this.load.image('bath_bg', 'assets/bathroom_bg.png');
        this.load.image('toilet', 'assets/toilet_bowl.png');
        this.load.image('tp_good', 'assets/item_toilet_paper.png');
        this.load.image('wipes_bad', 'assets/item_wipes.png');
        this.load.image('toy_bad', 'assets/item_toy.png');
        this.load.image('trash_bad', 'assets/item_trash.png');
    }

    create() {
        const cx = this.cameras.main.centerX;

        // background
        if (this.textures.exists('bath_bg')) {
            this.add.image(0, 0, 'bath_bg')
                .setOrigin(0, 0)
                .setDisplaySize(this.scale.width, this.scale.height);
        } else {
            this.cameras.main.setBackgroundColor(0xbdefff);
        }

        // enlarged toilet
        this.bowl = this.add.image(cx, this.scale.height - 120, 'toilet')
            .setOrigin(0.5, 0.5)
            .setScale(1.1); // larger toilet for better visibility

        // instruction text
        this.message = this.add.text(cx, 50, 'Let toilet paper fall. Swipe other stuff away!', {
            font: '26px Arial',
            color: '#111',
            align: 'center',
            wordWrap: { width: this.scale.width - 80 }
        }).setOrigin(0.5, 0.5);

        // scoring
        this.clears = 0;
        this.mistakes = 0;
        this.targetClears = 8;
        this._activeSprites = new Set();

        // toilet hit zone (enlarged slightly to match bigger toilet)
        const bowlW = 320, bowlH = 160;
        this.bowlZone = new Phaser.Geom.Rectangle(
            this.bowl.x - bowlW / 2,
            this.bowl.y - bowlH / 2,
            bowlW,
            bowlH
        );

        // spawn timing — slower
        this.spawnDelay = 2500; // was 1500 → slower spawn rate
        this.spawnTimer = this.time.addEvent({
            delay: this.spawnDelay,
            callback: this.spawnFallingItem,
            callbackScope: this,
            loop: true
        });

        // gentle difficulty increase
        this.time.addEvent({
            delay: 10000,
            callback: () => {
                this.spawnDelay = Math.max(1500, this.spawnDelay - 150);
                this.spawnTimer.reset({
                    delay: this.spawnDelay,
                    callback: this.spawnFallingItem,
                    callbackScope: this,
                    loop: true
                });
            },
            callbackScope: this,
            loop: true
        });
    }

    spawnFallingItem() {
        const x = Phaser.Math.Between(100, this.scale.width - 100);
        const y = -50;

        const isGood = Math.random() < 0.45;
        const key = isGood
            ? 'tp_good'
            : Phaser.Utils.Array.GetRandom(['wipes_bad', 'toy_bad', 'trash_bad']);

        // smaller item size
        const sprite = this.add.image(x, y, key)
            .setOrigin(0.5)
            .setScale(0.4) // smaller items
            .setInteractive({ draggable: true, cursor: 'grab' });

        sprite.isGood = isGood;
        sprite.hasEnded = false;

        // slower falling tween
        this.tweens.add({
            targets: sprite,
            y: this.scale.height + 100,
            duration: Phaser.Math.Between(4000, 5500), // was ~3000 → slower fall
            ease: 'Linear',
            onUpdate: () => {
                if (sprite.hasEnded) return;
                if (Phaser.Geom.Rectangle.Contains(this.bowlZone, sprite.x, sprite.y)) {
                    this.onItemEnteredBowl(sprite);
                }
            },
            onComplete: () => {
                if (!sprite.hasEnded) this.onItemMissed(sprite);
            }
        });

        // swipe logic
        this.input.setDraggable(sprite, true);
        this.input.on('drag', (_pointer, obj, dragX, dragY) => {
            if (obj === sprite && !sprite.hasEnded) {
                obj.x = dragX;
                obj.y = dragY;
            }
        });
        this.input.on('dragend', (_pointer, obj) => {
            if (obj === sprite && !sprite.hasEnded) {
                const dx = Math.abs(obj.x - this.bowl.x);
                const dy = Math.abs(obj.y - this.bowl.y);
                if (dx > 200 || dy > 200) this.flickAway(obj);
            }
        });

        this._activeSprites.add(sprite);
    }

    flickAway(obj) {
        obj.hasEnded = true;
        this.tweens.add({
            targets: obj,
            x: obj.x + Phaser.Math.Between(-400, 400),
            y: obj.y - Phaser.Math.Between(180, 260),
            alpha: 0,
            angle: Phaser.Math.Between(-35, 35),
            duration: 300,
            ease: 'Quad.easeOut',
            onComplete: () => {
                if (obj.isGood) this.registerFail('That belongs in the toilet!');
                else this.registerSuccess('Nice swipe!');
                obj.destroy();
                this._activeSprites.delete(obj);
                this.checkEnd();
            }
        });
    }

    onItemEnteredBowl(obj) {
        if (obj.hasEnded) return;
        obj.hasEnded = true;

        if (obj.isGood) this.registerSuccess('Correct: TP goes in.');
        else this.registerFail('No wipes / toys / trash in toilet!');

        this.tweens.add({
            targets: obj,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 250,
            onComplete: () => {
                obj.destroy();
                this._activeSprites.delete(obj);
                this.checkEnd();
            }
        });
    }

    onItemMissed(obj) {
        if (obj.hasEnded) return;
        obj.hasEnded = true;

        if (obj.isGood) this.registerFail('TP should go in the toilet.');
        else this.registerSuccess('Dodged it!');

        obj.destroy();
        this._activeSprites.delete(obj);
        this.checkEnd();
    }

    registerSuccess(text) {
        this.clears++;
        this.message.setText(text + `   Cleared: ${this.clears}/${this.targetClears}`);
    }

    registerFail(text) {
        this.mistakes++;
        this.message.setText(text + `   Mistakes: ${this.mistakes}`);
    }

    checkEnd() {
        if (this.clears >= this.targetClears) this.endGame(true);
        else if (this.mistakes >= 3) this.endGame(false);
    }

    endGame(won) {
        this.time.removeAllEvents();
        this.input.enabled = false;
        if (this._activeSprites) {
            this._activeSprites.forEach(s => s.destroy());
            this._activeSprites.clear();
        }

        const cx = this.cameras.main.centerX;
        const cy = this.cameras.main.centerY;
        this.add.text(cx, cy - 40, won ? 'Great job!' : 'Try again!', {
            font: '52px Arial',
            fill: '#fff'
        }).setOrigin(0.5);

        this.time.delayedCall(1000, () => {
            this.scene.start('Game11', {
                score: this.score + (won ? 10 : 0),
                xCoord: this.xCoord,
                yCoord: this.yCoord
            });
        });
    }
}

// expose for debugging
if (typeof window !== 'undefined') window.Game10 = Game10;
