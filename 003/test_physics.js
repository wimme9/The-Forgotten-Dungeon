const config = {
    type: Phaser.AUTO,
    width: 1200,
    height: 800,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let player, keyW, keyA, keyS, keyD, invisibleWalls, targetExitZone;
let wallGate2, wallGate3, wallGate4;
let books, fires, stones, chestGroup, npc, exitDoor;
let questStage = 0;
let correctBookIndex, correctFireIndex;
let hasKey = false;
let isGameOver = false;
let questText, hintText, dialogueText, dialogueBubble;
let dialoguePages = [];
let currentPage = 0;

function preload() {
    this.load.image('book1', 'book1.png');
    this.load.image('book2', 'book2.png');
    this.load.image('book3', 'book3.png');
    this.load.image('book4', 'book4.png');
    this.load.image('book5', 'book5.png');
    this.load.image('fire', 'fire.png');
    this.load.image('ground', 'tile.jpg');
    this.load.image('ston', 'ston.png');
    this.load.image('heepopen', 'heepopen.png');
    this.load.image('heep', 'heep.png');
    this.load.image('npc', 'npc.png');
    this.load.image('door', 'door.png');
    this.load.image('dooropen', 'dooropen.png');
    this.load.image('backg', 'backg.png');
    this.load.spritesheet('player', 'sprites/AnimationSheet_Character.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
    this.input.mouse.disableContextMenu();
    isGameOver = false;

    let background = this.add.image(600, 400, 'backg');
    background.setDisplaySize(1200, 800);

    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    invisibleWalls = this.physics.add.staticGroup();
    invisibleWalls.create(600, 10, 'ground').setDisplaySize(1200, 20).refreshBody();
    invisibleWalls.create(600, 790, 'ground').setDisplaySize(1200, 20).refreshBody();
    invisibleWalls.create(10, 400, 'ground').setDisplaySize(20, 800).refreshBody();
    invisibleWalls.create(1190, 250, 'ground').setDisplaySize(20, 500).refreshBody();
    invisibleWalls.create(1190, 730, 'ground').setDisplaySize(20, 2000).refreshBody();
    invisibleWalls.create(600, 115, 'ground').setDisplaySize(20, 210).refreshBody();
    invisibleWalls.create(600, 685, 'ground').setDisplaySize(20, 210).refreshBody();
    invisibleWalls.create(225, 400, 'ground').setDisplaySize(430, 20).refreshBody();
    invisibleWalls.create(925, 400, 'ground').setDisplaySize(680, 20).refreshBody();

    wallGate2 = this.physics.add.staticImage(600, 310, 'ground').setDisplaySize(20, 180).refreshBody();
    wallGate3 = this.physics.add.staticImage(515, 400, 'ground').setDisplaySize(150, 20).refreshBody();
    wallGate4 = this.physics.add.staticImage(600, 495, 'ground').setDisplaySize(20, 170).refreshBody();
    
    exitDoor = this.physics.add.staticImage(1100, 600, 'door').setScale(0.3).refreshBody();

    // ปรับ padding เพื่อแก้สระขาด
    questText = this.add.text(20, 25, 'เควส: ตามหาหนังสือที่ถูกต้อง', { fontSize: '20px', fill: '#ffffff', backgroundColor: '#00000088', padding: { x: 10, y: 10 } }).setScrollFactor(0).setDepth(100);
    hintText = this.add.text(600, 360, '', { fontSize: '24px', fill: '#ff3333', fontWeight: 'bold', backgroundColor: '#000000aa', padding: { x: 15, y: 15 } }).setOrigin(0.5).setScrollFactor(0).setDepth(100).setVisible(false);

    let showHint = (msg, isWarning = true) => {
        hintText.setText(msg);
        hintText.setStyle({ fill: isWarning ? '#ff3333' : '#ffff33' });
        hintText.setVisible(true).setAlpha(1);
        this.tweens.killTweensOf(hintText);
        this.tweens.add({ targets: hintText, alpha: 0, delay: 2000, duration: 500, onComplete: () => hintText.setVisible(false) });
    };

    books = this.physics.add.staticGroup();
    let bookIds = [1, 2, 3, 4, 5];
    Phaser.Utils.Array.Shuffle(bookIds);
    correctBookIndex = bookIds[Phaser.Math.Between(0, 4)];
    for (let i = 0; i < 5; i++) {
        let book = books.create(720 + (i * 100), 130, `book${bookIds[i]}`).setScale(0.15).refreshBody().setInteractive();
        book.setData('id', bookIds[i]);
        book.on('pointerdown', () => {
            if (isGameOver || Phaser.Math.Distance.Between(player.x, player.y, book.x, book.y) > 200) return;
            if (questStage === 0) {
                if (book.getData('id') === correctBookIndex) {
                    questStage = 1; wallGate2.destroy(); questText.setText('เควส: หากองไฟที่ถูกต้อง'); showHint("ทางไปห้องถัดไปเปิดแล้ว!", false);
                } else showHint("หนังสือเล่มนี้ไม่ใช่! ลองเล่มอื่นดูนะ");
            }
        });
    }

    fires = this.physics.add.staticGroup();
    correctFireIndex = Phaser.Math.Between(0, 4);
    for (let i = 0; i < 5; i++) {
        let fire = fires.create(120 + (i * 100), 130, 'fire').setScale(0.08).refreshBody().setInteractive();
        fire.setData('id', i);
        fire.on('pointerdown', () => {
            if (isGameOver || Phaser.Math.Distance.Between(player.x, player.y, fire.x, fire.y) > 200) return;
            if (questStage === 1) {
                if (fire.getData('id') === correctFireIndex) {
                    questStage = 2; wallGate3.destroy(); questText.setText('เควส: หมุนหินให้ตั้งตรง'); showHint("ทางลงห้องใต้ดินเปิดแล้ว!", false);
                } else showHint("กองไฟดวงนี้ไม่ใช่!");
            }
        });
    }

    stones = this.physics.add.staticGroup();
    [{ x: 150, y: 500 }, { x: 420, y: 500 }, { x: 150, y: 680 }, { x: 420, y: 680 }].forEach(pos => {
        let stone = stones.create(pos.x, pos.y, 'ston').setScale(0.15).refreshBody().setInteractive();
        stone.setAngle(Phaser.Math.RND.pick([90, 180, 270]));
        stone.on('pointerdown', () => {
            if (isGameOver || questStage !== 2 || Phaser.Math.Distance.Between(player.x, player.y, stone.x, stone.y) > 200) return;
            stone.angle += 90;
            let allCorrect = true;
            stones.children.iterate(s => { if (Math.abs(s.angle) % 360 !== 0) allCorrect = false; });
            if (allCorrect) { questStage = 3; wallGate4.destroy(); questText.setText('เควส: คุยกับ NPC'); showHint("กลไกปลดล็อกแล้ว!", false); }
        });
    });

    npc = this.physics.add.staticImage(850, 580, 'npc').setScale(1.8).refreshBody().setInteractive();
    dialogueBubble = this.add.graphics().setDepth(90).setVisible(false);
    
    // ปรับ padding ให้มากขึ้นสำหรับคำพูด
    dialogueText = this.add.text(0, 0, '', { 
        fontSize: '20px', fill: '#000000', align: 'center', wordWrap: { width: 280 }, 
        padding: { top: 20, bottom: 20, left: 10, right: 10 } 
    }).setDepth(95).setVisible(false);
    
    npc.on('pointerdown', () => {
        if (isGameOver || Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y) > 200) return;
        if (questStage === 3) {
            dialoguePages = ["ขอบคุณที่ช่วยแก้กลไกหินนะ!", "ฉันปลดล็อกหีบสมบัติให้แล้ว", "เลือกให้ดีล่ะ มีแค่ใบเดียวที่มีกุญแจ!"];
            currentPage = 0;
            showDialogue(this, npc.x, npc.y - 80);
            questStage = 4; questText.setText('เควส: เปิดหีบสมบัติ (ระวังกับดัก!)');
        } else if (questStage < 3) showDialogue(this, npc.x, npc.y - 80, ["เธอต้องเคลียร์ปริศนาห้องอื่นก่อนนะ"]);
    });

    chestGroup = this.physics.add.staticGroup();
    let correctChestIndex = Phaser.Math.Between(0, 2);
    [{x: 650, y: 480}, {x: 800, y: 480}, {x: 950, y: 480}].forEach((pos, index) => {
        let chest = chestGroup.create(pos.x, pos.y, 'heep').setScale(1.5).refreshBody().setInteractive();
        chest.on('pointerdown', () => {
            if (isGameOver || questStage !== 4 || Phaser.Math.Distance.Between(player.x, player.y, chest.x, chest.y) > 200) return;
            chest.setTexture('heepopen');
            if (index === correctChestIndex) { questStage = 5; hasKey = true; questText.setText('เควส: ไขประตูออกไป!'); showHint("ได้รับกุญแจแล้ว!", false); }
            else { isGameOver = true; showGameOverScreen(this); }
        });
    });

    targetExitZone = this.physics.add.staticImage(1100, 600, 'ground').setDisplaySize(15, 60).refreshBody().setVisible(false);
    player = this.physics.add.sprite(900, 250, 'player', 0).setScale(1.9).setCollideWorldBounds(true);
    this.physics.add.collider(player, invisibleWalls);
    this.physics.add.collider(player, wallGate2);
    this.physics.add.collider(player, wallGate3);
    this.physics.add.collider(player, wallGate4);
    this.physics.add.collider(player, exitDoor, () => {
        if (hasKey) { exitDoor.setTexture('dooropen'); exitDoor.body.enable = false; showHint("ไขกุญแจเปิดประตูสำเร็จ! เดินออกไปเลย!", false); }
        else showHint("ประตูถูกล็อกแน่นหนา! ต้องใช้กุญแจจากหีบสมบัติมาไข");
    });
    this.physics.add.overlap(player, targetExitZone, () => { if (hasKey && !isGameOver) { isGameOver = true; showWinScreen(this); } });

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }), frameRate: 6, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
}

