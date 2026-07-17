// ตัวแปรสำหรับระบบภารกิจ 2 (รูปปั้น)
let statues = []; 
let isMission2Complete = false;

//preload

    // โหลดภาพรูปปั้นห้อง 2
    this.load.image('statue', 'asset/statue.png'); 

//create

    // ==========================================
    // MISSION 2: ระบบรูปปั้น 4 ตัว
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