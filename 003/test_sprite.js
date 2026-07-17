const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let speed = 4;
let keyW;
let keyA;
let keyS;
let keyD;
let coins; 
let score = 0;
let scoreText;
let winText;
let isGameOver = false;
let bgMusic; 
let bgMusic2; 
let coinSound; 
let walls;
let randomX;
let randomY;

function preload() {
    this.load.spritesheet('player', 'sprites/AnimationSheet_Character.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.image('coin', 'coin/ddddd.png');
    this.load.audio('bgm', 'sudio/เต้ยสั่งลา ธีร์ ทีเร็กซ์【OFFICIAL MV】.mp3');
    this.load.audio('bgm2', 'sudio/เบิ้ล ปทุมราช x แมน ภิสิทธิ์พงษ์ ปลายฟ้า Official MV.mp3'); 
    this.load.audio('coinSfx', 'sudio/ribhavagrawal-coin-recieved-230517.mp3');
    this.load.audio('winSfx', 'sudio/sudio/pw23check-winning-218995.mp3');
}

function create() {
    walls = this.add.group();
    isGameOver = false;
    score = 0;
    
    let mazeData = [
        {x: 400, y: 10, w: 800, h: 20},
        {x: 400, y: 590, w: 800, h: 20},
        {x: 10, y: 300, w: 20, h: 600},
        {x: 790, y: 300, w: 20, h: 600},
        {x: 200, y: 200, w: 20, h: 250},
        {x: 350, y: 315, w: 320, h: 20},
        {x: 400, y: 130, w: 20, h: 220},
        {x: 200, y: 480, w: 20, h: 140},
        {x: 500, y: 480, w: 350, h: 20},
        {x: 620, y: 200, w: 20, h: 250}
    ];

    mazeData.forEach(w => {
        let rect = this.add.rectangle(w.x, w.y, w.w, w.h, 0xff0000);
        walls.add(rect);
    });

    bgMusic = this.sound.add('bgm', { loop: false, volume: 0.5 }); 
    bgMusic2 = this.sound.add('bgm2', { loop: true, volume: 0.5 }); 
    
    bgMusic.on('complete', () => {
        if (!isGameOver) bgMusic2.play();
    });

    bgMusic.play();

    coinSound = this.sound.add('coinSfx');
    
    player = this.add.sprite(70, 70, 'player', 0).setScale(1.9);
    cursors = this.input.keyboard.createCursorKeys();
    
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    coins = this.add.group();
    for (let i = 0; i < 4; i++) {
        let spawnPos = getValidSpawnPosition();
        let c = coins.create(spawnPos.x, spawnPos.y, 'coin');
        c.setScale(0.07);
    }

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
        frameRate: 6,      
        repeat: -1      
    });

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 24, end: 31 }),
        frameRate: 10,      
        repeat: -1      
    });

    player.play('idle', true);

    scoreText = this.add.text(40, 40, 'Score: 0', {
        fontSize: '32px',
        color: '#ffffff'
    });

    winText = this.add.text(400, 300, 'Win', {
        fontSize: '64px',
        color: '#eeff00',
        fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false);
}

function update() {
    if (isGameOver) {
        player.play('idle', true);
        return;
    }

    let moving = false;
    let prevX = player.x;
    let prevY = player.y;

    if (cursors.left.isDown || keyA.isDown) {
        player.x -= speed;
        player.flipX = true;
        moving = true;
        if (isCollidingWithGroup(player, walls)) {
            player.x = prevX;
        }
    } 
    else if (cursors.right.isDown || keyD.isDown) {
        player.x += speed;
        player.flipX = false;
        moving = true;
        if (isCollidingWithGroup(player, walls)) {
            player.x = prevX;
        }
    }

    if (cursors.up.isDown || keyW.isDown) {
        player.y -= speed;
        moving = true;
        if (isCollidingWithGroup(player, walls)) {
            player.y = prevY;
        }
    } 
    else if (cursors.down.isDown || keyS.isDown) {
        player.y += speed;
        moving = true;
        if (isCollidingWithGroup(player, walls)) {
            player.y = prevY;
        }
    }

    if (moving) {
        player.play('walk', true);
    } else {
        player.play('idle', true);
    }

    coins.children.iterate(function (c) {
        if (!c) return;
        let distance = Phaser.Math.Distance.Between(player.x, player.y, c.x, c.y);
        if (distance < 40) {
            coinSound.play();
            score += 1;
            scoreText.setText('Score: ' + score);
            
            if (score >= 10) {
                isGameOver = true;
                winText.setVisible(true);
                coins.clear(true, true);
            } else {
                let spawnPos = getValidSpawnPosition();
                c.x = spawnPos.x;
                c.y = spawnPos.y;
            }
        }
    });
}

function isColliding(obj1, obj2) {
    return Phaser.Geom.Intersects.RectangleToRectangle(
        obj1.getBounds(),
        obj2.getBounds()
    );
}

function isCollidingWithGroup(obj, group) {
    let isCollidingResult = false;
    group.children.iterate(function (child) {
        if (isColliding(obj, child)) {
            isCollidingResult = true;
        }
    });
    return isCollidingResult;
}

function getValidSpawnPosition() {
    let x, y;
    let valid = false;
    let dummy = new Phaser.Geom.Rectangle(0, 0, 40, 40);

    while (!valid) {
        x = Phaser.Math.Between(60, 740);
        y = Phaser.Math.Between(60, 540);
        dummy.setTo(x - 20, y - 20, 40, 40);

        valid = true;
        walls.children.iterate(function (wall) {
            if (Phaser.Geom.Intersects.RectangleToRectangle(dummy, wall.getBounds())) {
                valid = false;
            }
        });
    }
    return { x: x, y: y };
}