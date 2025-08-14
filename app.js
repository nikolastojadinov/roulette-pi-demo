/* ================== Purple/Gold Roulette – Mobile Optimized ================== */

/* European wheel order; Purple==former Red, Gold==former Black */
const ORDER = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const PURPLE = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const GOLD   = new Set(Array.from({length:36},(_,i)=>i+1).filter(n=>!PURPLE.has(n)));

const SWEEP = 360 / ORDER.length;
const BALL_ANGLE = 0; // ball is visually at the right-side of the wheel

/* ---------- element refs ---------- */
const wheel   = document.getElementById('wheel');
const wheelSvg= document.getElementById('wheelSvg');
const orbit   = document.getElementById('orbit');
const ball    = document.getElementById('ball');
const spinBtn = document.getElementById('spinBtn') || document.getElementById('spin'); // support either id
const badge   = document.getElementById('badge');
const lastEl  = document.getElementById('last');
const board   = document.getElementById('board');
const chips   = document.getElementById('chips');
const balEl   = document.getElementById('bal');

/* ---------- util ---------- */
const norm = a => (a%=360, a<0?a+360:a);
const pocketMid = idx => (idx + 0.5) * SWEEP - 90;
const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

/* ---------- build wheel (SVG) ---------- */
(function buildWheel(){
  const cx=50,cy=50,rO=49,rI=32,rT=41;
  const css = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  function polar(r,a){const rad=a*Math.PI/180;return{x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}}
  function ann(r0,r1,a0,a1){const p1=polar(r1,a0),p2=polar(r1,a1),p3=polar(r0,a1),p4=polar(r0,a0);const la=(a1-a0)<=180?0:1;
    return `M ${p1.x} ${p1.y} A ${r1} ${r1} 0 ${la} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r0} ${r0} 0 ${la} 0 ${p4.x} ${p4.y} Z`;}
  ORDER.forEach((n,i)=>{
    const a0=i*SWEEP-90,a1=a0+SWEEP,mid=(a0+a1)/2;
    const fill = n===0 ? css('--zero') : (PURPLE.has(n)? css('--purple') : css('--gold'));
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',ann(rI,rO,a0,a1)); p.setAttribute('fill',fill); p.setAttribute('stroke','#000'); p.setAttribute('stroke-width','0.25');
    wheelSvg.appendChild(p);
    const t=document.createElementNS('http://www.w3.org/2000/svg','text'); const pos=polar(rT,mid);
    t.setAttribute('x',pos.x); t.setAttribute('y',pos.y+2); t.setAttribute('text-anchor','middle');
    t.setAttribute('font-size','4.2'); t.setAttribute('font-weight','800'); t.setAttribute('transform',`rotate(${mid+90},${pos.x},${pos.y})`);
    t.setAttribute('fill', n===0 ? '#e6fff4' : (PURPLE.has(n)? '#fff' : '#2a2207')); t.textContent=n; wheelSvg.appendChild(t);
  });
})();

/* ---------- build number board ---------- */
const cells = {};
(function buildBoard(){
  if(!board) return;
  for(let col=0; col<12; col++){
    for(let r=2; r>=0; r--){
      const n = col*3 + (3-r);
      const d = document.createElement('div');
      d.className = `cell ${n===0?'zero':(PURPLE.has(n)?'purple':'gold')}`;
      d.textContent = n;
      d.dataset.type='straight'; d.dataset.num=n;
      board.appendChild(d);
      cells[`n:${n}`]=d;
    }
  }
  // map outside buttons that exist
  document.querySelectorAll('.outside').forEach(el=>{
    const t=el.dataset; let key='';
    if(t.color) key=`c:${t.color}`;
    else if(t.eo) key=`e:${t.eo}`;
    else if(t.lh) key=`l:${t.lh}`;
    else if(t.dozen) key=`d:${t.dozen}`;
    else if(t.col) key=`col:${t.col}`;
    if(key) cells[key]=el;
  });
})();

/* ---------- betting state ---------- */
let balance=1000, chip=10, bets={}, undo=[], lastBets={};
function updateBal(){ if(balEl) balEl.textContent = balance.toFixed(0); }
updateBal();

chips?.addEventListener('click',e=>{
  const c=e.target.closest('.chip'); if(!c) return;
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));
  c.classList.add('sel'); chip=parseInt(c.dataset.v,10);
});

function keyFor(el){ const t=el.dataset;
  if(t.num!==undefined) return `n:${t.num}`;
  if(t.color) return `c:${t.color}`;
  if(t.eo) return `e:${t.eo}`;
  if(t.lh) return `l:${t.lh}`;
  if(t.dozen) return `d:${t.dozen}`;
  if(t.col) return `col:${t.col}`;
  return '';
}
function addBadge(el,amt){ let b=el.querySelector('.bet-badge'); if(!b){b=document.createElement('div');b.className='bet-badge';el.appendChild(b)} b.textContent=amt }
function clearBadges(){ Object.values(cells).forEach(el=>{ const b=el?.querySelector?.('.bet-badge'); if(b) b.remove(); }); }

