const config = {
    type: Phaser.AUTO,
    width: 900,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },   // แบบอาเขต (top-down) ไม่มีแรงโน้มถ่วง
            debug: false
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
let walls;
let lockedDoors;      // static group ของ "ประตูล็อก" ที่จะถูกทำลายเมื่อไขปริศนาสำเร็จ
let doorBarriers = {}; // เก็บ reference ของแต่ละบาน ตาม id

let cursors, keyW, keyA, keyS, keyD, keyE;

const speed = 150;
let moving = false;

let promptText;   // ข้อความ "กด E เพื่อโต้ตอบ" ลอยเหนือหัวผู้เล่น
let messageBox, messageText; // กล่องข้อความด้านล่างจอ (fixed to camera)
let hudText;       // แสดงสถานะไอเทมที่เก็บได้ มุมซ้ายบน
let messageTimer;  // timer สำหรับซ่อนข้อความอัตโนมัติ

let interactables = []; // รวมทุกอย่างที่ผู้เล่นโต้ตอบได้ (หนังสือ/รูปปั้น/คบเพลิง/NPC/หีบ)
let winZone;

let torchFlickerTime = 0; // ใช้คำนวณจังหวะการกระเพื่อมของแสงคบเพลิง

// ---------------------------------------------------------------
// เค้าโครงห้อง (อ้างอิงจากผังที่แนบมา)
//
//   ห้อง1 = ห้องสมุด (MISSION 1)   |   ห้อง4 = ห้อง NPC (MISSION 4)
//   -----------------------------------------------------------
//   ห้อง2 = ห้องรูปปั้น (MISSION 2)| ห้อง3 = ห้องคบเพลิง(M3) | ห้อง5 = ห้องกล่อง (MISSION 5)
//
// ลำดับการผ่าน: ห้อง1 -> ห้อง2 -> ห้อง3 -> ห้อง4 -> (กลับ)ห้อง3 -> ห้อง5 -> ประตูทางออก
// ---------------------------------------------------------------

const THICK = 10;

const WALLS = [
    // ------- กำแพงรอบนอก (ไม่มีประตู) -------
    { type: 'h', y: 0,   x1: 0,   x2: 900, gap: null },
    { type: 'v', x: 0,   y1: 0,   y2: 300, gap: null },
    { type: 'v', x: 900, y1: 0,   y2: 300, gap: null },
    { type: 'v', x: 0,   y1: 300, y2: 600, gap: null },
    { type: 'h', y: 600, x1: 0,   x2: 900, gap: null },
    { type: 'v', x: 900, y1: 300, y2: 600, gap: null },

    // ------- กำแพงภายใน (มีประตู = ช่องว่าง) -------
    { id: 'A', type: 'v', x: 450, y1: 0,   y2: 300, gap: [120, 200] }, // ห้อง4(NPC) <-> ห้อง1(ห้องสมุด)
    { id: 'B', type: 'h', y: 300, x1: 0,   x2: 450, gap: [150, 280] }, // ห้อง1(ห้องสมุด) <-> ห้อง2(รูปปั้น)
    { id: 'C', type: 'h', y: 300, x1: 450, x2: 700, gap: [535, 610] }, // ห้อง4(NPC) <-> ห้อง3(คบเพลิง)
    { id: 'D', type: 'v', x: 450, y1: 300, y2: 600, gap: [400, 480] }, // ห้อง2(รูปปั้น) <-> ห้อง3(คบเพลิง)
    { id: 'E', type: 'v', x: 700, y1: 300, y2: 600, gap: [400, 480] }, // ห้อง3(คบเพลิง) <-> ห้อง5(กล่อง)

    // เดิมช่วงนี้ไม่มีกำแพงเลย (รั่ว) ทำให้เดินจากห้อง NPC ไปห้องกล่องได้ตรงๆ
    // ปิดให้ทึบสนิท ไม่มีประตู ตามที่ขอ (เส้นสีน้ำเงินในรูป)
    { type: 'h', y: 300, x1: 700, x2: 900, gap: null }, // ห้อง4(NPC) <-> ห้อง5(กล่อง) กั้นทึบ
];

// ประตูไหนล็อกอยู่ตอนเริ่ม และปลดล็อกด้วยเงื่อนไขอะไร
const LOCKS = [
    { wallId: 'B', flag: 'scrollCollected' }, // ต้องอ่านหนังสือเจอเล่มที่ถูกก่อน ถึงจะออกจากห้องสมุดไปห้องรูปปั้นได้
    { wallId: 'A', flag: 'torchSolved' },     // ต้องไขปริศนาคบเพลิงก่อนถึงจะเข้าห้อง NPC ได้
    { wallId: 'C', flag: 'torchSolved' },
    { wallId: 'D', flag: 'statueSolved' },    // ต้องไขปริศนารูปปั้นก่อนถึงจะผ่านไปห้องคบเพลิงได้
    { wallId: 'E', flag: 'npcDone' },          // ต้องคุยกับ NPC จบก่อนถึงจะเข้าห้องกล่องได้
];

const ROOM_LABELS = [
    { text: 'ห้อง 1 : ห้องสมุด (M1)', x: 225, y: 35 },
    { text: 'ห้อง 4 : ห้อง NPC (M4)', x: 675, y: 20 },
    { text: 'ห้อง 2 : ห้องรูปปั้น (M2)', x: 225, y: 320 },
    { text: 'ห้อง 3 : ห้องคบเพลิง (M3)', x: 575, y: 320 },
    { text: 'ห้อง 5 : ห้องกล่อง (M5)', x: 800, y: 320 },
];

const WORLD_W = 900;
const WORLD_H = 600;

