export default class game12 extends Phaser.Scene {
    constructor(){
        super('Game12');
    }

/* ===================== Utilities ===================== */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rand  = (a, b) => Math.random() * (b - a) + a;
const choose = (arr) => arr[(Math.random() * arr.length) | 0];

/* ===================== Entities ===================== */
 FRUITS = [
  { name: "apple",  color: "#ef4444", r: 14, air: 15, ground: 8 },
  { name: "orange", color: "#f97316", r: 15, air: 14, ground: 7 },
  { name: "lemon",  color: "#facc15", r: 12, air: 16, ground: 8 },
  { name: "plum",   color: "#8b5cf6", r: 13, air: 18, ground: 9 },
  { name: "cherry", color: "#dc2626", r: 10, air: 20, ground: 10 },
];

class Fruit {
  constructor(c, level, groundY) {
    this.c = c;
    this.ctx = c.getContext("2d");
    Object.assign(this, choose(FRUITS));

    // Spawn under canopy (leave space near tree at right)
    const maxX = c.width - 120;
    this.x = rand(this.r, maxX);
    this.y = -rand(20, 80);
    this.vx = rand(-25, 25) * (0.25 + 0.03 * level);
    this.vy = rand(90, 120) * (0.9 + 0.06 * level);
    this.spin = rand(-1.4, 1.4);
    this.rot = rand(0, Math.PI * 2);

    this.state = "falling"; // falling | ground | spoiled | collected
    this.groundY = groundY;
    this.targetBug = null; // bug assigned after landing
  }

  update(dt) {
    if (this.state !== "falling") return;
    this.vy += 240 * dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.rot += this.spin * dt;

    if (this.x < this.r) { this.x = this.r; this.vx *= -0.9; }
    if (this.x > this.c.width - this.r) { this.x = this.c.width - this.r; this.vx *= -0.9; }

    if (this.y + this.r >= this.groundY) {
      this.y = this.groundY - this.r;
      this.vx = 0; this.vy = 0;
      this.state = "ground";
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot);
    ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fillStyle = this.color; ctx.fill();
    // highlight
    ctx.beginPath(); ctx.arc(-this.r * 0.35, -this.r * 0.35, this.r * 0.33, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,.25)"; ctx.fill();
    // stem + leaf
    ctx.fillStyle = "#0b5d1e"; ctx.fillRect(-2, -this.r - 6, 4, 7);
    ctx.beginPath(); ctx.ellipse(6, -this.r - 4, 8, 4, Math.PI / 6, 0, Math.PI * 2);
    ctx.fillStyle = "#22c55e"; ctx.fill();
    ctx.restore();

    if (this.state === "spoiled") {
      ctx.save(); ctx.strokeStyle = "rgba(239,68,68,.9)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(this.x - this.r, this.y - this.r); ctx.lineTo(this.x + this.r, this.y + this.r); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(this.x + this.r, this.y - this.r); ctx.lineTo(this.x - this.r, this.y + this.r); ctx.stroke();
      ctx.restore();
    }
  }

  rect() { return { x: this.x - this.r, y: this.y - this.r, w: this.r * 2, h: this.r * 2 }; }
}

class Bug {
  constructor(c, fruit, level, groundY) {
    this.c = c; this.ctx = c.getContext("2d");
    this.target = fruit; this.alive = true;
    this.y = groundY - 6; // hover slightly above ground
    this.x = (fruit.x < c.width / 2) ? -20 : c.width + 20; // nearest edge
    this.speed = 50 + level * 12;
    this.phase = 0; // leg wiggle
    this.w = 14; this.h = 8;
  }

  update(dt) {
    if (!this.alive) return;
    if (!this.target || this.target.state !== "ground") { this.alive = false; return; }
    const dir = Math.sign(this.target.x - this.x) || 1;
    this.x += dir * this.speed * dt;
    this.phase += 12 * dt;

    if (Math.abs(this.x - this.target.x) <= (this.target.r - 1)) {
      this.target.state = "spoiled";
      this.alive = false;
    }
  }