document.addEventListener('click', e=>{
  const el=e.target.closest('.cell,.outside'); if(!el) return;
  const k=keyFor(el); if(!k) return;
  if(balance<chip){ el.animate([{filter:'brightness(1)'},{filter:'brightness(1.25)'},{filter:'brightness(1)'}],{duration:300}); return; }
  balance-=chip; bets[k]=(bets[k]||0)+chip; addBadge(el,bets[k]); undo.push({k,amt:chip}); updateBal();
});

/* ---------- spin / physics-lite ---------- */
let wheelAngle=0; // current rotation in degrees

function placeBall(){ const rim=wheel.offsetWidth*0.42; ball.style.transform=`translate(${rim}px,-10px)`; }
addEventListener('resize',placeBall); placeBall();

function spinToIndex(idx, ms, done){
  const deltaToBall = norm(BALL_ANGLE - pocketMid(idx)); // angle to align pocket center with ball
  const from = wheelAngle;
  const to   = wheelAngle + 6*360 + deltaToBall;         // nice number of spins
  const t0   = performance.now();

  function frame(now){
    const p = Math.min(1, (now - t0)/ms);
    const e = easeOutCubic(p);
    const ang = from + (to - from)*e;
    wheel.style.transform = `rotate(${ang}deg)`;
    orbit.style.transform = `rotate(${-ang}deg)`;         // keep ball visually fixed
    if(p<1){ requestAnimationFrame(frame); }
    else { wheelAngle = norm(to); orbit.style.transform=`rotate(${-wheelAngle}deg)`; done(); }
  }
  requestAnimationFrame(frame);
}

/* ---------- payouts ---------- */
function settle(winNum){
  let win=0;
  for(const [k,amt] of Object.entries(bets)){
    const [t,v]=k.split(':');
    if(t==='n' && Number(v)===winNum) win+=amt*36;
    if(t==='c' && winNum!==0){
      if(v==='purple' && PURPLE.has(winNum)) win+=amt*2;
      if(v==='gold'   && GOLD.has(winNum))   win+=amt*2;
    }
    if(t==='e' && winNum!==0){
      if(v==='even' && winNum%2===0) win+=amt*2;
      if(v==='odd'  && winNum%2===1) win+=amt*2;
    }
    if(t==='l' && winNum!==0){
      if(v==='low'  && winNum<=18) win+=amt*2;
      if(v==='high' && winNum>=19) win+=amt*2;
    }
    if(t==='d' && winNum!==0){
      const d=Number(v);
      if((d===1&&winNum<=12)||(d===2&&winNum>=13&&winNum<=24)||(d===3&&winNum>=25)) win+=amt*3;
    }
    if(t==='col' && winNum!==0){
      const col=((winNum-1)%3)+1; if(Number(v)===col) win+=amt*3;
    }
  }
  bets={}; undo=[]; clearBadges();
  if(win>0){ balance+=win; updateBal(); }
}

/* ---------- controls ---------- */
spinBtn?.addEventListener('click', ()=>{
  if(spinBtn.disabled) return;
  spinBtn.disabled = true; lastBets = {...bets};
  const idx = Math.floor(Math.random()*ORDER.length);
  const n   = ORDER[idx];
  spinToIndex(idx, 2400, ()=>{
    badge && (badge.textContent = n);
    lastEl && (lastEl.textContent = n);
    settle(n);
    spinBtn.disabled = false;
  });
});

/* ---------- public API for Pi SDK/backend ---------- */
window.RouletteApp = {
  /** Force a spin to a specific number (0–36). Returns true if valid. */
  spinTo(num){
    const idx = ORDER.indexOf(Number(num));
    if(idx<0) return false;
    spinBtn && (spinBtn.disabled = true);
    spinToIndex(idx, 2400, ()=>{
      badge && (badge.textContent = num);
      lastEl && (lastEl.textContent = num);
      settle(Number(num));
      spinBtn && (spinBtn.disabled = false);
    });
    return true;
  },
  /** Random spin. Returns the number immediately. */
  spinRandom(){
    const idx = Math.floor(Math.random()*ORDER.length);
    const n   = ORDER[idx];
    spinBtn && (spinBtn.disabled = true);
    spinToIndex(idx, 2400, ()=>{
      badge && (badge.textContent = n);
      lastEl && (lastEl.textContent = n);
      settle(n);
      spinBtn && (spinBtn.disabled = false);
    });
    return n;
  },
  setBalance(v){ balance = Number(v)||0; updateBal(); },
  getBalance(){ return balance; },
  getBets(){ return {...bets}; },
  clearBets(){ for(const [k,amt] of Object.entries(bets)) balance+=amt; bets={}; undo=[]; clearBadges(); updateBal(); }
};
