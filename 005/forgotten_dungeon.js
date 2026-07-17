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
// ตัวแปรสำหรับระบบภารกิจ 2 (รูปปั้น)
let statues = []; 
let isMission2Complete = false;
// ตัวแปรสำหรับระบบภารกิจ 3 (คบเพลิง)
let torches = [];
let correctSequence = [2, 0, 3, 1]; 
let playerSequence = []; 
let isMission3Complete = false;
// Mission 4 Variables (NPC Dialogue State)
let npc;
let npcDialogueCount = 0; // ตัวนับสถานะว่าคุยไปกี่ครั้งแล้ว


function preload() {
    this.load.spritesheet('player', 'assets/sprites/spr-player.png', { frameWidth: 32, frameHeight: 32 });
     // โหลดภาพเดี่ยวแยกกัน 5 เล่ม
    this.load.image('book1', 'assets/items/book1.png');
    this.load.image('book2', 'assets/items/book2.png');
    this.load.image('book3', 'assets/items/book3.png');
    this.load.image('book4', 'assets/items/book4.png');
    this.load.image('book5', 'assets/items/book5.png');
    // โหลดภาพรูปปั้นห้อง 2
    this.load.image('statue', 'assets/items/statue.png'); 
    // เพิ่มการโหลดสไปรท์คบเพลิง 4x2
    this.load.spritesheet('torch', 'assets/items/torch.png', { frameWidth: 64, frameHeight: 64 });
    // ภาพ NPC
    this.load.image('npc', 'assets/environments/npc.png');
}

