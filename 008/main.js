const config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    backgroundColor: '#2d2d2d',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);
let player, cursors, wasd;
let dialogBox, dialogText, typewriteTimer; 
let endScreen, endText; 
let choicesContainer; 

const gameState = {
    hasSpell: false,
    hasLighter: false,
    hasKey: false,
    gameWon: false,
    isEnding: false, 
    statuesMoved: false,
    statueAngles: [90, 180, 270, 90], 
    torchSequence: [],
    correctTorchOrder: [3, 1, 4, 2], 
    gatesOpened: { statue: false, magic: false }, 
    npcTalkAfterSolve: 0,
    chestOpened: false, 
    correctChestId: 2   
};

function preload() {
    this.load.spritesheet('character', 'sprite/character.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('bookItem', 'Notebook/book.png'); 
    this.load.image('moai', 'Statue/imagery.png'); 
    this.load.image('torch', 'torch/link.png'); 
    this.load.image('npcSprite', 'People/npc.png'); 
    this.load.image('chestSprite', 'Treasure chest/property.png'); 
    this.load.image('gate', 'door/gate.png'); 
}

function create() {
    // --- วาดของตกแต่งพื้นหลัง ---
    drawDecorations(this);

    const walls = this.physics.add.staticGroup();
    const interactables = this.physics.add.staticGroup();

    // วาดกำแพง
    const buildWall = (x, y, w, h) => {
        let g = this.add.graphics().fillStyle(0x222222, 1).fillRect(x, y, w, h);
        g.lineStyle(2, 0x111111).strokeRect(x, y, w, h); 
        let wall = walls.create(x + w/2, y + h/2, null);
        wall.setDisplaySize(w, h).setVisible(false).refreshBody();
    };

    // --- OUTER BOUNDARY WALLS ---
    buildWall(0, 0, 1000, 20);   
    buildWall(0, 580, 1000, 20);  
    buildWall(0, 0, 20, 600);     
    buildWall(980, 0, 20, 600);    

    // --- INNER ROOM WALLS ---
    buildWall(490, 20, 20, 200);   
    buildWall(490, 380, 20, 200);  
    buildWall(20, 290, 180, 20);   
    buildWall(300, 290, 400, 20);  
    buildWall(800, 290, 180, 20);  

    // --- ROOM 1: THE LIBRARY ---
    const bookPositions = [
        { x: 150, y: 150 }, { x: 300, y: 150 }, 
        { x: 150, y: 230 }, { x: 300, y: 230 }
    ];

    for (let i = 0; i < 4; i++) {
        let book = interactables.create(bookPositions[i].x, bookPositions[i].y, 'bookItem');
        book.setDisplaySize(40, 30); 
        book.refreshBody(); 
        book.setData('type', 'book').setData('id', i + 1);
    }

    // สร้างประตูกั้นเวทมนตร์ (สีฟ้า) ระหว่างห้อง 1 และห้อง 2
    let magicGate = this.add.rectangle(500, 300, 20, 160, 0x5555ff).setAlpha(0.5);
    this.physics.add.existing(magicGate, true);

    // --- ROOM 2: STATUE ROOM ---
    const statuePositions = [
        { x: 630, y: 110 }, { x: 820, y: 110 },
        { x: 630, y: 240 }, { x: 820, y: 240 } 
    ];

    for (let i = 0; i < 4; i++) {
        let statue = interactables.create(statuePositions[i].x, statuePositions[i].y, 'moai');
        statue.setScale(0.1); 
        statue.refreshBody(); 
        statue.setData('type', 'statue').setData('id', i);
        statue.setAngle(gameState.statueAngles[i]); 
    }
    
    let statueGate = this.add.rectangle(750, 300, 100, 20, 0xff5555);
    this.physics.add.existing(statueGate, true);

    // --- ROOM 3: TORCH ROOM ---
    const torchPositions = [
        { x: 100, y: 380 }, { x: 380, y: 380 },
        { x: 100, y: 530 }, { x: 380, y: 530 } 
    ];

    for (let i = 0; i < 4; i++) {
        let torch = interactables.create(torchPositions[i].x, torchPositions[i].y, 'torch');
        torch.setScale(0.08); 
        torch.refreshBody(); 
        torch.setTint(0x333333); 
        torch.setData('type', 'torch').setData('id', i + 1);
        this.add.text(torchPositions[i].x - 5, torchPositions[i].y + 35, `${i+1}`, { font: "12px Arial", fill: "#bbb" });
    }

    // --- ROOM 4: NPC & CHEST ROOM ---
    let npc = interactables.create(540, 450, 'npcSprite'); 
    npc.setScale(0.10);
    npc.refreshBody();
    npc.setData('type', 'npc');

    const chestPositions = [
        { x: 640, y: 450 }, 
        { x: 730, y: 450 }, 
        { x: 820, y: 450 }  
    ];

    for (let i = 0; i < 3; i++) {
        let chest = interactables.create(chestPositions[i].x, chestPositions[i].y, 'chestSprite');
        chest.setScale(0.05); 
        chest.refreshBody();
        chest.setData('type', 'chest').setData('id', i + 1);
    }

    let exitGate = interactables.create(920, 450, 'gate');
    exitGate.setScale(0.15); 
    exitGate.refreshBody();
    exitGate.setData('type', 'gate');

    // --- PLAYER INITIALIZATION ---
    player = this.physics.add.sprite(100, 150, 'character', 0).setScale(1.5).setCollideWorldBounds(true);
    this.physics.add.collider(player, walls);
    // เพิ่มการชนประตูกั้นสีแดงของรูปปั้น
    this.physics.add.collider(player, statueGate, null, () => !gameState.gatesOpened.statue, this);
    // เพิ่มการชนประตูกั้นเวทมนตร์ (สีฟ้า)
    this.physics.add.collider(player, magicGate, null, () => !gameState.gatesOpened.magic, this);

    // --- DIALOG BOX ---
    dialogBox = this.add.container(500, 510).setDepth(100); 
    let dialogBg = this.add.rectangle(0, 0, 800, 120, 0x000000);
    dialogBg.setStrokeStyle(4, 0xffffff);
    dialogText = this.add.text(-370, -40, "", { 
        font: "20px Courier", 
        fill: "#ffffff", 
        wordWrap: { width: 740, useAdvancedWrap: true } 
    });
    dialogBox.add([dialogBg, dialogText]);
    dialogBox.setVisible(false);

    // --- CHOICES MENU ---
    choicesContainer = this.add.container(500, 360).setDepth(150);
    choicesContainer.setVisible(false);

    const choiceStyle = { font: "18px Courier", fill: "#ffff00", backgroundColor: "#333333" };
    // เปลี่ยนคำถามข้อ 1 ให้กวนๆ
    const choice1 = this.add.text(-350, -30, " ► [1] ลุงครับ หัวลุงหงอกหมดแล้ว เอาหัวจุดไฟแทนคบเพลิงได้ไหม? ", choiceStyle).setPadding(5).setInteractive({ useHandCursor: true });
    const choice2 = this.add.text(-350, 10, " ► [2] ลุงพอจะจำลำดับการจุดคบเพลิงได้ไหม? ", choiceStyle).setPadding(5).setInteractive({ useHandCursor: true });
    const choice3 = this.add.text(-350, 50, " ► [3] ไม่มีอะไรครับ ลาก่อน ", { font: "18px Courier", fill: "#ff5555", backgroundColor: "#333333" }).setPadding(5).setInteractive({ useHandCursor: true });

    choice1.on('pointerdown', () => {
        choicesContainer.setVisible(false);
        // เปลี่ยนคำตอบข้อ 1 ให้ลุงด่ากลับแต่ใบ้ให้เหมือนเดิม
        showDialog(this, "* NPC: 'เดี๋ยวปั๊ดเหนี่ยว! หัวคนนะเว้ยไม่ใช่ไม้ขีดไฟ! อยากได้ไฟก็ไปแก้ปริศนาขยับรูปปั้นในห้องขวาสิวะไอ้หนุ่ม!'");
    });

    choice2.on('pointerdown', () => {
        choicesContainer.setVisible(false);
        showDialog(this, "* NPC: 'ถ้าลุงจำไม่ผิด... ลำดับน่าจะเป็น 3-1-4-2 นะ อย่าลืมล่ะ!'");
    });

    choice3.on('pointerdown', () => {
        choicesContainer.setVisible(false);
        dialogBox.setVisible(false);
    });

    [choice1, choice2, choice3].forEach((c, index) => {
        let originalColor = index === 2 ? '#ff5555' : '#ffff00';
        c.on('pointerover', () => c.setStyle({ fill: '#ffffff', backgroundColor: '#555555' }));
        c.on('pointerout', () => c.setStyle({ fill: originalColor, backgroundColor: '#333333' }));
    });

    choicesContainer.add([choice1, choice2, choice3]);

    // --- ENDING SCREEN UI ---
    endScreen = this.add.rectangle(500, 300, 1000, 600, 0x000000).setDepth(200).setAlpha(0);
    endText = this.add.text(500, 300, "คุณรอดแล้ว!", { 
        font: "bold 60px Arial", 
        fill: "#00ff00" 
    }).setOrigin(0.5).setDepth(201).setAlpha(0);

    // --- INTERACTION LOGIC ---
    let lastInteractTime = 0; 

    // ส่ง magicGate เข้าไปในฟังก์ชันจัดการการตอบสนองด้วย
    this.physics.add.overlap(player, interactables, (p, obj) => {
        if (gameState.gameWon) return; 

        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            let currentTime = this.time.now;
            if (currentTime - lastInteractTime > 200) {
                lastInteractTime = currentTime;
                handleInteraction(obj, statueGate, magicGate, this);
            }
        }
    }, null, this);

    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
    player.play('idle');
}

