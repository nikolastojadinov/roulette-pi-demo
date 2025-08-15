/* ----- DATA ----- */
const ORDER=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACK = new Set(Array.from({length:36},(_,i)=>i+1).filter(n=>!RED.has(n)));
const SWEEP = 360/ORDER.length; const BALL_ANGLE=0;

/* ----- DOM ----- */
const wheel=document.getElementById('wheel'), svg=document.getElementById('wheelSvg'), orbit=document.getElementById('orbit'), ball=document.getElementById('ball');
const spinBtn=document.getElementById('spin'), badge=document.getElementById('badge'), hist=document.getElementById('history');
const board=document.getElementById('board'), chips=document.getElementById('chips'), balEl=document.getElementById('bal');
const rebetBtn=document.getElementById('rebet'), doubleBtn=document.getElementById('double'), undoBtn=document.getElementById('undo'), clearBtn=document.getElementById('clear');

/* ----- HELPERS ----- */
const norm=a=>(a%=360,a<0?a+360:a); const mid=i=>(i+0.5)*SWEEP-90; const ease=t=>1-Math.pow(1-t,3);

/* ----- BUILD WHEEL (SVG) ----- */
(function buildWheel(){
  const cx=50,cy=50,rO=49,rI=32,rT=41;
  function polar(r,a){a*=Math.PI/180;return{x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)}}
  function ann(r0,r1,a0,a1){const p1=polar(r1,a0),p2=polar(r1,a1),p3=polar(r0,a1),p4=polar(r0,a0),la=(a1-a0)<=180?0:1;
    return `M ${p1.x} ${p1.y} A ${r1} ${r1} 0 ${la} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${r0} ${r0} 0 ${la} 0 ${p4.x} ${p4.y} Z`;}
  ORDER.forEach((n,i)=>{
    const a0=i*SWEEP-90,a1=a0+SWEEP,m=(a0+a1)/2, fill = n===0 ? '#0aa56e' : (RED.has(n)?'#b91c1c':'#111');
    const p=document.createElementNS('http://www.w3.org/2000/svg','path'); p.setAttribute('d',ann(rI,rO,a0,a1));
    p.setAttribute('fill',fill); p.setAttribute('stroke','#111'); p.setAttribute('stroke-width','0.25'); svg.appendChild(p);
    const t=document.createElementNS('http://www.w3.org/2000/svg','text'), pos=polar(rT,m);
    t.setAttribute('x',pos.x); t.setAttribute('y',pos.y+2); t.setAttribute('text-anchor','middle'); t.setAttribute('font-size','4.2'); t.setAttribute('font-weight','800');
    t.setAttribute('fill', n===0 ? '#e6fff4' : (RED.has(n)?'#fff':'#ededed')); t.setAttribute('transform',`rotate(${m+90},${pos.x},${pos.y})`); t.textContent=n; svg.appendChild(t);
  });
})();

/* ----- BUILD BOARD (0 levo + 3 reda 1–36) ----- */
const cells={};
(function buildBoard(){
  // 0 postoji u HTML-u; samo ga mapiramo
  cells['n:0']=board.querySelector('[data-num="0"]');
  for(let col=0; col<12; col++){
    for(let r=2; r>=0; r--){
      const n=col*3+(3-r);
      const d=document.createElement('div');
      d.className=`cell ${RED.has(n)?'red':'black'}`;
      d.textContent=n;
      d.dataset.type='straight'; d.dataset.num=n;
      d.style.gridColumn=(col+2);
      d.style.gridRow=(3-r);
      board.appendChild(d); cells[`n:${n}`]=d;
    }
  }
  // mapiraj outside elemente
  document.querySelectorAll('.outside').forEach(el=>{
    const t=el.dataset; let key='';
    if(t.color) key=`c:${t.color}`; else if(t.eo) key=`e:${t.eo}`; else if(t.lh) key=`l:${t.lh}`; else if(t.dozen) key=`d:${t.dozen}`; else if(t.col) key=`col:${t.col}`;
    if(key) cells[key]=el;
  });
})();

/* ----- BETTING ----- */
let balance=1000, chip=10, bets={}, undo=[], lastBets={}, history=[];
const upBal=()=>balEl.textContent=balance.toFixed(0); upBal();

chips.addEventListener('click',e=>{
  const c=e.target.closest('.chip'); if(!c) return;
  document.querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));
  c.classList.add('sel'); chip=+c.dataset.v;
});
function keyFor(el){
  const t=el.dataset;
  if(t.num!==undefined) return `n:${t.num}`;
  if(t.color) return `c:${t.color}`;
  if(t.eo) return `e:${t.eo}`;
  if(t.lh) return `l:${t.lh}`;
  if(t.dozen) return `d:${t.dozen}`;
  if(t.col) return `col:${t.col}`;
  return '';
}
function addBadge(el,amt){let b=el.querySelector('.bet-badge'); if(!b){b=document.createElement('div');b.className='bet-badge';el.appendChild(b);} b.textContent=amt}
function clearBadges(){Object.values(cells).forEach(el=>{const b=el?.querySelector?.('.bet-badge'); if(b) b.remove();});}

document.addEventListener('click',e=>{
  const el=e.target.closest('.cell,.outside'); if(!el) return;
  const k=keyFor(el); if(!k) return;
  if(balance<chip){ el.animate([{filter:'brightness(1)'},{filter:'brightness(1.25)'},{filter:'brightness(1)'}],{duration:300}); return;}
  balance-=chip; bets[k]=(bets[k]||0)+chip; addBadge(el,bets[k]); undo.push({k,amt:chip}); upBal();
});

