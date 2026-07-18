const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: true // เปิดไว้ดูขอบเขตการชน จะได้เทสระยะกระโดดง่ายๆ
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let platforms; 
let keyW, keyA, keyS, keyD;

function preload() {
    this.load.image('background', 'img/tree.jpg');
    this.load.image('tile', 'img/tile.jpg');
    // โหลดรูปหอคอย
    this.load.image('tower', 'img/tower.png'); 
    
    this.load.spritesheet('player', 'img/AnimationSheet_Character.png', {
        frameWidth: 32,
        frameHeight: 32
    });
}

function create() {
    // --- 1. สร้างฉากหลังและหอคอย ---
    let background = this.add.image(400, 300, 'background').setScale(2.5);
    let tower = this.add.image(400, 300, 'tower');
    
    platforms = this.physics.add.staticGroup();

    // ==========================================
    // ⭐️ โค้ดสร้างพื้นยาวๆ ด้านล่างสุด (อันนี้คงขนาด 0.12 ไว้เพื่อเป็นพื้นฐาน)
    for (let x = 32; x < 850; x += 64) {
        platforms.create(x, 568, "tile")
       .setScale(0.12, 0.12)
       .refreshBody();
    }
    // ==========================================

    // --- 2. สร้างแท่นลอย 5 แท่น (ปรับขนาดเล็กลงเป็น 0.08 และขยับให้ชิดกัน) ---
    // แท่นที่ 1 (บนสุด ซ้าย) - จุดเกิด
    platforms.create(250, 150, "tile").setScale(0.08, 0.08).refreshBody();
    platforms.create(292, 150, "tile").setScale(0.08, 0.08).refreshBody();

    // แท่นที่ 2 (บน ขวา)
    platforms.create(520, 200, "tile").setScale(0.08, 0.08).refreshBody();
    platforms.create(562, 200, "tile").setScale(0.08, 0.08).refreshBody();

    // แท่นที่ 3 (กลาง ซ้าย)
    platforms.create(250, 310, "tile").setScale(0.08, 0.08).refreshBody();
    platforms.create(292, 310, "tile").setScale(0.08, 0.08).refreshBody();

    // แท่นที่ 4 (ล่าง ขวา)
    platforms.create(520, 400, "tile").setScale(0.08, 0.08).refreshBody();
    platforms.create(562, 400, "tile").setScale(0.08, 0.08).refreshBody();

    // แท่นที่ 5 (ล่างสุด ซ้าย) - จุดหมาย
    platforms.create(250, 500, "tile").setScale(0.08, 0.08).refreshBody();
    platforms.create(292, 500, "tile").setScale(0.08, 0.08).refreshBody();
    platforms.create(334, 500, "tile").setScale(0.08, 0.08).refreshBody();

    // --- 3. สร้างผู้เล่น ---
    player = this.physics.add.sprite(270, 30, 'player', 0);
    player.setScale(2); 
    player.setCollideWorldBounds(true); 
    player.setBounce(0.2); 

    // --- การชน ---
    this.physics.add.collider(player, platforms);

    // --- ปุ่มควบคุม ---
    cursors = this.input.keyboard.createCursorKeys();
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    // --- สร้างอนิเมชั่นทั้งหมด ---
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 4,     
        repeat: -1      
    });

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
        frameRate: 6,     
        repeat: -1      
    });

    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('player', { start: 40, end: 47 }),
        frameRate: 6,     
        repeat: 0       
    });
}

function update() {
    const moveSpeed = 160; 
    const jumpForce = -330;

    // --- 1. ส่วนควบคุมความเร็ว (Movement) ---
    if (cursors.left.isDown || keyA.isDown) {
        player.setVelocityX(-moveSpeed);
        player.flipX = true;             
    } 
    else if (cursors.right.isDown || keyD.isDown) {
        player.setVelocityX(moveSpeed);  
        player.flipX = false;            
    } 
    else {
        player.setVelocityX(0);          
    }

    // กระโดด
    if ((cursors.space.isDown || keyW.isDown || cursors.up.isDown) && player.body.touching.down) {
        player.setVelocityY(jumpForce);  
    }

    // --- 2. ส่วนควบคุมอนิเมชั่น (Animation Logic) ---
    if (!player.body.touching.down) {
        player.play('jump', true); 
    } 
    else {
        if (player.body.velocity.x !== 0) {
            player.play('walk', true); 
        } else {
            player.play('idle', true); 
        }
    }
}