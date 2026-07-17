const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// ================= ห้อง (พื้นหลัง) =================
const rooms = [
    { x: 40, y: 40, w: 240, h: 180, quest: "เควส: ค้นหาคัมภีร์เวทมนตร์ที่ถูกต้อง" },
    { x: 360, y: 40, w: 280, h: 180, quest: "เควส: หมุนรูปปั้นให้หันถูกทิศ" },
    { x: 360, y: 340, w: 280, h: 180, quest: "เควส: จุดคบเพลิงเรียงลำดับจาก 1-4" },
    { x: 720, y: 340, w: 240, h: 180, quest: "เควส: เลือกเปิดหีบกุญแจ (ระวังกับดัก)" }
];

// ================= ทางเดิน (พื้นหลัง) =================
const corridors = [
    { x: 280, y: 110, w: 80, h: 40 },
    { x: 480, y: 220, w: 40, h: 120 },
    { x: 640, y: 410, w: 80, h: 40 }
];

// ================= ประตูล็อกของแต่ละห้อง =================
const door1 = { x: 295, y: 100, w: 20, h: 60, locked: true };
const door2 = { x: 470, y: 265, w: 60, h: 30, locked: true };
const door3 = { x: 645, y: 400, w: 20, h: 60, locked: true };

// ================= MISSION 1 =================
const books = [
    { x: 90, y: 80, title: "คัมภีร์เงา", message: "เปิดออกมา... หน้ากระดาษว่างเปล่า ราวกับตัวอักษรหนีหายไปเมื่อมีคนจ้องมอง", correct: false },
    { x: 160, y: 80, title: "บันทึกนักเล่นแร่แปรธาตุ", message: "สูตรแปลงตะกั่วเป็นทองคำ... แต่หน้าสุดท้ายดูเหมือนจะถูกฉีกหายไป", correct: false },
    { x: 230, y: 80, title: "คัมภีร์ต้องคำสาป", message: "ทันทีที่แตะปกหนังสือ แสงสีทองพวยพุ่งออกมา! ม้วนกระดาษเรืองแสงลอยขึ้นจากหน้ากระดาษ...", correct: true },
    { x: 90, y: 190, title: "ตำนานเทพเจ้าโบราณ", message: "เล่าเรื่องเทพผู้หลับใหลอยู่ใต้ภูเขาไฟมาเนิ่นนาน รอวันที่จะตื่นขึ้นอีกครั้ง", correct: false },
    { x: 230, y: 190, title: "สมุดบันทึกบรรณารักษ์", message: "รายชื่อผู้ยืมหนังสือ... ชื่อคนสุดท้ายที่ยืมถูกขีดฆ่าจนอ่านไม่ออก", correct: false }
];
const bookSize = 32;
const bookImg = new Image();
bookImg.src = "assets/sprite/book.png";
let hasMagicScroll = false;
let activeMessage = null;

// ================= MISSION 2 =================
const statues = [
    { x: 410, y: 80, angle: 180, targetAngle: 0, name: "รูปปั้นผู้พิทักษ์ทิศเหนือ" },
    { x: 590, y: 80, angle: 0, targetAngle: 90, name: "รูปปั้นผู้พิทักษ์ทิศตะวันออก" },
    { x: 410, y: 180, angle: 90, targetAngle: 180, name: "รูปปั้นผู้พิทักษ์ทิศใต้" },
    { x: 590, y: 180, angle: 270, targetAngle: 270, name: "รูปปั้นผู้พิทักษ์ทิศตะวันตก" }
];
const statueSize = 40;
const statueImg = new Image();
statueImg.src = "assets/sprite/T.png";
let statuesSolved = false;

// ================= MISSION 3 =================
const torches = [
    { id: 0, x: 400, y: 380, isOn: false, name: "คบเพลิงอันที่ 1" },
    { id: 1, x: 460, y: 380, isOn: false, name: "คบเพลิงอันที่ 2" },
    { id: 2, x: 520, y: 380, isOn: false, name: "คบเพลิงอันที่ 3" },
    { id: 3, x: 580, y: 380, isOn: false, name: "คบเพลิงอันที่ 4" }
];
const torchSize = 32;
const torchImg = new Image();
torchImg.src = "assets/sprite/Pixel_Bild__torch.png";
const correctSequence = [0, 1, 2, 3];
let currentStep = 0;
let torchesSolved = false;

// ================= MISSION 4 =================
const npc = { x: 760, y: 480, size: 60, name: "ผู้เฒ่าแห่งวิหาร" };
const npcImg = new Image();
npcImg.src = "assets/sprite/npc.png";