  draw() {
    if (!this.alive) return;
    const ctx = this.ctx;
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.fillStyle = "#111827";
    ctx.beginPath(); ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-6, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#f43f5e"; ctx.fillRect(-2, -2, 4, 4);
    // legs
    ctx.strokeStyle = "rgba(255,255,255,.25)"; ctx.lineWidth = 1.5;
    const k = Math.sin(this.phase) * 3;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(2 * i, 2);  ctx.lineTo(2 * i + 6,  6 + k);  ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2 * i,-2);  ctx.lineTo(2 * i + 6, -6 - k); ctx.stroke();
    }
    ctx.restore();
  }
}

class Basket {
  constructor(c, groundY) {
    this.c = c; this.ctx = c.getContext("2d");
    this.w = 120; this.h = 26;
    this.x = (c.width - this.w) / 2;
    this.y = groundY - 34;
    this.speed = 420; this.moveDir = 0; this.targetX = this.x;
  }

  update(dt) {
    if (this.moveDir) this.x += this.moveDir * this.speed * dt;
    else this.x += (this.targetX - this.x) * Math.min(1, 12 * dt);
    this.x = clamp(this.x, 0, this.c.width - this.w);
  }

  draw() {
    const ctx = this.ctx; ctx.save(); ctx.translate(this.x, this.y);
    ctx.fillStyle = "#b45309"; ctx.fillRect(0, 0, this.w, this.h);
    ctx.fillStyle = "#92400e"; ctx.fillRect(-6, -6, this.w + 12, 10);
    ctx.strokeStyle = "rgba(0,0,0,.25)"; ctx.lineWidth = 2;
    for (let i = 6; i < this.w; i += 12) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i - 8, this.h); ctx.stroke();
    }
    ctx.restore();
  }

  rect() { return { x: this.x, y: this.y - 6, w: this.w, h: this.h + 6 }; }
}

/* ===================== Game ===================== */
class Game {
  constructor(canvas) {
    this.c = canvas; this.ctx = canvas.getContext("2d");
    this.hud = {
      score: document.getElementById("score"),
      lives: document.getElementById("lives"),
      level: document.getElementById("level"),
      grounded: document.getElementById("grounded"),
    };
    this.groundH = 90;
    this.groundY = this.c.height - this.groundH + 10;

    this.bindInput();
    this.reset(true);
    this.drawTitle();
  }

  bindInput() {
    window.addEventListener("keydown", (e) => {
      const k = e.key.toLowerCase();
      if (k === "arrowleft" || k === "a") { this.basket.moveDir = -1; e.preventDefault(); }
      if (k === "arrowright" || k === "d") { this.basket.moveDir =  1; e.preventDefault(); }
      if (k === "p") this.paused = !this.paused;
      if (k === " " || k === "enter") this.start();
    });
    window.addEventListener("keyup", (e) => {
      const k = e.key.toLowerCase();
      if ((k === "arrowleft"  || k === "a") && this.basket.moveDir < 0) this.basket.moveDir = 0;
      if ((k === "arrowright" || k === "d") && this.basket.moveDir > 0) this.basket.moveDir = 0;
    });
    this.c.addEventListener("mousemove", (e) => {
      const r = this.c.getBoundingClientRect();
      const mx = (e.clientX - r.left) * (this.c.width / r.width);
      this.basket.targetX = clamp(mx - this.basket.w / 2, 0, this.c.width - this.basket.w);
    });
  }

  reset(hard = false) {
    this.basket = new Basket(this.c, this.groundY);
    this.fruits = [];
    this.bugs = [];

    this.spawnTimer = 0;  this.spawnEvery = 1.05;
    this.level = 1;       this.levelTimer = 0;
    this.score = 0;       this.lives = 3;
    this.running = false; this.paused = false;
    if (hard) this.last = performance.now();
    this.updateHud();
  }

  start() {
    if (!this.running) {
      this.running = true; this.paused = false;
      this.last = performance.now();
      this.loop();
    }
  }

  loop() {
    if (!this.running) return;
    const now = performance.now();
    const dt = Math.min(0.033, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused) { this.update(dt); this.render(); }
    requestAnimationFrame(() => this.loop());
  }