// ฟังก์ชันวาดฉากหลังและของตกแต่ง
function drawDecorations(scene) {
    let graphics = scene.add.graphics();

    // 1. ลายตารางหินบนพื้น
    graphics.lineStyle(1, 0x000000, 0.4);
    for(let x = 0; x <= 1000; x += 50) { graphics.moveTo(x, 0); graphics.lineTo(x, 600); }
    for(let y = 0; y <= 600; y += 50) { graphics.moveTo(0, y); graphics.lineTo(1000, y); }
    graphics.strokePath();

    // 2. Room 1: พรมเวทมนตร์วงกลม
    graphics.lineStyle(3, 0x0088ff, 0.3);
    graphics.strokeCircle(225, 190, 60);
    graphics.strokeCircle(225, 190, 50);
    graphics.beginPath();
    graphics.moveTo(225, 140); graphics.lineTo(240, 240); graphics.lineTo(175, 175);
    graphics.lineTo(275, 175); graphics.lineTo(210, 240); graphics.closePath();
    graphics.strokePath();

    // 3. Room 2: แท่นวางรูปปั้น และ สัญลักษณ์ทิศเหนือ
    graphics.fillStyle(0x111111, 0.8);
    [ {x:630, y:110}, {x:820, y:110}, {x:630, y:240}, {x:820, y:240} ].forEach(pos => {
        graphics.fillEllipse(pos.x, pos.y + 15, 35, 15); 
    });
    scene.add.text(725, 155, "N", { font: "bold 20px Arial", fill: "#555555" }).setOrigin(0.5);
    graphics.lineStyle(2, 0x555555, 0.8);
    graphics.moveTo(725, 125); graphics.lineTo(725, 140);
    graphics.strokePath();

    // 4. Room 3: รอยเขม่าควันไฟใต้คบเพลิง และคำใบ้
    graphics.fillStyle(0x000000, 0.5);
    [ {x:100, y:380}, {x:380, y:380}, {x:100, y:530}, {x:380, y:530} ].forEach(pos => {
        graphics.fillEllipse(pos.x, pos.y + 15, 40, 15);
    });
    scene.add.text(240, 455, "III  -  I  -  IV  -  II", { font: "italic 16px Courier", fill: "#444" }).setOrigin(0.5);

    // 5. Room 4: รอยเลือดเตือนภัย หน้าหีบปลอม
    graphics.fillStyle(0x330000, 0.7); 
    graphics.fillCircle(640, 480, 8);
    graphics.fillCircle(650, 475, 4);
    graphics.fillCircle(820, 475, 9);
    graphics.fillCircle(810, 485, 3);
}

