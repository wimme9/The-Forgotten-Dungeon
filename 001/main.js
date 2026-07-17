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
let player, cursors, wasd, uiText, wallGroup, interactables;
let activeDialogueInstance = null;
let victoryTriggered = false;
let puzzleGate, gateOutline;

const gameState = {
    hasSpell: false,
    hasLighter: false,
    torchSequence: [],
    correctTorchOrder: [], 
    correctStatueAngles: [], 
    statueAngles: [0, 0, 0, 0],
    correctBookIndex: 0, 
    gatesOpened: { torchRoomAccess: false, endHallwayAccess: false },
    chestOpened: false
};

const colors = ['Red', 'Blue', 'Green', 'Brown'];
const hexColors = [0xff0000, 0x0000ff, 0x00ff00, 0x8b4513];
const possibleAngles = [0, 45, 90, 135, 180, 225, 270, 315];

function preload() {
    this.load.spritesheet('character', 'sprite/character.png', { frameWidth: 32, frameHeight: 32 });
    this.load.image('bookAsset', 'sprite/book.png'); 
    this.load.image('dragonAsset', 'sprite/dragon.png'); 
    this.load.image('npcAsset', 'sprite/npc.png'); 
    this.load.image('torchAsset', 'sprite/torch.png'); 
    this.load.spritesheet('torchAnimated', 'sprite/Torch Animated.png', { frameWidth: 64, frameHeight: 64 }); 
    this.load.image('chestStatic', 'sprite/Wooden Chest 2 - frame  00.png'); 
    this.load.spritesheet('chestAnimated', 'sprite/Wooden Chest 2 - Spritesheet.png', { frameWidth: 48, frameHeight: 32 }); 
}