const npcDialogues = [
    "NPC: เจ้ามาถึงห้องสุดท้ายแล้วสินะ",
    "NPC: ข้าเฝ้าห้องนี้มานาน คอยดูแลหีบสมบัติทั้งสามใบ",
    "NPC: มีหีบใบเดียวที่มีกุญแจจริง ใบที่เหลือเป็นกับดัก",
    "NPC: เลือกให้ดีนะ ขอให้โชคดี"
];
let currentDialogueIndex = -1;
let npcTalked = false;

// ================= MISSION 5 =================
const chests = [
    { id: 1, x: 760, y: 430, isOpened: false, isCorrect: false, name: "หีบด้านซ้าย" },
    { id: 2, x: 840, y: 430, isOpened: false, isCorrect: true, name: "หีบตรงกลาง" },
    { id: 3, x: 920, y: 430, isOpened: false, isCorrect: false, name: "หีบด้านขวา" }
];
const chestSize = 40;
const chestImg = new Image();
chestImg.src = "assets/sprite/box.png";
let gameCleared = false;
let isTrapped = false;

// ================= ตัวละคร =================
const player = {
    x: 160,
    y: 130, // เกิดตรงกลางห้อง 1
    width: 40,
    height: 60,
    speed: 5,
    direction: "front",
    frame: 0,
    frameTimer: 0
};
// ปรับจุด Hitbox การชนให้เล็กลง (เน้นที่เท้า) ช่วยลดปัญชาชนขอบประตูแล้วติดขัด
const collisionSize = { w: 14, h: 14 };
const playerImg = new Image();
playerImg.src = "assets/sprite/Character.png";

const spriteWidth = 736 / 4;
const spriteHeight = 1102 / 4;
const animations = {
    front: [0, 1, 2, 3],
    back: [4, 5, 6, 7],
    left: [8, 9, 10, 11],
    right: [12, 13, 14, 15]
};

// ================= ปุ่มและการคลิก =================
const keys = { w: false, a: false, s: false, d: false };

// ย้ายปุ่มควบคุมมาดักจับที่ window เพื่อป้องกันบัค Canvas ไม่ Focus
window.addEventListener("keydown", (e) => {
    let key = e.key.toLowerCase();
    if (key === "w" || key === "arrowup") keys.w = true;
    if (key === "a" || key === "arrowleft") keys.a = true;
    if (key === "s" || key === "arrowdown") keys.s = true;
    if (key === "d" || key === "arrowright") keys.d = true;
});

window.addEventListener("keyup", (e) => {
    let key = e.key.toLowerCase();
    if (key === "w" || key === "arrowup") keys.w = false;
    if (key === "a" || key === "arrowleft") keys.a = false;
    if (key === "s" || key === "arrowdown") keys.s = false;
    if (key === "d" || key === "arrowright") keys.d = false;
});

