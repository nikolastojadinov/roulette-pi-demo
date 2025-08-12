/* Pi Roulette logic (European) */
const GOLD = '#F3B73C';
const PURPLE = '#5A2D82';
const GREEN = '#0aa84f';

// European wheel order (0..36 clockwise).
const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];

// Color map (gold replaces red, purple replaces black)
function colorOf(n){
  if(n===0) return 'green';
  const redSet = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
  return redSet.has(n) ? 'gold' : 'purple';
}

let bankroll = 1000;
let bets = {}; // { key: amount }
const chipSel = document.getElementById('chip');
const bankrollEl = document.getElementById('bankroll');
const totalBetEl = document.getElementById('totalBet');
const lastNumberEl = document.getElementById('lastNumber');
const lastColorEl = document.getElementById('lastColor');
const lastPayoutEl = document.getElementById('lastPayout');

// Build number grid 3 rows x 12 cols + 0 column
const grid = document.getElementById('numberGrid');
(function buildGrid(){
  // 0 column (spans 3 rows)
  const zero = document.createElement('div');
  zero.className = 'cell zero';
  zero.textContent = '0';
  zero.dataset.key = 'n0';
  zero.style.gridRow = '1 / span 3';
  grid.appendChild(zero);

  // numbers 1..36 arranged in 3 rows
  for(let r=0;r<3;r++){
    for(let c=1;c<=12;c++){
      const n = (c-1)*3 + (3-r); // classic layout
      const cell = document.createElement('div');
      cell.className = 'cell';
      const col = colorOf(n);
      if(col!=='green'){
        cell.dataset.color = col;
      }
      cell.textContent = String(n);
      cell.dataset.key = 'n'+n;
      grid.appendChild(cell);
    }
  }
})();

function addBet(key, amount){
  if(bankroll < amount) return;
  bankroll -= amount;
  bets[key] = (bets[key]||0) + amount;
  renderBets();
}

function clearBets(){
  // refund
  let refunded = 0;
  for(const k in bets){ refunded += bets[k];}
  bankroll += refunded;
  bets = {};
  renderBets();
}

function renderBets(){
  bankrollEl.textContent = bankroll.toString();
  totalBetEl.textContent = Object.values(bets).reduce((a,b)=>a+b,0);
  // reset stake bubbles
  document.querySelectorAll('.cell').forEach(el=>{
    el.querySelectorAll('.stake').forEach(s=>s.remove());
  });
  // render number stakes
  for(const [k,amt] of Object.entries(bets)){
    if(k.startsWith('n')){
      const el = [...document.querySelectorAll('.cell')].find(e=>e.dataset.key===k);
      if(el){
        const b = document.createElement('div');
        b.className = 'stake';
        b.textContent = amt;
        el.appendChild(b);
      }
    }
  }
}

grid.addEventListener('click', (e)=>{
  const cell = e.target.closest('.cell');
  if(!cell) return;
  const key = cell.dataset.key;
  addBet(key, parseInt(chipSel.value,10));
});

document.getElementById('clearBets').addEventListener('click', clearBets);

// outside bets
document.querySelector('.outside-bets').addEventListener('click', (e)=>{
  const btn = e.target.closest('button.bet');
  if(!btn) return;
  addBet(btn.dataset.bet, parseInt(chipSel.value,10));
});

// Canvas wheel drawing & spin
const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const center = {x: canvas.width/2, y: canvas.height/2};
const radius = canvas.width*0.47;
const pocketAngle = (Math.PI*2)/WHEEL_ORDER.length;

function drawWheel(angle=0){
  ctx.clearRect(0,0,canvas.width, canvas.height);

  // outer ring
  ctx.save();
  ctx.translate(center.x, center.y);
  ctx.rotate(angle);

  for(let i=0;i<WHEEL_ORDER.length;i++){
    const start = i*pocketAngle;
    const end = start + pocketAngle;
    const n = WHEEL_ORDER[i];
    const col = colorOf(n);
    ctx.beginPath();
    ctx.moveTo(0,0);
    ctx.arc(0,0,radius,start,end);
    ctx.closePath();
    ctx.fillStyle = (col==='gold') ? GOLD : (col==='purple'? PURPLE : GREEN);
    ctx.fill();
    ctx.strokeStyle = '#00000099';
    ctx.lineWidth = 1;
    ctx.stroke();

    // label
    ctx.save();
    ctx.rotate(start + pocketAngle/2);
    ctx.translate(radius*0.82, 0);
    ctx.rotate(Math.PI/2);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 18px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText(String(n), 0, 6);
    ctx.restore();
  }

  // hub
  const grad = ctx.createRadialGradient(0,0,10,0,0,radius*0.45);
  grad.addColorStop(0,'#ffdf8a');
  grad.addColorStop(1,'#c28e16');
  ctx.beginPath();
  ctx.arc(0,0,radius*0.45,0,Math.PI*2);
  ctx.fillStyle = grad;
  ctx.fill();

  // pointer
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(center.x, center.y - radius - 4);
  ctx.lineTo(center.x-14, center.y - radius + 26);
  ctx.lineTo(center.x+14, center.y - radius + 26);
  ctx.closePath();
  ctx.fillStyle = '#fff';
  ctx.fill();
}

