const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: { preload: preload, create: create, update: update }
};

const game = new Phaser.Game(config);

let player;
let cursors;
let walls;
let keys;
let interactText;
let dialogText;
let books = [];
let statueGroups = [];
let questStates = [];
let npc;
let rewardIcons = [];
let keyE;
let keyQ;
let npcDialogueState = 'idle';
let npcQuestStage = 'statue';
let fireObjects = [];
let extinguishedFireCount = 0;
let fireQuestCompleted = false;
let fireQuestRewardClaimed = false;
let chest;
let chestOpened = false;
let fullKeyIcon = null;
let chestRewardIcon = null;
let exitDoorParts = [];
let exitDoorOpened = false;

function preload() {
    this.load.image('Asset 1', 'img/map/1x/Asset 1.png');
    this.load.image('Asset 2', 'img/map/1x/Asset 2.png');
    this.load.image('Asset 3', 'img/map/1x/Asset 3.png');
    this.load.image('Asset 4', 'img/map/1x/Asset 4.png');
    this.load.image('Asset 5', 'img/map/1x/Asset 5.png');
    this.load.image('Asset 6', 'img/map/1x/Asset 6.png');
    this.load.image('Asset 7', 'img/map/1x/Asset 7.png');
    this.load.image('Asset 8', 'img/map/1x/Asset 8.png');
    this.load.image('Asset 9', 'img/map/1x/Asset 9.png');
    this.load.image('Asset 10', 'img/map/1x/Asset 10.png');
    this.load.image('Asset 11', 'img/map/1x/Asset 11.png');
    this.load.image('Asset 13', 'img/map/1x/Asset 13.png');
    this.load.image('Asset 14', 'img/map/1x/Asset 14.png');
    this.load.image('Asset 15', 'img/map/1x/Asset 15.png');
    this.load.image('Asset 16', 'img/map/1x/Asset 16.png');
    this.load.image('Asset 17', 'img/map/1x/Asset 17.png');
    this.load.image('Asset 18', 'img/Statue/Statue4.png');
    this.load.image('Asset 19', 'img/Statue/Asset 19.png');
    this.load.image('Asset 20', 'img/Statue/Asset 20.png');
    this.load.image('Asset 21', 'img/Statue/Asset 21.png');
    this.load.image('Asset 22', 'img/Statue/Asset 22.png');
    this.load.image('Asset 23', 'img/Statue/Asset 23.png');
    this.load.image('Asset 24', 'img/Statue/Asset 24.png');
    this.load.image('Asset 25', 'img/Statue/Asset 25.png');
    this.load.image('Asset 26', 'img/Statue/Asset 26.png');
    this.load.image('Asset 27', 'img/Statue/Asset 27.png');
    this.load.image('Asset 28', 'img/Statue/Asset 28.png');
    this.load.image('Asset 29', 'img/Statue/Asset 29.png');
    this.load.image('Asset 30', 'img/Statue/Asset 30.png');
    this.load.image('Asset 31', 'img/Statue/Asset 31.png');
    this.load.image('Asset 32', 'img/Statue/Asset 32.png');
    this.load.image('Asset 33', 'img/Statue/Asset 33.png');
    this.load.image('Asset 34', 'img/Statue/Asset 34.png');
    this.load.image('Asset 35', 'img/Statue/Asset 35.png');
    this.load.image('Asset 36', 'img/Statue/Asset 36.png');
    this.load.image('Asset 37', 'img/Statue/Asset 37.png');
    this.load.image('Asset 40', 'img/Statue/Asset 40.png');
    this.load.image('Asset 41', 'img/Statue/Asset 41.png');
    this.load.image('Asset 42', 'img/Statue/Asset 42.png');
    this.load.image('Asset 43', 'img/Statue/Asset 43.png');
    this.load.image('Asset 46', 'img/Statue/Asset 46.png');
    this.load.image('Asset 47', 'img/Statue/Asset 47.png');
    this.load.image('book1', 'img/book/book1.png');
    this.load.image('book2', 'img/book/book2.png');
    this.load.image('book3', 'img/book/book3.png');
    this.load.image('book4', 'img/book/book4.png');
    this.load.image('stone', 'img/map/wall.png');
    this.load.spritesheet('player', 'img/AnimationSheet_Character.png', { frameWidth: 32, frameHeight: 32 });
}