canvas.addEventListener("click", (e) => {
    if (currentDialogueIndex !== -1) {
        currentDialogueIndex++;
        if (currentDialogueIndex < npcDialogues.length) {
            activeMessage = npcDialogues[currentDialogueIndex];
        } else {
            currentDialogueIndex = -1;
            activeMessage = null;
            npcTalked = true;
        }
        return;
    }

    if (activeMessage) {
        activeMessage = null;
        return;
    }

    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let clickX = (e.clientX - rect.left) * scaleX;
    let clickY = (e.clientY - rect.top) * scaleY;

    // --- คลิกหนังสือ ---
    for (let i = 0; i < books.length; i++) {
        let b = books[i];
        if (clickX >= b.x - bookSize / 2 && clickX <= b.x + bookSize / 2 && clickY >= b.y - bookSize / 2 && clickY <= b.y + bookSize / 2) {
            activeMessage = b.message;
            if (b.correct && !hasMagicScroll) {
                hasMagicScroll = true;
                door1.locked = false;
            }
            return;
        }
    }

    // --- คลิกรูปปั้น ---
    for (let i = 0; i < statues.length; i++) {
        let s = statues[i];
        if (clickX >= s.x - statueSize / 2 && clickX <= s.x + statueSize / 2 && clickY >= s.y - statueSize / 2 && clickY <= s.y + statueSize / 2) {
            s.angle = (s.angle + 90) % 360;
            activeMessage = `คุณหมุน "${s.name}" ไปที่ทิศ ${getDirectionName(s.angle)}`;
            checkStatuesPuzzle();
            return;
        }
    }

    // --- คลิกคบเพลิง ---
    for (let i = 0; i < torches.length; i++) {
        let t = torches[i];
        if (clickX >= t.x - torchSize / 2 && clickX <= t.x + torchSize / 2 && clickY >= t.y - torchSize / 2 && clickY <= t.y + torchSize / 2) {
            if (torchesSolved) return;
            if (t.id === correctSequence[currentStep]) {
                t.isOn = true;
                currentStep++;
                activeMessage = `คุณจุดไฟที่ "${t.name}"... เปลวไฟลุกโชนขึ้น!`;
                if (currentStep === correctSequence.length) {
                    torchesSolved = true;
                    door3.locked = false;
                    activeMessage = "🔥 คบเพลิงจุดครบตามลำดับแล้ว! ประตูทางออกห้องคบเพลิงเปิดแล้ว!";
                }
            } else {
                torches.forEach(torch => torch.isOn = false);
                currentStep = 0;
                door3.locked = true;
                activeMessage = "💥 ลำดับผิดพลาด! ไฟทุกดวงดับลง... ต้องเริ่มจุดใหม่อีกครั้ง!";
            }
            return;
        }
    }

    // --- คลิก NPC ---
    if (clickX >= npc.x - npc.size / 2 && clickX <= npc.x + npc.size / 2 && clickY >= npc.y - npc.size / 2 && clickY <= npc.y + npc.size / 2) {
        if (!npcTalked) {
            currentDialogueIndex = 0;
            activeMessage = npcDialogues[currentDialogueIndex];
        } else {
            activeMessage = "NPC: จงระวังหีบกับดักในห้องถัดไปให้ดีๆ ล่ะเจ้าหนู!";
        }
        return;
    }

    // --- คลิกหีบสมบัติ ---
    for (let i = 0; i < chests.length; i++) {
        let c = chests[i];
        if (clickX >= c.x - chestSize / 2 && clickX <= c.x + chestSize / 2 && clickY >= c.y - chestSize / 2 && clickY <= c.y + chestSize / 2) {
            if (c.isOpened || gameCleared) return;
            c.isOpened = true;
            if (c.isCorrect) {
                gameCleared = true;
                isTrapped = false;
                player.speed = 5;
                activeMessage = `🎉 ยินดีด้วย! คุณเปิด "${c.name}" และพบ "กุญแจทองคำโบราณ"! คุณเคลียร์วิหารแห่งนี้สำเร็จแล้ว!`;
            } else {
                isTrapped = true;
                player.speed = 1;
                activeMessage = `💥 กริ๊ก... หมอกพิษพุ่งออกจาก "${c.name}"! คุณติดกับดัก! (ตัวช้าลงอย่างมาก) คุณไม่สามารถเปิดหีบใบนี้ได้อีก`;
            }
            return;
        }
    }
});

function getDirectionName(angle) {
    if (angle === 0) return "เหนือ (↑)";
    if (angle === 90) return "ตะวันออก (→)";
    if (angle === 180) return "ใต้ (↓)";
    if (angle === 270) return "ตะวันตก (←)";
    return angle + "°";
}

function checkStatuesPuzzle() {
    let allCorrect = statues.every(s => s.angle === s.targetAngle);
    if (allCorrect) {
        statuesSolved = true;
        door2.locked = false;
        activeMessage = "กลไกประตูดังลั่น... รูปปั้นทุกตัวหันถูกทิศแล้ว! ประตูทางลงเปิดออก!";
    } else {
        door2.locked = true;
    }
}

// ================= [ระบบคำนวณการชนใหม่หมดจด] =================
function isWalkable(cx, cy, w, h) {
    let left = cx - w / 2;
    let right = cx + w / 2;
    let top = cy - h / 2;
    let bottom = cy + h / 2;

    if (left < 0 || right > canvas.width || top < 0 || bottom > canvas.height) return false;

    if (door1.locked && left < door1.x + door1.w && right > door1.x && top < door1.y + door1.h && bottom > door1.y) return false;
    if (door2.locked && left < door2.x + door2.w && right > door2.x && top < door2.y + door2.h && bottom > door2.y) return false;
    if (door3.locked && left < door3.x + door3.w && right > door3.x && top < door3.y + door3.h && bottom > door3.y) return false;

    for (let i = 0; i < rooms.length; i++) {
        let r = rooms[i];
        if (left >= r.x && right <= r.x + r.w && top >= r.y && bottom <= r.y + r.h) {
            return true;
        }
    }
    for (let i = 0; i < corridors.length; i++) {
        let c = corridors[i];
        if (left >= c.x && right <= c.x + c.w && top >= c.y && bottom <= c.y + c.h) {
            return true;
        }
    }
    let centerInRoom = rooms.some(r => cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h);
    let centerInCorridor = corridors.some(c => cx >= c.x && cx <= c.x + c.w && cy >= c.y && cy <= c.y + c.h);

    return (centerInRoom || centerInCorridor);
}

