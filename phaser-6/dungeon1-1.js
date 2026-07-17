// การตั้งค่า Config ของ Phaser เกม
const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 675,
    backgroundColor: '#0d0d0d', 
    parent: 'game-container',
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let player;
let rooms = []; 
let corridors = []; 
let cursors;
let keyW, keyA, keyS, keyD;

function preload() {
    this.load.spritesheet('player', 'assets/sprites/spr-player.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
    // ==========================================
    // 1. วาดโครงสร้างห้องและเก็บพิกัด
    // ==========================================
    const gfx = this.add.graphics();
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.lineStyle(4, 0x4d4d4d, 1);

    rooms.push(new Phaser.Geom.Rectangle(50, 40, 500, 240));    // ห้อง 1
    rooms.push(new Phaser.Geom.Rectangle(600, 40, 550, 240));   // ห้อง 2
    rooms.push(new Phaser.Geom.Rectangle(50, 360, 450, 250));   // ห้อง 3
    rooms.push(new Phaser.Geom.Rectangle(560, 360, 590, 250));  // ห้อง 4

    // เริ่มต้นให้เข้าห้อง 2 ได้เลย แต่ทางเดินซ้าย (ไปห้อง 3) และทางเดินล่าง (3 ไป 4) จะยังไม่เปิดใช้งาน
    corridors.push(new Phaser.Geom.Rectangle(550, 120, 50, 80)); // ทางเดินบน (1 ไป 2) - เปิดแต่แรก

    rooms.forEach(r => { gfx.fillRectShape(r); gfx.strokeRectShape(r); });
    corridors.forEach(c => { gfx.fillRectShape(c); gfx.strokeRectShape(c); });

    // วาดประตูลับ Mission 2 (กั้นทางลงห้อง 3)
    this.secretDoorLeftGfx = this.add.graphics();
    this.secretDoorLeftGfx.fillStyle(0x1a1a1a, 1);
    this.secretDoorLeftGfx.lineStyle(4, 0x4d4d4d, 1);
    this.secretDoorLeftGfx.fillRectShape(new Phaser.Geom.Rectangle(120, 280, 80, 80));
    this.secretDoorLeftGfx.strokeRectShape(new Phaser.Geom.Rectangle(120, 280, 80, 80));

    // 🛠️ วาดประตูลับ Mission 3 (กั้นทางจากห้อง 3 ไปห้อง 4 ฝั่งขวา) แยกไว้สั่งทำลายเมื่อเรียงลำดับไฟถูก
    this.secretDoorBottomGfx = this.add.graphics();
    this.secretDoorBottomGfx.fillStyle(0x1a1a1a, 1);
    this.secretDoorBottomGfx.lineStyle(4, 0x4d4d4d, 1);
    this.secretDoorBottomGfx.fillRectShape(new Phaser.Geom.Rectangle(500, 480, 60, 80));
    this.secretDoorBottomGfx.strokeRectShape(new Phaser.Geom.Rectangle(500, 480, 60, 80));

    // เจาะรูทางเดินสายตาจุดอื่น ๆ ที่เปิดอยู่แล้ว
    gfx.fillStyle(0x1a1a1a, 1);
    gfx.fillRect(546, 122, 8, 76);  gfx.fillRect(596, 122, 8, 76); // รูทางเดินบน

    const textStyle = { font: '16px Arial', fill: '#888888' };
    this.add.text(70, 55, 'Mission 1: Forbidden Library', textStyle);
    this.add.text(620, 55, 'Mission 2: Statue Room', textStyle);
    this.add.text(70, 375, 'Mission 3: Torch Room', textStyle);
    this.add.text(580, 375, 'Mission 4 & 5: NPC / Chests / Exit Gate', textStyle);

    // ==========================================
    // 2. ตั้งค่าผู้เล่น
    // ==========================================
    cursors = this.input.keyboard.createCursorKeys();
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

    player = this.add.sprite(100, 150, 'player', 0).setScale(2);

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
    player.play('idle', true);

  
}

function update() {
    const speed = 4; 
    let nextX = player.x;
    let nextY = player.y;
    let isMoving = false;

    // 1. คำนวณหาพิกัดถัดไป
    if (cursors.left.isDown || keyA.isDown) {
        nextX -= speed;
        player.setFlipX(true);
        isMoving = true;
    } 
    else if (cursors.right.isDown || keyD.isDown) {
        nextX += speed;
        player.setFlipX(false);
        isMoving = true;
    }

    if (cursors.up.isDown || keyW.isDown) {
        nextY -= speed;
        isMoving = true;
    } 
    else if (cursors.down.isDown || keyS.isDown) {
        nextY += speed;
        isMoving = true;
    }

    // 2. ตรวจสอบขอบเขตแบบคิดความกว้าง-สูงของตัวละคร (ริมตัวละคร)
    if (isMoving) {
        // ตัวละครขนาด 32x32 พิกเซล คูณ Scale(2) จะมีขนาดจริงคือ 64x64 พิกเซล
        // ดังนั้น ระยะจากจุดศูนย์กลางไปถึงริมขอบแต่ละด้านคือ 32 พิกเซล (แต่ขอปรับลดเหลือ 20 เพื่อความพริ้วไม่ติดขอบประตูด้านข้างง่ายเกินไป)
        const hRadius = 20; // รัศมีด้านข้าง (ซ้าย-ขวา)
        const vRadius = 24; // รัศมีแนวตั้ง (บน-ล่าง)

        // สร้างฟังก์ชันภายในเพื่อเช็กว่า "จุดพิกัดนั้นๆ" อยู่ในห้องหรือทางเดินเชื่อมหรือไม่
        const isInsideMap = (x, y) => {
            let inside = false;
            rooms.forEach(room => { if (Phaser.Geom.Rectangle.Contains(room, x, y)) inside = true; });
            corridors.forEach(corridor => { if (Phaser.Geom.Rectangle.Contains(corridor, x, y)) inside = true; });
            return inside;
        };

        // 🛠️ ตรวจสอบจุดริมตัวละครทั้ง 4 ทิศทางในพิกัดเป้าหมายถัดไป
        let canMoveX = isInsideMap(nextX - hRadius, player.y) && isInsideMap(nextX + hRadius, player.y);
        let canMoveY = isInsideMap(player.x, nextY - vRadius) && isInsideMap(player.x, nextY + vRadius);

        // อัปเดตตำแหน่งเฉพาะแกนที่ริมตัวละครไม่หลุดออกนอกแมพ
        if (canMoveX) player.x = nextX;
        if (canMoveY) player.y = nextY;

        // เล่นแอนิเมชันเดินถ้าแกนใดแกนหนึ่งขยับได้
        if (canMoveX || canMoveY) {
            player.anims.play('walk', true);
        } else {
            player.anims.play('idle', true);
        }
    } else {
        player.anims.play('idle', true);
    }
}