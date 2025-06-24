interface Frame {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface FallingObject {
    x: number;
    y: number;
    width: number;
    height: number;
    type: "good" | "bad";
}

const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const frameWidth = 48;
const frameHeight = 48;

const walkFrames: Frame[] = [
    { x: 0, y: 0, width: frameWidth, height: frameHeight },
    { x: 48, y: 0, width: frameWidth, height: frameHeight },
    { x: 96, y: 0, width: frameWidth, height: frameHeight },
];

let playerX = canvas.width / 2 - frameWidth / 2;
let currentFrame = 0;
let frameTimer = 0;
const frameSpeed = 100;
let lastTime = performance.now();

let spriteImage = new Image();
let goodFoodSprite = new Image();
let badFoodSprite = new Image();
let explosionSprite = new Image();

let keys: { [key: string]: boolean } = {};
let fallingObjects: FallingObject[] = [];
let lastSpawn = 0;
let spawnInterval = 1500;
let score = 0;
let lives = 3;
let level = 1;
const speed = 4;
const fallingSpeed = 2;
let paused = false;
let gameOver = false;
let maxScore = localStorage.getItem("maxScore") ? parseInt(localStorage.getItem("maxScore")!) : 0;

// Audio
const goodSound = new Audio('./src/sound/good.mp3');
const badSound = new Audio('./src/sound/bad.mp3');
const explosionSound = new Audio('./src/sound/explosion.mp3');

// Eventi tastiera
document.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    if (e.key === "p" || e.key === "P") paused = !paused;
    if (e.key === "r" && gameOver) restartGame();
});
document.addEventListener("keyup", (e) => {
    keys[e.key] = false;
});

// Caricamento immagini con fallback
function loadImage(src: string, callback: (img: HTMLImageElement) => void) {
    const img = new Image();
    img.onload = () => callback(img);
    img.src = src;
}

function drawPlayer() {
    const frame = walkFrames[currentFrame];
    ctx.drawImage(spriteImage, frame.x, frame.y, frame.width, frame.height, playerX, canvas.height - frameHeight - 10, frame.width, frame.height);
}

function updatePlayerAnimation(delta: number) {
    frameTimer += delta;
    if (frameTimer >= frameSpeed) {
        currentFrame = (currentFrame + 1) % walkFrames.length;
        frameTimer = 0;
    }
}

function movePlayer(delta: number) {
    if (keys["ArrowLeft"] && playerX > 0) playerX -= speed;
    if (keys["ArrowRight"] && playerX < canvas.width - frameWidth) playerX += speed;
}

function spawnObject() {
    const isGood = Math.random() < 0.7;
    const type: "good" | "bad" = isGood ? "good" : "bad";
    const obj: FallingObject = {
        x: Math.random() * (canvas.width - 32),
        y: -32,
        width: 32,
        height: 32,
        type: type,
    };
    fallingObjects.push(obj);
}

function drawFallingObjects() {
    fallingObjects.forEach((obj) => {
        const image = obj.type === "good" ? goodFoodSprite : badFoodSprite;
        ctx.drawImage(image, obj.x, obj.y, obj.width, obj.height);
    });
}

function showExplosion(x: number, y: number) {
    ctx.drawImage(explosionSprite, x, y, 48, 48);
}

function updateFallingObjects(delta: number) {
    fallingObjects.forEach((obj) => {
        obj.y += fallingSpeed + level;
    });

    fallingObjects = fallingObjects.filter((obj) => {
        const playerY = canvas.height - frameHeight - 10;
        const collide = obj.x < playerX + frameWidth &&
            obj.x + obj.width > playerX &&
            obj.y < playerY + frameHeight &&
            obj.y + obj.height > playerY;

        if (collide) {
            if (obj.type === "good") {
                score += 10;
                goodSound.currentTime = 0;
                goodSound.play();
            } else {
                lives -= 1;
                badSound.currentTime = 0;
                badSound.play();
                showExplosion(obj.x, obj.y);
                explosionSound.currentTime = 0;
                explosionSound.play();
            }
            return false;
        }

        return obj.y < canvas.height;
    });
}

function drawUI() {
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText(`Score: ${score}`, 10, 20);
    ctx.fillText(`Lives: ${lives}`, 10, 40);
    ctx.fillText(`Level: ${level}`, 10, 60);
    ctx.fillText(`Max Score: ${maxScore}`, 10, 80);

    if (paused) {
        ctx.fillStyle = "yellow";
        ctx.font = "bold 24px sans-serif";
        ctx.fillText("PAUSED", canvas.width / 2 - 60, canvas.height / 2);
    }

    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "bold 30px sans-serif";
        ctx.fillText("GAME OVER", canvas.width / 2 - 100, canvas.height / 2 - 20);
        ctx.fillStyle = "white";
        ctx.font = "16px sans-serif";
        ctx.fillText("Premi R per Ricominciare", canvas.width / 2 - 90, canvas.height / 2 + 20);
    }
}

function gameLoop(time: number) {
    if (paused || gameOver) {
        drawUI();
        requestAnimationFrame(gameLoop);
        return;
    }

    const delta = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    movePlayer(delta);
    updatePlayerAnimation(delta);

    if (time - lastSpawn > spawnInterval - level * 50) {
        spawnObject();
        lastSpawn = time;
    }

    updateFallingObjects(delta);
    drawFallingObjects();
    drawPlayer();
    drawUI();

    if (score > 0 && score % 100 === 0) level++;

    if (lives <= 0) {
        gameOver = true;
        if (score > maxScore) {
            maxScore = score;
            localStorage.setItem("maxScore", maxScore.toString());
        }
    }

    requestAnimationFrame(gameLoop);
}

function restartGame() {
    score = 0;
    lives = 3;
    level = 1;
    fallingObjects = [];
    gameOver = false;
    paused = false;
}

// Caricamento risorse e avvio
loadImage("./src/sprites/sumo.png", (img1) => {
    spriteImage = img1;
    loadImage("./src/sprites/good-food.png", (img2) => {
        goodFoodSprite = img2;
        loadImage("./src/sprites/bad-food.png", (img3) => {
            badFoodSprite = img3;
            loadImage("./src/sprites/explosion.png", (img4) => {
                explosionSprite = img4;
                requestAnimationFrame(gameLoop);
            });
        });
    });
});


//Resize Screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});