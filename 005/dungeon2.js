// การตั้งค่า Config ของ Phaser เกม
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 675,
    backgroundColor: '#0d0d0d', 
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 }, 
            debug: false // เปลี่ยนเป็น true หากต้องการเปิดกล่องสีเขียวเพื่อเช็กพิกัดชน
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let player;
let platforms; 
let cursors;
let keyW, keyA, keyS, keyD;

function preload() {
    // โหลด Spritesheet ของตัวละคร
    this.load.spritesheet('player', 'assets/sprites/spr-player.png', {
        frameWidth: 32,
        frameHeight: 32
    });

    // โหลด Spritesheet ของหนังสือ (ดึงภาพนิ่งเฟรม 0-4 มาใช้)
    this.load.spritesheet('book', 'assets/items/book.png', {
        frameWidth: 280, 
        frameHeight: 450
    });
}

function create() {
    // ==========================================
    // 1. วาดโครงสร้างห้องเพื่อความสวยงาม (Visual Only)
    // ==========================================
    const gfx = this.add.graphics();
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.lineStyle(4, 0x4d4d4d, 1);

    // [ห้องบนซ้าย] - Mission 1: ห้องสมุดต้องห้าม
    const roomLibrary = new Phaser.Geom.Rectangle(50, 40, 500, 240);
    gfx.fillRectShape(roomLibrary); gfx.strokeRectShape(roomLibrary);

    // [ห้องบนขวา] - Mission 2: ห้องรูปปั้น
    const roomStatue = new Phaser.Geom.Rectangle(600, 40, 550, 240);
    gfx.fillRectShape(roomStatue); gfx.strokeRectShape(roomStatue);

    // [ห้องล่างซ้าย] - Mission 3: ห้องคบเพลิง
    const roomTorch = new Phaser.Geom.Rectangle(50, 360, 450, 250);
    gfx.fillRectShape(roomTorch); gfx.strokeRectShape(roomTorch);

    // [ห้องล่างขวา] - Mission 4 & 5: NPC, หีบสมบัติ และประตูทางออก
    const roomExit = new Phaser.Geom.Rectangle(560, 360, 590, 250);
    gfx.fillRectShape(roomExit); gfx.strokeRectShape(roomExit);

    // วาดทางเดินเชื่อมระหว่างห้อง (Corridors)
    gfx.fillRectShape(new Phaser.Geom.Rectangle(120, 280, 80, 80)); 
    gfx.strokeRectShape(new Phaser.Geom.Rectangle(120, 280, 80, 80));
    gfx.fillRectShape(new Phaser.Geom.Rectangle(550, 120, 50, 80)); 
    gfx.strokeRectShape(new Phaser.Geom.Rectangle(550, 120, 50, 80));
    gfx.fillRectShape(new Phaser.Geom.Rectangle(500, 480, 60, 80)); 
    gfx.strokeRectShape(new Phaser.Geom.Rectangle(500, 480, 60, 80));

    // เจาะรูทางเดินสายตา
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(122, 276, 76, 8); gfx.fillRect(122, 356, 76, 8);
    gfx.fillRect(546, 122, 8, 76);  gfx.fillRect(596, 122, 8, 76);
    gfx.fillRect(496, 482, 8, 76);  gfx.fillRect(556, 482, 8, 76);

    // ข้อความระบุโซนภารกิจ
    const textStyle = { font: '16px Arial', fill: '#888888' };
    this.add.text(70, 55, 'Mission 1: Forbidden Library', textStyle);
    this.add.text(620, 55, 'Mission 2: Statue Room', textStyle);
    this.add.text(70, 375, 'Mission 3: Torch Room', textStyle);
    this.add.text(580, 375, 'Mission 4 & 5: NPC / Chests / Exit Gate', textStyle);


    // ==========================================
    // 2. ระบบ COLLISION (กำแพงและพื้นฟิสิกส์)
    // ==========================================
    platforms = this.physics.add.staticGroup();

    function addWall(scene, x, y, w, h) {
        let wall = scene.add.rectangle(x, y, w, h, 0x000000, 0); 
        platforms.add(wall);
    }

    // --- [พื้นห้อง] ---
    addWall(this, 370, 275, 360, 10); 
    addWall(this, 875, 275, 550, 10); 
    addWall(this, 275, 605, 450, 10);     
    addWall(this, 530, 605, 60, 10);      
    addWall(this, 855, 605, 590, 10);     

    // --- [เพดานห้อง] ---
    addWall(this, 300, 45, 500, 10);  
    addWall(this, 875, 45, 550, 10);  
    addWall(this, 370, 365, 250, 10); 
    addWall(this, 855, 365, 590, 10); 

    // --- [กำแพงแนวตั้ง ขอบนอกสุด] ---
    addWall(this, 55, 140, 10, 200);  
    addWall(this, 55, 485, 10, 240);  
    addWall(this, 1145, 140, 10, 200); 
    addWall(this, 1145, 485, 10, 240); 

    // --- [กำแพงกั้นทางเดินเชื่อมแนวตั้งฝั่งซ้าย] ---
    addWall(this, 115, 320, 10, 80);  
    addWall(this, 205, 320, 10, 80);  

    // --- [กำแพงกั้นระหว่างห้อง 3 กับห้อง 4] ---
    addWall(this, 495, 420, 10, 110);   
    addWall(this, 565, 420, 10, 110);   
    addWall(this, 495, 582, 10, 45);    
    addWall(this, 565, 582, 10, 45);    

    // --- [กำแพงกั้นระหว่างห้อง 1 กับห้อง 2] ---
    addWall(this, 545, 80, 10, 80);   
    addWall(this, 545, 240, 10, 80);  
    addWall(this, 605, 80, 10, 80);   
    addWall(this, 605, 240, 10, 80);  


    // ==========================================
    // 3. ตั้งค่าผู้เล่นและการควบคุม
    // ==========================================
    cursors = this.input.keyboard.createCursorKeys();
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    player = this.physics.add.sprite(100, 150, 'player', 0).setScale(2);
    player.setBounce(0.0); 
    player.setCollideWorldBounds(true); 
    
    this.physics.add.collider(player, platforms);

    // แอนิเมชันของตัวละคร
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 4,     
        repeat: -1      
    });
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
        frameRate: 8,
        repeat: -1
    });    
    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNumbers('player', { start: 8, end: 9 }),
        frameRate: 6,
        repeat: 0
    });    

    player.play('idle', true); 


    // ==========================================
    // 🛠️ MISSION 1: ระบบหนังสือ 5 เล่ม จากภาพที่ 1-5 (Interaction)
    // ==========================================
    
    // พิกัดแกน X ของหนังสือ 5 เล่ม วางเรียงกันในห้องที่ 1
    const bookPositionsX = [160, 220, 280, 340, 400];
    
    // กำหนดให้เล่มสุดท้าย (เล่มที่ 5) เป็นคัมภีร์ที่ถูกต้อง
    const correctBookIndex = 4; 

    bookPositionsX.forEach((posX, index) => {
        // 🛠️ แก้ไข: ใส่ดัชนีเฟรมภาพ 'index' (0,1,2,3,4) เพื่อดึงภาพนิ่งที่ 1 ถึง 5 มาใช้ตรงๆ
        let book = this.add.sprite(posX, 146, 'book', index).setScale(0.1);
        
        // ทำให้หนังสือสามารถคลิกตรวจเช็กได้
        book.setInteractive({ useHandCursor: true });

        // สร้างกล่องข้อความบรรยายลอยเหนือหนังสือ (ซ่อนไว้ก่อน)
        let textBubble = this.add.text(posX - 40, 190, '', { 
            font: '14px Arial', 
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 5, y: 5 }
        }).setOrigin(0, 0).setVisible(false);

        // ระบบคลิกสำรวจเมื่อตัวละครเดินมาใกล้
        book.on('pointerdown', () => {
            // เช็กระยะห่างระหว่างผู้เล่นกับหนังสือ (ไม่ใช้ Collision พร่ำเพรื่อตามโจทย์)
            let distance = Phaser.Math.Distance.Between(player.x, player.y, book.x, book.y);
            
            if (distance < 80) { // ต้องเดินเข้ามาใกล้ในระยะ 80 พิกเซล
                
                if (index === correctBookIndex) {
                    // 🌟 ถ้าคลิกเล่มที่ 5 (ภาพเฟรมที่ 4)
                    textBubble.setText("You found the\nMagic Scroll!");
                    textBubble.setStyle({ fill: '#ffcc00' });
                    textBubble.setVisible(true);
                    console.log("Mission 1 Complete: Magic Scroll Added!");
                } else {
                    // ❌ ถ้าคลิกเล่มอื่น (เล่มที่ 1 ถึง 4)
                    textBubble.setText("Nothing here.");
                    textBubble.setStyle({ fill: '#ff3333' });
                    textBubble.setVisible(true);
                    
                    this.time.delayedCall(1500, () => {
                        textBubble.setVisible(false);
                    });
                }
            } else {
                console.log("Too far away to inspect this book!");
            }
        });
    });
}

function update() {
    const speed = 180; 

    if (cursors.left.isDown || keyA.isDown) {
        player.setVelocityX(-speed);
        player.setFlipX(true); 
        if (player.body.touching.down) player.anims.play('walk', true);
    } 
    else if (cursors.right.isDown || keyD.isDown) {
        player.setVelocityX(speed);
        player.setFlipX(false); 
        if (player.body.touching.down) player.anims.play('walk', true);
    } 
    else {
        player.setVelocityX(0); 
        if (player.body.touching.down) player.anims.play('idle', true);
    }

    const isJumpPressed = cursors.up.isDown || keyW.isDown || cursors.space.isDown;
    if (isJumpPressed && player.body.touching.down) {
        player.setVelocityY(-320); 
        player.anims.play('jump', true);
    }

    if (!player.body.touching.down && player.anims.currentAnim && player.anims.currentAnim.key !== 'jump') {
        player.anims.play('jump', true);
    }
}