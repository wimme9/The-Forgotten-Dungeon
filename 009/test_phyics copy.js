const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 300 }, debug: true }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let interactText;
let player, platforms, bouncePads, rocks, hearts, healthBar, timerText;
let cursors;
let playerHealth = 3;
let isGameStarted = false;
let startTime = 0;
let keyE;
let gate;
let gateOpened = false;
// ตัวแปรเสียง
let jumpSfx, hurtSfx, rockSfx, openDoorSfx;

function preload() {
    this.load.image('tile', 'img/tile.jpg');
    this.load.image('tower', 'img/tower.png'); 
    this.load.image('gate', 'img/door 1.png');
    this.load.image('door2', 'img/door 2.png');
    this.load.image('rock', 'img/rock.png'); 
    this.load.image('heart', 'img/heart.png'); 
    this.load.audio('jumpSound', 'audio/jump.mp3');
    this.load.audio('hurtSound', 'audio/hurt.mp3');
    this.load.audio('rockSound', 'audio/rock.mp3');
    this.load.audio('openDoorSound', 'audio/opendoor.mp3');
    this.load.spritesheet('player', 'img/AnimationSheet_Character.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
    // 1. รีเซ็ตค่าตัวแปรเมื่อเริ่มเกมใหม่
    interactText = this.add.text(0, 0, "Press E", {
    fontSize: "20px",
    fill: "#ffffff",
    backgroundColor: "#000000"
});
    interactText.setVisible(false);

    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    gate = this.add.image(700, 490, 'gate').setScale(0.1).setDepth(-10);
    gateOpened = false;
    //this.add.image(500, 300, 'door 2').setScale(0.1).setDepth(-10);
    playerHealth = 3;
    isGameStarted = false;
    startTime = 0;

    this.add.image(400, 300, 'tower').setDepth(-5);

    // 2. ตั้งค่าเสียง
    jumpSfx = this.sound.add('jumpSound');
    hurtSfx = this.sound.add('hurtSound');
    rockSfx = this.sound.add('rockSound');
    openDoorSfx = this.sound.add('openDoorSound');

    // 3. UI (เลือดและเวลา)
    this.add.rectangle(70, 30, 120, 20, 0x000000).setDepth(100);
    healthBar = this.add.rectangle(70, 30, 110, 15, 0x00ff00).setDepth(101);
    timerText = this.add.text(70, 60, 'Time: 0s', { fontSize: '24px', fill: '#ffffff' }).setDepth(100);

    // 4. กลุ่มวัตถุ
    platforms = this.physics.add.staticGroup();
    bouncePads = this.physics.add.staticGroup();
    rocks = this.physics.add.group();
    hearts = this.physics.add.group();

    // สร้างฉาก
    for (let x = 32; x < 850; x += 64) platforms.create(x, 568, "tile").setScale(0.12).refreshBody();
    platforms.create(250, 150, "tile").setScale(0.08).refreshBody();
    platforms.create(290, 150, "tile").setScale(0.08).refreshBody();
    platforms.create(520, 200, "tile").setScale(0.08).refreshBody();
    platforms.create(560, 200, "tile").setScale(0.08).refreshBody();
    platforms.create(250, 310, "tile").setScale(0.08).refreshBody();
    platforms.create(290, 310, "tile").setScale(0.08).refreshBody();
    platforms.create(520, 400, "tile").setScale(0.08).refreshBody();
    platforms.create(560, 400, "tile").setScale(0.08).refreshBody();
    platforms.create(250, 500, "tile").setScale(0.08).refreshBody();
    platforms.create(292, 500, "tile").setScale(0.08).refreshBody();
    platforms.create(334, 500, "tile").setScale(0.08).refreshBody();
    bouncePads.create(400, 500, "tile").setScale(0.15, 0.08).setTint(0x00ff00).refreshBody();

    // 5. ระบบผู้เล่น
    player = this.physics.add.sprite(270, 30, 'player', 0).setScale(2).setDepth(40);
    player.setCollideWorldBounds(true);

    // 6. ระบบไอเทม
    const spawnHeart = () => {
        let h = hearts.create(Phaser.Math.Between(100, 700), Phaser.Math.Between(100, 400), 'heart').setScale(0.2).setDepth(50);
        h.body.setAllowGravity(false);
    };
    spawnHeart(); spawnHeart();

    // 7. ระบบการชน
    this.physics.add.collider(player, platforms);
    this.physics.add.collider(player, bouncePads, (p, b) => { 
        if(p.body.touching.down) { p.setVelocityY(-600); jumpSfx.play(); } 
    });
    
    this.physics.add.overlap(player, hearts, (p, h) => {
        h.destroy();
        if(playerHealth < 3) playerHealth++;
        updateHealthBar();
        spawnHeart();
    });

    this.physics.add.overlap(player, rocks, (p, r) => {
        r.destroy();
        playerHealth--;
        hurtSfx.play();
        updateHealthBar();
        if(playerHealth <= 0) {
            // ใช้เวลาดีเลย์นิดนึงก่อนรีสตาร์ทเพื่อป้องกันเกมค้าง
            this.time.delayedCall(100, () => { this.scene.restart(); }, [], this);
        }
    });

    this.physics.add.collider(rocks, platforms, (r) => { 
        r.destroy(); 
        rockSfx.play(); 
        this.cameras.main.shake(100, 0.005); 
    });

    // 8. หินหล่น
    this.time.addEvent({ delay: 1500, loop: true, callback: () => {
        rocks.create(Phaser.Math.Between(100, 700), -50, 'rock').setScale(0.1).setDepth(30);
    }});

    // 9. อนิเมชั่น
    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'jump', frames: this.anims.generateFrameNumbers('player', { start: 40, end: 47 }), frameRate: 6, repeat: 0 });

    cursors = this.input.keyboard.createCursorKeys();
}