// ---------------------------------------------------------------
// ค่าคำตอบของแต่ละปริศนา (ปรับได้ตามต้องการ)
// ---------------------------------------------------------------
const CORRECT_BOOK_INDEX = 2;              // ห้องสมุด: เล่มที่ 3 (index 2) คือเล่มที่ถูกต้อง
const STATUE_TARGETS = [90, 180, 270, 180]; // ห้องรูปปั้น: มุมที่ต้องหมุนให้ตรง (องศา) — กด E 1/2/3/2 ครั้งตามลำดับ
const TORCH_ORDER = [2, 0, 3, 1];          // ห้องคบเพลิง: ลำดับที่ต้องจุด (index คบเพลิง)
const CORRECT_CHEST_INDEX = 1;             // ห้องหีบสมบัติ: หีบที่มีกุญแจ (index 1 = หีบกลาง)

const BOOK_TEXTS = [
    'หนังสือเล่มนี้เต็มไปด้วยฝุ่น... ไม่มีอะไรพิเศษ',
    'บทกวีเก่าแก่ที่ไม่มีใครเข้าใจความหมาย',
    'หน้ากระดาษเรืองแสงสีทอง! เจ้าพบ MAGIC SCROLL ที่ซ่อนอยู่!',
    'สูตรอาหารโบราณ... อ่านแล้วหิวจัง',
    'บันทึกของนักผจญภัยที่หายไป ไม่มีเบาะแสอะไรเพิ่มเติม'
];

const NPC_LINES = [
    '...ใครกัน? อ๋อ นักผจญภัยคนใหม่สินะ',
    'ข้าเฝ้าทางผ่านนี้มานานหลายร้อยปีแล้ว',
    'ถ้าเจ้าอยากไปห้องหีบสมบัติ เจ้าต้องพิสูจน์ตัวเองก่อน',
    '...เอาล่ะ ข้าจะปล่อยเจ้าไป แต่ระวังกับดักในหีบด้วยนะ',
    'โชคดี นักผจญภัย! (ประตูสู่ห้องหีบสมบัติเปิดแล้ว)'
];

// ---------------------------------------------------------------
// สถานะเกม
// ---------------------------------------------------------------
const gameState = {
    scrollCollected: false,
    statueSolved: false,
    torchSolved: false,
    torchNextExpected: 0,
    npcStep: 0,
    npcDone: false,
    keyCollected: false,
    gameWon: false
};

// ตัวรับ scene ปัจจุบัน (ใช้เรียก this.xxx จากฟังก์ชันช่วยด้านนอก)
let sceneRef;

function preload() {

    // asset เดิมของผู้ใช้
    this.load.image('ground', 'assetes/images/tile.jpg');
    this.load.spritesheet('player', 'assetes/sprites/AnimationSheet_Character.png', {
        frameWidth: 32,
        frameHeight: 32
    });

    // asset ของแต่ละ mission (SVG ที่สร้างไว้ วางไฟล์ไว้ที่ assetes/images/)
    this.load.svg('book',   'assetes/images/book.svg',   { width: 64, height: 64 });
    this.load.svg('statue', 'assetes/images/statue.svg', { width: 64, height: 96 });
    this.load.svg('torch',  'assetes/images/torch.svg',  { width: 40, height: 64 });
    this.load.svg('npc',    'assetes/images/npc.svg',    { width: 32, height: 48 });
    this.load.svg('chest',  'assetes/images/chest.svg',  { width: 56, height: 48 });

    // ฉากหลัง
    this.load.svg('floorTile', 'assetes/images/floor_tile.svg', { width: 128, height: 128 });
    this.load.svg('vignette',  'assetes/images/vignette.svg',   { width: 900, height: 600 });
}

