// Mission 4 Variables (NPC Dialogue State)
let npc;
let npcDialogueCount = 0; // ตัวนับสถานะว่าคุยไปกี่ครั้งแล้ว

//preload

    // ภาพ NPC
    this.load.image('npc', 'assets/environments/npc.png');

//create

    // ==========================================
    // 🌟 MISSION 4: ระบบ NPC (Dialogue State)
    // ==========================================
    
    // สร้างตัว NPC ยืนอยู่ในห้อง 4 (พิกัด X: 850, Y: 480)
    npc = this.add.sprite(850, 480, 'npc').setScale(1.2);
    
    // ตั้งค่า Hit Area สำหรับคลิกให้พอดีกับขนาดรูปภาพใหม่ที่ย่อแล้ว
    npc.setInteractive(new Phaser.Geom.Rectangle(0, 0, npc.width, npc.height), Phaser.Geom.Rectangle.Contains);
    this.input.setHitArea(npc);

    // ข้อความบอกใบ้ด้านบนหัว NPC (ขยับ Y ขึ้นไปเล็กน้อยไม่ให้บังตัว NPC)
    this.add.text(850, 435, "💬 NPC (Click to talk)", { font: '12px Arial', fill: '#888888' }).setOrigin(0.5);

    // กล่องข้อความคำพูดของ NPC (Speech Bubble)
    let npcBubble = this.add.text(850, 425, '', { 
        font: '15px Arial', 
        fill: '#ffffff', 
        backgroundColor: '#111111', 
        padding: { x: 10, y: 6 },
        align: 'center'
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10); 

    let npcTimer = null;

    // รายการคำพูดตาม Dialogue State
    const npcDialogues = [
        "กุญแจถูกซ่อนไว้",      // ครั้งที่ 1 (Index 0)
        "มองไปใกล้ๆ รูปปั้นสิ",   // ครั้งที่ 2 (Index 1)
        "โชคดีนะ"              // ครั้งที่ 3 เป็นต้นไป (Index 2)
    ];

    npc.on('pointerdown', () => {
        let distance = Phaser.Math.Distance.Between(player.x, player.y, npc.x, npc.y);
        
        if (distance < 100) {
            let currentText = npcDialogues[npcDialogueCount];
            
            npcBubble.setText(currentText);
            npcBubble.setVisible(true);

            if (npcDialogueCount === 0) npcBubble.setStyle({ fill: '#ffffff' });
            if (npcDialogueCount === 1) npcBubble.setStyle({ fill: '#ffcc00' }); 
            if (npcDialogueCount >= 2) npcBubble.setStyle({ fill: '#888888' });

            if (npcDialogueCount < npcDialogues.length - 1) {
                npcDialogueCount++;
            }

            if (npcTimer) npcTimer.remove();
            npcTimer = this.time.delayedCall(2500, () => { 
                npcBubble.setVisible(false); 
            });
        }
    });