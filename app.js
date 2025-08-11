// — KONSTANTE —
const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const wedge=2*Math.PI/ORDER.length;

// — CANVAS —
const cv=document.getElementById('wheel'), ctx=cv.getContext('2d');
const cb=document.getElementById('ball'), c2=cb.getContext('2d');
let CX=0, CY=0, R_OUT=250, R_IN=95, R_TEXT=220, R_BALL=270;
let wheelAngle=0, spinning=false;

// responsive dimenzije točka
function setCanvasSize(size){
  [cv,cb].forEach(c=>{ c.width=size; c.height=size; });
  CX=cv.width/2; CY=cv.height/2;
  R_OUT=Math.floor(size*0.45);
  R_IN =Math.floor(size*0.17);
  R_TEXT=Math.floor(size*0.40);
  R_BALL=Math.floor(size*0.49);
}
function resizeWheel(){
  const box=document.querySelector('.wheel-box');
  const size=Math.max(320, Math.min(box.clientWidth-20, window.innerHeight*0.45, 860));
  setCanvasSize(size); drawWheel(); drawBall(0);
}
window.addEventListener('resize', resizeWheel);
window.addEventListener('orientationchange', ()=>setTimeout(resizeWheel,80));

// crtanje točka
function drawWheel(highlight=null){
  ctx.clearRect(0,0,cv.width,cv.height);
  const gWood=ctx.createRadialGradient(CX,CY,R_OUT*0.6,CX,CY,R_OUT+22);
  gWood.addColorStop(0,'#6c4223'); gWood.addColorStop(1,'#3f2616');
  ctx.fillStyle=gWood; ctx.beginPath(); ctx.arc(CX,CY,R_OUT+22,0,Math.PI*2); ctx.fill();

  for(let i=0;i<ORDER.length;i++){
    const n=ORDER[i], start=wheelAngle+i*wedge, end=start+wedge;
    ctx.beginPath(); ctx.moveTo(CX,CY);
    ctx.arc(CX,CY,R_OUT,start,end); ctx.arc(CX,CY,R_IN,end,start,true); ctx.closePath();
    ctx.fillStyle = n===0 ? '#12b767' : (REDS.has(n) ? '#c62828' : '#141414'); ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(CX,CY,R_OUT,start,end); ctx.stroke();
  }
  // numbers
  ctx.save(); ctx.translate(CX,CY);
  for(let i=0;i<ORDER.length;i++){
    const n=ORDER[i]; const ang=wheelAngle+i*wedge+wedge/2;
    ctx.save(); ctx.rotate(ang); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = n===0 ? '#9dff9d' : (REDS.has(n)?'#ff7a7a':'#efefef');
    ctx.font=`bold ${Math.max(13, Math.floor(cv.width*0.028))}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;
    ctx.translate(0,-R_TEXT); ctx.rotate(-ang); ctx.fillText(String(n),0,0); ctx.restore();
  }
  ctx.restore();

  // hub
  const g=ctx.createRadialGradient(CX-12,CY-12,18,CX,CY,Math.max(60, R_IN+15));
  g.addColorStop(0,'#777'); g.addColorStop(0.6,'#333'); g.addColorStop(1,'#111');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(CX,CY,R_IN,0,Math.PI*2); ctx.fill();

  // highlight pobednika
  if(highlight!=null){
    const idx=ORDER.indexOf(highlight);
    const ang=wheelAngle + idx*wedge + wedge/2;
    ctx.strokeStyle='rgba(255,235,130,.95)'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.arc(CX,CY,R_OUT-6,ang-wedge/2+0.02,ang+wedge/2-0.02); ctx.stroke();
  }
}
function drawBall(angle){
  c2.clearRect(0,0,cb.width,cb.height);
  c2.fillStyle='rgba(0,0,0,.35)';
  c2.beginPath(); c2.arc(CX+(R_BALL-6)*Math.sin(angle), CY-(R_BALL-6)*Math.cos(angle), Math.max(6,cv.width*0.016), 0, Math.PI*2); c2.fill();
  const bx=CX+R_BALL*Math.sin(angle), by=CY-R_BALL*Math.cos(angle);
  const gb=c2.createRadialGradient(bx-3,by-3,2,bx,by,Math.max(9,cv.width*0.02));
  gb.addColorStop(0,'#fff'); gb.addColorStop(0.6,'#ddd'); gb.addColorStop(1,'#999');
  c2.fillStyle=gb; c2.beginPath(); c2.arc(bx,by,Math.max(7,cv.width*0.018),0,Math.PI*2); c2.fill();
}
function angleForNumber(n){ const idx=ORDER.indexOf(n); return -(idx*wedge) - wedge/2; }
async function animateTo(n){
  if(spinning) return; spinning=true; toast('Spinning...');
  const target=angleForNumber(n);
  const start=wheelAngle, turns=6*Math.PI*2;
  const delta=(turns + (target - (start % (Math.PI*2))));
  const dur=5200, t0=performance.now();
  const ease=t=>1-Math.pow(1-t,3);
  function step(t){
    const p=Math.min(1,(t-t0)/dur), e=ease(p);
    wheelAngle=start + delta*e;
    const ballAng=start - (turns*(1-e)) - (target*e) - 0.4;
    drawWheel(p===1?n:null); drawBall(ballAng);
    if(p<1) requestAnimationFrame(step); else { spinning=false; toast('Result: '+n); }
  }
  requestAnimationFrame(step);
}

// — STO & OPKLADE —
const table=document.getElementById('table');
let currentChip=1, balance=100, totalBet=0;
const placed=[];

function money(x){ return '£'+x.toFixed(2); }
function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'), 900); }
function updateFooter(){ document.getElementById('balance').textContent=money(balance); document.getElementById('total').textContent=money(totalBet); }

// ispravan raspored brojeva na stolu
function buildTable(){
  const grid=document.createElement('div'); grid.className='grid'; table.appendChild(grid);

  // kolona 0 (vertikalno 3 reda)
  const zero=cell('0','zero'); zero.dataset.bet=JSON.stringify({betType:'number',selection:0}); grid.appendChild(zero);

  // 12 kolona × 3 reda
  for(let c=0;c<12;c++){
    const top   = 3 + c*3;
    const mid   = 2 + c*3;
    const bottom= 1 + c*3;

    grid.appendChild(numCell(top));
    grid.appendChild(numCell(mid));
    grid.appendChild(numCell(bottom));
  }

  // desno "2to1" za svaku vrstu (3 reda)
  for(let r=0;r<3;r++){
    const d=cell('2to1','twoToOne'); d.dataset.bet=JSON.stringify({betType:'column', selection:r+1});
    grid.appendChild(d);
  }

  // DOZENS (ispod – preko 12 kolona)
  const rowDoz=document.createElement('div'); rowDoz.className='row-dozens';
  const d1=cell('1st 12','label'), d2=cell('2nd 12','label'), d3=cell('3rd 12','label');
  d1.dataset.bet=JSON.stringify({betType:'dozen',selection:1});
  d2.dataset.bet=JSON.stringify({betType:'dozen',selection:2});
  d3.dataset.bet=JSON.stringify({betType:'dozen',selection:3});
  // svaka zauzima 4 "broj" kolone
  d1.style.gridColumn='span 4'; d2.style.gridColumn='span 4'; d3.style.gridColumn='span 4';
  rowDoz.append(d1,d2,d3);
  table.appendChild(rowDoz);

  // OUTSIDE
  const out=document.createElement('div'); out.className='row-outside';
  const low =cell('1 - 18','label'); low.dataset.bet=JSON.stringify({betType:'lowHigh',selection:'low'}); low.style.gridColumn='span 2';
  const even=cell('Even','label'); even.dataset.bet=JSON.stringify({betType:'evenOdd',selection:'even'}); even.style.gridColumn='span 2';
  const diamond=cell('◈','label diamond'); diamond.style.gridColumn='span 4';
  const odd =cell('Odd','label'); odd.dataset.bet=JSON.stringify({betType:'evenOdd',selection:'odd'}); odd.style.gridColumn='span 2';
  const high=cell('19 - 36','label'); high.dataset.bet=JSON.stringify({betType:'lowHigh',selection:'high'}); high.style.gridColumn='span 2';
  out.append(low,even,diamond,odd,high);
  table.appendChild(out);

  // delegacija klika
  table.addEventListener('click', e=>{
    const el=e.target.closest('.cell'); if(!el || !el.dataset.bet) return;
    placeChip(el, JSON.parse(el.dataset.bet));
  });
}
function numCell(v){ const d=cell(String(v), (REDS.has(v)?'red':'black')); d.dataset.bet=JSON.stringify({betType:'number',selection:v}); return d; }
function cell(text, cls=''){ const d=document.createElement('div'); d.className='cell '+cls; d.textContent=text; return d; }

function placeChip(el, bet){
  const stake=Number(currentChip); if(balance<stake){ toast('No balance'); return; }
  balance -= stake; totalBet += stake; updateFooter();
  const chip=document.createElement('div'); chip.className='chip chip-sm'; chip.textContent=stake; el.appendChild(chip);
  placed.push({bet, stake, el, chip});
}
function clearBets(){ placed.splice(0).forEach(p=>p.chip.remove()); totalBet=0; updateFooter(); }
function undoBet(){ const p=placed.pop(); if(!p) return; p.chip.remove(); balance+=p.stake; totalBet-=p.stake; updateFooter(); }

// izbor žetona
document.querySelectorAll('.chips .chip').forEach(ch=>{
  ch.addEventListener('click',()=>{
    document.querySelectorAll('.chips .chip').forEach(x=>x.classList.remove('active'));
    ch.classList.add('active'); currentChip=Number(ch.dataset.chip);
  });
});
document.querySelector('.chips .chip[data-chip="1"]').classList.add('active');

// Netlify spin API (GET bez opklada; POST sa opkladama)
async function callSpin(bets){
  const body = bets && bets.length
    ? (bets.length===1 ? {...bets[0].bet, stake:bets[0].stake}
       : {bets: bets.map(p=>({...p.bet, stake:p.stake}))})
    : null;
  const res = await fetch('/.netlify/functions/spin', {
    method: body ? 'POST' : 'GET',
    headers:{'Content-Type':'application/json'},
    body: body ? JSON.stringify(body) : undefined
  });
  return await res.json();
}

// dugmad
document.getElementById('btnClear').addEventListener('click', ()=>{ clearBets(); toast('Cleared'); });
document.getElementById('btnUndo').addEventListener('click', ()=>{ undoBet(); });
document.getElementById('btnSpin').addEventListener('click', async ()=>{
  try{
    const data=await callSpin(placed);
    const r=data.result||{};
    await animateTo(r.number ?? 0);
    let profit = (data.totals && typeof data.totals.profit==='number') ? data.totals.profit : 0;
    if(!data.totals && Array.isArray(data.bets)){ data.bets.forEach(b=> profit += (b.profit||0)); }
    balance += totalBet + profit;
    totalBet=0; placed.splice(0); document.querySelectorAll('.cell .chip-sm').forEach(n=>n.remove());
    updateFooter();
  }catch(e){ toast('Error'); console.error(e); }
});

// INIT
buildTable(); updateFooter(); resizeWheel();
