let player, walls, cursors, wasd;
let books, statues, chests, torchObjs;
let bookDoor, statueDoor, torchDoor, exitDoor;
let dialogueBox, dialogueText, dialogueName, nextBtn;
let dialogueState = 0;
let npcSprite;
let hasKey = false;
let hasMagicScroll = false;
let hasTalkedToNPC = false;
let torchOrder = [];
let correctTorchOrder = [0, 2, 1, 3];
let torchLit = [false, false, false, false];
let statueAngles = [0, 0, 0, 0];
let correctAngles = [90, 0, 270, 180];
let msgBox, msgText, msgTimer;
let scrollIcon;

// ระยะที่ผู้เล่นต้องเข้าใกล้ถึงจะกด interact กับวัตถุได้ (px)
const INTERACT_RANGE = 70;

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    backgroundColor: '#111111',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload, create, update }
};
const game = new Phaser.Game(config);

function preload() {
    this.load.spritesheet('player', 'images/AnimationSheet_Character.png', {
        frameWidth: 32, frameHeight: 32
    });
    this.load.image('book',   'images/book.png');
    this.load.image('statue', 'images/stat.png');
    this.load.image('torch',  'images/torch.png');
    this.load.image('npc',    'images/mage.png');
    this.load.image('chest',  'images/box.png');
}

// ── Proximity helper ──
// คืนค่า true ถ้าผู้เล่นอยู่ใกล้ตำแหน่ง (x, y) มากพอที่จะ interact ได้
function isPlayerNear(x, y, range = INTERACT_RANGE) {
    if (!player) return false;
    const d = Phaser.Math.Distance.Between(player.x, player.y, x, y);
    return d <= range;
}

// แจ้งเตือนเมื่อกดของที่อยู่ไกลเกินไป
function tooFarMsg(scene) {
    showMsg(scene, '🚶 เข้าไปใกล้ๆ ก่อนถึงจะใช้งานได้', 0x333333);
}

