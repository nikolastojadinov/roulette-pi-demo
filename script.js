/* ---------- Config (EU roulette, single zero) ---------- */
const NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13,
  36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14,
  31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];
const REDS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

/* ---------- Canvas setup ---------- */
const canvas = document.getElementById("wheel");
const ctx = canvas.getContext("2d");

// Retina crispy text on phones
const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
if (DPR !== 1) {
  canvas.width *= DPR; canvas.height *= DPR;
  ctx.scale(DPR, DPR);
}

const W = 700, H = 700;          // logical draw size (do not change)
const CX = W/2, CY = H/2;

const R_OUT         = Math.min(W,H) * 0.47;  // outer gold rim
const R_POCKETS_OUT = R_OUT * 0.88;
const R_POCKETS_IN  = R_OUT * 0.63;
const R_HUB_OUT     = R_OUT * 0.45;          // inner wood ring outer radius
const R_HUB_IN      = R_OUT * 0.18;          // brass spindle
const R_BALL        = R_OUT * 0.022;

const SLICE = (Math.PI * 2) / NUMBERS.length;
const TAU = Math.PI * 2;
const mod = (n, m) => ((n % m) + m) % m;

/* ---------- State ---------- */
let wheelAngle = 0;     // rad
let wheelSpeed = 0;     // rad/s
let spinning   = false;

let ballAngle  = -Math.PI/2; // start at pointer
let ballSpeed  = 0;
let ballRadius = (R_POCKETS_OUT + R_POCKETS_IN)/2;
let ballFalling = false;

/* ---------- UI refs ---------- */
const ui = {
  spin: document.getElementById("spinBtn"),
  reset: document.getElementById("resetBtn"),
  winNum: document.getElementById("winNumber"),
  winColor: document.getElementById("winColor"),
};

/* ---------- Helpers ---------- */
const colorFor = n => n === 0 ? "#1aa34a" : (REDS.has(n) ? "#cc2a2a" : "#111");