function create() {
    const floorLayer = this.add.graphics();
    wallGroup = this.physics.add.staticGroup();
    interactables = this.physics.add.staticGroup();

    gameState.correctBookIndex = Phaser.Math.Between(0, 4);
    
    let torchPool = [1, 2, 3, 4];
    gameState.correctTorchOrder = Phaser.Utils.Array.Shuffle(torchPool);

    let angleClues = [];
    for(let i=0; i<4; i++) {
        let randAngle = possibleAngles[Phaser.Math.Between(0, possibleAngles.length - 1)];
        gameState.correctStatueAngles.push(randAngle);
        gameState.statueAngles[i] = (randAngle + 90) % 360;
        angleClues.push(`${colors[i]} = ${randAngle}°`);
    }

    let clueIndex = 0;
    const bookClues = [];
    for(let i=0; i<5; i++) {
        if(i === gameState.correctBookIndex) {
            bookClues.push("✨ This book contains the ancient Magic Spell scroll! ✨");
        } else {
            bookClues.push(`📜 Clue Fragment: "${angleClues[clueIndex]}"`);
            clueIndex++;
        }
    }

    // --- FLOOR TILES ---
    floorLayer.fillStyle(0x3e2723, 1).fillRect(20, 20, 470, 270);
    for (let x = 510; x < 980; x += 40) {
        for (let y = 20; y < 290; y += 40) {
            floorLayer.fillStyle((Math.floor(x/40)+Math.floor(y/40)) % 2 === 0 ? 0x424242 : 0x616161, 1);
            floorLayer.fillRect(x, y, Math.min(40, 980-x), Math.min(40, 290-y));
        }
    }
    floorLayer.fillStyle(0x37474f, 1).fillRect(20, 310, 470, 270);
    floorLayer.fillStyle(0x311b92, 1).fillRect(510, 310, 470, 270);

    // --- STRUCTURAL WALLS ---
    const buildWall = (x, y, w, h) => {
        this.add.graphics().fillStyle(0x1a1a1a, 1).fillRect(x, y, w, h).lineStyle(2, 0x555555, 0.8).strokeRect(x, y, w, h);
        let wall = wallGroup.create(x + w/2, y + h/2, null);
        wall.setDisplaySize(w, h).setVisible(false).refreshBody();
    };

    buildWall(0, 0, 1000, 20); buildWall(0, 580, 1000, 20);
    buildWall(0, 0, 20, 600); buildWall(980, 0, 20, 600);
    buildWall(20, 290, 180, 20); buildWall(300, 290, 680, 20); 
    buildWall(490, 20, 20, 80); buildWall(490, 200, 20, 90); buildWall(490, 290, 20, 110); buildWall(490, 500, 20, 80); 

    puzzleGate = this.add.rectangle(500, 455, 20, 90, 0xd32f2f);
    gateOutline = this.add.graphics().lineStyle(3, 0xffeb3b, 1).strokeRect(490, 410, 20, 90);
    this.physics.add.existing(puzzleGate, true);

    // --- LIBRARY: BOOKS ---
    this.add.text(40, 30, "📚 THE LIBRARY", { font: "bold 16px Arial", fill: "#88ccff" });
    for (let i = 0; i < 5; i++) {
        let posX = 110 + (i * 70);
        let posY = 130;
        this.add.circle(posX, posY, 24, 0x5d4037).setStrokeStyle(2, 0xd7ccc8);
        this.add.sprite(posX, posY, 'bookAsset').setScale(0.05);

        let hitZone = this.add.rectangle(posX, posY, 64, 64, 0x000, 0).setInteractive();
        interactables.add(hitZone);
        
        this.add.text(posX, posY + 32, `${i + 1}`, { font: "bold 14px Arial", fill: "#d7ccc8" }).setOrigin(0.5);
        hitZone.setData('type', 'book').setData('id', i).setData('clue', bookClues[i]);
    }

    // --- DRAGON CHAMBER ---
    this.add.text(540, 30, "🗿 DRAGON CHAMBER", { font: "bold 16px Arial", fill: "#ffcc88" });
    for (let i = 0; i < 4; i++) {
        this.add.rectangle(600 + (i * 100), 120, 55, 65, 0x37474f);
        let dragon = this.add.sprite(600 + (i * 100), 120, 'dragonAsset').setTint(hexColors[i]).setScale(0.05);
        
        let dragonHitZone = this.add.rectangle(600 + (i * 100), 120, 64, 80, 0x000, 0).setInteractive();
        interactables.add(dragonHitZone);
        dragonHitZone.setData('type', 'statue').setData('id', i).setData('art', dragon);

        let label = this.add.text(600 + (i * 100), 75, `${gameState.statueAngles[i]}°`, { font: "14px monospace", fill: "#ffffff" }).setOrigin(0.5);
        dragonHitZone.setData('labelText', label);
    }

    // --- TORCH ROOM ---
    this.add.text(40, 330, "🔥 TORCH ROOM", { font: "bold 16px Arial", fill: "#ff8888" });
    this.anims.create({
        key: 'burn',
        frames: this.anims.generateFrameNumbers('torchAnimated', { start: 0, end: 7 }),
        frameRate: 12,
        repeat: -1
    });

    for (let i = 0; i < 4; i++) {
        let base = this.add.sprite(80 + (i * 90), 475, 'torchAsset');
        
        // CORRECTION: Shifted lit torch overlay Y down slightly to 458 to connect cleanly to base handle
        let fire = this.add.sprite(80 + (i * 90), 458, 'torchAnimated').setVisible(false).setScale(0.8);
        let hitArea = this.add.rectangle(80 + (i * 90), 460, 60, 80, 0x000, 0).setInteractive();
        let light = this.add.circle(80 + (i * 90), 458, 60, 0xffaa00, 0.15).setVisible(false);
        
        interactables.add(hitArea);
        hitArea.setData('type', 'torch').setData('id', i + 1).setData('fire', fire).setData('light', light);
        this.add.text(75 + (i * 90), 505, `${i+1}`, { font: "12px monospace", fill: "#90a4ae" });
    }

    // --- TREASURE ROOM ---
    this.add.text(540, 330, "👑 TREASURE ROOM", { font: "bold 16px Arial", fill: "#88ff88" });
    
    // CORRECTION: Scaled NPC to exactly 0.06 as requested
    let npc = this.add.sprite(680, 460, 'npcAsset').setScale(0.06); 
    let npcHitZone = this.add.rectangle(680, 460, 64, 80, 0x000, 0).setInteractive();
    interactables.add(npcHitZone);
    npcHitZone.setData('type', 'npc');

    let chest = this.add.sprite(850, 460, 'chestStatic');
    let chestHitZone = this.add.rectangle(850, 460, 64, 64, 0x000, 0).setInteractive();
    interactables.add(chestHitZone);
    chestHitZone.setData('type', 'chest').setData('art', chest);

    this.anims.create({
        key: 'chestOpen',
        frames: this.anims.generateFrameNumbers('chestAnimated', { start: 0, end: 4 }),
        frameRate: 8,
        repeat: 0
    });

    // --- PLAYER CREATION ---
    player = this.physics.add.sprite(100, 180, 'character', 0).setScale(1.5).setCollideWorldBounds(true);
    this.physics.add.collider(player, wallGroup);
    this.physics.add.collider(player, puzzleGate, null, () => !gameState.gatesOpened.torchRoomAccess, this);

    this.add.rectangle(500, 565, 960, 40, 0x000000, 0.6);
    uiText = this.add.text(40, 555, "Objective: Walk directly up to a book and press SPACEBAR to inspect it.", { font: "15px Arial", fill: "#ffffff" });

    cursors = this.input.keyboard.createCursorKeys();
    wasd = this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('character', { start: 0, end: 1 }), frameRate: 4, repeat: -1 });
    this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('character', { start: 24, end: 31 }), frameRate: 10, repeat: -1 });
    player.play('idle');
}

