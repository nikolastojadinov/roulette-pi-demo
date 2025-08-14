/* ================== Purple/Gold Roulette – exact landing + full table ================== */
const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const PURPLE=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const GOLD  =new Set(Array.from({length:36},(_,i)=>i+1).filter(n=>!PURPLE.has(n)));
const SWEEP=360/ORDER.length;
const BALL_ANGLE=0;                        // ball on right edge of wheel

/* refs */
const wheel    = document.getElementById('wheel');
const wheelSvg = document.getElementById('wheelSvg');
const orbit    = document.getElementById('orbit');
const ball     = document.getElementById('ball');
const spinBtn  = document.getElementById('spinBtn')||document.getElementById('spin');
const badge    = document.getElementById('badge');
const lastEl   = document.getElementById('last');
const board    = document.getElementById('board');
const chips    = document.getElementById('chips');
const balEl    = document.getElementById('bal');

/* utils */
const norm=a=>(a%=360,a<0?a+360:a);
const mid=(i)=>(i+0.5)*SWEEP-90;
const ease=t=>1-Math.pow(1-t,3);

/* ---------- build wheel ---------- */
(function buildWheel(){
  const cx=50,cy=50,rO=49,rI=32,rT=41;
  const css=k=>getComputedStyle(document.documentElement).getPropertyValue(k).trim();
  const polar=(r,a)=>{a*=Math.PI/180;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}};
  const ann=(r0,r1,a0,a1)=>{const p1=polar(r1,a0),p2=polar(r1,a1),p3=polar(r0,a1),p4=polar(r0,a0),la=(a1-a0)<=180?0:1;
    return `M ${p1.x} ${p1.y} A ${r1} ${r1} 0 ${la} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r0} ${r0} 0 ${la} 0 ${p4.x} ${p4.y} Z`};
  ORDER.forEach((n,i)=>{
    const a0=i*SWEEP-90,a1=a0+SWEEP, m=(a0+a1)/2;
    const fill = n===0 ? css('--zero') : (PURPLE.has(n)?css('--purple'):css('--gold'));
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d',ann(rI,rO,a0,a1)); p.setAttribute('fill',fill); p.setAttribute('stroke','#000'); p.setAttribute('stroke-width','0.25');
    wheelSvg.appendChild(p);
    const t=document.createElementNS('http://www.w3.org/2000/svg','text'), pos=polar(rT,m);
    t.setAttribute('x',pos.x); t.setAttribute('y',pos.y+2); t.setAttribute('text-anchor','middle');
    t.setAttribute('font-size','4.2'); t.setAttribute('font-weight','800'); t.setAttribute('transform',`rotate(${m+90},${pos.x},${pos.y})`);
    t.setAttribute('fill', n===0 ? '#e6fff4' : (PURPLE.has(n)?'#fff':'#2a2207')); t.textContent=n; wheelSvg.appendChild(t);
  });
})();

/* ---------- build full table (0 column + 1..36 grid) ---------- */
const cells={};
(function buildBoard(){
  if(!board) return;
  // first column = tall 0 spanning all 3 rows
  const zero=document.createElement('div');
  zero.className='cell zero'; zero.textContent='0';
  zero.style.gridRow='1 / span 3'; zero.style.gridColumn='1';
  zero.dataset.type='straight'; zero.dataset.num='0';
  board.appendChild(zero); cells['n:0']=zero;

  // 12 columns of 3 rows (top to bottom: 3rd row, 2nd, 1st in standard layout)
  for(let col=0; col<12; col++){
    for(let r=2; r>=0; r--){
      const n=col*3+(3-r);
      const d=document.createElement('div');
      d.className=`cell ${PURPLE.has(n)?'purple':'gold'}`;
      d.textContent=n; d.dataset.type='straight'; d.dataset.num=n;
      d.style.gridColumn = (col+2); // +1 for CSS grid start, +1 for zero column
      d.style.gridRow    = (3-r);
      board.appendChild(d);
      cells[`n:${n}`]=d;
    }
  }

  // map outside buttons
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

/* ---------- chips + betting ---------- */
let balance=1000, chip=10, bets={}, undo=[], lastBets={};
const upBal=()=>{ if(balEl) balEl.textContent=balance.toFixed(0) }; upBal();

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
  balance-=chip; bets[k]=(bets[k]||0)+chip; addBadge(el,bets[k]); undo.push({k,amt:chip}); upBal();
});

/* ---------- wheel spin with auto-correction ---------- */
let wheelAngle=0; // deg

function placeBall(){ const rim=wheel.offsetWidth*0.42; ball.style.transform=`translate(${rim}px,-10px)`; }
addEventListener('resize',placeBall); placeBall();

