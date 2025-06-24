var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var frameWidth = 48;
var frameHeight = 48;
var walkFrames = [
    { x: 0, y: 0, width: frameWidth, height: frameHeight },
    { x: 48, y: 0, width: frameWidth, height: frameHeight },
    { x: 96, y: 0, width: frameWidth, height: frameHeight },
];
var playerX = canvas.width / 2 - frameWidth / 2;
var currentFrame = 0;
var frameTimer = 0;
var frameSpeed = 100;
var lastTime = performance.now();
var spriteImage = new Image();
var goodFoodSprite = new Image();
var badFoodSprite = new Image();
var explosionSprite = new Image();
var keys = {};
var fallingObjects = [];
var lastSpawn = 0;
var spawnInterval = 1500;
var score = 0;
var lives = 3;
var level = 1;
var speed = 4;
var fallingSpeed = 2;
var paused = false;
var gameOver = false;
var maxScore = localStorage.getItem("maxScore") ? parseInt(localStorage.getItem("maxScore")) : 0;
// Audio
var goodSound = new Audio('./src/sound/good.mp3');
var badSound = new Audio('./src/sound/bad.mp3');
var explosionSound = new Audio('./src/sound/explosion.mp3');
// Eventi tastiera
document.addEventListener("keydown", function (e) {
    keys[e.key] = true;
    if (e.key === "p" || e.key === "P")
        paused = !paused;
    if (e.key === "r" && gameOver)
        restartGame();
});
document.addEventListener("keyup", function (e) {
    keys[e.key] = false;
});
// Caricamento immagini con fallback
function loadImage(src, callback) {
    var img = new Image();
    img.onload = function () { return callback(img); };
    img.src = src;
}
function drawPlayer() {
    var frame = walkFrames[currentFrame];
    ctx.drawImage(spriteImage, frame.x, frame.y, frame.width, frame.height, playerX, canvas.height - frameHeight - 10, frame.width, frame.height);
}
function updatePlayerAnimation(delta) {
    frameTimer += delta;
    if (frameTimer >= frameSpeed) {
        currentFrame = (currentFrame + 1) % walkFrames.length;
        frameTimer = 0;
    }
}
function movePlayer(delta) {
    if (keys["ArrowLeft"] && playerX > 0)
        playerX -= speed;
    if (keys["ArrowRight"] && playerX < canvas.width - frameWidth)
        playerX += speed;
}
function spawnObject() {
    var isGood = Math.random() < 0.7;
    var type = isGood ? "good" : "bad";
    var obj = {
        x: Math.random() * (canvas.width - 32),
        y: -32,
        width: 32,
        height: 32,
        type: type,
    };
    fallingObjects.push(obj);
}
function drawFallingObjects() {
    fallingObjects.forEach(function (obj) {
        var image = obj.type === "good" ? goodFoodSprite : badFoodSprite;
        ctx.drawImage(image, obj.x, obj.y, obj.width, obj.height);
    });
}
function showExplosion(x, y) {
    ctx.drawImage(explosionSprite, x, y, 48, 48);
}
function updateFallingObjects(delta) {
    fallingObjects.forEach(function (obj) {
        obj.y += fallingSpeed + level;
    });
    fallingObjects = fallingObjects.filter(function (obj) {
        var playerY = canvas.height - frameHeight - 10;
        var collide = obj.x < playerX + frameWidth &&
            obj.x + obj.width > playerX &&
            obj.y < playerY + frameHeight &&
            obj.y + obj.height > playerY;
        if (collide) {
            if (obj.type === "good") {
                score += 10;
                goodSound.currentTime = 0;
                goodSound.play();
            }
            else {
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
    ctx.fillText("Score: ".concat(score), 10, 20);
    ctx.fillText("Lives: ".concat(lives), 10, 40);
    ctx.fillText("Level: ".concat(level), 10, 60);
    ctx.fillText("Max Score: ".concat(maxScore), 10, 80);
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
function gameLoop(time) {
    if (paused || gameOver) {
        drawUI();
        requestAnimationFrame(gameLoop);
        return;
    }
    var delta = time - lastTime;
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
    if (score > 0 && score % 100 === 0)
        level++;
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
loadImage("./src/sprites/sumo.png", function (img1) {
    spriteImage = img1;
    loadImage("./src/sprites/good-food.png", function (img2) {
        goodFoodSprite = img2;
        loadImage("./src/sprites/bad-food.png", function (img3) {
            badFoodSprite = img3;
            loadImage("./src/sprites/explosion.png", function (img4) {
                explosionSprite = img4;
                requestAnimationFrame(gameLoop);
            });
        });
    });
});
//Resize Screen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', function () {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