function handleInteraction(obj) {
    const type = obj.getData('type');

    if (type === 'book') {
        let isCorrect = (obj.getData('id') === gameState.correctBookIndex);
        let textClue = obj.getData('clue');

        if (isCorrect && !gameState.hasSpell) {
            gameState.hasSpell = true;
            uiText.setText("✨ Magic spell learned! Head to the Dragon Chamber.");
            
            let particles = this.add.particles(0, 0, 'bookAsset', {
                speed: 120,
                scale: { start: 0.02, end: 0 },
                blendMode: 'ADD',
                lifespan: 800,
                tint: 0x00aaff
            });
            particles.startFollow(player);
            this.time.delayedCall(1000, () => particles.destroy());
        } else {
            uiText.setText(textClue);
        }
    }

    if (type === 'statue') {
        if (!gameState.hasSpell) {
            uiText.setText("🔒 The dragons are completely static. You need a magic spell!");
            return;
        }
        if (gameState.hasLighter) return;

        let id = obj.getData('id');
        let dragonArt = obj.getData('art');
        gameState.statueAngles[id] = (gameState.statueAngles[id] + 45) % 360;
        obj.getData('labelText').setText(`${gameState.statueAngles[id]}°`);

        if (gameState.statueAngles.every((angle, idx) => angle === gameState.correctStatueAngles[idx])) {
            gameState.hasLighter = true;
            gameState.gatesOpened.torchRoomAccess = true;
            puzzleGate.destroy();
            gateOutline.clear();
            uiText.setText("⚡ Success! Dragons aligned. Obtained the LIGHTER! Red door opened.");
        }
    }

    if (type === 'torch') {
        if (!gameState.hasLighter) {
            uiText.setText("❌ You cannot ignite these torches. You need the Lighter!");
            return;
        }

        let id = obj.getData('id');
        let fireSprite = obj.getData('fire');
        let lightSprite = obj.getData('light');

        if (gameState.torchSequence.includes(id)) return;

        gameState.torchSequence.push(id);
        fireSprite.setVisible(true).play('burn');
        lightSprite.setVisible(true);

        let step = gameState.torchSequence.length - 1;
        if (gameState.torchSequence[step] !== gameState.correctTorchOrder[step]) {
            uiText.setText("💨 Wrong order! The flames fizzle out. Start over!");
            gameState.torchSequence = [];
            
            this.children.list.forEach(child => {
                if (child.getData && child.getData('type') === 'torch') {
                    child.getData('fire').setVisible(false).stop();
                    child.getData('light').setVisible(false);
                }
            });
        } else if (gameState.torchSequence.length === 4) {
            uiText.setText("🔥 Fantastic! All torches burning. Speak to the NPC.");
        }
    }

    if (type === 'npc') {
        triggerDialogueTree.call(this);
    }

    if (type === 'chest') {
        if (gameState.torchSequence.length < 4) {
            uiText.setText("The treasure chest is locked down tight by protective spells.");
            return;
        }
        if (gameState.chestOpened) return;

        gameState.chestOpened = true;
        let chestArt = obj.getData('art');
        chestArt.setTexture('chestAnimated');
        chestArt.play('chestOpen');

        uiText.setText("💰 Opened! Found legendary relic contents. +5000 GOLD!");

        let alert = this.add.text(500, 250, "+5000 GOLD", { font: "bold 40px Arial", fill: "#ffd700", stroke: "#000", strokeThickness: 6 }).setOrigin(0.5);
        this.tweens.add({ targets: alert, y: 180, alpha: 0, duration: 2000, onComplete: () => alert.destroy() });

        gameState.gatesOpened.endHallwayAccess = true;
        openEndHallway.call(this);
    }
}

