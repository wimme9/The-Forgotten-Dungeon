function preload() {
    // โหลดภาพเดี่ยวแยกกัน 5 เล่ม
    this.load.image('book1', 'assets/items/book1.png');
    this.load.image('book2', 'assets/items/book2.png');
    this.load.image('book3', 'assets/items/book3.png');
    this.load.image('book4', 'assets/items/book4.png');
    this.load.image('book5', 'assets/items/book5.png');
}

function create() {
    // ==========================================
    // 🛠️ MISSION 1: ระบบหนังสือ 5 เล่ม (บีบ Hit Area ป้องกันการบังกัน)
    // ==========================================
    const bookPositionsX = [160, 220, 280, 340, 400];
    const correctBookIndex = 4; // เล่มที่ 5 (index 4) เป็น Ancient Spell Book

    const bookTexts = [
        "นี่เป็นเพียงหนังสือประวัติศาสตร์เก่าเล่มหนึ่ง", 
        "หน้ากระดาษเต็มไปด้วยฝุ่นและอ่านไม่ออก",
        "มันเป็นรวมนิทานพื้นบ้านง่ายๆ เรื่องหนึ่ง",
        "สมุดบันทึกเก่าของนักสำรวจคนก่อน",
        "✨ คุณพบหนังสือเวทมนตร์โบราณแล้ว! ✨\n[Got Magic Scroll]"
    ];

    // สร้างกล่องข้อความกลางอันเดียว
    let globalBubble = this.add.text(0, 0, '', { 
        font: '14px Arial', 
        fill: '#ffffff', 
        backgroundColor: '#000000', 
        padding: { x: 8, y: 6 },
        align: 'center'
    }).setOrigin(0.5, 1).setVisible(false).setDepth(10); 

    let hideTimer = null;

    bookPositionsX.forEach((posX, index) => {
        let bookKey = `book${index + 1}`; 
        let book = this.add.sprite(posX, 140, bookKey).setScale(0.15); 
        
        // เปิดโหมด Interactive พร้อมบีบกล่องรับการคลิก (Hit Area) 
        // ให้เท่ากับขนาดของรูปภาพจริง
        book.setInteractive(new Phaser.Geom.Rectangle(0, 0, book.width, book.height), Phaser.Geom.Rectangle.Contains);
        this.input.setHitArea(book); 
        book.on('pointerdown', () => {
            let distance = Phaser.Math.Distance.Between(player.x, player.y, book.x, book.y);
            // ระยะตรวจจับ
            if (distance < 80) {
                globalBubble.setPosition(book.x, book.y - 25);
                globalBubble.setText(bookTexts[index]);

                if (index === correctBookIndex) {
                    globalBubble.setStyle({ fill: '#ffcc00' }); 
                } else {
                    globalBubble.setStyle({ fill: '#ff4444' }); 
                }
                
                globalBubble.setVisible(true);

                if (hideTimer) hideTimer.remove();

                hideTimer = this.time.delayedCall(2000, () => {
                    globalBubble.setVisible(false);
                });
            } else {
                console.log("Too far! Walk closer to inspect.");
            }
        });
    });
}
