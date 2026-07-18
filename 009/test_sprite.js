const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);
let cursors;
let player;
let speed = 2;
let keyW;
let keyA;
let keyD;
let keyS;
let coin, coin1, coin2, coin3;
let score = 0;
let scoreText;
let winText;
let hasWon = false;
let wall, wall1, wall2, wall3;
let walls = [];
let randomX;
let randomY;
let time = 30;
let timeText;
let gameOver = false;

// ตัวแปรสำหรับสถานะวิ่งเร็ว (เมื่อเก็บเหรียญ)
let isFast = false;
let fastTimer = 0;

function preload() {
    // โหลด Spritesheet และรูปภาพ
    this.load.spritesheet('player', 'img/AnimationSheet_Character.png', {
        frameWidth: 32,
        frameHeight: 32
    });
    this.load.image('coin', 'img/coin.png');
    this.load.audio('duy', 'img/buy_1.mp3');
    this.load.image('boom', 'img/boom.png');
}

function create() {
    wall = this.add.rectangle(400, 200, 200, 10, 0xff0000);
    wall1 = this.add.rectangle(400, 400, 200, 10, 0xff0000);
    wall2 = this.add.rectangle(600, 300, 10, 100, 0xff0000);
    wall3 = this.add.rectangle(200, 300, 10, 100, 0xff0000);
    walls = [wall, wall1, wall2, wall3];
    
    player = this.add.sprite(400, 300, 'player', 0);
    player.setScale(2); // ขยายขนาดของ Sprite
    
    cursors = this.input.keyboard.createCursorKeys();
    keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    
    coin1 = this.add.sprite(200, 400, 'coin', 0).setScale(0.05);
    coin2 = this.add.sprite(600, 400, 'coin', 0).setScale(0.05);
    coin3 = this.add.sprite(600, 500, 'coin', 0).setScale(0.05);
    coin = this.add.sprite(100, 100, 'coin', 0).setScale(0.05);

    this.anims.create({
        key: 'idle',
        frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
        frameRate: 4,     
        repeat: -1      
    });
    player.play('idle', true);

    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNumbers('player', { start: 16, end: 19 }),
        frameRate: 6,     
        repeat: -1      
    });
    player.play('walk', true);

    scoreText = this.add.text(20, 20, 'Score: 0', {
        fontSize: '32px',
        color: '#ffffff'
    });
    
    timeText = this.add.text(20, 60, "Time : 30", {
        fontSize: '32px',
        color: '#ffffff'
    });
    
    this.time.addEvent({
        delay: 1000,
        loop: true,
        callback: () => {
            if(gameOver || hasWon) return;
            time--;
            timeText.setText("Time : " + time);
            if(time <= 0){
                gameOver = true;
                this.add.text(250, 250, "GAME OVER", {
                    fontSize: '64px',
                    color: '#ff0000'
                });
            }
        }
    });
}

function update(timeParam, delta) {
    if (gameOver) return;

    // --- อัปเดตตัวจับเวลาวิ่งเร็ว ---
    if (isFast) {
        fastTimer -= delta;
        if (fastTimer <= 0) {
            isFast = false;
            speed = 2; // คืนค่าความเร็วปกติ
            player.clearTint(); // ลบสีเขียวออก
        }
    }

    if (hasWon) {
        if (player && player.anims) {
            player.play('idle', true);
        }
        return;
    }

    // --- ระบบควบคุมการเดิน ---
    if (cursors.right.isDown || keyD.isDown) {
        if (player.x < 780) {
            player.x += speed;
            if (isColliding(player, ...walls)) player.x -= speed;
        }
        player.play('walk', true);
        player.flipX = false; 
    } else if (cursors.left.isDown || keyA.isDown) {
        if (player.x > 20) {
            player.x -= speed; 
            if (isColliding(player, ...walls)) player.x += speed;
        }
        player.play('walk', true);
        player.flipX = true; 
    } else if (cursors.down.isDown || keyS.isDown) {
        if (player.y < 570) {
            player.y += speed;
            if (isColliding(player, ...walls)) player.y -= speed;
        }
        player.play('walk', true);
    } else if (cursors.up.isDown || keyW.isDown) {
        if (player.y > 20) {
            player.y -= speed;
            if (isColliding(player, ...walls)) player.y += speed;
        }
        player.play('walk', true);
    } else {
        player.play('idle', true);
    }

    // --- เช็คการชนเหรียญทั้ง 4 เหรียญ ---
    checkCoinCollision(this, coin);
    checkCoinCollision(this, coin1);
    checkCoinCollision(this, coin2);
    checkCoinCollision(this, coin3);
}

// ฟังก์ชันสำหรับจัดการเมื่อเก็บเหรียญได้
function checkCoinCollision(scene, coinObj) {
    let distance = Phaser.Math.Distance.Between(player.x, player.y, coinObj.x, coinObj.y);
    
    if (distance < 32) {
        console.log('เก็บเหรียญได้! วิ่งเร็วขึ้น!');
        
        // --- สถานะวิ่งเร็ว ---
        isFast = true;
        speed = 4; // เพิ่มความเร็วเป็น 4
        fastTimer = 2000; // เวลาบัฟความเร็ว 2 วินาที (2000 ms)
        player.setTint(0x00ff00); // ตัวละครเป็นสีเขียว
        
        // สุ่มจุดเกิดเหรียญใหม่
        do {
            randomX = Phaser.Math.Between(50, 750);
            randomY = Phaser.Math.Between(50, 550);
            coinObj.x = randomX;
            coinObj.y = randomY;
        } while (isColliding(coinObj, ...walls));
        
        // เพิ่มคะแนนและเล่นเสียง
        score++;
        scoreText.setText('Score: ' + score);
        scene.sound.play('duy', { volume: 50 });
        
        // เช็คการชนะ
        if (score >= 10 && !hasWon) {
            hasWon = true;
            scene.add.text(400, 300, 'ชนะ', {
                fontSize: '64px',
                color: '#FFFF00'
            }).setOrigin(0.5).setDepth(100);
        }
    }
}

// ฟังก์ชันตรวจสอบการชนกำแพง
function isColliding(gameObject, ...walls) {
    const bounds = gameObject.getBounds();
    return walls.some(wall => Phaser.Geom.Intersects.RectangleToRectangle(bounds, wall.getBounds()));
}