undoBtn.onclick=()=>{
  const a=undo.pop(); if(!a) return;
  balance+=a.amt; bets[a.k]-=a.amt; if(bets[a.k]<=0) delete bets[a.k];
  const el=cells[a.k]; const b=el?.querySelector?.('.bet-badge');
  if(b){ if(bets[a.k]) b.textContent=bets[a.k]; else b.remove();} upBal();
};
clearBtn.onclick=()=>{for(const [k,amt] of Object.entries(bets)) balance+=amt; bets={}; undo=[]; clearBadges(); upBal();};
rebetBtn.onclick=()=>{if(!Object.keys(lastBets).length) return; clearBtn.onclick(); for(const [k,amt] of Object.entries(lastBets)){ if(balance>=amt){ balance-=amt; bets[k]=amt; addBadge(cells[k],amt);} } upBal();};
doubleBtn.onclick=()=>{const need=Object.values(bets).reduce((a,b)=>a+b,0); if(!need||balance<need) return; for(const k in bets){ bets[k]*=2; addBadge(cells[k],bets[k]); } balance-=need; upBal(); };

/* ----- WHEEL SPIN ----- */
let wheelAngle=0;
function placeBall(){const rim=wheel.offsetWidth*0.42; ball.style.transform=`translate(${rim}px,-10px)`;}
window.addEventListener('load', ()=>{ placeBall(); });
window.addEventListener('resize', ()=>{ placeBall(); });

function visualIndexFromAngle(angleDeg){
  const angAtBall=norm(BALL_ANGLE - norm(angleDeg));
  const raw=norm(angAtBall + 90)/SWEEP;
  return Math.floor(raw)%ORDER.length;
}
function spinToIndex(idx, ms, done){
  const from=wheelAngle, to=wheelAngle + 6*360 + norm(BALL_ANGLE - mid(idx)); const t0=performance.now();
  function frame(now){const p=Math.min(1,(now-t0)/ms), e=ease(p), ang=from+(to-from)*e;
    wheel.style.transform=`rotate(${ang}deg)`; orbit.style.transform=`rotate(${-ang}deg)`; if(p<1){requestAnimationFrame(frame);} else {
      wheelAngle=norm(to);
      const seen=visualIndexFromAngle(wheelAngle);
      if(seen!==idx){
        const need=norm(mid(idx) - (BALL_ANGLE - 0));
        const current=norm(-wheelAngle); let d=norm(need - current); if(d>180) d-=360;
        const a0=wheelAngle,a1=wheelAngle+d,t1=performance.now(),dur=160;(function adj(now){const q=Math.min(1,(now-t1)/dur),x=ease(q),A=a0+(a1-a0)*x;
          wheel.style.transform=`rotate(${A}deg)`; orbit.style.transform=`rotate(${-A}deg)`; if(q<1) requestAnimationFrame(adj); else {wheelAngle=norm(a1); done();}})(t1);
      } else done();
    }}
  requestAnimationFrame(frame);
}

/* ----- Settle / History ----- */
function pushHistory(n){
  history.unshift(n); if(history.length>14) history.pop(); hist.innerHTML='';
  history.forEach(x=>{const s=document.createElement('span'); s.className='hpill ' + (x===0?'green':(RED.has(x)?'red':'black')); s.textContent=x; hist.appendChild(s);});
}
function settle(n){
  let win=0;
  for(const [k,amt] of Object.entries(bets)){
    const [t,v]=k.split(':');
    if(t==='n' && +v===n) win+=amt*36;
    if(t==='c' && n!==0){ if(v==='red'&&RED.has(n)) win+=amt*2; if(v==='black'&&BLACK.has(n)) win+=amt*2; }
    if(t==='e' && n!==0){ if(v==='even'&&n%2===0) win+=amt*2; if(v==='odd'&&n%2===1) win+=amt*2; }
    if(t==='l' && n!==0){ if(v==='low'&&n<=18) win+=amt*2; if(v==='high'&&n>=19) win+=amt*2; }
    if(t==='d' && n!==0){ const d=+v; if((d===1&&n<=12)||(d===2&&n>=13&&n<=24)||(d===3&&n>=25)) win+=amt*3; }
    if(t==='col' && n!==0){ const col=((n-1)%3)+1; if(+v===col) win+=amt*3; }
  }
  bets={}; undo=[]; clearBadges();
  if(win>0) balance+=win; upBal(); pushHistory(n); lastBets={...bets};
}

/* ----- Controls ----- */
spinBtn.onclick=()=>{ if(spinBtn.disabled) return; spinBtn.disabled=true; lastBets={...bets};
  const idx=Math.floor(Math.random()*ORDER.length);
  spinToIndex(idx,2400,()=>{ const seen=visualIndexFromAngle(wheelAngle); const n=ORDER[seen]; badge.textContent=n; settle(n); spinBtn.disabled=false; });
};

/* Public API (po potrebi) */
window.RouletteAPI = {
  spinTo(num){ const idx=ORDER.indexOf(Number(num)); if(idx<0) return false; spinBtn.disabled=true;
    spinToIndex(idx,2400,()=>{const seen=visualIndexFromAngle(wheelAngle); const n=ORDER[seen]; badge.textContent=n; settle(n); spinBtn.disabled=false;}); return true; },
  spinRandom(){ const idx=Math.floor(Math.random()*ORDER.length); const n=ORDER[idx]; this.spinTo(n); return n; },
  setBalance(v){ balance=Number(v)||0; upBal(); }, getBalance(){ return balance; }, getBets(){ return {...bets}; }, clearBets(){ clearBtn.onclick(); }
};
