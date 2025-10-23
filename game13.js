const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 500;
canvas.length = 600;

let player = {
    x: canvas.width / 2 - 40,
    y: canvas.height - 40,
    width: 80,
    height: 20,
    speed: 8,
};

let items = [];
let score = 0;
let lives = 3;
let gameOver = false;
let keys = {};

function randomItem() {
    const isCup = Math.random() < 0.5; // 50/50 chance
    return {
        x: Math.random() * (canvas.width - 30),
        y: 0,
        size: 30,
        speed: 3 + Math.random() * 2,
        isCup
    };
}

document.addEventListener('keydown', (e) => (keys[e.key] = true));
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function movePlayer() {
  if (keys["ArrowLeft"] && player.x > 0) player.x -= player.speed;
  if (keys["ArrowRight"] && player.x < canvas.width - player.width)
    player.x += player.speed;
}

function updateItems() {
  if (Math.random() < 0.03) items.push(randomItem());

  items.forEach((item, index) => {
    item.y += item.speed;

    // collision check
    if (
      item.y + item.size >= player.y &&
      item.x + item.size >= player.x &&
      item.x <= player.x + player.width
    ) {
      if (item.isCup) {
        score++;
      } else {
        lives--;
      }
      items.splice(index, 1);
    }

    if (item.y > canvas.height) items.splice(index, 1);
  });

  if (lives <= 0) gameOver = true;
}

function drawPlayer() {
  ctx.fillStyle = "#424242";
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function drawItems() {
  items.forEach((item) => {
    if (item.isCup) {
      ctx.fillStyle = "blue"; // faucet cup
      ctx.beginPath();
      ctx.arc(item.x + 15, item.y + 15, 15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "green"; // bottle
      ctx.fillRect(item.x, item.y, item.size, item.size);
    }
  });
}

function drawHUD() {
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}`, 10, 25);
  ctx.fillText(`Lives: ${lives}`, 420, 25);
}

function drawGameOver() {
  ctx.fillStyle = "red";
  ctx.font = "36px Arial";
  ctx.fillText("GAME OVER!", 130, 300);
  ctx.font = "20px Arial";
  ctx.fillText("Press R to Restart", 160, 340);
}

function restartGame() {
  player.x = canvas.width / 2 - 40;
  items = [];
  score = 0;
  lives = 3;
  gameOver = false;
}

document.addEventListener("keydown", (e) => {
  if (e.key === "r" || e.key === "R") {
    if (gameOver) restartGame();
  }
});

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (!gameOver) {
    movePlayer();
    updateItems();
    drawPlayer();
    drawItems();
    drawHUD();
  } else {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();