function showDialog(scene, text) {
    dialogBox.setVisible(true); 
    if (typewriteTimer) typewriteTimer.remove(); 
    dialogText.setText(""); 
    let i = 0;
    typewriteTimer = scene.time.addEvent({
        delay: 30, 
        callback: () => {
            dialogText.text += text[i];
            i++;
        },
        repeat: text.length - 1
    });
}

function handleInteraction(obj, statueGate, magicGate, scene) {
    const type = obj.getData('type');

    if (type === 'book') {
        let id = obj.getData('id');
        if (id === 1) {
            showDialog(scene, "* Clue 1: All statues must face the exact same direction."); 
        } else if (id === 2) {
            showDialog(scene, "* Clue 2: The statues seek the North (Point them UP)."); 
        } else {
            // เมื่อเปิดหนังสือเวทมนตร์ (เล่มอื่นๆ ที่ไม่ใช่คำใบ้)
            if (!gameState.hasSpell) {
                gameState.hasSpell = true; 
                gameState.gatesOpened.magic = true; // เปิดสถานะให้เดินผ่านได้
                if (magicGate && magicGate.active) magicGate.destroy(); // ลบประตูกั้นออกไป
                showDialog(scene, "* You found the magic spell! The magical barrier to the next room has vanished."); 
            } else {
                showDialog(scene, "* This is the book where you found the magic spell.");
            }
        }
    }

    if (type === 'statue') {
        if (!gameState.hasSpell) {
            showDialog(scene, "* The statues are sealed solid. You need a magic spell to move them!");
            return;
        }
        if (gameState.hasLighter) return;

        let id = obj.getData('id');
        gameState.statueAngles[id] = (gameState.statueAngles[id] + 90) % 360;
        obj.setAngle(gameState.statueAngles[id]);

        if (gameState.statueAngles.every(angle => angle === 0)) {
            gameState.hasLighter = true;
            gameState.gatesOpened.statue = true;
            if (statueGate && statueGate.active) statueGate.destroy();
            showDialog(scene, "* Success! Statues aligned perfectly. Obtained the LIGHTER! Red door opened.");
        } else {
            showDialog(scene, `* The statue rotates heavily...`);
        }
    }

    if (type === 'torch') {
        if (!gameState.hasLighter) {
            showDialog(scene, "* These torches won't light. You need a lighter from the statue room!");
            return;
        }

        let id = obj.getData('id');
        if (gameState.torchSequence.includes(id)) return;

        gameState.torchSequence.push(id);
        obj.clearTint(); 

        let step = gameState.torchSequence.length - 1;
        
        if (gameState.torchSequence[step] !== gameState.correctTorchOrder[step]) {
            showDialog(scene, "* Wrong order! The flames fizzle out. Start over.");
            gameState.torchSequence = [];
            obj.scene.children.list.forEach(child => {
                if (child.getData && child.getData('type') === 'torch') {
                    child.setTint(0x333333);
                }
            });
        } else if (gameState.torchSequence.length === 4) {
            showDialog(scene, "* All torches lit correctly! The path to the NPC Room is safe.");
        } else {
            showDialog(scene, `* Torch lit! Sequence: ${gameState.torchSequence.length}/4`);
        }
    }

    if (type === 'npc') {
        if (gameState.torchSequence.length < 4) {
            showDialog(scene, "* NPC: 'ว่าไงเจ้าหนุ่ม มีอะไรให้ลุงช่วยไหม? (ใช้เมาส์คลิกเลือกคำถาม)'");
            scene.time.delayedCall(1000, () => {
                choicesContainer.setVisible(true);
            });
        } else {
            const dialogues = [
                "* NPC: 'โอ้! หลานเก่งมากที่แก้ปริศนาได้ทั้งหมด'",
                "* NPC: 'ตอนนี้หลานสามารถเลือกเปิดหีบได้ 1 ใบเท่านั้นเพื่อหากุญแจ'",
                "* NPC: 'ระวังให้ดีล่ะ หีบปลอมมีกับดักมรณะซ่อนอยู่!'"
            ];
            showDialog(scene, dialogues[gameState.npcTalkAfterSolve]);
            if (gameState.npcTalkAfterSolve < dialogues.length - 1) {
                gameState.npcTalkAfterSolve++;
            }
        }
    }

    if (type === 'chest') {
        if (gameState.torchSequence.length < 4) {
            showDialog(scene, "* The chests are magically locked tightly by the surrounding shadows.");
            return;
        }

        if (gameState.chestOpened) {
            showDialog(scene, "* You already made your choice. The remaining chests are sealed forever.");
            return;
        }

        gameState.chestOpened = true; 
        
        let chestId = obj.getData('id');

        if (chestId === gameState.correctChestId) {
            gameState.hasKey = true; 
            showDialog(scene, "* 🌟 You open the chest... You found the GOLDEN KEY! 🌟 Now escape through the door!");
            obj.setTint(0x00ff00); 
        } else {
            showDialog(scene, "* ☠️ SNAP! It's a Mimic Trap! Poison gas fills the room... (GAME OVER)");
            obj.setTint(0xff0000); 
        }
    }

    if (type === 'gate') {
        if (gameState.hasKey) {
            showDialog(scene, "* 🗝️ You unlocked the door with the Golden Key! Escaping the dungeon...");
            gameState.gameWon = true; 
            
            player.setCollideWorldBounds(false); 
            obj.setAlpha(0.5); 
            
            scene.time.delayedCall(1500, () => {
                dialogBox.setVisible(false); 
                if (!gameState.isEnding) {
                    gameState.isEnding = true;
                    scene.tweens.add({
                        targets: [endScreen, endText],
                        alpha: 1,
                        duration: 1500 
                    });
                }
            });

        } else {
            showDialog(scene, "* The gate is firmly locked. You need to find a Golden Key.");
        }
    }
}

function update() {
    const speed = 180;
    
    if (gameState.gameWon) {
        player.setVelocityX(100); 
        player.setVelocityY(0);
        player.setFlipX(false);
        if (player.anims.currentAnim.key !== 'walk') player.play('walk');
        return; 
    }

    player.setVelocity(0);
    let moving = false;

    if (cursors.left.isDown || wasd.left.isDown) {
        player.setVelocityX(-speed); player.setFlipX(true); moving = true;
    } else if (cursors.right.isDown || wasd.right.isDown) {
        player.setVelocityX(speed); player.setFlipX(false); moving = true;
    }

    if (cursors.up.isDown || wasd.up.isDown) {
        player.setVelocityY(-speed); moving = true;
    } else if (cursors.down.isDown || wasd.down.isDown) {
        player.setVelocityY(speed); moving = true;
    }

    if (moving) {
        if (player.anims.currentAnim.key !== 'walk') player.play('walk');
        
        if (dialogBox.visible || choicesContainer.visible) {
            dialogBox.setVisible(false);
            choicesContainer.setVisible(false); 
            if (typewriteTimer) typewriteTimer.remove(); 
        }
    } else {
        if (player.anims.currentAnim.key !== 'idle') player.play('idle');
    }
}