drawWheel();

function spin(){
  if(Object.values(bets).reduce((a,b)=>a+b,0)===0){
    alert('Place a bet first.');
    return;
  }
  // pick a winning number first
  const winningIndex = Math.floor(Math.random()*WHEEL_ORDER.length);
  const winningNumber = WHEEL_ORDER[winningIndex];

  // compute target rotation so that winningIndex ends at 12 o'clock (pointer)
  const targetAngle = (Math.PI/2) - (winningIndex * pocketAngle); // pointer at top
  const extraSpins = 6 + Math.floor(Math.random()*4); // 6-9 extra spins
  const startAngle = 0;
  const endAngle = targetAngle + extraSpins*2*Math.PI;

  const duration = 4000;
  const startTime = performance.now();

  function easeOutCubic(t){ return 1 - Math.pow(1-t,3); }

  function animate(now){
    const p = Math.min(1, (now - startTime)/duration);
    const eased = easeOutCubic(p);
    const angle = startAngle + (endAngle - startAngle)*eased;
    drawWheel(angle);
    if(p<1){
      requestAnimationFrame(animate);
    }else{
      settle(winningNumber);
    }
  }
  requestAnimationFrame(animate);
}

document.getElementById('spin').addEventListener('click', spin);

// Payouts
function numbersInColumn(col){ // 1..3
  const arr=[];
  for(let n=col; n<=36; n+=3) arr.push(n);
  return arr;
}

function evaluate(winning){
  let payout = 0;

  // Straight numbers
  for(const [k,amt] of Object.entries(bets)){
    if(k.startsWith('n')){
      const n = parseInt(k.slice(1),10);
      if(n===winning) payout += amt * 35;
    }
  }

  // Dozens
  if(bets['1st12']) if(winning>=1 && winning<=12) payout += bets['1st12'] * 2;
  if(bets['2nd12']) if(winning>=13 && winning<=24) payout += bets['2nd12'] * 2;
  if(bets['3rd12']) if(winning>=25 && winning<=36) payout += bets['3rd12'] * 2;

  // Columns
  const col1 = numbersInColumn(1);
  const col2 = numbersInColumn(2);
  const col3 = numbersInColumn(3);
  if(bets['col1'] && col1.includes(winning)) payout += bets['col1'] * 2;
  if(bets['col2'] && col2.includes(winning)) payout += bets['col2'] * 2;
  if(bets['col3'] && col3.includes(winning)) payout += bets['col3'] * 2;

  // Even money (exclude 0)
  if(winning!==0){
    if(bets['even'] && winning%2===0) payout += bets['even'] * 1;
    if(bets['odd'] && winning%2===1) payout += bets['odd'] * 1;
    if(bets['1to18'] && winning>=1 && winning<=18) payout += bets['1to18'] * 1;
    if(bets['19to36'] && winning>=19 && winning<=36) payout += bets['19to36'] * 1;

    const c = colorOf(winning);
    if(bets['gold'] && c==='gold') payout += bets['gold'] * 1;
    if(bets['purple'] && c==='purple') payout += bets['purple'] * 1;
  }

  return payout;
}

function settle(winning){
  const payout = evaluate(winning);
  bankroll += payout;
  lastNumberEl.textContent = winning;
  const c = colorOf(winning);
  lastColorEl.textContent = c.toUpperCase();
  lastColorEl.style.color = (c==='gold'? GOLD : (c==='purple'? PURPLE : GREEN));
  lastPayoutEl.textContent = payout - Object.values(bets).reduce((a,b)=>a+b,0);
  bets = {};
  renderBets();
}

// Initialize outside bet button mapping for columns to hover hints
(function labelColumns(){
  const outs = document.querySelector('.outside-bets');
  const [c1,c2,c3] = outs.querySelectorAll('[data-bet^="col"]');
  c1.textContent = '2 to 1 (col 1)';
  c2.textContent = '2 to 1 (col 2)';
  c3.textContent = '2 to 1 (col 3)';
})();