function create() {
    const scene = this;

    const g = this.add.graphics();

    function drawTile(gx, gy, gw, gh, tileSize, color, alpha) {
        g.lineStyle(1, color, alpha);
        for (let ix = gx + tileSize; ix < gx + gw; ix += tileSize) {
            g.lineBetween(ix, gy, ix, gy + gh);
        }
        for (let iy = gy + tileSize; iy < gy + gh; iy += tileSize) {
            g.lineBetween(gx, iy, gx + gw, iy);
        }
    }

    function drawCorner(cx, cy, size, color) {
        g.lineStyle(3, color, 0.9);
        g.beginPath();
        g.moveTo(cx - size, cy); g.lineTo(cx, cy); g.lineTo(cx, cy - size);
        g.strokePath();
    }

    function drawRoom(x, y, w, h, topColor, botColor, borderColor, tileColor) {
        g.fillGradientStyle(topColor, topColor, botColor, botColor, 1);
        g.fillRect(x, y, w, h);
        drawTile(x, y, w, h, 40, tileColor, 0.18);
        g.lineStyle(3, borderColor, 0.9);
        g.strokeRect(x + 3, y + 3, w - 6, h - 6);
        g.lineStyle(1, borderColor, 0.4);
        g.strokeRect(x, y, w, h);
        const cs = 16;
        drawCorner(x + cs, y + cs, cs, borderColor);
        g.lineStyle(3, borderColor, 0.9);
        g.beginPath(); g.moveTo(x + w - cs, y); g.lineTo(x + w, y); g.lineTo(x + w, y + cs); g.strokePath();
        g.beginPath(); g.moveTo(x, y + h - cs); g.lineTo(x, y + h); g.lineTo(x + cs, y + h); g.strokePath();
        g.beginPath(); g.moveTo(x + w - cs, y + h); g.lineTo(x + w, y + h); g.lineTo(x + w, y + h - cs); g.strokePath();
    }

    drawRoom(20,  340, 340, 240, 0x2b2013, 0x1a130b, 0xd4af37, 0xd4af37);
    drawRoom(20,  20,  340, 240, 0x1a232c, 0x101820, 0x7fb3d5, 0x7fb3d5);
    drawRoom(440, 20,  340, 240, 0x2c1608, 0x1a0d05, 0xff9944, 0xff9944);
    drawRoom(440, 340, 340, 240, 0x241a30, 0x150e1e, 0xcc99ff, 0xcc99ff);

    [[155, 260, 80, 80], [360, 95, 80, 80], [575, 260, 80, 80]].forEach(([cx, cy, cw, ch]) => {
        g.fillGradientStyle(0x2a2a2a, 0x2a2a2a, 0x181818, 0x181818, 1);
        g.fillRect(cx, cy, cw, ch);
        drawTile(cx, cy, cw, ch, 20, 0x888888, 0.15);
        g.lineStyle(2, 0x666666, 0.6);
        g.strokeRect(cx, cy, cw, ch);
    });

    function roomLabel(x, y, w, text, color) {
        scene.add.rectangle(x, y, w, 26, 0x000000, 0.55).setOrigin(0, 0.5).setStrokeStyle(1, color, 0.6);
        scene.add.text(x + 8, y, text, { fontSize: '15px', fill: color, fontStyle: 'bold' }).setOrigin(0, 0.5);
    }
    roomLabel(28,  350, 300, '📖 Mission 1: Forbidden Library', '#e8c667');
    roomLabel(28,  30,  260, '🗿 Mission 2: Statue Room',       '#9fd3f0');
    roomLabel(448, 30,  250, '🔥 Mission 3: Torch Room',        '#ffb066');
    roomLabel(448, 350, 340, '🗝️ Mission 4 & 5: Trials End',   '#d9b3ff');

    walls = this.physics.add.staticGroup();
    function wall(x, y, w, h) {
        const r = scene.add.rectangle(x, y, w, h, 0x000000, 0);
        scene.physics.add.existing(r, true);
        walls.add(r);
    }

    wall(400,   5, 800,  10);
    wall(400, 595, 800,  10);
    wall(  5, 300,  10, 600);
    wall(795, 300,  10, 600);

    wall( 20, 460,  10, 240);
    wall(190, 580, 340,  10);
    wall( 20, 140,  10, 240);
    wall(190,  20, 340,  10);
    wall(610,  20, 340,  10);
    wall(780, 140,  10, 240);
    wall(780, 385,  10,  90);
    wall(780, 535,  10,  90);
    wall(610, 580, 340,  10);

    wall(400, 460, 80, 240);

    wall(400,  57.5, 80,  75);
    wall(400, 217.5, 80,  85);

    wall( 87.5, 300, 135, 80);
    wall(297.5, 300, 125, 80);

    wall(507.5, 300, 135, 80);
    wall(717.5, 300, 125, 80);

    function makeDoor(x, y, w, h) {
        const d = scene.add.rectangle(x, y, w, h, 0x8B0000);
        scene.physics.add.existing(d, true);
        walls.add(d);
        return d;
    }

    bookDoor   = makeDoor(195, 300,  80, 10);
    statueDoor = makeDoor(400, 135,  10, 80);
    torchDoor  = makeDoor(615, 300,  80, 10);
    exitDoor   = makeDoor(780, 460,  10, 60);

    scene.add.text(195, 283, 'LOCKED', { fontSize: '14px', fill: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5, 1).setName('lbl_book');
    scene.add.text(422, 135, 'LOCKED', { fontSize: '14px', fill: '#ff4444', fontStyle: 'bold' }).setOrigin(0, 0.5).setName('lbl_statue');
    scene.add.text(615, 283, 'LOCKED', { fontSize: '14px', fill: '#ff4444', fontStyle: 'bold' }).setOrigin(0.5, 1).setName('lbl_torch');

    scene.add.text(28, 372, 'Click a book to read it', { fontSize: '13px', fill: '#bbb' });
    scrollIcon = scene.add.text(28, 558, '', { fontSize: '16px', fill: '#cc88ff', fontStyle: 'bold' }).setDepth(10);

    const bookData = [
        { x: 50,  y: 470, title: 'Tome of Shadows',   msg: '"Darkness calls… but this is not the answer."',     correct: false },
        { x: 120, y: 470, title: 'Echo of Fallen',     msg: '"The fallen speak of sorrow, not of keys."',        correct: false },
        { x: 190, y: 470, title: 'Codex Veritas',      msg: '✅ "The truth reveals itself! A scroll appears!"',   correct: true  },
        { x: 260, y: 470, title: 'Book of Illusions',  msg: '"Nothing here but mirrors and lies."',              correct: false },
        { x: 330, y: 470, title: 'Ancient Ledger',     msg: '"Dusty numbers… a merchant\'s boring record."',     correct: false },
    ];

    books = scene.add.group();
    bookData.forEach(b => {
        const img = scene.add.image(b.x, b.y, 'book')
            .setDisplaySize(36, 44).setInteractive();
        scene.add.text(b.x, b.y + 30, b.title,
            { fontSize: '10px', fill: '#eee', align: 'center', wordWrap: { width: 68 }, lineSpacing: 2 })
            .setOrigin(0.5, 0);
        img.on('pointerover', () => img.setTint(0xffff88));
        img.on('pointerout',  () => img.clearTint());
        img.on('pointerdown', () => {
            if (!isPlayerNear(b.x, b.y)) { tooFarMsg(scene); return; }
            showMsg(scene, b.msg, b.correct ? 0x004400 : 0x550000);
            if (b.correct && !hasMagicScroll) {
                hasMagicScroll = true;
                const scroll = scene.add.text(b.x, b.y, '📜', { fontSize: '24px' }).setDepth(15);
                scene.tweens.add({
                    targets: scroll, y: b.y - 60, alpha: 0,
                    duration: 1200, ease: 'Power2',
                    onComplete: () => { scroll.destroy(); scrollIcon.setText('📜 Magic Scroll ✔'); }
                });
                scene.time.delayedCall(400,  () => showMsg(scene, '📜 You obtained the MAGIC SCROLL! Door opens!', 0x330055));
                scene.time.delayedCall(1000, () => openDoor(scene, bookDoor, 'lbl_book'));
                img.setTint(0xcc88ff).disableInteractive();
            }
        });
        books.add(img);
    });

    statues = [];
    const statuePos = [
        { x: 100, y: 100 }, { x: 200, y: 100 },
        { x: 100, y: 190 }, { x: 200, y: 190 },
    ];
    const dirLabels = ['↑','→','↓','←'];
    scene.add.text(28, 48, 'Rotate to:  →  ↑  ←  ↓', { fontSize: '14px', fill: '#bbb' });

    statuePos.forEach((pos, i) => {
        const img = scene.add.image(pos.x, pos.y, 'statue')
            .setDisplaySize(52, 52).setInteractive();
        const arrow = scene.add.text(pos.x, pos.y + 34, dirLabels[0],
            { fontSize: '18px', fill: '#ffff00', fontStyle: 'bold' }).setOrigin(0.5);
        let angle = 0;
        img.on('pointerover', () => img.setTint(0xaaddff));
        img.on('pointerout',  () => img.clearTint());
        img.on('pointerdown', () => {
            if (!isPlayerNear(pos.x, pos.y)) { tooFarMsg(scene); return; }
            angle = (angle + 90) % 360;
            statueAngles[i] = angle;
            img.setAngle(angle);
            arrow.setText(dirLabels[Math.round(angle / 90) % 4]);
            checkStatues(scene);
        });
        statues.push({ img, arrow });
    });

    torchObjs = [];
    const torchPos = [
        { x: 510, y: 105 }, { x: 610, y: 105 },
        { x: 510, y: 200 }, { x: 610, y: 200 },
    ];
    scene.add.text(448, 48, 'Light order:  1 → 3 → 2 → 4', { fontSize: '14px', fill: '#bbb' });

    torchPos.forEach((pos, i) => {
        const img = scene.add.image(pos.x, pos.y, 'torch')
            .setDisplaySize(44, 56).setInteractive().setTint(0x444444);
        scene.add.text(pos.x + 24, pos.y - 32, String(i + 1),
            { fontSize: '16px', fill: '#ccc', fontStyle: 'bold' }).setOrigin(0.5);
        const litT = scene.add.text(pos.x, pos.y + 36, 'OFF',
            { fontSize: '13px', fill: '#999', fontStyle: 'bold' }).setOrigin(0.5);
        img.on('pointerover', () => img.setTint(torchLit[i] ? 0xffcc55 : 0x777777));
        img.on('pointerout',  () => img.setTint(torchLit[i] ? 0xffaa00 : 0x444444));
        img.on('pointerdown', () => {
            if (!isPlayerNear(pos.x, pos.y)) { tooFarMsg(scene); return; }
            toggleTorch(scene, i, img, litT);
        });
        torchObjs.push({ img, litT });
    });

    npcSprite = scene.add.image(510, 430, 'npc').setDisplaySize(48, 56).setInteractive();
    scene.add.text(510, 464, 'Elder Moren', { fontSize: '14px', fill: '#ccc', fontStyle: 'bold' }).setOrigin(0.5, 0);

    const dialogues = [
        'So… you made it this far. Most turn back at the Library.',
        'The Tower holds three trials. You have passed them all — tome, statue, and torch.',
        'But the greatest trial is trust. Choose wisely among the chests ahead.',
        'One chest holds the key to freedom. The other two… hold only despair.',
        '...I can say no more. Farewell, brave traveller. 🗝️',
    ];

    dialogueBox  = scene.add.rectangle(400, 556, 780, 88, 0x111133, 0.95).setVisible(false).setDepth(10);
    dialogueName = scene.add.text(25, 518, '', { fontSize: '16px', fill: '#ffff88', fontStyle: 'bold' }).setVisible(false).setDepth(11);
    dialogueText = scene.add.text(25, 540, '', { fontSize: '15px', fill: '#fff', wordWrap: { width: 630 }, lineSpacing: 5 }).setVisible(false).setDepth(11);
    nextBtn = scene.add.text(690, 518, '[ NEXT ▶ ]', { fontSize: '15px', fill: '#88ffff', fontStyle: 'bold' }).setVisible(false).setDepth(11).setInteractive();

    npcSprite.on('pointerover', () => npcSprite.setTint(0xffddaa));
    npcSprite.on('pointerout',  () => npcSprite.clearTint());
    npcSprite.on('pointerdown', () => {
        if (!isPlayerNear(npcSprite.x, npcSprite.y)) { tooFarMsg(scene); return; }
        dialogueState = 0;
        showDialogue(scene, dialogues);
    });
    nextBtn.on('pointerdown', () => {
        dialogueState++;
        if (dialogueState < dialogues.length) {
            showDialogue(scene, dialogues);
        } else {
            hideDialogue();
            if (!hasTalkedToNPC) {
                hasTalkedToNPC = true;
                showMsg(scene, '🗨️ Elder Moren ให้คำแนะนำแล้ว — ตอนนี้เลือกหีบได้', 0x113322);
            }
        }
    });

    chests = [];
    const chestData = [
        { x: 615, y: 430, correct: false },
        { x: 685, y: 430, correct: true  },
        { x: 750, y: 430, correct: false },
    ];
    scene.add.text(608, 372, 'Choose a chest wisely...', { fontSize: '13px', fill: '#bbb' });

    chestData.forEach(c => {
        const img = scene.add.image(c.x, c.y, 'chest').setDisplaySize(44, 36).setInteractive();
        img.on('pointerover', () => { if (!img.getData('opened')) img.setTint(0xffdd88); });
        img.on('pointerout',  () => { if (!img.getData('opened')) img.clearTint(); });
        img.on('pointerdown', () => {
            if (img.getData('opened')) return;
            if (!hasTalkedToNPC) {
                showMsg(scene, '🗨️ ต้องคุยกับ Elder Moren ก่อนถึงจะเปิดหีบได้', 0x333311);
                return;
            }
            if (!isPlayerNear(c.x, c.y)) { tooFarMsg(scene); return; }
            img.setData('opened', true).setAlpha(0.5).clearTint();
            if (c.correct) {
                hasKey = true;
                showMsg(scene, '🗝️ You found the KEY! The exit is now open!', 0x004400);
                openDoor(scene, exitDoor, null);
                scene.add.text(750, 470, 'EXIT OPEN!', { fontSize: '13px', fill: '#00ff00', align: 'center', fontStyle: 'bold' }).setOrigin(0.5);
            } else {
                showMsg(scene, '💀 TRAP! You triggered a trap!', 0x660000);
                player.setTint(0xff0000);
                scene.time.delayedCall(600, () => player.clearTint());
            }
        });
        chests.push(img);
    });

    scene.add.text(760, 402, 'EXIT', { fontSize: '13px', fill: '#00ff00', fontStyle: 'bold' }).setOrigin(0.5);
    const winRect = scene.add.rectangle(793, 460, 10, 60, 0x00ff00, 0);
    scene.physics.add.existing(winRect, true);
    winRect.body.enable = false;
    scene.winZone = winRect;
    scene.exitZoneVis = scene.add.rectangle(787, 460, 14, 60, 0x00aa00, 0.0);

    msgBox  = scene.add.rectangle(400, 295, 540, 84, 0x000000, 0.92).setVisible(false).setDepth(20);
    msgText = scene.add.text(400, 295, '', { fontSize: '17px', fill: '#fff', wordWrap: { width: 500 }, align: 'center', lineSpacing: 5 })
        .setOrigin(0.5).setVisible(false).setDepth(21);

    player = this.physics.add.sprite(190, 500, 'player', 0);
    player.setCollideWorldBounds(true).setDepth(5);
    this.physics.add.collider(player, walls);
    this.physics.add.overlap(player, winRect, () => {
        if (!scene._winShown) { scene._winShown = true; showWin(scene); }
    }, null, scene);

    wasd = this.input.keyboard.addKeys({
        up:    Phaser.Input.Keyboard.KeyCodes.W,
        left:  Phaser.Input.Keyboard.KeyCodes.A,
        down:  Phaser.Input.Keyboard.KeyCodes.S,
        right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    cursors = this.input.keyboard.createCursorKeys();

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),  frameRate: 3,  repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
    player.anims.play('idle');
}

function update() {
    const speed = 160;
    const left  = wasd.left.isDown  || cursors.left.isDown;
    const right = wasd.right.isDown || cursors.right.isDown;
    const up    = wasd.up.isDown    || cursors.up.isDown;
    const down  = wasd.down.isDown  || cursors.down.isDown;

    player.setVelocity(0);
    if (left)  { player.setVelocityX(-speed); player.flipX = true; }
    if (right) { player.setVelocityX(speed);  player.flipX = false; }
    if (up)    player.setVelocityY(-speed);
    if (down)  player.setVelocityY(speed);

    if (left || right || up || down) player.anims.play('walk', true);
    else player.anims.play('idle', true);
}

function showMsg(scene, text, color) {
    msgBox.setFillStyle(color || 0x000000, 0.92).setVisible(true);
    msgText.setText(text).setVisible(true);
    if (msgTimer) msgTimer.remove();
    msgTimer = scene.time.delayedCall(2800, () => {
        msgBox.setVisible(false);
        msgText.setVisible(false);
    });
}

function openDoor(scene, door, labelName) {
    if (!door.visible) return;
    door.setVisible(false);
    door.body.enable = false;
    walls.remove(door);
    if (labelName) {
        const lbl = scene.children.getByName(labelName);
        if (lbl) lbl.setText('OPEN').setStyle({ fill: '#00ff00' });
    }
    showMsg(scene, '🚪 Door unlocked!', 0x003300);
    if (door === exitDoor && scene.winZone) {
        scene.winZone.body.enable = true;
        scene.exitZoneVis.setFillStyle(0x00ff00, 0.6);
    }
}

function checkStatues(scene) {
    if (statueAngles.every((a, i) => a === correctAngles[i])) {
        showMsg(scene, '🗿 All statues aligned! Secret door opens!', 0x003355);
        openDoor(scene, statueDoor, 'lbl_statue');
    }
}

function toggleTorch(scene, i, img, litT) {
    torchLit[i] = !torchLit[i];
    if (torchLit[i]) {
        img.setTint(0xffaa00);
        litT.setText('ON').setStyle({ fill: '#ffaa00' });
        torchOrder.push(i);
    } else {
        img.setTint(0x444444);
        litT.setText('OFF').setStyle({ fill: '#888' });
        resetTorches(scene);
        return;
    }
    for (let k = 0; k < torchOrder.length; k++) {
        if (torchOrder[k] !== correctTorchOrder[k]) {
            showMsg(scene, '🔥 Wrong order! Torches reset.', 0x550000);
            scene.time.delayedCall(800, () => resetTorches(scene));
            return;
        }
    }
    if (torchOrder.length === 4) {
        showMsg(scene, '🔥 Correct order! Torch door opens!', 0x553300);
        openDoor(scene, torchDoor, 'lbl_torch');
    }
}

function resetTorches(scene) {
    torchOrder = [];
    torchLit = [false, false, false, false];
    torchObjs.forEach(t => { t.img.setTint(0x444444); t.litT.setText('OFF').setStyle({ fill: '#888' }); });
}

function showDialogue(scene, dialogues) {
    dialogueBox.setVisible(true);
    dialogueName.setText('Elder Moren').setVisible(true);
    dialogueText.setText(dialogues[dialogueState]).setVisible(true);
    nextBtn.setText(dialogueState === dialogues.length - 1 ? '[ CLOSE ✕ ]' : '[ NEXT ▶ ]').setVisible(true);
}

function hideDialogue() {
    [dialogueBox, dialogueName, dialogueText, nextBtn].forEach(o => o.setVisible(false));
}

function showWin(scene) {
    player.setVelocity(0).setActive(false);
    ['left','right','up','down'].forEach(k => wasd[k].enabled = false);
    scene.add.rectangle(400, 300, 800, 600, 0x000000, 0.75).setDepth(30);
    scene.add.text(400, 220, '🏆 YOU WIN! 🏆', { fontSize: '52px', fill: '#FFD700', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5).setDepth(31);
    scene.add.text(400, 305, 'You escaped the Tower!', { fontSize: '22px', fill: '#ffffff' }).setOrigin(0.5).setDepth(31);
}