// ================= เดิน =================
function updatePlayer() {
    if (activeMessage) return;

    let newX = player.x;
    let newY = player.y;
    let moving = false;

    if (keys.w) { newY -= player.speed; player.direction = "back"; moving = true; }
    if (keys.s) { newY += player.speed; player.direction = "front"; moving = true; }
    if (keys.a) { newX -= player.speed; player.direction = "left"; moving = true; }
    if (keys.d) { newX += player.speed; player.direction = "right"; moving = true; }

    // แยกเช็ก X และ Y อิสระ เพื่อให้สามารถสไลด์ไปตามกำแพงได้ ไม่ติดขัด
    if (isWalkable(newX, player.y, collisionSize.w, collisionSize.h)) {
        player.x = newX;
    }
    if (isWalkable(player.x, newY, collisionSize.w, collisionSize.h)) {
        player.y = newY;
    }

    if (moving) {
        player.frameTimer++;
        if (player.frameTimer > 8) {
            player.frame++;
            if (player.frame >= 4) player.frame = 0;
            player.frameTimer = 0;
        }
    } else {
        player.frame = 0;
    }
}

// ================= วาดองค์ประกอบต่าง ๆ =================
function drawBooks() {
    books.forEach(b => {
        if (bookImg.complete && bookImg.naturalWidth > 0) {
            ctx.drawImage(bookImg, b.x - bookSize / 2, b.y - bookSize / 2, bookSize, bookSize);
        } else {
            ctx.fillStyle = "#8b5e3c"; ctx.fillRect(b.x - bookSize / 2, b.y - bookSize / 2, bookSize, bookSize);
        }
    });
}