function create() {
    //พื้นหลัง
    this.add.image(15, 140, 'Asset 1').setScale(1.5).setDepth(-5);
    this.add.image(15, 410, 'Asset 1').setScale(1.5).setDepth(-5);
    this.add.image(15, 680, 'Asset 1').setScale(1.5).setDepth(-5);

    //พื้นห้องสมบัติ
    this.add.image(115, 420, 'Asset 2').setScale(1.5).setDepth(-4);
    this.add.image(115, 520, 'Asset 2').setScale(1.5).setDepth(-4);
    this.add.image(115, 600, 'Asset 2').setScale(1.5).setDepth(-4);
    this.add.image(205, 420, 'Asset 2').setScale(1.5).setDepth(-4);
    this.add.image(205, 520, 'Asset 2').setScale(1.5).setDepth(-4);
    this.add.image(205, 600, 'Asset 2').setScale(1.5).setDepth(-4);

    //พื้นห้องรูปปั้น
    this.add.image(320, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(320, 250, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(320, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(440, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(550, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(650, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(750, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(440, 250, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(550, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(650, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(750, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(440, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(350, 450, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(410, 450, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(390, 45, 'Asset 5').setScale(1.2).setDepth(-4);
    this.add.image(535, 45, 'Asset 5').setScale(1.2).setDepth(-4);
    this.add.image(680, 45, 'Asset 5').setScale(1.2).setDepth(-4);
    this.add.image(820, 45, 'Asset 5').setScale(1.2).setDepth(-4);

    //กำแพงห้องสมุด    
    this.add.image(90, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(210, 150, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(90, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(210, 300, 'Asset 6').setScale(1).setDepth(-4);
    this.add.image(300, 230, 'Asset 4').setScale(1.2).setDepth(-4);
    this.add.image(105, 45, 'Asset 5').setScale(1.2).setDepth(-4);
    this.add.image(240, 45, 'Asset 5').setScale(1.2).setDepth(-4);
    this.add.image(300, 110, 'stone').setScale(0.2, 0.35).setDepth(-4);

     
    //รูปปั้นที่ซ้อนกันและสลับด้วย E (แต่ละตำแหน่งมีชุดของตัวเอง)
    const statueGroupsData = [
        { x: 400, y: 80, keys: ['Asset 15', 'Asset 16', 'Asset 17', 'Asset 18'], correctIndex: 1 },
        { x: 550, y: 80, keys: ['Asset 19', 'Asset 20', 'Asset 21', 'Asset 22'], correctIndex: 1 },
        { x: 700, y: 80, keys: ['Asset 23', 'Asset 24', 'Asset 25', 'Asset 26'], correctIndex: 0 },
        { x: 700, y: 200, keys: ['Asset 27', 'Asset 28', 'Asset 29', 'Asset 30'], correctIndex: 3 }
    ];

    statueGroups = statueGroupsData.map((group, groupIndex) => {
        const sprites = group.keys.map((key, index) => {
            const statue = this.add.image(group.x, group.y, key).setScale(0.2).setDepth(-4);
            statue.setData('kind', 'statue');
            statue.setData('groupIndex', groupIndex);
            statue.setData('index', index);
            statue.setData('correctIndex', group.correctIndex);
            statue.setData('solved', false);
            statue.setVisible(index === 0);
            return statue;
        });
        return sprites;
    });

    questStates = statueGroupsData.map(() => ({ solved: false, rewarded: false }));

    npc = this.add.image(350, 200, 'Asset 31').setScale(0.1).setDepth(10);
    npc.setData('kind', 'npc');
    npc.setData('range', 95);

    

    //พื้นห้องคบเพลิง
   this.add.image( 570, 340, 'Asset 2').setScale(1.5).setDepth(-4);
   this.add.image( 700, 340, 'Asset 2').setScale(1.5).setDepth(-4);
   this.add.image( 570, 440, 'Asset 2').setScale(1.5).setDepth(-4);
   this.add.image( 700, 440, 'Asset 2').setScale(1.5).setDepth(-4);
   this.add.image( 570, 540, 'Asset 2').setScale(1.5).setDepth(-4);
   this.add.image( 700, 540, 'Asset 2').setScale(1.5).setDepth(-4);


   
   //กำแพงห้องคบเพลิง
   this.add.image( 480, 600, 'Asset 7').setScale(1).setDepth(-4);
   this.add.image( 480, 500, 'Asset 7').setScale(1).setDepth(-4);
   this.add.image( 480, 360, 'Asset 7').setScale(1).setDepth(-4);
   this.add.image( 750, 300, 'Asset 8').setScale(1).setDepth(-4);
   this.add.image( 645, 300, 'Asset 8').setScale(1).setDepth(-4);
   this.add.image(600, 600, 'Asset 9').setScale(1).setDepth(-4);
   this.add.image(790, 100, 'Asset 10').setScale(1).setDepth(-4);
   this.add.image(790, 400, 'Asset 10').setScale(1).setDepth(-4);
   this.add.image(790, 500, 'Asset 10').setScale(1).setDepth(-4);

   //ของในห้องสมุด
   this.add.image( 265, 200, 'Asset 13').setScale(0.6).setDepth(-4);
   this.add.image( 45, 130, 'Asset 14').setScale(0.6).setDepth(-4);
   this.add.image( 45, 220, 'Asset 14').setScale(0.6).setDepth(-4);
    this.add.image( 45, 300, 'Asset 14').setScale(0.6).setDepth(-4);
    chest = this.add.image(100, 460, 'Asset 41').setScale(0.1).setDepth(-4);
    chest.setData('kind', 'chest');
    chest.setData('range', 70);
    this.add.image(100, 460, 'Asset 42').setScale(0.1).setDepth(-4).setVisible(false);
    //หนังสือและวัตถุโต้ตอบ
    const bookDefinitions = [
        { key: 'book1', x: 50, y: 100, message: 'หนังสือเล่ม 1: รูปปั้นถือโล่วงกลมหันไปทางขวา', scale: 0.04, range: 70 },
        { key: 'book2', x: 50, y: 190, message: 'หนังสือเล่ม 2: รูปปั้นถือโล่วงสีเหลี่ยมหันไปทางซ้าย', scale: 0.04, range: 70 },
        { key: 'book3', x: 50, y: 270, message: 'หนังสือเล่ม 3: รูปปั้นถือดาบหันไปด้านหน้า', scale: 0.04, range: 70 },
        { key: 'book4', x: 265, y: 170, message: 'หนังสือเล่ม 4: รูปปั้นถือธนูหันไปด้านหลัง', scale: 0.04, range: 70 },
        { key: 'Asset 11', x: 150, y: 150, message: 'อ่านหนังสือที่อยู่บนชั้นแล้วทำตาม', scale: 0.1, range: 50 }
    ];

    books = bookDefinitions.map(def => {
        const book = this.add.image(def.x, def.y, def.key).setScale(def.scale ?? 0.04).setDepth(-4);
        book.setData('message', def.message);
        book.setData('range', def.range ?? 70);
        return book;
    });

    //กำแพงห้องสมบัติ
    this.add.image(90, 380, 'Asset 3').setScale(1).setDepth(-4);
    this.add.image(150, 380, 'Asset 3').setScale(1).setDepth(-4);
    this.add.image(300, 490, 'stone').setScale(0.2, 0.6).setDepth(-4);
    this.add.image(150, 600, 'Asset 9').setScale(1).setDepth(-4);
    exitDoorParts = [
        this.add.image(405, 550, 'Asset 46').setScale(0.35, 0.3).setDepth(16),
    ];
    exitDoorParts.forEach((doorPart) => {
        doorPart.setData('kind', 'door');
        doorPart.setData('range', 90);
        doorPart.setData('opened', false);
    });

    fireObjects = [
        { x: 585, y: 360 },
        { x: 640, y: 360 },
        { x: 690, y: 360 },
        { x: 615, y: 430 },
        { x: 675, y: 430 }
    ].map(pos => {
        const flame = this.add.image(pos.x, pos.y, 'Asset 37').setScale(0.16).setDepth(12);
        flame.setData('kind', 'fire');
        flame.setData('range', 70);
        flame.setData('extinguished', false);
        flame.setTint(0xffbb33);
        return flame;
    });

    walls = this.physics.add.staticGroup();
    createWall(this, 400, 10, 800, 60);
    createWall(this, 400, 590, 800, 20);
    createWall(this, 10, 300, 20, 600);
    createWall(this, 40,  200, 20, 300);

    createWall(this, 350, 200, 20, 10);

    createWall(this, 400, 100, 20, 10);
    createWall(this, 550, 100, 20, 10);
    createWall(this, 700, 100, 20, 10);
    createWall(this, 700, 250, 20, 10);
    createWall(this, 270, 175, 20, 60);
    createWall(this, 150, 135, 60, 20);
    createWall(this, 790, 300, 20, 600);
    
    createWall(this, 300, 460, 20, 250);


    createWall(this, 300, 120, 20, 220);
    createWall(this, 110, 360, 200, 50);

    createWall(this, 700, 280, 250, 40);
    createWall(this, 480, 450, 20, 350);

    player = this.physics.add.sprite(180, 300, 'player', 0).setScale(1.7).setDepth(10);
    player.setCollideWorldBounds(true);
    player.setBounce(0);
    player.body.allowGravity = false;

    this.physics.add.collider(player, walls);

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

    interactText = this.add.text(0, 0, 'กด E เพื่ออ่าน', {
        fontSize: '12px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setDepth(30).setVisible(false);

    dialogText = this.add.text(player.x, player.y - 60, '', {
        fontSize: '14px',
        fill: '#ffffff',
        backgroundColor: '#000000',
        padding: { x: 6, y: 4 },
        wordWrap: { width: 200 }
    }).setOrigin(0.5).setDepth(30).setVisible(false);

    cursors = this.input.keyboard.createCursorKeys();
    keys = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D
    });
    keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    keyQ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
}

function createWall(scene, x, y, width, height) {
    const wall = scene.add.rectangle(x, y, width, height, 0x000000, 0.5);
    wall.setStrokeStyle(0);
    wall.setDepth(5);
    scene.physics.add.existing(wall, true);
    walls.add(wall);
}

function playRewardMergeAnimation(scene, iconsToReplace) {
    const centerX = 400;
    const centerY = 300;
    const merged = scene.add.image(centerX, centerY, 'Asset 40').setScale(0.01).setDepth(45).setScrollFactor(0);

    iconsToReplace.forEach((icon, index) => {
        const targetX = centerX + (index === 0 ? -45 : 45);
        const targetY = centerY;
        scene.tweens.add({
            targets: icon,
            x: targetX,
            y: targetY,
            scale: 0.08,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                icon.destroy();
                if (index === iconsToReplace.length - 1) {
                    scene.tweens.add({
                        targets: merged,
                        scale: 0.18,
                        duration: 450,
                        ease: 'Back.easeOut',
                        onComplete: () => {
                            scene.tweens.add({
                                targets: merged,
                                x: 730,
                                y: 50,
                                scale: 0.12,
                                duration: 700,
                                ease: 'Power2'
                            });
                        }
                    });
                }
            }
        });
    });

    return merged;
}

function update() {
    const baseSpeed = 160;
    const runSpeed = 250;
    const shiftPressed = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT).isDown;
    const speed = shiftPressed ? runSpeed : baseSpeed;

    const left = cursors.left.isDown || keys.left.isDown;
    const right = cursors.right.isDown || keys.right.isDown;
    const up = cursors.up.isDown || keys.up.isDown;
    const down = cursors.down.isDown || keys.down.isDown;

    let vx = 0;
    let vy = 0;

    if (left) vx = -speed;
    if (right) vx = speed;
    if (up) vy = -speed;
    if (down) vy = speed;

    player.setVelocity(vx, vy);

    if (vx < 0) {
        player.flipX = true;
    } else if (vx > 0) {
        player.flipX = false;
    }

    if (vx !== 0 || vy !== 0) {
        player.play('walk', true);
    } else {
        player.play('idle', true);
    }

    let nearbyTarget = null;
    let nearestDistance = Infinity;
    const interactables = [...books, ...statueGroups.flat(), ...fireObjects, npc, chest, ...exitDoorParts];
    for (const target of interactables) {
        const distance = Phaser.Math.Distance.Between(player.x, player.y, target.x, target.y);
        const range = target.getData('range') ?? 70;
        if (distance < range && distance < nearestDistance) {
            nearestDistance = distance;
            nearbyTarget = target;
        }
    }

    if (nearbyTarget) {
        if (nearbyTarget.getData('kind') === 'fire') {
            const flame = nearbyTarget;
            if (npcQuestStage !== 'fire') {
                interactText.setText('ต้องทำเควสรูปปั้นและรับกุญแจก่อน');
                interactText.setVisible(true);
                interactText.setPosition(flame.x, flame.y - 35);
            } else {
                const promptText = flame.getData('extinguished') ? 'ดับแล้ว' : 'กด E เพื่อดับคบเพลิง';
                interactText.setText(promptText);
                interactText.setVisible(true);
                interactText.setPosition(flame.x, flame.y - 35);

                if (Phaser.Input.Keyboard.JustDown(keyE) && !flame.getData('extinguished')) {
                    flame.setData('extinguished', true);
                    flame.setTint(0x3a2a1a);
                    flame.setAlpha(0.7);
                    extinguishedFireCount += 1;
                    dialogText.setText(`ดับคบเพลิงแล้ว ${extinguishedFireCount}/5`);
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                    this.time.delayedCall(1000, () => {
                        dialogText.setVisible(false);
                    });

                    if (extinguishedFireCount >= 5 && !fireQuestCompleted) {
                        fireQuestCompleted = true;
                        dialogText.setText('ดับคบเพลิงครบ 5 อันแล้ว');
                        dialogText.setPosition(player.x, player.y - 60);
                        dialogText.setVisible(true);
                        this.time.delayedCall(1200, () => {
                            dialogText.setVisible(false);
                        });
                    }
                }
            }
        } else if (nearbyTarget.getData('kind') === 'chest') {
            if (!chestOpened) {
                interactText.setText(fullKeyIcon ? 'กด E เพื่อเปิดกล่อง' : 'ต้องมีกุญแจแบบเต็มก่อน');
                interactText.setVisible(true);
                interactText.setPosition(chest.x, chest.y - 35);

                if (Phaser.Input.Keyboard.JustDown(keyE) && fullKeyIcon) {
                    chestOpened = true;
                    chest.setTexture('Asset 42');
                    chest.setScale(0.1);
                    dialogText.setText('เปิดกล่องแล้ว');
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                    if (fullKeyIcon) {
                        fullKeyIcon.destroy();
                        fullKeyIcon = null;
                    }
                    if (!chestRewardIcon) {
                        chestRewardIcon = this.add.image(760, 70, 'Asset 43').setScale(0.12).setDepth(40).setScrollFactor(0);
                    }
                    this.time.delayedCall(1200, () => {
                        dialogText.setVisible(false);
                    });
                }
            }
        } else if (nearbyTarget.getData('kind') === 'door') {
            const canOpenDoor = chestOpened;
            interactText.setText(exitDoorOpened ? 'ประตูเปิดแล้ว' : canOpenDoor ? 'กด E เพื่อเปิดประตู' : 'ต้องเปิดกล่องรับกุญแจก่อน');
            interactText.setVisible(true);
            interactText.setPosition(nearbyTarget.x, nearbyTarget.y - 45);

            if (Phaser.Input.Keyboard.JustDown(keyE) && canOpenDoor && !exitDoorOpened) {
                exitDoorOpened = true;
                exitDoorParts.forEach((doorPart) => {
                    doorPart.setTexture('Asset 47');
                    doorPart.setScale(0.18, 0.3);
                });
                dialogText.setText('ประตูเปิดแล้ว');
                dialogText.setPosition(player.x, player.y - 60);
                dialogText.setVisible(true);
                this.time.delayedCall(1200, () => {
                    dialogText.setVisible(false);
                });
            }
        } else if (nearbyTarget.getData('kind') === 'statue') {
            const groupIndex = nearbyTarget.getData('groupIndex');
            const groupState = questStates[groupIndex];
            const group = statueGroups[groupIndex];
            const currentIndex = group.findIndex(statue => statue.visible);
            const promptText = groupState.solved ? 'เควสนี้เสร็จแล้ว' : 'กด E เพื่อสลับรูปปั้น';
            interactText.setText(promptText);
            interactText.setVisible(true);
            interactText.setPosition(nearbyTarget.x, nearbyTarget.y - 35);

            if (Phaser.Input.Keyboard.JustDown(keyE) && !groupState.solved) {
                const nextIndex = (currentIndex + 1) % group.length;
                group.forEach((statue, index) => {
                    const shouldShow = index === nextIndex;
                    statue.setVisible(shouldShow);
                    statue.setData('index', index);
                });

                if (nextIndex === nearbyTarget.getData('correctIndex')) {
                    groupState.solved = true;
                    nearbyTarget.setData('solved', true);
                    dialogText.setText('เควสนี้สำเร็จแล้ว');
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                    this.time.delayedCall(1200, () => {
                        dialogText.setVisible(false);
                    });
                }
            }
        } else if (nearbyTarget.getData('kind') === 'npc') {
            interactText.setText(npcDialogueState === 'idle' ? 'กด E เพื่อคุย' : 'กด E ต่อ / Q เพื่อยกเลิก');
            interactText.setVisible(true);
            interactText.setPosition(npc.x, npc.y - 55);

            const justPressedE = Phaser.Input.Keyboard.JustDown(keyE);
            const justPressedQ = Phaser.Input.Keyboard.JustDown(keyQ);

            if (npcDialogueState === 'idle') {
                if (justPressedE) {
                    if (npcQuestStage === 'statue') {
                        npcDialogueState = 'greeting';
                        dialogText.setText('สวัสดี มีไรให้เราช่วยไหม');
                    } else if (npcQuestStage === 'fire' && !fireQuestCompleted) {
                        dialogText.setText('ดับคบเพลิง 5 อันให้ครบก่อน');
                    } else if (npcQuestStage === 'fire' && fireQuestCompleted && !fireQuestRewardClaimed) {
                        const rewardIcon = this.add.image(760, 40 + rewardIcons.length * 28, 'Asset 36')
                            .setScale(0.12)
                            .setDepth(40)
                            .setScrollFactor(0);
                        rewardIcons.push(rewardIcon);
                        const mergedIcon = playRewardMergeAnimation(this, rewardIcons);
                        rewardIcons.length = 0;
                        rewardIcons.push(mergedIcon);
                        fullKeyIcon = mergedIcon;
                        fireQuestRewardClaimed = true;
                        dialogText.setText('รับกุญแจอีกครึ่งแล้ว');
                    } else {
                        dialogText.setText('รับกุญแจครบแล้ว');
                    }
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                }
            } else if (npcDialogueState === 'greeting') {
                if (justPressedE) {
                    npcDialogueState = 'choice1';
                    dialogText.setText('ฉันอยากถามเรื่องจะออกไปยัง\nE = ฉันอยากถามเรื่องจะออกไปยัง\nQ = ไม่มี');
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                } else if (justPressedQ) {
                    npcDialogueState = 'idle';
                    dialogText.setVisible(false);
                }
            } else if (npcDialogueState === 'choice1') {
                if (justPressedE) {
                    npcDialogueState = 'choice2';
                    dialogText.setText('คุณจะออกไปได้คุณต้องช่วยฉันหน่อย\nE = ช่วยอะไร\nQ = ไม่ช่วย');
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                } else if (justPressedQ) {
                    npcDialogueState = 'idle';
                    dialogText.setVisible(false);
                }
            } else if (npcDialogueState === 'choice2') {
                if (justPressedE) {
                    npcDialogueState = 'choice3';
                    dialogText.setText('ช่วยทำรูปปั้นให้ตรงตามที่หนังสือบอกได้ไหมลุงแก่แล้ว\nE = ได้\nQ = ไม่');
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                } else if (justPressedQ) {
                    npcDialogueState = 'idle';
                    dialogText.setVisible(false);
                }
            } else if (npcDialogueState === 'choice3') {
                if (justPressedE) {
                    const completedUnrewarded = questStates.findIndex(state => state.solved && !state.rewarded);
                    if (completedUnrewarded === -1) {
                        dialogText.setText('ยังไม่มีเควสที่เสร็จให้รับกุญแจ');
                    } else {
                        const rewardKey = 'Asset 35';
                        const rewardIcon = this.add.image(760, 40 + rewardIcons.length * 28, rewardKey)
                            .setScale(0.12)
                            .setDepth(40)
                            .setScrollFactor(0);
                        rewardIcons.push(rewardIcon);
                        questStates[completedUnrewarded].rewarded = true;
                        npcQuestStage = 'fire';
                        dialogText.setText('รับกุญแจครึ่งหนึ่งแล้ว ตอนนี้เควสรูปปั้นจบแล้ว');
                    }
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                    npcDialogueState = 'done';
                    this.time.delayedCall(1200, () => {
                        npcDialogueState = 'idle';
                        dialogText.setVisible(false);
                        interactText.setText('กด E เพื่อคุย');
                    });
                } else if (justPressedQ) {
                    npcDialogueState = 'idle';
                    dialogText.setVisible(false);
                }
            } else if (npcDialogueState === 'fireIntro') {
                if (justPressedE) {
                    npcDialogueState = 'fireDone';
                    dialogText.setText('เควสคบเพลิงเริ่มขึ้นแล้ว ลองหาเครื่องมือเพื่อช่วยต่อไป');
                    dialogText.setPosition(player.x, player.y - 60);
                    dialogText.setVisible(true);
                } else if (justPressedQ) {
                    npcDialogueState = 'idle';
                    dialogText.setVisible(false);
                }
            } else if (npcDialogueState === 'fireDone') {
                if (justPressedE || justPressedQ) {
                    npcDialogueState = 'idle';
                    dialogText.setVisible(false);
                }
            }
        } else if (nearbyTarget.getData('kind') === 'book') {
            interactText.setText('กด E เพื่ออ่าน');
            interactText.setVisible(true);
            interactText.setPosition(nearbyTarget.x, nearbyTarget.y - 35);

            if (Phaser.Input.Keyboard.JustDown(keyE)) {
                dialogText.setText(nearbyTarget.getData('message'));
                dialogText.setPosition(player.x, player.y - 60);
                dialogText.setVisible(true);
                this.time.delayedCall(5000, () => {
                    dialogText.setVisible(false);
                });
            }
        } else {
            interactText.setText('กด E เพื่ออ่าน');
            interactText.setVisible(true);
            interactText.setPosition(nearbyTarget.x, nearbyTarget.y - 35);

            if (Phaser.Input.Keyboard.JustDown(keyE)) {
                dialogText.setText(nearbyTarget.getData('message'));
                dialogText.setPosition(player.x, player.y - 60);
                dialogText.setVisible(true);
                this.time.delayedCall(1000, () => {
                    dialogText.setVisible(false);
                });
            }
        }
    } else {
        interactText.setVisible(false);
    }

    if (dialogText.visible) {
        dialogText.setPosition(player.x, player.y - 60);
    }
}