  update(dt) {
    // level ramp
    this.levelTimer += dt;
    if (this.levelTimer >= 12) {
      this.levelTimer = 0; this.level += 1;
      this.spawnEvery = Math.max(0.4, this.spawnEvery * 0.9);
      this.updateHud();
    }

    // spawns
    this.spawnTimer += dt;
    if (this.spawnTimer >= this.spawnEvery) {
      this.spawnTimer = 0;
      this.fruits.push(new Fruit(this.c, this.level, this.groundY));
    }

    // entities
    this.basket.update(dt);
    for (const f of this.fruits) f.update(dt);

    // grounded fruit → spawn bugs
    for (const f of this.fruits) {
      if (f.state === "ground" && !f.targetBug) {
        const bug = new Bug(this.c, f, this.level, this.groundY);
        f.targetBug = bug; this.bugs.push(bug);
      }
    }
    for (const b of this.bugs) b.update(dt);

    // catches / pickups
    const br = this.basket.rect();
    for (const f of this.fruits) {
      if (f.state !== "falling" && f.state !== "ground") continue;
      const cx = clamp(f.x, br.x, br.x + br.w);
      const cy = clamp(f.y, br.y, br.y + br.h);
      const dx = f.x - cx, dy = f.y - cy;
      const hit = dx * dx + dy * dy <= f.r * f.r;
      if (hit) {
        const pts = (f.state === "falling")
          ? f.air + Math.floor(this.level * 0.5)
          : f.ground + Math.floor(this.level * 0.3);
        this.score += pts;
        if (f.targetBug) f.targetBug.alive = false;
        f.state = "collected";
        this.updateHud();
      }
    }

    // spoiled → lose lives
    let lost = false;
    for (const f of this.fruits) {
      if (f.state === "spoiled") {
        f.state = "removed";
        this.lives -= 1; lost = true;
      }
    }
    if (lost) {
      this.updateHud(true);
      if (this.lives <= 0) { this.gameOver(); return; }
    }

    // prune
    this.fruits = this.fruits.filter(f => !["collected", "removed"].includes(f.state));
    this.bugs   = this.bugs.filter(b => b.alive);
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.c.width, this.c.height);

    // ground band
    const gTop = this.c.height - this.groundH;
    const grd = ctx.createLinearGradient(0, gTop, 0, this.c.height);
    grd.addColorStop(0, "#145214"); grd.addColorStop(1, "#0b3d0b");
    ctx.fillStyle = grd; ctx.fillRect(0, gTop, this.c.width, this.c.height - gTop);

    // tree on right
    ctx.fillStyle = "#4b2e12"; ctx.fillRect(this.c.width - 96, gTop - 130, 30, 130);
    const cx = this.c.width - 80, cy = gTop - 170;
    ctx.fillStyle = "#166534";
    [60, 50, 46, 42, 40].forEach((r, i) => {
      ctx.beginPath();
      ctx.arc(cx + (i - 2) * 24, cy + (i % 2 ? 16 : -2), r, 0, Math.PI * 2);
      ctx.fill();
    });

    // entities
    for (const f of this.fruits) f.draw();
    for (const b of this.bugs) b.draw();
    this.basket.draw();

    // HUD derived
    document.getElementById("grounded").textContent =
      this.fruits.filter(f => f.state === "ground").length;

    if (this.paused) this.overlay("Paused");
  }

  overlay(text) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,.45)";
    ctx.fillRect(0, 0, this.c.width, this.c.height);
    ctx.fillStyle = "#ffffff";
    ctx.font = "700 40px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, this.c.width / 2, this.c.height / 2);
    ctx.restore();
  }

  drawTitle() {
    this.render();
    this.overlay("Press Space to Start");
  }

  updateHud(flash = false) {
    this.hud.score.textContent = this.score;
    this.hud.lives.textContent = this.lives;
    this.hud.level.textContent = this.level;
    if (flash) {
      this.hud.lives.style.color = "#ef4444";
      setTimeout(() => (this.hud.lives.style.color = ""), 180);
    }
  }

  gameOver() {
    this.running = false;
    this.overlay(`Game Over — Score: ${this.score}`);
  }
}

/* ===================== Boot & HiDPI Fit ===================== */
const canvas = document.getElementById("game");
function fitCanvasToDisplaySize() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
  }
}
new ResizeObserver(() => { fitCanvasToDisplaySize(); game?.render(); }).observe(canvas);
fitCanvasToDisplaySize();
const game = new Game(canvas);

}