function updateHealthBar() {
    if(playerHealth === 3) { healthBar.width = 110; healthBar.fillColor = 0x00ff00; }
    else if(playerHealth === 2) { healthBar.width = 70; healthBar.fillColor = 0xffff00; }
    else { healthBar.width = 30; healthBar.fillColor = 0xff0000; }
}

function spawnDoorBurst(scene, x, y) {
    for (let i = 0; i < 24; i++) {
        const star = scene.add.text(x, y, '★', {
            fontSize: '30px',
            color: '#ffd54f',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(90);

        const angle = (i / 24) * Math.PI * 2 + Phaser.Math.Between(-0.2, 0.2);
        const speed = Phaser.Math.Between(120, 220);
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 40;

        scene.tweens.add({
            targets: star,
            x: x + vx,
            y: y + vy,
            alpha: 0,
            scale: 1.8,
            duration: 900,
            ease: 'Power2',
            onComplete: () => star.destroy()
        });
    }
}

function update() {
    // Timer Logic
    
    if (!isGameStarted && (cursors.left.isDown || cursors.right.isDown || cursors.up.isDown || cursors.space.isDown)) {
        isGameStarted = true;
        startTime = Date.now();
    }
    if (isGameStarted) {
        let elapsed = Math.floor((Date.now() - startTime) / 1000);
        timerText.setText('Time: ' + elapsed + 's');
    }

    // การเดิน
    if (cursors.left.isDown) {
        player.setVelocityX(-160);
        player.flipX = true;
        player.play('walk', true);
    } else if (cursors.right.isDown) {
        player.setVelocityX(160);
        player.flipX = false;
        player.play('walk', true);
    } else {
        player.setVelocityX(0);
        if (player.body.touching.down) player.play('idle', true);
    }

    // กระโดด
    if ((cursors.up.isDown || cursors.space.isDown) && player.body.touching.down) {
        player.setVelocityY(-330);
        jumpSfx.play();
    }
    
    // อนิเมชั่นกระโดด
    if (!player.body.touching.down) player.play('jump', true);
    
    if (!gate) return;

    let distance = Phaser.Math.Distance.Between(
        player.x,
        player.y,
        gate.x,
        gate.y
    );
    if (distance < 80){
        interactText.setVisible(true);
        interactText.setPosition(
            gate.x - 30,
            gate.y - 70
        );
        if (!gateOpened && Phaser.Input.Keyboard.JustDown(keyE)) {
            gateOpened = true;
            gate.setTexture('door2');
            gate.setScale(0.1);
            if (openDoorSfx) openDoorSfx.play({ volume: 0.7 });
            spawnDoorBurst(this, gate.x, gate.y);
            this.cameras.main.shake(900, 0.008);
            console.log("Door opened");
        }
    }else{
        interactText.setVisible(false);
    }
}