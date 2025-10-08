// ====================================================
// Leaky Faucet - Dimitry Visochin
// Microgame for Recycle Rush
// ====================================================

// Canvas setup
const canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 300;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

// --- Game State ---
let waterLevel = 0;
let dripTimer = 0;
let wrenchRotation = 0;
let leakFixed = false;
let gameOver = false;

// --- Constants ---
const DRIP_RATE = 0.5;        // how fast the sink fills
const FIX_THRESHOLD = 360;    // degrees to fully tighten
const MAX_WATER = 100;        // overflow point

// --- Event Listener ---
document.addEventListener("keydown", (e) => {
    if (gameOver) return;

    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") {
        wrenchRotation += 15;
    } else if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") {
        wrenchRotation -= 15;
    }

    if (Math.abs(wrenchRotation) >= FIX_THRESHOLD) {
        leakFixed = true;
    }
});

// --- Drawing Functions ---
function drawFaucet() {
    // faucet neck
    ctx.fillStyle = "#555";
    ctx.fillRect(160, 50, 80, 20);
    ctx.fillRect(195, 20, 10, 30);

    // drip
    if (!leakFixed && dripTimer % 40 === 0) {
        ctx.beginPath();
        ctx.arc(200, 75, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#2196f3";
        ctx.fill();
        waterLevel += DRIP_RATE;
    }
}

function drawSink() {
    // sink outline
    ctx.fillStyle = "#b0bec5";
    ctx.fillRect(120, 200, 160, 40);

    // water fill
    ctx.fillStyle = "#4fc3f7";
    ctx.fillRect(120, 240 - waterLevel, 160, waterLevel);
}

function drawWrench() {
    ctx.save();
    ctx.translate(300, 130);
    ctx.rotate((wrenchRotation * Math.PI) / 180);
    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(-40, -10, 80, 20);

    // wrench head
    ctx.beginPath();
    ctx.arc(40, 0, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// --- Main Loop ---
function update() {
    if (gameOver) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFaucet();
    drawSink();
    drawWrench();

    dripTimer++;

    if (waterLevel >= MAX_WATER) {
        endGame(false);
    }

    if (leakFixed) {
        endGame(true);
    }

    requestAnimationFrame(update);
}

function endGame(success) {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#fff";
    ctx.font = "22px Arial";
    ctx.textAlign = "center";
    ctx.fillText(
        success ? "✅ Leak Fixed! Great job!" : "💦 Sink Overflowed!",
        canvas.width / 2,
        canvas.height / 2
    );

    gameOver = true;
}

update();