/* find which pocket is visually under the ball for a given wheel angle */
function visualIndexFromAngle(angleDeg){
  const angAtBall = norm(BALL_ANGLE - norm(angleDeg));       // wheel vs ball
  const raw = norm(angAtBall + 90) / SWEEP;                  // 0 sector starts at -90
  return Math.floor(raw) % ORDER.length;
}

/* spin animation + final micro-correction so the ball ends at exact pocket center */
function spinToIndex(idxTarget, ms, done){
  const deltaToBall = norm(BALL_ANGLE - mid(idxTarget));
  const from = wheelAngle;
  const to   = wheelAngle + 6*360 + deltaToBall;
  const t0   = performance.now();

  function frame(now){
    const p=Math.min(1,(now-t0)/ms), e=ease(p), ang=from+(to-from)*e;
    wheel.style.transform=`rotate(${ang}deg)`;                 // CW
    orbit.style.transform=`rotate(${-ang}deg)`;                // keep ball fixed
    if(p<1) requestAnimationFrame(frame);
    else {
      wheelAngle=norm(to);
      // micro-correct if rounding drifted
      const idxVisual = visualIndexFromAngle(wheelAngle);
      if(idxVisual !== idxTarget){
        // rotate by the shortest path to the exact mid of target
        const need = norm(mid(idxTarget) - (BALL_ANGLE - 0));  // where we want the wheel (relative to ball)
        const current = norm(-wheelAngle);                     // wheel's negative is ball frame
        let d = norm(need - current);                          // [0..360)
        if(d>180) d -= 360;                                    // shortest direction
        const adjFrom = wheelAngle, adjTo = wheelAngle + d;
        const t1=performance.now(), dur=180;                   // quick snap
        (function adj(now){
          const q=Math.min(1,(now-t1)/dur), x=ease(q), A=adjFrom+(adjTo-adjFrom)*x;
          wheel.style.transform=`rotate(${A}deg)`; orbit.style.transform=`rotate(${-A}deg)`;
          if(q<1) requestAnimationFrame(adj); else { wheelAngle=norm(adjTo); done(); }
        })(t1);
      } else {
        done();
      }
    }
  }
  requestAnimationFrame(frame);
}

/* payouts */
function settle(n){
  let win=0;
  for(const [k,amt] of Object.entries(bets)){
    const [t,v]=k.split(':');
    if(t==='n' && Number(v)===n) win+=amt*36;
    if(t==='c' && n!==0){
      if(v==='purple'&&PURPLE.has(n)) win+=amt*2;
      if(v==='gold'  &&GOLD.has(n))   win+=amt*2;
    }
    if(t==='e' && n!==0){
      if(v==='even'&&n%2===0) win+=amt*2;
      if(v==='odd' &&n%2===1) win+=amt*2;
    }
    if(t==='l' && n!==0){
      if(v==='low' &&n<=18) win+=amt*2;
      if(v==='high'&&n>=19) win+=amt*2;
    }
    if(t==='d' && n!==0){
      const D=+v; if((D===1&&n<=12)||(D===2&&n>=13&&n<=24)||(D===3&&n>=25)) win+=amt*3;
    }
    if(t==='col' && n!==0){
      const col=((n-1)%3)+1; if(+v===col) win+=amt*3;
    }
  }
  bets={}; undo=[]; clearBadges();
  if(win>0){ balance+=win; } upBal();
}

/* controls */
spinBtn?.addEventListener('click',()=>{
  if(spinBtn.disabled) return;
  spinBtn.disabled=true; lastBets={...bets};
  const idx=Math.floor(Math.random()*ORDER.length), n=ORDER[idx];
  spinToIndex(idx,2400,()=>{
    // compute the *actual* pocket under ball (after correction) and use that for result
    const idxVis=visualIndexFromAngle(wheelAngle);
    const num=ORDER[idxVis];
    if(badge) badge.textContent=num;
    if(lastEl) lastEl.textContent=num;
    settle(num);
    spinBtn.disabled=false;
  });
});

/* public API for server-driven results */
window.RouletteApp = {
  spinTo(num){
    const idx=ORDER.indexOf(Number(num)); if(idx<0) return false;
    spinBtn && (spinBtn.disabled=true);
    spinToIndex(idx,2400,()=>{
      const idxVis=visualIndexFromAngle(wheelAngle);
      const real=ORDER[idxVis];  // guaranteed visual result
      badge && (badge.textContent=real);
      lastEl && (lastEl.textContent=real);
      settle(real);
      spinBtn && (spinBtn.disabled=false);
    });
    return true;
  },
  spinRandom(){
    const idx=Math.floor(Math.random()*ORDER.length);
    const n=ORDER[idx];
    this.spinTo(n);
    return n;
  },
  setBalance(v){ balance=Number(v)||0; upBal(); },
  getBalance(){ return balance; },
  getBets(){ return {...bets}; },
  clearBets(){ for(const [k,amt] of Object.entries(bets)) balance+=amt; bets={}; undo=[]; clearBadges(); upBal(); }
};