function create() {
    // ==========================================
    // วาดโครงสร้างห้องและเก็บพิกัด
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
    // ตั้งค่าผู้เล่น (ไม่ใช่ฟิสิกส์ ชนริมตัวละครเป๊ะ)
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
    this.anims.create({
        key: 'torchFire',
        frames: this.anims.generateFrameNumbers('torch', {
            start: 0,
            end: 7      // ถ้ามี 8 เฟรม
        }),
        frameRate: 10,
        repeat: -1
    });
    player.play('idle', true);


    // ==========================================
    // 🛠️ MISSION 1: ระบบหนังสือ 5 เล่ม (บีบ Hit Area ป้องกันการบังกัน)
    // ==========================================
    const bookPositionsX = [160, 220, 280, 340, 400];
    const correctBookIndex = 4; // เล่มที่ 5 (index 4) เป็น Ancient Spell Book

    const bookTexts = [
        "นี่เป็นเพียงหนังสือประวัติศาสตร์เก่าเล่มหนึ่ง", 
        "หน้ากระดาษเต็มไปด้วยฝุ่นและอ่านไม่ออก",
        "มันเป็นรวมนิทานพื้นบ้านง่ายๆ เรื่องหนึ่ง",
        "สมุดบันทึกเก่าของนักสำรวจคนก่อน",
        "✨ คุณพบหนังสือเวทมนตร์โบราณแล้ว! ✨\n[Got Magic Scroll]"
    ];

    // สร้างกล่องข้อความกลางอันเดียว
    let globalBubble = this.add.text(0, 0, '', { 
        font: '14px Arial', 
        fill: '#ffffff', 
        backgroundColor: '#000000', 
        padding: { x: 8, y: 6 },
        align: 'center'
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10); 

    let hideTimer = null;

    bookPositionsX.forEach((posX, index) => {
        let bookKey = `book${index + 1}`; 
        let book = this.add.sprite(posX, 140, bookKey).setScale(0.15); 
        
        // เปิดโหมด Interactive พร้อมบีบกล่องรับการคลิก (Hit Area) 
        // ให้เท่ากับขนาดของรูปภาพจริง
        book.setInteractive(new Phaser.Geom.Rectangle(0, 0, book.width, book.height), Phaser.Geom.Rectangle.Contains);
        this.input.setHitArea(book); 
        book.on('pointerdown', () => {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, book.x, book.y);
            // ระยะตรวจจับ
            if (distance < 80) {
                globalBubble.setPosition(book.x, book.y - 25);
                globalBubble.setText(bookTexts[index]);

                if (index === correctBookIndex) {
                    globalBubble.setStyle({ fill: '#ffcc00' }); 
                } else {
                    globalBubble.setStyle({ fill: '#ff4444' }); 
                }
                
                globalBubble.setVisible(true);

                if (hideTimer) hideTimer.remove();

                hideTimer = this.time.delayedCall(2000, () => {
                    globalBubble.setVisible(false);
                });
            } else {
                console.log("Too far! Walk closer to inspect.");
            }
        });
    });

    // ==========================================
    //  MISSION 2: ระบบรูปปั้น 4 ตัว
    // ==========================================
    const statueData = [
        { x: 720,  y: 130,  target: 180 }, 
        { x: 1000, y: 130,  target: 90  }, 
        { x: 720,  y: 230, target: 0   }, 
        { x: 1000, y: 230, target: 270 }  
    ];

    statueData.forEach((data, index) => {
        let statue = this.add.sprite(data.x, data.y, 'statue').setScale(0.2); 
        statue.setAngle(0); 
        statue.setInteractive(new Phaser.Geom.Rectangle(0, 0, statue.width, statue.height), Phaser.Geom.Rectangle.Contains);
        this.input.setHitArea(statue);

        statue.targetAngle = data.target;

        let statusText = this.add.text(data.x, data.y - 45, `0° / Target: ${data.target}°`, {
            font: '11px Arial', fill: '#ffffff', backgroundColor: '#333333', padding: {x:3, y:2}
        }).setOrigin(0.5);

        statue.on('pointerdown', () => {
            if (isMission2Complete) return; 

            let distance = Phaser.Math.Distance.Between(player.x, player.y, statue.x, statue.y);
            
            if (distance < 90) { 
                let nextAngle = (statue.angle + 90) % 360;
                if (nextAngle < 0) nextAngle += 360; 
                statue.setAngle(nextAngle);

                statusText.setText(`${nextAngle}° / Target: ${statue.targetAngle}°`);

                if (nextAngle === statue.targetAngle) {
                    statusText.setStyle({ fill: '#00ff00', backgroundColor: '#003300' }); 
                } else {
                    statusText.setStyle({ fill: '#ffffff', backgroundColor: '#333333' });
                }

                checkAllStatues();
            }
        });

        statues.push(statue); 
    });

    const checkAllStatues = () => {
        let allCorrect = true;
        
        statues.forEach(s => {
            let currentAngle = s.angle;
            if (currentAngle < 0) currentAngle += 360;
            if (currentAngle !== s.targetAngle) allCorrect = false;
        });

        if (allCorrect && !isMission2Complete) {
            isMission2Complete = true;
            corridors.push(new Phaser.Geom.Rectangle(120, 280, 80, 80)); 
            this.secretDoorLeftGfx.destroy(); 

            const postGfx = this.add.graphics();
            postGfx.fillStyle(0x1a1a1a, 1);
            postGfx.fillRect(122, 276, 76, 8); 
            postGfx.fillRect(122, 356, 76, 8);

            let winText = this.add.text(600, 330, "The Passage to the Torch Room is Open!", {
                font: '20px Arial', fill: '#ffcc00', backgroundColor: '#000000', padding: {x:10, y:5}
            }).setOrigin(0.5).setDepth(20);
            this.time.delayedCall(3000, () => { winText.destroy(); });
        }
    };
    // ==========================================
    // 🛠️  MISSION 3: ระบบห้องคบเพลิง 4 อัน 
    // ==========================================
    
    const torchPositionsX = [120, 210, 300, 390];

    let torchStatusText = this.add.text(250, 385, "Torches: [ ] [ ] [ ] [ ]", {
        font: '13px Arial', fill: '#ffffff', backgroundColor: '#222222', padding: {x:8, y:4}
    }).setOrigin(0.5);

    torchPositionsX.forEach((posX, index) => {
        // 🌟 บังคับให้อยู่เฟรม 0 ตลอดไป ภาพจะได้ไม่วิ่งข้ามคอลลัมน์
        let torch = this.add.sprite(posX, 460, 'torch', 0).setScale(1.0);
        torch.play('torchFire');
        torch.setInteractive();

        torch.torchId = index; 
        torch.isLit = false;   
        torch.startX = posX;     // จำพิกัด X เริ่มต้นไว้
        torch.startY = 460;    // จำพิกัด Y เริ่มต้นไว้

        // เริ่มต้นย้อมสีมืด (ไฟดับ)
        torch.setTint(0x444444); 

        torch.on('pointerdown', () => {
            if (isMission3Complete) return; 

            let distance = Phaser.Math.Distance.Between(player.x, player.y, torch.x, torch.y);
            
            if (distance < 800) {
                if (!torch.isLit) {
                    torch.isLit = true;
                    
                    // ✨ เปิดไฟ: ล้างสีที่ย้อมมืดออกให้ภาพสว่างใส (และใน update จะสั่งให้มันสั่นเอง)
                    torch.clearTint(); 
                    
                    playerSequence.push(torch.torchId); 
                    updateTorchUI();
                    checkTorchSequence();
                }
            }
        });

        torches.push(torch);
    });

    const updateTorchUI = () => {
        let displayStr = "Torches: ";
        playerSequence.forEach(id => { displayStr += `[ ${id + 1} ] `; });
        torchStatusText.setText(displayStr);
    };

    const checkTorchSequence = () => {
        let currentStep = playerSequence.length - 1;

        if (playerSequence[currentStep] !== correctSequence[currentStep]) {
            torchStatusText.setText("❌ WRONG! Resetting...");
            torchStatusText.setStyle({ fill: '#ff4444' });
            this.time.delayedCall(800, () => { resetTorches(); });
            return;
        }

        if (playerSequence.length === correctSequence.length) {
            isMission3Complete = true;
            torchStatusText.setText("✨ SUCCESS! Way to Room 4 is Open!");
            torchStatusText.setStyle({ fill: '#00ff00', backgroundColor: '#003300' });

            corridors.push(new Phaser.Geom.Rectangle(500, 480, 60, 80));
            this.secretDoorBottomGfx.destroy();

            const postGfx3 = this.add.graphics();
            postGfx3.fillStyle(0x1a1a1a, 1);
            postGfx3.fillRect(496, 482, 8, 76);  
            postGfx3.fillRect(556, 482, 8, 76);
        }
    };

    const resetTorches = () => {
        playerSequence = [];
        torches.forEach((t) => {
            t.isLit = false;
            t.setTint(0x444444);  // กลับมามืดเหมือนเดิม
            t.setPosition(t.startX, t.startY); // ดึงกลับพิกัดเดิมเป๊ะ ๆ
        });
        torchStatusText.setText("Torches: [ ] [ ] [ ] [ ]");
        torchStatusText.setStyle({ fill: '#ffffff', backgroundColor: '#222222' });
    };

    // ==========================================
    // 🌟 MISSION 4: ระบบ NPC (Dialogue State)
    // ==========================================
    
    // สร้างตัว NPC ยืนอยู่ในห้อง 4 (พิกัด X: 850, Y: 480)
    npc = this.add.sprite(850, 480, 'npc').setScale(0.6);
    
    // ตั้งค่า Hit Area สำหรับคลิกให้พอดีกับขนาดรูปภาพใหม่ที่ย่อแล้ว
    npc.setInteractive(new Phaser.Geom.Rectangle(0, 0, npc.width, npc.height), Phaser.Geom.Rectangle.Contains);
    this.input.setHitArea(npc);

    // ข้อความบอกใบ้ด้านบนหัว NPC (ขยับ Y ขึ้นไปเล็กน้อยไม่ให้บังตัว NPC)
    this.add.text(850, 435, "💬 NPC (Click to talk)", { font: '12px Arial', fill: '#888888' }).setOrigin(0.5);

    // กล่องข้อความคำพูดของ NPC (Speech Bubble)
    let npcBubble = this.add.text(850, 425, '', { 
        font: '15px Arial', 
        fill: '#ffffff', 
        backgroundColor: '#111111', 
        padding: { x: 10, y: 6 },
        align: 'center'
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10); 

    let npcTimer = null;

    // รายการคำพูดตาม Dialogue State
    const npcDialogues = [
        "กุญแจถูกซ่อนไว้",      // ครั้งที่ 1 (Index 0)
        "มองไปใกล้ๆ รูปปั้นสิ",   // ครั้งที่ 2 (Index 1)
        "โชคดีนะ"              // ครั้งที่ 3 เป็นต้นไป (Index 2)
    ];

    npc.on('pointerdown', () => {
        let distance = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
        
        if (distance < 900) {
            let currentText = npcDialogues[npcDialogueCount];
            
            npcBubble.setText(currentText);
            npcBubble.setVisible(true);

            if (npcDialogueCount === 0) npcBubble.setStyle({ fill: '#ffffff' });
            if (npcDialogueCount === 1) npcBubble.setStyle({ fill: '#ffcc00' }); 
            if (npcDialogueCount >= 2) npcBubble.setStyle({ fill: '#0cc1f3' });

            if (npcDialogueCount < npcDialogues.length - 1) {
                npcDialogueCount++;
            }

            if (npcTimer) npcTimer.remove();
            npcTimer = this.time.delayedCall(2500, () => { 
                npcBubble.setVisible(false); 
            });
        }
    });
}

function update() {
    const speed = 4; 
    let nextX = player.x;
    let nextY = player.y;
    let isMoving = false;

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

    if (isMoving) {
        const hRadius = 20; 
        const vRadius = 24; 

        const isInsideMap = (x, y) => {
            let inside = false;
            rooms.forEach(room => { if (Phaser.Geom.Rectangle.Contains(room, x, y)) inside = true; });
            corridors.forEach(corridor => { if (Phaser.Geom.Rectangle.Contains(corridor, x, y)) inside = true; });
            return inside;
        };

        let canMoveX = isInsideMap(nextX - hRadius, player.y) && isInsideMap(nextX + hRadius, player.y);
        let canMoveY = isInsideMap(player.x, nextY - vRadius) && isInsideMap(player.x, nextY + vRadius);

        if (canMoveX) player.x = nextX;
        if (canMoveY) player.y = nextY;

        if (canMoveX || canMoveY) {
            player.anims.play('walk', true);
        } else {
            player.anims.play('idle', true);
        }
    } else {
        player.anims.play('idle', true);
    }
}