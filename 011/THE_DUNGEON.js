// =========================================================
// WORLD CUP FOOTBALL DUNGEON — Phaser 3 Top-Down RPG Puzzle
// (เวอร์ชันแก้ไขทางเดินถูกบล็อก + จัดตำแหน่งวัตถุลงล็อก 100%)
// =========================================================

const config = {
    type: Phaser.AUTO,
    width: 1380,
    height: 700,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false // เปลี่ยนเป็น true หากต้องการดูกรอบชนสีชมพู/เขียวของ Phaser
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// ===== คีย์บอร์ด / ผู้เล่น =====
let cursors, keyW, keyA, keyS, keyD, keyE, keyB;
let player, walls;
const speed = 200;
let lastFacing = 'down';

// ===== สเกลของแต่ละวัตถุ =====
const SCALE = {
    book: 0.14,
    statue: 0.09,
    torch: 0.13,
    messi: 0.22,
    chest: 0.14,
    door: 1
};

// ===== สถานะภารกิจหลัก =====
let currentMission = 1;
let hasKey = false;
let penaltyUntil = 0;

// ===== UI กลาง =====
let interactPrompt;
let messageBox, messageText;
let messageHideAt = 0;
let interactables = [];

// =========================================================
// กำแพง — แก้ไขจุดที่บล็อกทางเดิน และตบกรอบให้แนบชิดกำแพงจริง
// =========================================================
const WALL_RECTS = [
    // 1. ขอบสเตเดียมด้านนอกสุด (Outer Boundaries)
    { x: 690, y: 20, w: 1380, h: 40 },       // ขอบบนสุด
    { x: 690, y: 680, w: 1380, h: 40 },      // ขอบล่างสุด
    { x: 20, y: 350, w: 40, h: 700 },        // ขอบซ้ายสุด
    { x: 1255, y: 260, w: 40, h: 440 },      // ขอบขวาสุด (ช่วงห้อง 2 และด้านบนห้อง 4)

    // 2. กำแพงแบ่งห้อง (เว้นช่องประตูขนาด 60px พอดีกับซุ้มประตูสีทองบนพื้น)
    // --- ฝั่งซ้าย (ห้อง 1 และ ห้อง 3) ---
    { x: 150, y: 275, w: 230, h: 30 },       // ห้อง 1 กำแพงล่าง (ซ้ายของประตู)
    { x: 450, y: 275, w: 200, h: 30 },       // ห้อง 1 กำแพงล่าง (ขวาของประตู)
    { x: 150, y: 425, w: 230, h: 30 },       // ห้อง 3 กำแพงบน (ซ้ายของประตู)
    { x: 450, y: 425, w: 200, h: 30 },       // ห้อง 3 กำแพงบน (ขวาของประตู)
    { x: 545, y: 150, w: 30, h: 220 },       // ห้อง 1 กำแพงขวา
    { x: 545, y: 550, w: 30, h: 220 },       // ห้อง 3 กำแพงขวา

    // --- ฝั่งขวา (ห้อง 2 และ ห้อง 4) ---
    { x: 828, y: 275, w: 217, h: 30 },       // ห้อง 2 กำแพงล่าง (ซ้ายของประตู)
    { x: 1130, y: 335, w: 210, h: 150 },      // ห้อง 2 กำแพง ล่าง (ขวาของประตู)
    { x: 830, y: 425, w: 220, h: 30 },       // ห้อง 4 กำแพงบน (ซ้ายของประตู)
    { x: 1130, y: 400, w: 210, h: 30 },      // ห้อง 4 กำแพงบน (ขวาของประตู)
    { x: 735, y: 150, w: 30, h: 220 },       // ห้อง 2 กำแพงซ้าย
    { x: 735, y: 550, w: 30, h: 220 },       // ห้อง 4 กำแพงซ้าย

    // 3. กำแพงล้อมรอบซอกประตูทางออกสีฟ้า (ขวาล่าง)
    { x: 1255, y: 495, w: 40, h: 110 },      // กำแพงกั้นเหนือช่องทางออก
    { x: 1310, y: 530, w: 150, h: 40 },      // หลังคาของซอกทางออก
    { x: 1365, y: 610, w: 40, h: 180 }       // กำแพงปิดท้ายซอกทางออกขวาสุด
];

// =========================================================
// ประตูล็อกระหว่างห้อง — จัดตำแหน่งให้อยู่ตรงกลางช่องประตูเป๊ะๆ
// =========================================================
const GATE_DEFS = [
    { key: 'gate1', x: 305, y: 275, w: 80, h: 30, requiredMission: 2 }, // ประตูทางออกห้อง 1
    { key: 'gate2', x: 980, y: 275, w: 80, h: 30, requiredMission: 2 }, // ประตูทางเข้าห้อง 2
    { key: 'gate3', x: 310, y: 425, w: 80, h: 30, requiredMission: 3 }, // ประตูทางเข้าห้อง 3
    { key: 'gate4', x: 980, y: 425, w: 80, h: 30, requiredMission: 4 }  // ประตูทางเข้าห้อง 4
];
let gates = [];
let gatesGroup;
let gateBumpMessageAt = 0;

// ===== Debug overlay =====
let debugGraphics;
let debugVisible = false;

// ===== HUD แสดงภารกิจปัจจุบัน =====
let missionStatusText;
const MISSION_STATUS_LABELS = {
    1: 'ภารกิจปัจจุบัน: Mission 1 — หาหนังสือที่ถูกต้อง',
    2: 'ภารกิจปัจจุบัน: Mission 2 — หมุนรูปปั้นให้ถูกทิศ',
    3: 'ภารกิจปัจจุบัน: Mission 3 — จุดคบเพลิงให้ถูกลำดับ',
    4: 'ภารกิจปัจจุบัน: Mission 4 — คุยกับเมสซี่',
    5: 'ภารกิจปัจจุบัน: Mission 5 — เลือกกล่องสมบัติ',
    6: 'ภารกิจปัจจุบัน: ไปที่ประตูทางออก'
};

// ===== MISSION 1: หนังสือ =====
let books = [];
let hasFootballScroll = false;
const bookTexts = [
    'World Cup History - จุดเริ่มต้นแห่งความยิ่งใหญ่',
    'Greatest Players - ตำนานแห่งเกมลูกหนัง',
    'Memorable Matches - ค่ำคืนแห่งการพลิกกลับที่น่าจดจำ',
    'World Cup Stadiums - สนามที่ความฝันเป็นจริง',
    'Beyond the Dream - ชัยชนะสูงสุด'
];
const correctBookIndex = 4;

// ===== MISSION 2: รูปปั้น =====
let statues = [];
let statueDirections = [0, 0, 0, 0];
const statueTarget = [0, 1, 2, 3];
const dirLabel = ['N', 'E', 'S', 'W'];
let statuesSolved = false;

// ===== MISSION 3: คบเพลิง =====
let torches = [];
let torchLit = [false, false, false, false];
let torchSequence = [];
const correctTorchOrder = [1, 3, 4, 2];
let torchSolved = false;

// ===== MISSION 4: บทสนทนาเมสซี่ =====
let messiNPC;
let messiDialogueActive = false;
let messiDialogueIndex = 0;
let messiDialogueComplete = false;
const messiLines = [
    'Welcome, champion. You\'ve proven your skills through the rooms.',
    'One final test remains. Three World Cup chests stand before you.',
    'Careful, only one chest holds the key! Choose wisely. Good luck.'
];

// ===== MISSION 5: กล่องสมบัติ =====
let chests = [];
const correctChestIndex = 1;
let chestOpened = false;

// ===== ประตูทางออก =====
let door;
let doorOpened = false;

// ===== ฉากจบเกม =====
let victoryOverlay, victoryText, restartButton;
let gameWon = false;

// =========================================================
// PRELOAD
// =========================================================
function preload() {
    this.load.image('stadium_map', 'sprites/Map.png'); 
    this.load.spritesheet('player', 'sprites/GhostSheet_Character.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('book1', 'sprites/book1.png');
    this.load.image('book2', 'sprites/book2.png');
    this.load.image('book3', 'sprites/book3.png');
    this.load.image('book4', 'sprites/book4.png');
    this.load.image('book5', 'sprites/book5.png');
    this.load.image('jude_statue', 'sprites/jude bellingham_Statue.png');
    this.load.image('fire1', 'sprites/fire1.png');
    this.load.image('fire2', 'sprites/fire2.png');
    this.load.image('fire3', 'sprites/fire3.png');
    this.load.image('messi_npc', 'sprites/messi NPC.png');
    this.load.image('box1', 'sprites/box1.png');
    this.load.image('box2', 'sprites/box2.png');
    this.load.image('box3', 'sprites/box3.png');
    this.load.image('door1', 'sprites/door1.png');
    this.load.image('door2', 'sprites/door2.png');
    this.load.image('wc_key', 'sprites/key.png');
}

// =========================================================
// CREATE
// =========================================================
function create() {
    const scene = this;

    this.add.image(690, 350, 'stadium_map').setDisplaySize(1380, 700).setDepth(-10);
    this.physics.world.setBounds(0, 0, 1380, 700);

    // ===== สร้างกำแพงถาวร =====
    walls = this.physics.add.staticGroup();

    function addWall(x, y, w, h) {
        const wall = scene.add.rectangle(x, y, w, h, 0x000000, 0.001); 
        scene.physics.add.existing(wall, true); 
        walls.add(wall);
        return wall;
    }

    WALL_RECTS.forEach(r => addWall(r.x, r.y, r.w, r.h));

    // ===== สร้างประตูล็อกระหว่างห้อง =====
    gatesGroup = this.physics.add.staticGroup();
    gates = GATE_DEFS.map(def => {
        const rect = scene.add.rectangle(def.x, def.y, def.w, def.h, 0x000000, 0.001);
        scene.physics.add.existing(rect, true);
        gatesGroup.add(rect);
        return { key: def.key, rect, requiredMission: def.requiredMission };
    });

    // ===== ตั้งค่าผู้เล่นให้อยู่ในจุดปลอดภัยห้องแรก =====
    player = this.physics.add.sprite(220, 140, 'player', 0).setScale(2).setDepth(10);
    player.setCollideWorldBounds(true);
    player.body.setSize(18, 24);
    player.body.setOffset(7, 6);
    this.physics.add.collider(player, walls);
    this.physics.add.collider(player, gatesGroup, onGateBump);

    updateGates(); 

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 27 }), frameRate: 8, repeat: -1 });

    cursors = this.input.keyboard.createCursorKeys();
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    keyB = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.B);

    interactPrompt = this.add.text(0, 0, 'กด E', {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#000000', padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setDepth(30).setVisible(false);

    messageBox = this.add.rectangle(690, 630, 1040, 90, 0x000000, 0.8)
        .setStrokeStyle(2, 0xffe066).setDepth(40).setVisible(false);
    messageText = this.add.text(690, 630, '', {
        fontSize: '19px', fontFamily: 'Arial', color: '#ffffff',
        align: 'center', wordWrap: { width: 980 }
    }).setOrigin(0.5).setDepth(41).setVisible(false);

    missionStatusText = this.add.text(20, 660, '', {
        fontSize: '16px', fontFamily: 'Arial', color: '#ffe066',
        backgroundColor: '#000000cc', padding: { x: 8, y: 4 }
    }).setDepth(50);
    updateMissionStatusText();

    this.add.text(1230, 684, 'กด B = ดูกรอบชนกำแพง (debug)', {
        fontSize: '12px', fontFamily: 'Arial', color: '#ffffff88'
    }).setOrigin(1, 1).setDepth(50);

    debugGraphics = this.add.graphics().setDepth(200).setVisible(false);

    setupBooks(scene);
    setupStatues(scene);
    setupTorches(scene);
    setupMessi(scene);
    setupChests(scene);
    setupDoor(scene);

    victoryOverlay = this.add.rectangle(690, 350, 1380, 700, 0x000000, 0.85).setDepth(100).setVisible(false);
    victoryText = this.add.text(690, 320, '🏆 WORLD CUP CHAMPION! 🏆\nคุณหนีออกจากดันเจี้ยนสำเร็จ!', {
        fontSize: '40px', fontFamily: 'Arial', color: '#ffe066', align: 'center'
    }).setOrigin(0.5).setDepth(101).setVisible(false);
    
    restartButton = this.add.text(690, 450, '🔄 เริ่มใหม่', {
        fontSize: '28px', fontFamily: 'Arial', color: '#ffffff',
        backgroundColor: '#4a3220', padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(101).setVisible(false)
        .setInteractive({ useHandCursor: true })
        .on('pointerdown', () => {
            currentMission = 1;
            hasKey = false;
            penaltyUntil = 0;
            interactables = [];
            books = [];
            statues = [];
            torches = [];
            chests = [];
            hasFootballScroll = false;
            statueDirections = [0, 0, 0, 0];
            statuesSolved = false;
            torchLit = [false, false, false, false];
            torchSequence = [];
            torchSolved = false;
            messiDialogueActive = false;
            messiDialogueIndex = 0;
            messiDialogueComplete = false;
            chestOpened = false;
            doorOpened = false;
            gameWon = false;
            messageHideAt = 0;
            scene.scene.restart();
        });
}

// =========================================================
// UPDATE
// =========================================================
function update(time, delta) {
    if (gameWon) return;
    handleMovement(time);
    handleInteractionCheck(time);

    if (Phaser.Input.Keyboard.JustDown(keyB)) {
        debugVisible = !debugVisible;
        debugGraphics.setVisible(debugVisible);
        if (debugVisible) drawDebugOverlay();
    }
}

function handleMovement(time) {
    let vx = 0; let vy = 0;
    const currentSpeed = (time < penaltyUntil) ? speed * 0.35 : speed;
    const movementLocked = messiDialogueActive;

    if (!movementLocked) {
        if (cursors.left.isDown || keyA.isDown) { vx = -currentSpeed; lastFacing = 'left'; }
        else if (cursors.right.isDown || keyD.isDown) { vx = currentSpeed; lastFacing = 'right'; }

        if (cursors.up.isDown || keyW.isDown) { vy = -currentSpeed; lastFacing = 'up'; }
        else if (cursors.down.isDown || keyS.isDown) { vy = currentSpeed; lastFacing = 'down'; }
    }

    if (vx !== 0 && vy !== 0) { const norm = Math.SQRT1_2; vx *= norm; vy *= norm; }
    player.setVelocity(vx, vy);

    if (vx < 0) player.flipX = true; else if (vx > 0) player.flipX = false;
    if (vx !== 0 || vy !== 0) player.anims.play('walk', true); else player.anims.play('idle', true);
}

function handleInteractionCheck(time) {
    if (messageHideAt && time > messageHideAt) hideMessage();
    if (messiDialogueActive) {
        interactPrompt.setVisible(false);
        if (Phaser.Input.Keyboard.JustDown(keyE)) advanceMessiDialogue();
        return;
    }

    let nearest = null; let nearestDist = Infinity;
    interactables.forEach(obj => {
        if (obj.done) return;
        const d = Phaser.Math.Distance.Between(player.x, player.y, obj.sprite.x, obj.sprite.y);
        if (d < obj.range && d < nearestDist) { nearest = obj; nearestDist = d; }
    });

    if (nearest) {
        interactPrompt.setVisible(true);
        interactPrompt.setPosition(nearest.sprite.x, nearest.sprite.y - nearest.promptOffsetY);
        interactPrompt.setText(nearest.promptText || 'กด E');
        if (Phaser.Input.Keyboard.JustDown(keyE)) nearest.onInteract();
    } else {
        interactPrompt.setVisible(false);
    }
}

function registerInteractable(sprite, range, promptOffsetY, onInteract, promptText) {
    interactables.push({ sprite, range, promptOffsetY, onInteract, promptText, done: false });
}

// =========================================================
// UI FUNCTIONS
// =========================================================
function showMessage(text, durationMs) {
    messageText.setText(text);
    messageBox.setVisible(true);
    messageText.setVisible(true);
    messageHideAt = durationMs ? (performance.now() + durationMs) : 0;
}
function hideMessage() { messageBox.setVisible(false); messageText.setVisible(false); messageHideAt = 0; }
function showLockedMessage() { showMessage('🔒 ต้องทำภารกิจก่อนหน้าให้สำเร็จก่อนถึงจะผ่านมาตรงนี้ได้นะ!', 1600); }

function updateGates() {
    gates.forEach(g => {
        g.rect.body.enable = currentMission < g.requiredMission;
    });
}

function onGateBump(playerObj, gateRect) {
    const now = performance.now();
    if (now - gateBumpMessageAt > 400) {
        gateBumpMessageAt = now;
        showLockedMessage();
    }
}

function updateMissionStatusText() {
    if (!missionStatusText) return;
    missionStatusText.setText(MISSION_STATUS_LABELS[currentMission] || '');
}

function drawDebugOverlay() {
    debugGraphics.clear();

    debugGraphics.lineStyle(2, 0xff3b3b, 1);
    debugGraphics.fillStyle(0xff3b3b, 0.25);
    WALL_RECTS.forEach(r => {
        debugGraphics.fillRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
        debugGraphics.strokeRect(r.x - r.w / 2, r.y - r.h / 2, r.w, r.h);
    });

    gates.forEach(g => {
        const locked = g.rect.body.enable;
        const color = locked ? 0xffe066 : 0x4caf50;
        debugGraphics.lineStyle(2, color, 1);
        debugGraphics.fillStyle(color, 0.35);
        const b = g.rect.getBounds();
        debugGraphics.fillRect(b.x, b.y, b.width, b.height);
        debugGraphics.strokeRect(b.x, b.y, b.width, b.height);
    });
}

function createHintSign(scene, x, y, hintText) {
    const glow = scene.add.circle(x, y, 17, 0xffe066, 0.25).setDepth(2);
    scene.add.circle(x, y, 14, 0x2b2b2b, 0.9).setStrokeStyle(2, 0xffe066).setDepth(3);
    scene.add.text(x, y, '?', {
        fontSize: '18px', fontFamily: 'Arial', color: '#ffe066', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(4);

    scene.tweens.add({ targets: glow, scale: 1.3, alpha: 0.05, duration: 900, yoyo: true, repeat: -1 });
    registerInteractable(glow, 45, 26, () => showMessage(hintText, 4000), 'กด E เพื่อดูคำใบ้');
}

// ================= MISSION 1: หนังสือ (จัดพิกัดให้สมดุล) =================
function setupBooks(scene) {
    const bookX = [100, 170, 240, 310, 380];
    const bookY = 110;
    const bookKeys = ['book1', 'book2', 'book3', 'book4', 'book5'];

    bookKeys.forEach((key, i) => {
        const book = scene.add.image(bookX[i], bookY, key).setScale(SCALE.book).setDepth(2);
        books.push(book);
        registerInteractable(book, 55, 45, () => handleBookInteract(i), 'กด E เพื่ออ่านหนังสือ');
    });
}

function handleBookInteract(index) {
    if (currentMission !== 1) { showMessage(bookTexts[index], 2500); return; }

    if (index === correctBookIndex) {
        hasFootballScroll = true;
        showMessage(bookTexts[index] + '\n\n✨ คุณได้รับ "FOOTBALL SCROLL"! ทางไปห้องที่ 2 เปิดแล้ว', 3200);
        currentMission = 2;
        updateGates();
        updateMissionStatusText();
    } else {
        showMessage(bookTexts[index] + '\n\n❌ ยังไม่ใช่เล่มที่ถูกต้อง ลองหาเล่มอื่นดูนะ!', 2200);
    }
}

// ================= MISSION 2: รูปปั้น (ขยับเข้าในห้อง ไม่ให้ตกแมพ) =================
function setupStatues(scene) {
    // ขยับพิกัดมาทางซ้าย [850, 940, 1030, 1120] เพื่อให้อยู่กึ่งกลางห้อง 2 ไม่หลุดออกไปทางขวา
    const statueX = [850, 940, 1030, 1120];
    const statueY = 170;

    for (let i = 0; i < 4; i++) {
        const statue = scene.add.image(statueX[i], statueY, 'jude_statue').setScale(SCALE.statue).setDepth(2);
        const dirText = scene.add.text(statueX[i], statueY + 55, dirLabel[statueDirections[i]], {
            fontSize: '20px', fontFamily: 'Arial', color: '#ffe066', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);
        statues.push({ sprite: statue, dirText: dirText });
        registerInteractable(statue, 55, 50, () => handleStatueInteract(i), 'กด E หมุนรูปปั้น 90°');
    }

    const statueHintText = 'คำใบ้: หมุนรูปปั้นทั้ง 4 ตัวให้หันทิศตามลำดับ\n' + statueTarget.map(d => dirLabel[d]).join('  →  ');
    createHintSign(scene, 985, 240, statueHintText);
}

function handleStatueInteract(index) {
    if (currentMission < 2) { showLockedMessage(); return; }
    if (currentMission > 2) { showMessage('รูปปั้นเหล่านี้หยุดนิ่งแล้ว หลังจากไขปริศนาสำเร็จ', 1500); return; }

    statueDirections[index] = (statueDirections[index] + 1) % 4;
    statues[index].dirText.setText(dirLabel[statueDirections[index]]);
    statues[index].sprite.setAngle(statueDirections[index] * 90);
    checkStatues();
}

// ================= MISSION 3: คบเพลิง (คงเดิมสวยงามอยู่แล้ว) =================
function setupTorches(scene) {
    const torchX = [120, 220, 320, 420];
    const torchY = 560;

    for (let i = 0; i < 4; i++) {
        const torch = scene.add.image(torchX[i], torchY, 'fire1').setScale(SCALE.torch).setDepth(2);
        const numText = scene.add.text(torchX[i], torchY + 40, String(i + 1), {
            fontSize: '17px', fontFamily: 'Arial', color: '#ffffff', fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);
        torches.push({ sprite: torch, numText: numText, id: i + 1 });
        registerInteractable(torch, 50, 42, () => handleTorchInteract(i), 'กด E เพื่อจุดไฟ');
    }

    const torchHintText = 'คำใบ้: จุดคบเพลิงตามลำดับหมายเลข\n' + correctTorchOrder.join('  →  ');
    createHintSign(scene, 220, 645, torchHintText);
}

// ================= MISSION 4 & 5: เมสซี่ และ กล่องสมบัติ (ขยับหลบจากกำแพงขวา) =================
function setupMessi(scene) {
    // ขยับเมสซี่มาทางซ้ายของห้อง 4 เพื่อให้กล่องสมบัติเรียงต่อได้สวยงาม
    messiNPC = scene.add.image(840, 560, 'messi_npc').setScale(SCALE.messi).setDepth(2);
    registerInteractable(messiNPC, 60, 55, () => startMessiDialogue(), 'กด E เพื่อคุยกับเมสซี่');
}

function setupChests(scene) {
    // ขยับกล่องสมบัติทั้ง 3 ใบให้อยู่ตรงกลางห้อง ไม่ทับประตูทางออกขวาสุด
    const chestX = [960, 1050, 1140];
    const chestY = 560;
    const chestKeys = ['box1', 'box2', 'box3'];

    chestKeys.forEach((key, i) => {
        const chest = scene.add.image(chestX[i], chestY, key).setScale(SCALE.chest).setDepth(2);
        chests.push(chest);
        registerInteractable(chest, 50, 42, () => handleChestInteract(i), 'กด E เพื่อเปิดกล่อง');
    });
}

// ================= ประตูทางออกสีฟ้า (ย้ายไปอยู่ในช่องซอกด้านขวาสุดเป๊ะๆ) =================
function setupDoor(scene) {
    // วางตำแหน่งที่ x: 1335, y: 605 เพื่อให้ทับกับแผ่นสี่เหลี่ยมสีฟ้าเรืองแสงในซอกขวาล่างของแมพจริงพอดี
    door = scene.add.image(1300, 580, 'door1').setDisplaySize(62, 108).setDepth(2);
    registerInteractable(door, 70, 65, () => handleDoorInteract(), 'กด E เพื่อเปิดประตู');
}

// ================= Logic ปริศนาหลัก (ห้ามแก้ไขโครงสร้างเด็ดขาด) =================
function checkStatues() {
    const solved = statueDirections.every((dir, i) => dir === statueTarget[i]);
    if (solved) {
        statuesSolved = true;
        showMessage('🗿 รูปปั้นทั้งหมดหันถูกทิศแล้ว! ปริศนาสำเร็จ ทางไปห้องคบเพลิงเปิดแล้ว', 3000);
        currentMission = 3;
        updateGates();
        updateMissionStatusText();
    }
}

function handleTorchInteract(index) {
    if (currentMission < 3) { showLockedMessage(); return; }
    if (currentMission > 3 || torchSolved) { showMessage('คบเพลิงเหล่านี้ถูกจุดถาวรแล้ว', 1500); return; }
    if (torchLit[index]) return;

    const torchId = torches[index].id;
    torchLit[index] = true;
    torches[index].sprite.setTexture('fire2');
    torchSequence.push(torchId);

    const stepIndex = torchSequence.length - 1;
    if (torchSequence[stepIndex] !== correctTorchOrder[stepIndex]) {
        showMessage('❌ ลำดับผิด! คบเพลิงดับหมด ลองใหม่อีกครั้ง (กด E ที่ป้าย "?" เพื่อดูคำใบ้)', 2200);
        resetTorches();
        return;
    }

    if (torchSequence.length === correctTorchOrder.length) {
        torchSolved = true;
        showMessage('🔥 จุดคบเพลิงถูกลำดับครบแล้ว! ทางไปพบเมสซี่เปิดแล้ว', 3000);
        currentMission = 4;
        updateGates();
        updateMissionStatusText();
    } else {
        showMessage('✅ ถูกต้อง! (' + torchSequence.length + '/' + correctTorchOrder.length + ')', 900);
    }
}

function resetTorches() {
    torchSequence = [];
    torchLit = [false, false, false, false];
    torches.forEach(t => t.sprite.setTexture('fire1'));
}

function startMessiDialogue() {
    if (currentMission < 4) { showLockedMessage(); return; }
    if (messiDialogueComplete) { showMessage('"Go on, the chests are waiting for you."', 1800); return; }

    messiDialogueActive = true; messiDialogueIndex = 0;
    showMessage(messiLines[messiDialogueIndex] + '\n\n(กด E เพื่ออ่านต่อ)', 0);
}

function advanceMessiDialogue() {
    messiDialogueIndex++;
    if (messiDialogueIndex < messiLines.length) {
        showMessage(messiLines[messiDialogueIndex] + '\n\n(กด E เพื่ออ่านต่อ)', 0);
    } else {
        messiDialogueActive = false; messiDialogueComplete = true; currentMission = 5;
        updateGates();
        hideMessage();
        showMessage('✨ กล่องสมบัติทั้ง 3 ใบพร้อมให้เลือกแล้ว! เลือกได้เพียงครั้งเดียว ระวังให้ดี (ไม่มีคำใบ้ข้อนี้)', 2800);
        updateMissionStatusText();
    }
}

function handleChestInteract(index) {
    if (currentMission < 5) { showLockedMessage(); return; }
    if (chestOpened) { showMessage('คุณได้กุญแจไปแล้ว ไปที่ประตูทางออกได้เลย', 1500); return; }

    if (index === correctChestIndex) {
        chestOpened = true; 
        hasKey = true;
        showMessage('🗝️ คุณพบ Golden World Cup Trophy Key! เดินเข้าซอกขวาไปเปิดประตูทางออกได้เลย', 3000);
        
        const keyIcon = game.scene.scenes[0].add.image(chests[index].x, chests[index].y - 50, 'wc_key').setScale(0.15).setDepth(6);
        game.scene.scenes[0].tweens.add({ targets: keyIcon, y: keyIcon.y - 30, alpha: 0, duration: 1200, delay: 800, onComplete: () => keyIcon.destroy() });
    } else {
        triggerPenalty(); 
    }
}

function triggerPenalty() {
    showMessage('🟥 พลาด! กล่องนี้ไม่มีกุญแจ... โดนโทษเดินช้าลงชั่วคราว', 2000);
    penaltyUntil = performance.now() + 2000;
    const scene = game.scene.scenes[0];
    scene.cameras.main.shake(300, 0.01);
    scene.cameras.main.flash(200, 200, 0, 0);
}

function handleDoorInteract() {
    if (doorOpened) return;
    if (!hasKey) { showMessage('🔒 ประตูถูกล็อกอยู่... ต้องมีกุญแจ World Cup ก่อนถึงจะเปิดได้', 2000); return; }

    doorOpened = true; door.setTexture('door2');
    showMessage('🚪 ประตูเปิดแล้ว! เส้นทางออกจากสเตเดียมปรากฏ...', 2000);
    currentMission = 6;
    updateMissionStatusText();
    const scene = game.scene.scenes[0];
    scene.time.delayedCall(1500, () => winGame());
}

function winGame() {
    gameWon = true; player.setVelocity(0, 0); hideMessage(); interactPrompt.setVisible(false);
    victoryOverlay.setVisible(true); victoryText.setVisible(true); restartButton.setVisible(true);
}