function drawStatues() {
    statues.forEach(s => {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate((s.angle * Math.PI) / 180);
        if (statueImg.complete && statueImg.naturalWidth > 0) {
            ctx.drawImage(statueImg, -statueSize / 2, -statueSize / 2, statueSize, statueSize);
        } else {
            ctx.fillStyle = "#7f8c8d"; ctx.fillRect(-statueSize / 2, -statueSize / 2, statueSize, statueSize);
            ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.moveTo(0, -statueSize / 2 + 5);
            ctx.lineTo(-10, 0); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
    });
}

function drawTorches() {
    torches.forEach(t => {
        if (torchImg.complete && torchImg.naturalWidth > 0) {
            ctx.save();
            if (!t.isOn) ctx.globalAlpha = 0.4;
            ctx.drawImage(torchImg, t.x - torchSize / 2, t.y - torchSize / 2, torchSize, torchSize);
            ctx.restore();
        } else {
            ctx.fillStyle = t.isOn ? "#f1c40f" : "#34495e"; ctx.fillRect(t.x - torchSize / 2, t.y - torchSize / 2, torchSize, torchSize);
        }
    });
}

function drawNPC() {
    if (npcImg.complete && npcImg.naturalWidth > 0) {
        ctx.drawImage(npcImg, npc.x - npc.size / 2, npc.y - npc.size / 2, npc.size, npc.size);
    } else {
        ctx.fillStyle = "#9b59b6"; ctx.fillRect(npc.x - npc.size / 2, npc.y - npc.size / 2, npc.size, npc.size);
    }
}

function drawChests() {
    chests.forEach(c => {
        ctx.save();
        if (c.isOpened) ctx.globalAlpha = 0.5;
        if (chestImg.complete && chestImg.naturalWidth > 0) {
            ctx.drawImage(chestImg, c.x - chestSize / 2, c.y - chestSize / 2, chestSize, chestSize);
        } else {
            ctx.fillStyle = c.isOpened ? "#7f8c8d" : "#e67e22"; ctx.fillRect(c.x - chestSize / 2, c.y - chestSize / 2, chestSize, chestSize);
        }
        ctx.restore();
    });
}

function drawDoors() {
    ctx.lineWidth = 2; ctx.strokeStyle = "#000000";
    let allDoors = [door1, door2, door3];
    allDoors.forEach(d => {
        ctx.fillStyle = d.locked ? "#c0392b" : "#2ecc71";
        ctx.fillRect(d.x, d.y, d.w, d.h);
        ctx.strokeRect(d.x, d.y, d.w, d.h);
    });
}

function drawMessageBox() {
    if (!activeMessage) return;

    let boxW = 800; let boxH = 140;
    let boxX = (canvas.width - boxW) / 2;
    let boxY = canvas.height - boxH - 40;

    ctx.fillStyle = "rgba(20, 20, 30, 0.95)"; ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = "#e07a5f"; ctx.lineWidth = 3; ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffffff"; ctx.font = "20px sans-serif";
    wrapText(activeMessage, boxX + 30, boxY + 40, boxW - 60, 28);

    ctx.fillStyle = "#e07a5f"; ctx.font = "16px sans-serif";
    let tipText = (currentDialogueIndex !== -1) ? "(คลิกเพื่ออ่านประโยคถัดไป)" : "(คลิกที่ไหนก็ได้เพื่อปิดข้อความ)";
    ctx.fillText(tipText, boxX + 30, boxY + boxH - 20);
}

function wrapText(text, x, y, maxWidth, lineHeight) {
    let words = text.split(" ");
    let line = ""; let currentY = y;
    for (let i = 0; i < words.length; i++) {
        let testLine = line + words[i] + " ";
        let testWidth = ctx.measureText(testLine).width;
        if (testWidth > maxWidth && i > 0) {
            ctx.fillText(line, x, currentY);
            line = words[i] + " "; currentY += lineHeight;
        } else { line = testLine; }
    }
    ctx.fillText(line, x, currentY);
}

function drawUI() {
    ctx.fillStyle = "#ffffff"; ctx.font = "13px sans-serif";
    ctx.fillStyle = hasMagicScroll ? "#ffd700" : "#ffffff";
    ctx.fillText("M1: " + (hasMagicScroll ? "✔️" : "🔒"), 20, 30);
    ctx.fillStyle = statuesSolved ? "#2ecc71" : "#ffffff";
    ctx.fillText("M2: " + (statuesSolved ? "✔️" : "🔒"), 90, 30);
    ctx.fillStyle = torchesSolved ? "#e67e22" : "#ffffff";
    ctx.fillText("M3: " + (torchesSolved ? "✔️" : "🔒"), 160, 30);
    ctx.fillStyle = npcTalked ? "#9b59b6" : "#ffffff";
    ctx.fillText("M4 NPC: " + (npcTalked ? "✔️" : "🔒"), 230, 30);

    if (gameCleared) {
        ctx.fillStyle = "#2ecc71"; ctx.font = "bold 16px sans-serif";
        ctx.fillText("🎉 GAME CLEAR!! คุณได้กุญแจทองคำแล้ว!", 450, 30);
    } else if (isTrapped) {
        ctx.fillStyle = "#e74c3c"; ctx.fillText("⚠️ ติดกับดัก! ตัวช้าลง (หาหีบใบใหม่)", 450, 30);
    } else {
        ctx.fillStyle = "#ffffff"; ctx.fillText("M5: ตามหาหีบกุญแจจริงในห้องขวาล่าง", 450, 30);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#3d405b";
    corridors.forEach(c => { ctx.fillRect(c.x, c.y, c.w, c.h); });

    rooms.forEach(r => {
        ctx.fillStyle = "#22252a"; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = "#e07a5f"; ctx.lineWidth = 4; ctx.strokeRect(r.x, r.y, r.w, r.h);

        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.font = "12px sans-serif";
        ctx.fillText(r.quest, r.x + 10, r.y + 20);
    });

    drawDoors();
    drawBooks();
    drawStatues();
    drawTorches();
    drawNPC();
    drawChests();

    if (playerImg.complete && playerImg.naturalWidth > 0) {
        let frameIndex = animations[player.direction][player.frame];
        let frameX = frameIndex % 4; let frameY = Math.floor(frameIndex / 4);
        ctx.drawImage(playerImg, frameX * spriteWidth, frameY * spriteHeight, spriteWidth, spriteHeight, player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    } else {
        ctx.fillStyle = "#e63946"; ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
    }

    drawUI();
    drawMessageBox();
}

// ================= Loop =================
function gameLoop() {
    try {
        updatePlayer();
        draw();
    } catch (err) {
        ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#f00"; ctx.font = "16px monospace";
        ctx.fillText("ERROR: " + err.message, 20, 40);
        console.error(err);
    }
    requestAnimationFrame(gameLoop);
}

gameLoop();