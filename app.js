/***** KONFIG *****/
const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const REDS=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const wedge=2*Math.PI/ORDER.length;

/***** CANVAS SETUP *****/
const wheel=document.getElementById('wheel');
const ball=document.getElementById('ball');
const ctx=wheel.getContext('2d');
const bctx=ball.getContext('2d');
let CX=0, CY=0, R_OUT=250, R_IN=95, R_TEXT=218, R_BALL=272;
let wheelAngle=0, spinning=false;

function setCanvas(size){
  [wheel,ball].forEach(c=>{ c.width=size; c.height=size; });
  CX=size/2; CY=size/2;
  R_OUT=size*0.45; R_IN=size*0.17; R_TEXT=size*0.40; R_BALL=size*0.49;
}
function resize(){
  const box=document.querySelector('.wheel-box');
  const w=box.getBoundingClientRect().width||360;
  const size=Math.floor(Math.max(300, Math.min(w-24, window.innerHeight*0.55, 860)));
  setCanvas(size); drawWheel(); drawBall(0);
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', ()=>setTimeout(resize,80));

/***** CRTANJE TOČKA *****/
function drawWheel(highlight=null){
  ctx.clearRect(0,0,wheel.width,wheel.height);

  // drveni prsten
  const gWood=ctx.createRadialGradient(CX,CY,R_OUT*0.6,CX,CY,R_OUT+20);
  gWood.addColorStop(0,'#6b3e1f'); gWood.addColorStop(1,'#3d2313');
  ctx.fillStyle=gWood; ctx.beginPath(); ctx.arc(CX,CY,R_OUT+20,0,2*Math.PI); ctx.fill();

  // polja
  for(let i=0;i<ORDER.length;i++){
    const n=ORDER[i], start=wheelAngle+i*wedge, end=start+wedge;
    ctx.beginPath(); ctx.moveTo(CX,CY);
    ctx.arc(CX,CY,R_OUT,start,end);
    ctx.arc(CX,CY,R_IN,end,start,true);
    ctx.closePath();
    ctx.fillStyle = n===0 ? '#0d9447' : (REDS.has(n)?'#b01919':'#111');
    ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.22)'; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(CX,CY,R_OUT,start,end); ctx.stroke();
  }

  // brojevi
  ctx.save(); ctx.translate(CX,CY);
  for(let i=0;i<ORDER.length;i++){
    const n=ORDER[i]; const ang=wheelAngle+i*wedge+wedge/2;
    ctx.save(); ctx.rotate(ang); ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle = n===0 ? '#bfffd0' : (REDS.has(n)?'#ffd2d2':'#f2f2f2');
    ctx.font=`bold ${Math.max(14, Math.floor(wheel.width*0.028))}px system-ui,-apple-system,Segoe UI,Roboto,sans-serif`;
    ctx.translate(0,-R_TEXT); ctx.rotate(-ang); ctx.fillText(String(n),0,0); ctx.restore();
  }
  ctx.restore();

  // poklopac
  const g=ctx.createRadialGradient(CX-12,CY-12,18,CX,CY,Math.max(60,R_IN+15));
  g.addColorStop(0,'#777'); g.addColorStop(0.6,'#333'); g.addColorStop(1,'#111');
  ctx.fillStyle=g; ctx.beginPath(); ctx.arc(CX,CY,R_IN,0,2*Math.PI); ctx.fill();

  // highlight pobedničkog polja
  if(highlight!=null){
    const idx=ORDER.indexOf(highlight);
    const ang=wheelAngle + idx*wedge + wedge/2;
    ctx.strokeStyle='rgba(255,235,130,.95)'; ctx.lineWidth=6;
    ctx.beginPath(); ctx.arc(CX,CY,R_OUT-6,ang-wedge/2+0.02,ang+wedge/2-0.02); ctx.stroke();
  }
}

/***** KUGLICA *****/
function drawBall(angle){
  bctx.clearRect(0,0,ball.width,ball.height);
  // senka
  bctx.fillStyle='rgba(0,0,0,.35)';
  bctx.beginPath();
  bctx.arc(CX+(R_BALL-6)*Math.sin(angle), CY-(R_BALL-6)*Math.cos(angle), Math.max(6,wheel.width*0.016), 0, 2*Math.PI);
  bctx.fill();
  // kuglica
  const bx=CX+R_BALL*Math.sin(angle), by=CY-R_BALL*Math.cos(angle);
  const gb=bctx.createRadialGradient(bx-3,by-3,2,bx,by,Math.max(9,wheel.width*0.02));
  gb.addColorStop(0,'#fff'); gb.addColorStop(0.6,'#ddd'); gb.addColorStop(1,'#999');
  bctx.fillStyle=gb; bctx.beginPath(); bctx.arc(bx,by,Math.max(7,wheel.width*0.018),0,2*Math.PI); bctx.fill();
}

function angleForNumber(n){ const idx=ORDER.indexOf(n); return -(idx*wedge) - wedge/2; }

/***** ANIMACIJA SPIN *****/
async function animateTo(n){
  if(spinning) return; spinning=true;
  const target=angleForNumber(n);
  const start=wheelAngle, turns=6*Math.PI*2; // višestruki krugovi
  const delta=(turns + (target - (start % (2*Math.PI))));
  const dur=5200, t0=performance.now();
  const ease=t=>1-Math.pow(1-t,3); // cubic-out

  function step(t){
    const p=Math.min(1,(t-t0)/dur), e=ease(p);
    wheelAngle=start + delta*e;
    const ballAng=start - (turns*(1-e)) - (target*e) - 0.4; // rotira suprotno
    drawWheel(p===1?n:null); drawBall(ballAng);
    if(p<1) requestAnimationFrame(step);
    else spinning=false;
  }
  requestAnimationFrame(step);
}

/***** TABELA (kratko – da radi odmah) *****/
const table=document.getElementById('table');
function buildTable(){
  const grid=document.createElement('div'); grid.className='grid'; table.appendChild(grid);
  const zero=cell('0','zero'); grid.appendChild(zero);

  for(let c=0;c<12;c++){
    const top = 3 + c*3, mid = 2 + c*3, bot = 1 + c*3;
    grid.appendChild(numCell(top)); grid.appendChild(numCell(mid)); grid.appendChild(numCell(bot));
  }
  for(let r=0;r<3;r++) grid.appendChild(cell('2to1','twotoone'));
  const doz=document.createElement('div'); doz.className='row-dozens';
  doz.append(cell('1st 12','label'), cell('2nd 12','label'), cell('3rd 12','label')); table.appendChild(doz);
  const out=document.createElement('div'); out.className='row-out';
  out.append(cell('1 - 18','label'), cell('Even','label'), cell('◈','label'), cell('Odd','label'), cell('19 - 36','label')); table.appendChild(out);
}
function numCell(v){ return cell(String(v), (REDS.has(v)?'red':'black')); }
function cell(text, cls=''){ const d=document.createElement('div'); d.className='cell '+cls; d.textContent=text; return d; }

/***** SPIN BTN *****/
document.getElementById('btnSpin').addEventListener('click', async ()=>{
  // demo RNG (posle se lako poveže na serverless /spin)
  const number = Math.floor(Math.random()*37);
  await animateTo(number);
});

/***** INIT *****/
buildTable(); resize(); drawWheel(); drawBall(0);