function showDialogue(scene, x, y, fixedText = null) {
    let pages = fixedText || dialoguePages;
    let boxWidth = 320; // ขยายความกว้างกล่องนิดหน่อย
    let boxHeight = 120; // ขยายความสูงกล่อง
    let boxY = y - 120; 

    dialogueBubble.clear()
        .fillStyle(0xffffff, 1)
        .fillRoundedRect(x - boxWidth / 2, boxY, boxWidth, boxHeight, 10)
        .lineStyle(2, 0x000000, 1)
        .strokeRoundedRect(x - boxWidth / 2, boxY, boxWidth, boxHeight, 10)
        .setVisible(true).setAlpha(1);
    
    dialogueText.setText(pages[currentPage])
        .setPosition(x, boxY + 10) 
        .setOrigin(0.5, 0)
        .setVisible(true)
        .setAlpha(1);
    
    scene.input.off('pointerdown');
    scene.input.once('pointerdown', () => {
        if (!fixedText && currentPage < pages.length - 1) { currentPage++; showDialogue(scene, x, y); }
        else { dialogueBubble.setVisible(false); dialogueText.setVisible(false); }
    });
}

function showWinScreen(scene) {
    scene.add.graphics().fillStyle(0x000000, 0.75).fillRect(0, 0, 1200, 800).setDepth(200);
    // เพิ่ม padding ให้กับข้อความจบเกม
    scene.add.text(600, 350, "ยินดีด้วย! คุณหนีรอดได้สำเร็จ!", { fontSize: '36px', fill: '#ffffff', padding: { x: 20, y: 20 } }).setOrigin(0.5).setDepth(201);
    scene.add.text(600, 500, "เล่นอีกครั้ง", { fontSize: '24px', backgroundColor: '#27ae60', padding: {x:20, y:15} }).setOrigin(0.5).setDepth(201).setInteractive().on('pointerdown', () => location.reload());
}

function showGameOverScreen(scene) {
    scene.add.graphics().fillStyle(0xcc0000, 0.8).fillRect(0, 0, 1200, 800).setDepth(200);
    scene.add.text(600, 350, "GAME OVER!\nคุณเปิดหีบผิดและติดกับดัก!", { fontSize: '40px', fill: '#ffffff', align: 'center', padding: { x: 20, y: 20 } }).setOrigin(0.5).setDepth(201);
    scene.add.text(600, 500, "ลองใหม่อีกครั้ง", { fontSize: '24px', backgroundColor: '#000', padding: {x:20, y:15} }).setOrigin(0.5).setDepth(201).setInteractive().on('pointerdown', () => location.reload());
}

function update() {
    if (isGameOver) { player.setVelocity(0); return; }
    player.setVelocity(0);
    let moving = false;
    if (keyA.isDown) { player.setVelocityX(-250); player.setFlipX(true); moving = true; }
    else if (keyD.isDown) { player.setVelocityX(250); player.setFlipX(false); moving = true; }
    if (keyW.isDown) { player.setVelocityY(-250); moving = true; }
    else if (keyS.isDown) { player.setVelocityY(250); moving = true; }
    player.anims.play(moving ? 'walk' : 'idle', true);
}