function create() {

    sceneRef = this;

    // ---------- Keyboard ----------
    cursors = this.input.keyboard.createCursorKeys();
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

    // ---------- ขอบเขตโลก / กล้อง ----------
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);

    // ---------- สร้าง texture แบบ procedural (ไม่ต้องพึ่งไฟล์ภาพเพิ่ม) ----------
    // ใช้สำหรับแสงคบเพลิงกระเพื่อม และเงานุ่มใต้วัตถุ/ตัวละคร
    generateGlowTexture(this);
    generateShadowTexture(this);
    generateEmberTexture(this);
    generateDustTexture(this);
    generateBeamTexture(this);

    // ---------- ฉากหลัง: พื้นหินลายซ้ำ + โทนสีแยกแต่ละห้อง ----------
    this.add.tileSprite(WORLD_W / 2, WORLD_H / 2, WORLD_W, WORLD_H, 'floorTile')
        .setDepth(-2);

    const ROOM_TINTS = [
        { x: 0,   y: 0,   w: 450, h: 300, color: 0x2e3550 }, // ห้อง1 ห้องสมุด
        { x: 450, y: 0,   w: 450, h: 300, color: 0x33402c }, // ห้อง4 ห้อง NPC
        { x: 0,   y: 300, w: 450, h: 300, color: 0x2c4038 }, // ห้อง2 ห้องรูปปั้น
        { x: 450, y: 300, w: 250, h: 300, color: 0x40312c }, // ห้อง3 ห้องคบเพลิง
        { x: 700, y: 300, w: 200, h: 300, color: 0x40392c }, // ห้อง5 ห้องกล่อง
    ];
    const tintGfx = this.add.graphics().setDepth(-1);
    ROOM_TINTS.forEach(r => {
        tintGfx.fillStyle(r.color, 0.35);
        tintGfx.fillRect(r.x, r.y, r.w, r.h);
    });

    // ---------- ลวดลายพื้นเฉพาะแต่ละห้อง (ธีมตกแต่งจางๆ ให้แต่ละห้องมีเอกลักษณ์) ----------
    createRoomDecorations(this);

    // วิญเยตต์มืดขอบจอ ให้บรรยากาศดันเจี้ยน (fixed กับกล้อง อยู่เหนือฉากแต่ใต้ UI)
    this.add.image(WORLD_W / 2, WORLD_H / 2, 'vignette')
        .setScrollFactor(0)
        .setDepth(15);

    // ---------- ป้ายชื่อห้อง ----------
    ROOM_LABELS.forEach(l => {
        this.add.text(l.x, l.y, l.text, {
            fontFamily: 'Tahoma, sans-serif',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(1);
    });

    // ---------- กำแพง: วาดเป็นบล็อกหิน + เว้นช่องประตู ----------
    walls = this.physics.add.staticGroup();
    lockedDoors = this.physics.add.staticGroup();

    const wallGraphics = this.add.graphics().setDepth(0.2);

    WALLS.forEach(w => buildWall(w, wallGraphics));

    // ---------- สร้าง "ประตูล็อก" ทับช่องที่ยังไขปริศนาไม่สำเร็จ ----------
    LOCKS.forEach(lock => buildDoorBarrier(this, lock));

    // ---------- Player ----------
    player = this.physics.add.sprite(225, 250, 'player'); // เริ่มที่ห้องสมุด (ห้อง1)
    player.setScale(2);
    player.setCollideWorldBounds(true);

    this.physics.add.collider(player, walls);
    this.physics.add.collider(player, lockedDoors);

    this.cameras.main.startFollow(player, true, 0.1, 0.1);

    // ---------- Animation ----------
    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 5,
        repeat: -1
    });
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
        frameRate: 8,
        repeat: -1
    });
    player.play('idle');

    // ---------- MISSION 1: ห้องสมุด (ห้อง1) ----------
    const bookXs = [60, 140, 220, 300, 380];
    bookXs.forEach((x, i) => {
        addDropShadow(this, x, 90 + 30, 34, 12, 0.3);
        const book = this.add.sprite(x, 90, 'book').setScale(1.1).setDepth(1);
        interactables.push({
            sprite: book,
            type: 'book',
            index: i,
            used: false
        });
    });

    // ---------- MISSION 2: ห้องรูปปั้น (ห้อง2) ----------
    const statueXs = [90, 190, 290, 390];
    statueXs.forEach((x, i) => {
        addDropShadow(this, x, 500 + 46, 46, 16, 0.35);
        const statue = this.add.sprite(x, 500, 'statue').setScale(0.9).setDepth(1);
        statue.setAngle(0);

        // ติ๊กถูกสีเขียว โผล่ตอนตัวนี้หมุนถูกทิศ (ซ่อนไว้ก่อน)
        const check = this.add.text(x, 500 - 62, '✔', {
            fontFamily: 'Arial',
            fontSize: '26px',
            color: '#33dd55',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(2).setVisible(false);

        interactables.push({
            sprite: statue,
            type: 'statue',
            index: i,
            rotation: 0,
            checkmark: check
        });
    });

    // ---------- MISSION 3: ห้องคบเพลิง (ห้อง3) ----------
    const torchXs = [490, 540, 590, 640];
    torchXs.forEach((x, i) => {
        // เงานุ่มใต้คบเพลิง (จะกระเพื่อมตามแสงไฟตอนถูกจุด)
        const shadow = addDropShadow(this, x, 520 + 30, 40, 14, 0.22);

        // แสงเรืองจากคบเพลิง (ซ่อนไว้จนกว่าจะถูกจุด) ใช้ blend mode ADD ให้ดูเหมือนแสงจริง
        const glow = this.add.image(x, 520, 'torchGlow')
            .setScale(1.2)
            .setDepth(0.6)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setVisible(false);

        const torch = this.add.sprite(x, 520, 'torch').setScale(1).setDepth(1);
        torch.setAlpha(0.4); // เริ่มต้นดับ

        // อนุภาคประกายไฟลอยขึ้น (เริ่มต้นหยุดไว้ก่อน จนกว่าจะถูกจุด)
        const emitter = this.add.particles(x, 500, 'emberParticle', {
            speed: { min: 10, max: 30 },
            angle: { min: 260, max: 280 },
            lifespan: { min: 500, max: 1000 },
            scale: { start: 0.6, end: 0 },
            alpha: { start: 0.9, end: 0 },
            frequency: 140,
            blendMode: 'ADD'
        });
        emitter.setDepth(0.7);
        emitter.stop();

        interactables.push({
            sprite: torch,
            type: 'torch',
            index: i,
            lit: false,
            glow,
            shadow,
            emitter
        });
    });

    // ---------- MISSION 4: NPC (ห้อง4) ----------
    addDropShadow(this, 700, 150 + 26, 30, 12, 0.3);
    const npc = this.add.sprite(700, 150, 'npc').setScale(1.3).setDepth(1);
    interactables.push({
        sprite: npc,
        type: 'npc',
        index: 0
    });

    // ---------- MISSION 5: ห้องกล่อง (ห้อง5) ----------
    const chestXs = [740, 800, 860];
    chestXs.forEach((x, i) => {
        addDropShadow(this, x, 500 + 24, 40, 14, 0.3);
        const chest = this.add.sprite(x, 500, 'chest').setScale(1).setDepth(1);
        interactables.push({
            sprite: chest,
            type: 'chest',
            index: i,
            opened: false
        });
    });

    // ---------- ประตูทางออก (ห้อง5) ----------
    const exitGfx = this.add.graphics();
    exitGfx.fillStyle(0xffd700, 0.5);
    exitGfx.fillRect(780, 580, 40, 16);
    winZone = this.add.zone(800, 588, 40, 16);
    this.physics.world.enable(winZone, Phaser.Physics.Arcade.STATIC_BODY);

    this.physics.add.overlap(player, winZone, tryWin, null, this);

    // ---------- UI: กล่องข้อความ (fixed to camera) ----------
    messageBox = this.add.rectangle(450, 555, 860, 60, 0x000000, 0.7)
        .setScrollFactor(0).setDepth(20).setVisible(false);
    messageText = this.add.text(450, 555, '', {
        fontFamily: 'Tahoma, sans-serif',
        fontSize: '16px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 820 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(21).setVisible(false);

    // ---------- UI: HUD สถานะไอเทม ----------
    hudText = this.add.text(10, 10, '', {
        fontFamily: 'Tahoma, sans-serif',
        fontSize: '14px',
        color: '#ffe08a'
    }).setScrollFactor(0).setDepth(20);
    updateHud();

    // ---------- UI: prompt "กด E เพื่อโต้ตอบ" ----------
    promptText = this.add.text(0, 0, 'กด E เพื่อโต้ตอบ', {
        fontFamily: 'Tahoma, sans-serif',
        fontSize: '13px',
        color: '#ffffff',
        backgroundColor: '#000000aa',
        padding: { x: 4, y: 2 }
    }).setOrigin(0.5).setDepth(22).setVisible(false);
}

// ================= Texture ที่สร้างขึ้นเอง (ไม่ต้องพึ่งไฟล์ภาพเพิ่ม) =================

// texture แสงเรืองแบบ radial gradient สีส้ม-เหลือง ใช้กับคบเพลิง
function generateGlowTexture(scene) {
    if (scene.textures.exists('torchGlow')) return;
    const size = 256;
    const tex = scene.textures.createCanvas('torchGlow', size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,214,130,0.95)');
    grad.addColorStop(0.35, 'rgba(255,150,50,0.55)');
    grad.addColorStop(1, 'rgba(255,90,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
}

// texture เงานุ่มสีดำจางๆ ใช้วางใต้วัตถุ/ตัวละครทุกชิ้น ให้ดูมีมิติ
function generateShadowTexture(scene) {
    if (scene.textures.exists('softShadow')) return;
    const w = 128, h = 64;
    const tex = scene.textures.createCanvas('softShadow', w, h);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    tex.refresh();
}

function addDropShadow(scene, x, y, w, h, alpha) {
    return scene.add.image(x, y, 'softShadow')
        .setDisplaySize(w, h)
        .setAlpha(alpha)
        .setDepth(0.3);
}

// เม็ดถ่านไฟ/ประกายไฟลอยขึ้น ใช้กับ particle emitter ของคบเพลิง
function generateEmberTexture(scene) {
    if (scene.textures.exists('emberParticle')) return;
    const size = 16;
    const tex = scene.textures.createCanvas('emberParticle', size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,230,150,1)');
    grad.addColorStop(0.5, 'rgba(255,140,50,0.8)');
    grad.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
}

// ฝุ่นละอองลอยจางๆ ใช้ในห้องสมุด
function generateDustTexture(scene) {
    if (scene.textures.exists('dustMote')) return;
    const size = 10;
    const tex = scene.textures.createCanvas('dustMote', size, size);
    const ctx = tex.getContext();
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, 'rgba(255,240,200,0.9)');
    grad.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
    tex.refresh();
}

// ลำแสงจากเพดาน ใช้ในห้องหีบสมบัติ
function generateBeamTexture(scene) {
    if (scene.textures.exists('lightBeam')) return;
    const w = 60, h = 260;
    const tex = scene.textures.createCanvas('lightBeam', w, h);
    const ctx = tex.getContext();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(255,235,180,0.35)');
    grad.addColorStop(1, 'rgba(255,235,180,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(w * 0.5 - 6, 0);
    ctx.lineTo(w * 0.5 + 6, 0);
    ctx.lineTo(w * 0.5 + 26, h);
    ctx.lineTo(w * 0.5 - 26, h);
    ctx.closePath();
    ctx.fill();
    tex.refresh();
}

// แท่นหินใต้รูปปั้น
function addPedestal(scene, x, y) {
    const gfx = scene.add.graphics().setDepth(0.4);
    gfx.fillStyle(0x4a4a52, 1);
    gfx.fillRoundedRect(x - 26, y, 52, 14, 3);
    gfx.lineStyle(1, 0x24242a, 1);
    gfx.strokeRoundedRect(x - 26, y, 52, 14, 3);
    gfx.fillStyle(0x5c5c66, 1);
    gfx.fillRoundedRect(x - 20, y - 6, 40, 8, 2);
}

// เสาหินมุมห้อง
function addPillar(scene, x, y, height) {
    const gfx = scene.add.graphics().setDepth(0.4);
    gfx.fillStyle(0x565660, 1);
    gfx.fillRect(x - 12, y, 24, height);
    gfx.lineStyle(1, 0x2a2a30, 0.9);
    gfx.strokeRect(x - 12, y, 24, height);
    // ลายร่องเสา
    for (let i = 0; i < 3; i++) {
        gfx.lineStyle(1, 0x3a3a42, 0.7);
        gfx.lineBetween(x - 12 + (i + 1) * 6, y + 4, x - 12 + (i + 1) * 6, y + height - 4);
    }
    // หัวเสา/ฐานเสา
    gfx.fillStyle(0x6a6a74, 1);
    gfx.fillRect(x - 16, y - 6, 32, 8);
    gfx.fillRect(x - 16, y + height - 2, 32, 8);
}

// ใยแมงมุมมุมห้อง
function addCobweb(scene, x, y, flipX, flipY) {
    const gfx = scene.add.graphics().setDepth(0.5);
    gfx.lineStyle(1, 0xdedede, 0.25);
    const sx = flipX ? -1 : 1;
    const sy = flipY ? -1 : 1;
    const r = 36;
    for (let i = 0; i <= 4; i++) {
        const a = (i / 4) * (Math.PI / 2);
        gfx.lineBetween(x, y, x + Math.cos(a) * r * sx, y + Math.sin(a) * r * sy);
    }
    for (let rr = 12; rr <= r; rr += 12) {
        gfx.beginPath();
        gfx.arc(x, y, rr, flipX ? Math.PI : 0, flipX ? (3 * Math.PI) / 2 : Math.PI / 2, false);
        gfx.strokePath();
    }
}

// วงเวทมนตร์หมุนช้าๆ ใต้ตัวละคร NPC
function addMagicCircle(scene, x, y) {
    const gfx = scene.add.graphics();
    gfx.lineStyle(2, 0x66ddaa, 0.35);
    gfx.strokeCircle(0, 0, 46);
    gfx.lineStyle(1, 0x66ddaa, 0.3);
    gfx.strokeCircle(0, 0, 36);
    for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        gfx.lineBetween(Math.cos(a) * 36, Math.sin(a) * 36, Math.cos(a) * 46, Math.sin(a) * 46);
    }
    const container = scene.add.container(x, y, [gfx]).setDepth(0.4);
    scene.tweens.add({
        targets: gfx,
        angle: 360,
        duration: 14000,
        repeat: -1
    });
    return container;
}

// ผ้าแบนเนอร์แขวนผนัง
function addBanner(scene, x, y, color) {
    const gfx = scene.add.graphics().setDepth(0.4);
    gfx.fillStyle(color, 0.85);
    gfx.fillRect(x - 14, y, 28, 46);
    gfx.fillTriangle(x - 14, y + 46, x + 14, y + 46, x, y + 58);
    gfx.lineStyle(1, 0x000000, 0.4);
    gfx.strokeRect(x - 14, y, 28, 46);
    gfx.fillStyle(0xffe08a, 0.7);
    gfx.fillCircle(x, y + 18, 5);
}

// ลังไม้ซ้อนกัน
function addCrate(scene, x, y, scale = 1) {
    const gfx = scene.add.graphics().setDepth(0.55);
    const w = 30 * scale, h = 24 * scale;
    gfx.fillStyle(0x7a5230, 1);
    gfx.fillRect(x - w / 2, y - h, w, h);
    gfx.lineStyle(2, 0x4a3018, 1);
    gfx.strokeRect(x - w / 2, y - h, w, h);
    gfx.lineBetween(x - w / 2, y - h / 2, x + w / 2, y - h / 2);
    gfx.lineBetween(x, y - h, x, y);
    addDropShadow(scene, x, y + 4, w * 1.1, h * 0.4, 0.3);
}

// เหรียญทองกระจายพื้น
function addCoinScatter(scene, x, y) {
    const gfx = scene.add.graphics().setDepth(0.35);
    gfx.fillStyle(0xffd700, 0.9);
    gfx.lineStyle(1, 0xaa7700, 0.9);
    for (let i = 0; i < 5; i++) {
        const cx = x + (Math.random() - 0.5) * 26;
        const cy = y + (Math.random() - 0.5) * 12;
        gfx.fillCircle(cx, cy, 3 + Math.random() * 2);
        gfx.strokeCircle(cx, cy, 3 + Math.random() * 2);
    }
}

// ================= ลวดลายพื้นเฉพาะแต่ละห้อง =================

function createRoomDecorations(scene) {
    const decoGfx = scene.add.graphics().setDepth(-0.5);

    // =========================================================
    // ห้อง1 ห้องสมุด (0,0 - 450,300)
    // =========================================================

    // ชั้นหนังสือติดผนังด้านบน: กรอบไม้ + สันหนังสือหลากสี
    for (let shelf = 0; shelf < 2; shelf++) {
        const shelfY = 14 + shelf * 26;
        decoGfx.fillStyle(0x3b2a1c, 0.9);
        decoGfx.fillRect(20, shelfY, 300, 20);
        decoGfx.lineStyle(2, 0x1f150d, 0.9);
        decoGfx.strokeRect(20, shelfY, 300, 20);
        for (let b = 0; b < 22; b++) {
            const bx = 24 + b * 13.4;
            const bw = 8 + Math.random() * 4;
            const hue = [0x8b3a3a, 0x3a5f8b, 0x3a8b57, 0x8b7a3a, 0x6a3a8b][b % 5];
            decoGfx.fillStyle(hue, 0.9);
            decoGfx.fillRect(bx, shelfY + 2, bw, 16);
        }
    }

    // โต๊ะอ่านหนังสือกลางห้อง + เก้าอี้ง่ายๆ
    /*addDropShadow(scene, 225, 210, 90, 26, 0.3);
    decoGfx.fillStyle(0x5a3d24, 1);
    decoGfx.fillRect(180, 180, 90, 18);
    decoGfx.lineStyle(2, 0x2e1e10, 1);
    decoGfx.strokeRect(180, 180, 90, 18);
    decoGfx.fillRect(184, 198, 6, 16);
    decoGfx.fillRect(260, 198, 6, 16);*/

    // พรมอ่านหนังสือใต้โต๊ะ
    decoGfx.fillStyle(0x6b3f3f, 0.35);
    decoGfx.fillRoundedRect(140, 160, 170, 90, 10);
    decoGfx.lineStyle(2, 0x8a5555, 0.3);
    decoGfx.strokeRoundedRect(140, 160, 170, 90, 10);

    // โคมไฟแขวนเพดานให้แสงนวลๆ
    //scene.add.image(225, 60, 'torchGlow').setScale(0.55).setAlpha(0.4)
        // .setBlendMode(Phaser.BlendModes.ADD).setDepth(0.35);

    // ใยแมงมุมมุมห้อง
    addCobweb(scene, 12, 12, false, false);
    addCobweb(scene, 438, 12, true, false);

    // ฝุ่นละอองลอยฟุ้งเบาๆ ในอากาศ
    const dust = scene.add.particles(225, 150, 'dustMote', {
        x: { min: 20, max: 430 },
        y: { min: 20, max: 290 },
        lifespan: 6000,
        speedY: { min: -4, max: -1 },
        speedX: { min: -2, max: 2 },
        scale: { start: 0.6, end: 0.1 },
        alpha: { start: 0.35, end: 0 },
        frequency: 400,
        blendMode: 'ADD'
    });
    dust.setDepth(0.5);

    // =========================================================
    // ห้อง2 ห้องรูปปั้น (0,300 - 450,600)
    // =========================================================

    // แท่นหินใต้รูปปั้นแต่ละตัว
    [90, 190, 290, 390].forEach(x => addPedestal(scene, x, 500 + 30));

    // วงหินมอสจางๆ บนพื้น
    decoGfx.lineStyle(2, 0x3f6b4a, 0.16);
    [[100, 450, 60], [300, 430, 45], [220, 560, 70]].forEach(([cx, cy, r]) => {
        decoGfx.strokeCircle(cx, cy, r);
    });

    // รอยแตกของพื้นหิน
    decoGfx.lineStyle(1, 0x1c1c22, 0.35);
    [[40, 330, 90, 360], [90, 360, 70, 400], [380, 340, 340, 380], [340, 380, 360, 420],
     [150, 560, 190, 590], [250, 340, 290, 320]].forEach(([x1, y1, x2, y2]) => {
        decoGfx.lineBetween(x1, y1, x2, y2);
    });

    // เถาวัลย์/มอสไต่ผนังซ้าย-ขวา
    decoGfx.lineStyle(3, 0x2f5a3a, 0.4);
    [20, 430].forEach(wx => {
        let py = 305;
        decoGfx.beginPath();
        decoGfx.moveTo(wx, py);
        for (let i = 0; i < 5; i++) {
            py += 30;
            decoGfx.lineTo(wx + (i % 2 === 0 ? 10 : -10), py);
        }
        decoGfx.strokePath();
    });

    // กระถางต้นไม้มุมห้อง
    decoGfx.fillStyle(0x5a4530, 1);
    decoGfx.fillRect(28, 560, 24, 20);
    decoGfx.fillStyle(0x2f6b3f, 0.9);
    decoGfx.fillTriangle(40, 505, 20, 560, 60, 560);
    addDropShadow(scene, 40, 578, 30, 10, 0.3);

    // =========================================================
    // ห้อง3 ห้องคบเพลิง (450,300 - 700,600)
    // =========================================================

    // รอยเขม่าไฟ/ควันดำใต้คบเพลิงแต่ละอัน
    [490, 540, 590, 640].forEach(x => {
        decoGfx.fillStyle(0x1a1410, 0.4);
        decoGfx.fillEllipse(x, 552, 34, 12);
    });

    // เถ้าถ่าน/ประกายไฟจางๆ กระจายบนพื้น
    decoGfx.fillStyle(0xff8844, 0.10);
    for (let i = 0; i < 40; i++) {
        const x = 460 + Math.random() * 230;
        const y = 320 + Math.random() * 260;
        decoGfx.fillCircle(x, y, 1 + Math.random() * 2);
    }

    // กองฟืน/เชื้อเพลิงข้างคบเพลิงต้นแรกและต้นสุดท้าย
    [490, 640].forEach(x => {
        decoGfx.fillStyle(0x4a3020, 1);
        decoGfx.fillRect(x - 20, 546, 14, 5);
        decoGfx.fillRect(x - 14, 540, 14, 5);
        decoGfx.fillRect(x - 20, 534, 14, 5);
    });

    // =========================================================
    // ห้อง4 ห้อง NPC (450,0 - 900,300)
    // =========================================================

    // เสาหินสองต้นกรอบทางเข้า
    addPillar(scene, 480, 20, 260);
    addPillar(scene, 870, 20, 260);

    // แบนเนอร์แขวนผนัง
    addBanner(scene, 560, 8, 0x7a2020);
    addBanner(scene, 790, 8, 0x1f4f7a);

    // ลายอักขระ/รูนโบราณจางๆ บนพื้น
    decoGfx.lineStyle(1, 0x88cc88, 0.14);
    for (let i = 0; i < 6; i++) {
        const cx = 520 + i * 55;
        const cy = 60 + (i % 2) * 20;
        decoGfx.strokeRect(cx - 8, cy - 8, 16, 16);
        decoGfx.lineBetween(cx - 8, cy - 8, cx + 8, cy + 8);
        decoGfx.lineBetween(cx - 8, cy + 8, cx + 8, cy - 8);
    }

    // วงเวทมนตร์หมุนช้าๆ ใต้ NPC
    addMagicCircle(scene, 700, 155);

    // =========================================================
    // ห้อง5 ห้องกล่อง (700,300 - 900,600)
    // =========================================================

    // ลำแสงจากเพดานส่องลงมาที่กองสมบัติ
    scene.add.image(800, 340, 'lightBeam').setOrigin(0.5, 0).setAlpha(0.5)
        .setBlendMode(Phaser.BlendModes.ADD).setDepth(-0.3);

    // ลังไม้ซ้อนกันข้างๆ หีบ
    addCrate(scene, 715, 560, 0.9);
    addCrate(scene, 885, 555, 1);

    // เหรียญทองกระจายอยู่รอบหีบ
    [740, 800, 860].forEach(x => addCoinScatter(scene, x, 540));

    // ลายทองวิบวับ พร้อมอนิเมชันกระพริบ
    for (let i = 0; i < 20; i++) {
        const x = 705 + Math.random() * 190;
        const y = 320 + Math.random() * 260;
        const star = scene.add.text(x, y, '✦', {
            fontFamily: 'Arial',
            fontSize: (8 + Math.random() * 8) + 'px',
            color: '#ffe08a'
        }).setAlpha(0.15).setDepth(-0.4);

        scene.tweens.add({
            targets: star,
            alpha: { from: 0.08, to: 0.5 },
            duration: 800 + Math.random() * 1200,
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1000
        });
    }
}

// ================= กำแพง / ประตู =================

function buildWall(w, gfx) {
    if (w.type === 'h') {
        const segments = w.gap ? [[w.x1, w.gap[0]], [w.gap[1], w.x2]] : [[w.x1, w.x2]];
        segments.forEach(([sx, ex]) => {
            if (ex - sx <= 0) return;
            drawStoneWallH(gfx, sx, ex, w.y);
            const midX = (sx + ex) / 2;
            const width = ex - sx;
            const rect = walls.create(midX, w.y, null);
            rect.setVisible(false);
            rect.body.setSize(width, THICK);
            rect.refreshBody();
        });
    } else {
        const segments = w.gap ? [[w.y1, w.gap[0]], [w.gap[1], w.y2]] : [[w.y1, w.y2]];
        segments.forEach(([sy, ey]) => {
            if (ey - sy <= 0) return;
            drawStoneWallV(gfx, w.x, sy, ey);
            const midY = (sy + ey) / 2;
            const height = ey - sy;
            const rect = walls.create(w.x, midY, null);
            rect.setVisible(false);
            rect.body.setSize(THICK, height);
            rect.refreshBody();
        });
    }
}

// วาดกำแพงแนวนอนเป็น "บล็อกหิน" แทนเส้นเรียบๆ — สุ่มขนาด/สีแต่ละก้อนให้ดูเป็นธรรมชาติ
function drawStoneWallH(gfx, x1, x2, y) {
    const length = x2 - x1;
    let pos = 0;
    let rowOffset = 0; // ทำให้แถวบล็อกสลับฟันปลาเหมือนก่ออิฐจริง
    while (pos < length) {
        const blockLen = 16 + Math.random() * 16;
        const len = Math.min(blockLen, length - pos);
        drawStoneBlock(gfx, x1 + pos, y - 6, len - 2, 12);
        pos += blockLen;
    }
}

// วาดกำแพงแนวตั้งเป็น "บล็อกหิน"
function drawStoneWallV(gfx, x, y1, y2) {
    const length = y2 - y1;
    let pos = 0;
    while (pos < length) {
        const blockLen = 16 + Math.random() * 16;
        const len = Math.min(blockLen, length - pos);
        drawStoneBlock(gfx, x - 6, y1 + pos, 12, len - 2);
        pos += blockLen;
    }
}

// ก้อนหินหนึ่งก้อน: พื้นสีเทาสุ่มโทน + ขอบเข้ม + จุดด่างเล็กๆ เพิ่มพื้นผิว
function drawStoneBlock(gfx, x, y, w, h) {
    if (w <= 0 || h <= 0) return;
    const shade = 70 + Math.floor(Math.random() * 40);
    const fillColor = Phaser.Display.Color.GetColor(shade + 24, shade + 26, shade + 32);

    gfx.fillStyle(fillColor, 1);
    gfx.fillRect(x, y, w, h);

    gfx.lineStyle(1, 0x15161c, 0.85);
    gfx.strokeRect(x, y, w, h);

    // จุดด่างเล็กๆ ให้ดูเหมือนพื้นผิวหินขรุขระ
    gfx.fillStyle(0x000000, 0.18);
    for (let i = 0; i < 2; i++) {
        gfx.fillCircle(x + Math.random() * w, y + Math.random() * h, 1);
    }
    gfx.fillStyle(0xffffff, 0.06);
    gfx.fillCircle(x + w * 0.3, y + h * 0.3, 1);
}

// สร้างประตูล็อก (สี่เหลี่ยมสีแดง ทึบ) วางทับตรงช่องประตูของ wall ที่ต้องการล็อก
function buildDoorBarrier(scene, lock) {
    const wallDef = WALLS.find(w => w.id === lock.wallId);
    if (!wallDef || !wallDef.gap) return;

    let rect;
    if (wallDef.type === 'h') {
        const width = wallDef.gap[1] - wallDef.gap[0];
        const midX = (wallDef.gap[0] + wallDef.gap[1]) / 2;
        rect = scene.add.rectangle(midX, wallDef.y, width, THICK + 4, 0x8b1a1a, 0.85);
    } else {
        const height = wallDef.gap[1] - wallDef.gap[0];
        const midY = (wallDef.gap[0] + wallDef.gap[1]) / 2;
        rect = scene.add.rectangle(wallDef.x, midY, THICK + 4, height, 0x8b1a1a, 0.85);
    }
    scene.physics.add.existing(rect, true);
    lockedDoors.add(rect);
    doorBarriers[lock.wallId] = rect;
}

// เรียกทุกครั้งที่มีการอัปเดตสถานะ เพื่อตรวจว่าปลดล็อกประตูไหนได้บ้าง
function refreshLocks() {
    LOCKS.forEach(lock => {
        if (gameState[lock.flag] && doorBarriers[lock.wallId]) {
            doorBarriers[lock.wallId].destroy();
            delete doorBarriers[lock.wallId];
        }
    });
}

// ================= UI Helpers =================

function showMessage(text, duration = 3500) {
    messageText.setText(text).setVisible(true);
    messageBox.setVisible(true);
    if (messageTimer) messageTimer.remove(false);
    messageTimer = sceneRef.time.delayedCall(duration, () => {
        messageText.setVisible(false);
        messageBox.setVisible(false);
    });
}

function updateHud() {
    const scroll = gameState.scrollCollected ? '✓' : '✗';
    const key = gameState.keyCollected ? '✓' : '✗';
    hudText.setText(`MAGIC SCROLL: ${scroll}    KEY: ${key}`);
}

function tryWin(playerObj, zone) {
    if (gameState.gameWon) return;
    if (!gameState.keyCollected) {
        showMessage('ประตูถูกล็อกด้วยกุญแจ... เจ้ายังไม่มีกุญแจ!');
        return;
    }
    gameState.gameWon = true;
    player.setVelocity(0, 0);
    showMessage('ยินดีด้วย! เจ้าหนีออกจากดันเจี้ยนที่ถูกลืมได้สำเร็จ!', 10000);
}

// ================= Mission Logic =================

function interactWith(obj) {
    switch (obj.type) {
        case 'book':      handleBook(obj); break;
        case 'statue':    handleStatue(obj); break;
        case 'torch':     handleTorch(obj); break;
        case 'npc':       handleNpc(obj); break;
        case 'chest':     handleChest(obj); break;
    }
}

function handleBook(obj) {
    if (obj.index === CORRECT_BOOK_INDEX && !gameState.scrollCollected) {
        gameState.scrollCollected = true;
        obj.sprite.setTint(0xffd700);
        updateHud();
        showMessage(`[หนังสือเล่มที่ ${obj.index + 1}] ${BOOK_TEXTS[obj.index]} ประตูไปห้องรูปปั้นเปิดแล้ว!`);
        refreshLocks();
    } else {
        showMessage(`[หนังสือเล่มที่ ${obj.index + 1}] ${BOOK_TEXTS[obj.index]}`);
    }
}

function handleStatue(obj) {
    if (gameState.statueSolved) {
        showMessage('รูปปั้นตัวนี้หันถูกทิศแล้ว');
        return;
    }

    // หมุนรูปปั้นตัวนี้ไป 90° ทุกครั้งที่กด E (ครบ 4 ครั้งจะวนกลับไปที่ 0°)
    obj.rotation = (obj.rotation + 90) % 360;
    obj.sprite.setAngle(obj.rotation);

    const isCorrect = obj.rotation === STATUE_TARGETS[obj.index];
    obj.checkmark.setVisible(isCorrect);

    const allCorrect = interactables
        .filter(o => o.type === 'statue')
        .every(o => o.rotation === STATUE_TARGETS[o.index]);

    if (allCorrect) {
        gameState.statueSolved = true;
        showMessage('รูปปั้นทั้งหมดหันถูกทิศแล้ว! ประตูลับเปิดออก...');
        refreshLocks();
    } else if (isCorrect) {
        showMessage(`ตัวนี้หันถูกทิศแล้ว (${obj.rotation}°) ✔ — หมุนตัวที่เหลือให้ครบ`);
    } else {
        showMessage(`หมุนรูปปั้นไปที่ ${obj.rotation}° แล้ว (ยังไม่ถูก)`);
    }
}

function handleTorch(obj) {
    if (gameState.torchSolved) {
        showMessage('คบเพลิงอันนี้ลุกโชนอยู่แล้ว');
        return;
    }

    const expected = TORCH_ORDER[gameState.torchNextExpected];

    if (obj.index === expected) {
        obj.lit = true;
        obj.sprite.setAlpha(1);
        obj.glow.setVisible(true);
        obj.emitter.start();
        gameState.torchNextExpected++;

        if (gameState.torchNextExpected >= TORCH_ORDER.length) {
            gameState.torchSolved = true;
            showMessage('จุดคบเพลิงถูกลำดับครบทุกอัน! ทางไปห้อง NPC เปิดแล้ว');
            refreshLocks();
        } else {
            showMessage('ถูกต้อง! จุดคบเพลิงอันต่อไป...');
        }
    } else {
        // ผิดลำดับ -> รีเซ็ตทั้งหมด
        interactables
            .filter(o => o.type === 'torch')
            .forEach(o => {
                o.lit = false;
                o.sprite.setAlpha(0.4);
                o.glow.setVisible(false);
                if (o.shadow) o.shadow.setAlpha(0.22);
                if (o.emitter) o.emitter.stop();
            });
        gameState.torchNextExpected = 0;
        showMessage('ผิดลำดับ! คบเพลิงทั้งหมดดับลง ลองใหม่อีกครั้ง');
    }
}

function handleNpc(obj) {
    if (gameState.npcDone) {
        showMessage('"ไปเถอะ นักผจญภัย ทางข้างหน้ารออยู่"');
        return;
    }

    showMessage(NPC_LINES[gameState.npcStep]);
    gameState.npcStep++;

    if (gameState.npcStep >= NPC_LINES.length) {
        gameState.npcDone = true;
        refreshLocks();
    }
}

function handleChest(obj) {
    if (obj.opened) {
        showMessage('หีบนี้เปิดไปแล้ว ไม่มีอะไรเหลืออยู่');
        return;
    }
    obj.opened = true;

    if (obj.index === CORRECT_CHEST_INDEX) {
        gameState.keyCollected = true;
        obj.sprite.setTint(0xffd700);
        showMessage('เจ้าพบกุญแจอยู่ในหีบ! ตอนนี้สามารถเปิดประตูทางออกได้แล้ว');
        updateHud();
    } else {
        obj.sprite.setTint(0x552222);
        showMessage('กับดัก! หีบใบนี้ว่างเปล่า... ระวังให้มากขึ้น');
        // เด้งผู้เล่นออกจากหีบเล็กน้อยแทนความเสียหายจริง
        const dx = player.x - obj.sprite.x;
        const dy = player.y - obj.sprite.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        player.setVelocity((dx / len) * 300, (dy / len) * 300);
    }
}

// ================= Update Loop =================

function update() {

    if (gameState.gameWon) {
        player.setVelocity(0, 0);
        return;
    }

    moving = false;
    let vx = 0;
    let vy = 0;

    if (cursors.left.isDown || keyA.isDown) {
        vx = -1;
        player.flipX = true;
        moving = true;
    } else if (cursors.right.isDown || keyD.isDown) {
        vx = 1;
        player.flipX = false;
        moving = true;
    }

    if (cursors.up.isDown || keyW.isDown) {
        vy = -1;
        moving = true;
    } else if (cursors.down.isDown || keyS.isDown) {
        vy = 1;
        moving = true;
    }

    if (vx !== 0 && vy !== 0) {
        const norm = Math.SQRT1_2;
        vx *= norm;
        vy *= norm;
    }

    player.setVelocity(vx * speed, vy * speed);
    player.play(moving ? 'walk' : 'idle', true);

    // ---------- แสงคบเพลิงกระเพื่อม + เงาบนพื้นสั่นไหวตาม ----------
    torchFlickerTime += 0.016;
    const flicker = 0.85 + Math.sin(torchFlickerTime * 4) * 0.08 + (Math.random() - 0.5) * 0.12;
    const s = Phaser.Math.Clamp(flicker, 0.6, 1.15);

    interactables.forEach(obj => {
        if (obj.type === 'torch' && obj.lit) {
            obj.glow.setScale(0.5 * s);
            obj.glow.setAlpha(Phaser.Math.Clamp(0.8 * s, 0.45, 1));
            if (obj.shadow) {
                obj.shadow.setAlpha(Phaser.Math.Clamp(0.35 - (s - 0.85) * 0.3, 0.15, 0.4));
            }
        }
    });

    // ---------- หาสิ่งที่โต้ตอบได้ใกล้ที่สุด ----------
    let nearest = null;
    let nearestDist = 55; // ระยะที่โต้ตอบได้ (px)

    interactables.forEach(obj => {
        const d = Phaser.Math.Distance.Between(player.x, player.y, obj.sprite.x, obj.sprite.y);
        if (d < nearestDist) {
            nearestDist = d;
            nearest = obj;
        }
    });

    if (nearest) {
        promptText.setVisible(true);
        promptText.setPosition(nearest.sprite.x, nearest.sprite.y - 40);

        if (Phaser.Input.Keyboard.JustDown(keyE)) {
            interactWith(nearest);
        }
    } else {
        promptText.setVisible(false);
    }
}