function triggerDialogueTree() {
    if (activeDialogueInstance) return;

    let dialogues = [];
    if (gameState.torchSequence.length < 4) {
        dialogues = [
            { text: "NPC: 'Hello there.'", options: [{ text: "Hello", next: 2 }, { text: "Goodbye", next: -1 }] },
            { text: "NPC: 'Hello adventurer, nice to see you here.'", options: [{ text: "What are you doing here?", next: 3 }] },
            { text: "NPC: 'I am guarding this ancient space.'", options: [{ text: "I'm trying to figure out the torch puzzle.", next: 4 }, { text: "Just passing by.", next: -1 }] },
            { text: "NPC: 'I can help you with that.'", options: [{ text: "Really? That would be nice.", next: 5 }, { text: "No, thanks.", next: -1 }] },
            { text: `NPC: 'The order of torches is: [ ${gameState.correctTorchOrder.join(' - ')} ]'`, options: [{ text: "Thanks!", next: -1 }] }
        ];
    } else {
        dialogues = [
            { text: "NPC: 'Great job adventurer, the treasure is yours!'", options: [{ text: "Thanks again, good luck now.", next: 1 }] },
            { text: "NPC: 'See you around!'", options: [{ text: "[Leave Conversation]", next: -1 }] }
        ];
    }

    renderDialogueWindow.call(this, dialogues, 0);
}

function renderDialogueWindow(tree, index) {
    if (index === -1) {
        if (activeDialogueInstance) activeDialogueInstance.destroy();
        activeDialogueInstance = null;
        return;
    }

    if (activeDialogueInstance) activeDialogueInstance.destroy();

    const node = tree[index];
    const box = this.add.container(250, 380);
    activeDialogueInstance = box;

    let bg = this.add.rectangle(0, 0, 500, 160, 0x000000, 0.85).setOrigin(0).setStrokeStyle(2, 0xffffff);
    let mainTxt = this.add.text(20, 20, node.text, { font: "15px Arial", fill: "#fff", wordWrap: { width: 460 } });
    box.add([bg, mainTxt]);

    node.options.forEach((opt, i) => {
        let optText = this.add.text(30, 80 + (i * 30), `> ${opt.text}`, { font: "14px Arial", fill: "#00ff66" }).setInteractive();
        box.add(optText);
        optText.on('pointerdown', () => {
            renderDialogueWindow.call(this, tree, opt.next);
        });
    });
}

function openEndHallway() {
    let wallBreaker = this.add.rectangle(970, 460, 20, 70, 0xffffff);
    this.physics.add.existing(wallBreaker, true);
    
    this.physics.add.overlap(player, wallBreaker, () => {
        if (!victoryTriggered) {
            victoryTriggered = true;
            triggerVictoryScene.call(this);
        }
    });
}

function triggerVictoryScene() {
    player.setVelocity(0);
    this.physics.world.colliders.destroy();

    let view = this.add.container(0, 600);
    let cover = this.add.rectangle(0, 0, 1000, 600, 0x000000, 0.95).setOrigin(0);
    let vicText = this.add.text(500, 200, "LEVEL PASSED", { font: "bold 52px Arial", fill: "#00ff66" }).setOrigin(0.5);
    view.add([cover, vicText]);

    let btnReset = this.add.text(380, 350, "[ Play Again ]", { font: "22px Arial", fill: "#ffffff" }).setInteractive();
    let btnNext = this.add.text(580, 350, "[ Progress Next ]", { font: "22px Arial", fill: "#ffffff" }).setInteractive();
    view.add([btnReset, btnNext]);

    this.tweens.add({
        targets: view,
        y: 0,
        duration: 1500,
        ease: 'Power2'
    });

    btnReset.on('pointerdown', () => {
        victoryTriggered = false;
        this.scene.restart();
    });

    btnNext.on('pointerdown', () => {
        let devNotice = this.add.text(500, 450, "Oops, looks like the level is under development. Stay tuned!", { font: "18px Arial", fill: "#ffaa00" }).setOrigin(0.5);
        this.tweens.add({ targets: devNotice, alpha: 0, delay: 3000, duration: 1000, onComplete: () => devNotice.destroy() });
    });
}

function update() {
    if (victoryTriggered || activeDialogueInstance) {
        player.setVelocity(0);
        player.play('idle', true);
        return;
    }

    this.children.list.forEach(child => {
        if (child.getData && child.getData('type') === 'torch' && child.getData('light').visible) {
            child.getData('light').setAlpha(Phaser.Math.FloatBetween(0.12, 0.25));
        }
    });

    const speed = 180;
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
        player.play('walk', true);
    } else {
        player.play('idle', true);
    }

    this.physics.overlap(player, interactables, (p, obj) => {
        if (Phaser.Input.Keyboard.JustDown(cursors.space)) {
            handleInteraction.call(this, obj);
        }
    });
}