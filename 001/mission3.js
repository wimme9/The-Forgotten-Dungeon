// ตัวแปรสำหรับระบบภารกิจ 3 (คบเพลิง)
let torches = [];
let correctSequence = [2, 0, 3, 1]; 
let playerSequence = []; 
let isMission3Complete = false;

//preload
    this.load.spritesheet('torch', 'assets/items/torch.png', { frameWidth: 64, frameHeight: 64 });

//create
    this.anims.create({
        key: 'torchFire',
        frames: this.anims.generateFrameNumbers('torch', {
            start: 0,
            end: 7      // ถ้ามี 8 เฟรม
        }),
        frameRate: 10,
        repeat: -1
    });

    // ==========================================
    // 🛠️ MISSION 3: ระบบห้องคบเพลิง 4 อัน 
    // ==========================================
    
    const torchPositionsX = [120, 210, 300, 390];

    let torchStatusText = this.add.text(250, 385, "Torches: [ ] [ ] [ ] [ ]", {
        font: '13px Arial', fill: '#ffffff', backgroundColor: '#222222', padding: {x:8, y:4}
    }).setOrigin(0.5);

    torchPositionsX.forEach((posX, index) => {
        // 🌟 บังคับให้อยู่เฟรม 0 ตลอดไป ภาพจะได้ไม่วิ่งข้ามคอลลัมน์
        let torch = this.add.sprite(posX, 460, 'torch', 0).setScale(1.0);
        torch.play('torchFire');
        torch.setInteractive();

        torch.torchId = index; 
        torch.isLit = false;   
        torch.startX = posX;     // จำพิกัด X เริ่มต้นไว้
        torch.startY = 460;    // จำพิกัด Y เริ่มต้นไว้

        // เริ่มต้นย้อมสีมืด (ไฟดับ)
        torch.setTint(0x444444); 

        torch.on('pointerdown', () => {
            if (isMission3Complete) return; 

            let distance = Phaser.Math.Distance.Between(player.x, player.y, torch.x, torch.y);
            
            if (distance < 800) {
                if (!torch.isLit) {
                    torch.isLit = true;
                    
                    // ✨ เปิดไฟ: ล้างสีที่ย้อมมืดออกให้ภาพสว่างใส (และใน update จะสั่งให้มันสั่นเอง)
                    torch.clearTint(); 
                    
                    playerSequence.push(torch.torchId); 
                    updateTorchUI();
                    checkTorchSequence();
                }
            }
        });

        torches.push(torch);
    });

    const updateTorchUI = () => {
        let displayStr = "Torches: ";
        playerSequence.forEach(id => { displayStr += `[ ${id + 1} ] `; });
        torchStatusText.setText(displayStr);
    };

    const checkTorchSequence = () => {
        let currentStep = playerSequence.length - 1;

        if (playerSequence[currentStep] !== correctSequence[currentStep]) {
            torchStatusText.setText("❌ WRONG! Resetting...");
            torchStatusText.setStyle({ fill: '#ff4444' });
            this.time.delayedCall(800, () => { resetTorches(); });
            return;
        }

        if (playerSequence.length === correctSequence.length) {
            isMission3Complete = true;
            torchStatusText.setText("✨ SUCCESS! Way to Room 4 is Open!");
            torchStatusText.setStyle({ fill: '#00ff00', backgroundColor: '#003300' });

            corridors.push(new Phaser.Geom.Rectangle(500, 480, 60, 80));
            this.secretDoorBottomGfx.destroy();

            const postGfx3 = this.add.graphics();
            postGfx3.fillStyle(0x1a1a1a, 1);
            postGfx3.fillRect(496, 482, 8, 76);  
            postGfx3.fillRect(556, 482, 8, 76);
        }
    };

    const resetTorches = () => {
        playerSequence = [];
        torches.forEach((t) => {
            t.isLit = false;
            t.setTint(0x444444);  // กลับมามืดเหมือนเดิม
            t.setPosition(t.startX, t.startY); // ดึงกลับพิกัดเดิมเป๊ะ ๆ
        });
        torchStatusText.setText("Torches: [ ] [ ] [ ] [ ]");
        torchStatusText.setStyle({ fill: '#ffffff', backgroundColor: '#222222' });
    };
    