function draw(){
  ctx.clearRect(0,0,W,H);

  // outer gold rim
  const g = ctx.createRadialGradient(CX, CY, R_OUT*0.2, CX, CY, R_OUT);
  g.addColorStop(0, "#ffcf5a");
  g.addColorStop(0.6, "#e9b643");
  g.addColorStop(0.9, "#b57919");
  g.addColorStop(1, "#6e4710");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(CX, CY, R_OUT, 0, TAU);
  ctx.fill();

  // wooden track
  const wood = ctx.createRadialGradient(CX, CY, R_POCKETS_OUT*0.3, CX, CY, R_POCKETS_OUT);
  wood.addColorStop(0, "#c97925");
  wood.addColorStop(1, "#8b4f16");
  ctx.beginPath();
  ctx.fillStyle = wood;
  ctx.arc(CX, CY, R_POCKETS_OUT, 0, TAU);
  ctx.arc(CX, CY, R_POCKETS_IN, 0, TAU, true);
  ctx.closePath();
  ctx.fill();

  // rotating pocket ring (numbers + separators)
  ctx.save();
  ctx.translate(CX, CY);
  ctx.rotate(wheelAngle);

  for(let i=0;i<NUMBERS.length;i++){
    const start = -Math.PI/2 + i*SLICE;
    const mid   = start + SLICE/2;

    // colored pocket
    ctx.beginPath();
    ctx.fillStyle = colorFor(NUMBERS[i]);
    ctx.arc(0,0,R_POCKETS_OUT,start,start+SLICE);
    ctx.arc(0,0,R_POCKETS_IN,start+SLICE,start,true);
    ctx.closePath();
    ctx.fill();

    // separators
    ctx.strokeStyle = "rgba(255,255,255,.45)";
    ctx.lineWidth = Math.max(1, R_OUT*0.004);
    ctx.beginPath();
    ctx.moveTo(Math.cos(start)*R_POCKETS_OUT, Math.sin(start)*R_POCKETS_OUT);
    ctx.lineTo(Math.cos(start)*R_POCKETS_IN,  Math.sin(start)*R_POCKETS_IN);
    ctx.stroke();

    // number text
    ctx.save();
    ctx.rotate(mid);
    ctx.fillStyle = NUMBERS[i] === 0 ? "#0b1d0f" : "#f3f3f3";
    ctx.font = `${Math.floor(R_OUT*0.06)}px system-ui, Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.translate(0, (R_POCKETS_IN + R_POCKETS_OUT)/2);
    ctx.rotate(Math.PI/2);
    ctx.fillText(String(NUMBERS[i]), 0, 0);
    ctx.restore();
  }

  // inner wood ring (donut)
  ctx.beginPath();
  ctx.fillStyle = wood;
  ctx.arc(0,0,R_HUB_OUT,0,TAU);
  ctx.arc(0,0,R_HUB_IN,0,TAU,true);
  ctx.fill();

  // brass spindle
  const brass = ctx.createRadialGradient(0,0,R_HUB_IN*0.1,0,0,R_HUB_IN);
  brass.addColorStop(0, "#ffe39a");
  brass.addColorStop(0.7, "#d2a33a");
  brass.addColorStop(1, "#845d13");
  ctx.fillStyle = brass;
  ctx.beginPath();
  ctx.arc(0,0,R_HUB_IN,0,TAU);
  ctx.fill();

  ctx.restore();

  // ball
  ctx.save();
  ctx.translate(CX, CY);
  const r = ballFalling ? (R_POCKETS_IN + R_HUB_OUT)/2 : ballRadius;
  const x = Math.cos(ballAngle)*r;
  const y = Math.sin(ballAngle)*r;
  const bg = ctx.createRadialGradient(x-R_BALL*0.3, y-R_BALL*0.3, R_BALL*0.1, x, y, R_BALL);
  bg.addColorStop(0, "#fff7dd");
  bg.addColorStop(1, "#bba46b");
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(x,y,R_BALL,0,TAU);
  ctx.fill();
  ctx.restore();
}

/* ---------- Animation ---------- */
let last = performance.now();
function tick(now){
  const dt = Math.min(0.033, (now-last)/1000); // cap at ~30fps for big jumps
  last = now;

  if(spinning){
    wheelAngle = mod(wheelAngle + wheelSpeed*dt, TAU);
    wheelSpeed *= 0.995;          // friction

    ballAngle = mod(ballAngle - ballSpeed*dt, TAU); // opposite direction
    ballSpeed *= 0.992;

    if(!ballFalling && wheelSpeed < 0.8){
      ballFalling = true; // start falling later in the spin
    }
    if(ballFalling){
      ballRadius -= ((R_POCKETS_OUT + R_POCKETS_IN)/2 - (R_HUB_OUT*0.75)) * dt * 0.5;
      if(ballRadius < (R_POCKETS_IN + R_HUB_OUT)/2){
        ballRadius = (R_POCKETS_IN + R_HUB_OUT)/2;
      }
    }

    // stop and snap
    if(wheelSpeed < 0.15 && ballSpeed < 0.15){
      spinning = false;
      snapToWinning();
    }
  }

  draw();
  requestAnimationFrame(tick);
}

/* ---------- Spin / Reset ---------- */
function spin(){
  if(spinning) return;
  wheelSpeed = 6 + Math.random()*2;   // 6–8 rad/s
  ballSpeed  = 11 + Math.random()*3;  // 11–14 rad/s
  ballRadius = (R_POCKETS_OUT + R_POCKETS_IN)/2;
  ballFalling = false;
  spinning = true;

  ui.winNum.textContent = "…";
  ui.winColor.textContent = "…";
}

function reset(){
  spinning = false;
  wheelAngle = 0; wheelSpeed = 0;
  ballAngle = -Math.PI/2; ballSpeed = 0;
  ballRadius = (R_POCKETS_OUT + R_POCKETS_IN)/2;
  ballFalling = false;

  ui.winNum.textContent = "0";
  ui.winColor.textContent = "—";
  draw();
}

/* ---------- Determine winning pocket at the pointer (12 o'clock) ---------- */
function snapToWinning(){
  const pointer = -Math.PI/2;
  let bestIdx = 0, bestDist = 1e9;

  for(let i=0;i<NUMBERS.length;i++){
    const center = -Math.PI/2 + i*SLICE + wheelAngle + SLICE/2;
    const d = Math.abs(Math.atan2(Math.sin(center - pointer), Math.cos(center - pointer)));
    if(d < bestDist){ bestDist = d; bestIdx = i; }
  }

  const n = NUMBERS[bestIdx];
  const color = n === 0 ? "Zeleno" : (REDS.has(n) ? "Crveno" : "Crno");

  // snap ball to that pocket
  const centerAngle = -Math.PI/2 + bestIdx*SLICE + wheelAngle + SLICE/2;
  ballAngle = centerAngle;
  ballFalling = true;
  ballRadius = (R_POCKETS_IN + R_HUB_OUT)/2;

  ui.winNum.textContent = String(n);
  ui.winColor.textContent = color;
}

/* ---------- Wire up & start ---------- */
ui.spin.addEventListener("click", spin);
ui.reset.addEventListener("click", reset);

draw();
requestAnimationFrame(tick);
console.log("Roulette ready ✅");
