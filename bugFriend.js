export default class bugFriend extends Phaser.Scene {
    constructor(){
        super('bugFriend');
    }

    preload(){
        this.load.image('fly', 'assets/flie.png');
        this.load.image('ant', 'assets/ant.png');
        this.load.image('wasp', 'assets/wasp.png');
        this.load.image('bee', 'assets/honeybee.png');
        this.load.image('ladybug', 'assets/ladybug.png');
        this.load.image('cockroach', 'assets/cockroach.png');
        this.load.image('bg', 'assets/flowerfieldbg.png');
        this.load.image('aphid', 'assets/aphid.png');
        this.load.image('grasshopper', 'assets/grasshopper.png');
    }

    init(data){
        this.score = data.score;
        this.xCoord = data.xCoord;
        this.yCoord = data.yCoord;
    }

    create(){
        this.lives = 3;
        this.winCon = 0;
        this.background = this.add.image(0, 0, 'bg').setOrigin(0,0);
        this.background.displayWidth = this.sys.game.config.width;
        this.background.displayHeight = this.sys.game.config.height;
        this.background.on('pointerdown', () => {
        this.scene.start('closeTheLids', {score: this.score, xCoord: this.xCoord, yCoord: this.yCoord});
        });
        
        //Ant
        this.ant = this.physics.add.image(400, 300, 'ant').setInteractive();
        this.ant.setScale(0.4);
        this.ant.setCollideWorldBounds(true);
        this.ant.on('pointerdown', () => {
            console.log("Ant squashed :(");
            this.ant.setVisible(false);
            this.ant.setActive(false);
            this.checkAnswer(false, this.score);
        });
        //Wasp
        this.wasp = this.physics.add.image(600,500, 'wasp').setInteractive();
        this.wasp.setScale(0.5);
        this.wasp.setCollideWorldBounds(true);
        this.wasp.on('pointerdown', () => {
            console.log("Wasp squashed :)");
            this.wasp.setVisible(false);
            this.wasp.setActive(false);
            this.checkAnswer(true, this.score);
        });
        //Cockroach
        this.cockroach = this.physics.add.image(800,800, 'cockroach').setInteractive();
        this.cockroach.setScale(0.7);
        this.cockroach.setCollideWorldBounds(true);
        this.cockroach.on('pointerdown', () => {
            console.log("cockroach squashed :)");
            this.cockroach.setVisible(false);
            this.cockroach.setActive(false);
            this.checkAnswer(true, this.score);
        });
        //Ladybug
        this.ladybug = this.physics.add.image(200,100, 'ladybug').setInteractive();
        this.ladybug.setScale(0.7);
        this.ladybug.setCollideWorldBounds(true);
        this.ladybug.on('pointerdown', () => {
            console.log("ladybug squashed :(");
            this.ladybug.setVisible(false);
            this.ladybug.setActive(false);
            this.checkAnswer(false, this.score);
        });
        //fly
        this.fly = this.physics.add.image(180,160, 'fly').setInteractive();
        this.fly.setScale(0.5);
        this.fly.setCollideWorldBounds(true);
        this.fly.on('pointerdown', () => {
            console.log("fly squashed :)");
            this.fly.setVisible(false);
            this.fly.setActive(false);
            this.checkAnswer(true, this.score);
        });
        //bee
        this.bee = this.physics.add.image(750,150, 'bee').setInteractive();
        this.bee.setScale(0.5);
        this.bee.setCollideWorldBounds(true);
        this.bee.on('pointerdown', () => {
            console.log("bee squashed :(");
            this.bee.setVisible(false);
            this.bee.setActive(false);
            this.checkAnswer(false, this.score);
        });
        //aphid
        this.aphid = this.physics.add.image(100,600, 'aphid').setInteractive();
        this.aphid.setScale(0.5);
        this.aphid.setCollideWorldBounds(true);
        this.aphid.on('pointerdown', () => {
            console.log("aphid squashed :)");
            this.aphid.setVisible(false);
            this.aphid.setActive(false);
            this.checkAnswer(true, this.score);
        });
        //grasshopper
        this.grasshopper = this.physics.add.image(800,500, 'grasshopper').setInteractive();
        this.grasshopper.setScale(0.5);
        this.grasshopper.setCollideWorldBounds(true);
        this.grasshopper.on('pointerdown', () => {
            console.log("grasshopper squashed :)");
            this.grasshopper.setVisible(false);
            this.grasshopper.setActive(false);
            this.checkAnswer(true, this.score);
        });
        this.setDirections();
    }


    setDirections(){
        this.setAntRandomDirection();
        this.setWaspRandomDirection();
        this.setCockroachRandomDirection();
        this.setLadybugRandomDirection();
        this.setFlyRandomDirection();
        this.setBeeRandomDirection();
        this.setAphidRandomDirection();
        this.setGrasshopperRandomDirection();

       if(  this.ant.body.blocked.left ||
            this.ant.body.blocked.right ||
            this.ant.body.blocked.up ||
            this.ant.body.blocked.down) { 
            this.setAntRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(2000, 4000),
            callback: () => {
                this.setAntRandomDirection();
            },
            loop: true
        });
        if( this.wasp.body.blocked.left ||
            this.wasp.body.blocked.right ||
            this.wasp.body.blocked.up ||
            this.wasp.body.blocked.down) { 
            this.setWaspRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setWaspRandomDirection();
            },
            loop: true
        });
        if( this.cockroach.body.blocked.left ||
            this.cockroach.body.blocked.right ||
            this.cockroach.body.blocked.up ||
            this.cockroach.body.blocked.down) { 
            this.setCockroachRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setCockroachRandomDirection();
            },
            loop: true
        });
        if( this.ladybug.body.blocked.left ||
            this.ladybug.body.blocked.right ||
            this.ladybug.body.blocked.up ||
            this.ladybug.body.blocked.down) { 
            this.setLadybugRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setLadybugRandomDirection();
            },
            loop: true
        });
        if( this.fly.body.blocked.left ||
            this.fly.body.blocked.right ||
            this.fly.body.blocked.up ||
            this.fly.body.blocked.down) { 
            this.setFlyRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setFlyRandomDirection();
            },
            loop: true
        });
        if( this.bee.body.blocked.left ||
            this.bee.body.blocked.right ||
            this.bee.body.blocked.up ||
            this.bee.body.blocked.down) { 
            this.setBeeRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setBeeRandomDirection();
            },
            loop: true
        });
        if( this.aphid.body.blocked.left ||
            this.aphid.body.blocked.right ||
            this.aphid.body.blocked.up ||
            this.aphid.body.blocked.down) { 
            this.setAphidRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setAphidRandomDirection();
            },
            loop: true
        });
        if( this.grasshopper.body.blocked.left ||
            this.grasshopper.body.blocked.right ||
            this.grasshopper.body.blocked.up ||
            this.grasshopper.body.blocked.down) { 
            this.setGrasshopperRandomDirection(); }
        this.time.addEvent({
            delay: Phaser.Math.Between(1000, 2000),
            callback: () => {
                this.setGrasshopperRandomDirection();
            },
            loop: true
        });
    }


    setAntRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(50, 120);

        this.ant.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.ant.setAngle(Phaser.Math.RadToDeg(angle)); 
    }

    setWaspRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(120, 180);

        this.wasp.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.wasp.setAngle(Phaser.Math.RadToDeg(angle)); 
    }

    setCockroachRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(50, 240);

        this.cockroach.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.cockroach.setAngle(Phaser.Math.RadToDeg(angle)); 
    }

    setLadybugRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(30, 100);

        this.ladybug.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.ladybug.setAngle(Phaser.Math.RadToDeg(angle)); 
    }

    setFlyRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(150, 250);

        this.fly.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.fly.setAngle(Phaser.Math.RadToDeg(angle)); 
    }

    setBeeRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(150, 190);

        this.bee.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.bee.setAngle(Phaser.Math.RadToDeg(angle)); 
    }

    setAphidRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(40, 80);

        this.aphid.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.aphid.setAngle(Phaser.Math.RadToDeg(angle)); 
    }
    setGrasshopperRandomDirection() {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = Phaser.Math.Between(100, 180);

        this.grasshopper.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
        this.grasshopper.setAngle(Phaser.Math.RadToDeg(angle)); 
    }



    checkAnswer(flag, score){
        if(flag) this.winCon++;
        else this.lives --;

        console.log("Lives Remaining: " + this.lives);
        console.log("Score: " + this.winCon);
        if(this.lives == 0) {
            this.add.text(500, 450, "You Lost...", { fontSize: '84px', fill: '#fff' }).setOrigin(0.5);
            this.ant.destroy;
            this.wasp.destroy;
            this.bee.destroy;
            this.grasshopper.destroy;
            this.cockroach.destroy;
            this.aphid.destroy;
            this.ladybug.destroy;
            this.fly.destroy;
            this.background.setInteractive(); }
        if(this.winCon == 5) {
            this.add.text(500, 450, "You Win!", { fontSize: '84px', fill: '#fff' }).setOrigin(0.5);
            this.background.setInteractive();
        }

    }
}