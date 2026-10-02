const EMO = {
  sadness:{e:'😢',c:'#6c8cff'}, joy:{e:'😄',c:'#ffc94a'}, love:{e:'❤️',c:'#ff6b9a'},
  anger:{e:'😠',c:'#ff5a4e'}, fear:{e:'😨',c:'#a87cff'}, surprise:{e:'😲',c:'#3fe0c5'}
};
const SAMPLES = [
  ['Got the job!','I just got the job offer and I cannot stop smiling'],
  ['Missing home','I feel so alone and I miss everyone back home'],
  ['Furious','I am furious that they lied to my face again'],
  ['Late night noise','I heard footsteps downstairs and my heart is racing'],
  ['Sweet','I adore the way you laugh at my terrible jokes'],
  ['No way','I opened the door and the whole family was there, what a shock']
];
const $ = id => document.getElementById(id);
const txt = $('txt'), go = $('go'), root = document.documentElement;

// headline: letters pop in one by one
const h1 = document.querySelector('h1');
'How are you feeling?'.split(' ').forEach((w,i)=>{
  const s=document.createElement('span'); s.textContent=w; s.style.animationDelay=(i*.12)+'s';
  h1.append(s, ' ');
});

SAMPLES.forEach(([label,text])=>{
  const b=document.createElement('button'); b.className='chip'; b.textContent=label;
  b.onclick=()=>{ txt.value=text; sync(); analyze(); };
  $('chips').append(b);
});

function sync(){ $('n').textContent=txt.value.length; go.disabled=!txt.value.trim(); }
txt.addEventListener('input',sync);
txt.addEventListener('keydown',e=>{ if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)) analyze(); });
go.onclick=analyze;

function setMood(k){ root.style.setProperty('--c', EMO[k].c); }

async function analyze(){
  const text = txt.value.trim(); if(!text||go.disabled&&!text) return;
  $('err').classList.remove('show');
  go.classList.add('loading'); go.disabled=true; go.textContent='Reading…'; document.body.classList.add('busy');
  try{
    const r = await fetch('/predict',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text})});
    if(!r.ok){ const d=await r.json().catch(()=>({})); throw new Error(typeof d.detail==='string'?d.detail:'The server could not process that text.'); }
    show(await r.json());
  }catch(e){
    const el=$('err'); el.textContent=(e.message==='Failed to fetch')?'Cannot reach the server. Check that it is running and try again.':e.message;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
  }finally{
    go.classList.remove('loading'); go.textContent='Analyze'; document.body.classList.remove('busy'); sync();
  }
}

function show(d){
  const k=d.predicted_emotion, m=EMO[k];
  setMood(k);
  const res=$('result'); res.classList.add('show');
  const card=res.firstElementChild; card.style.animation='none'; void card.offsetWidth; card.style.animation='';
  const em=$('em'); em.textContent=m.e; em.classList.remove('swap'); void em.offsetWidth; em.classList.add('swap');
  $('name').textContent=k;
  // ring + counter
  const fg=$('fg'); fg.style.strokeDashoffset=339.3;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{ fg.style.strokeDashoffset=339.3*(1-d.confidence); }));
  countUp($('pct'), d.confidence*100);
  // bars sorted high to low
  const bars=$('bars'); bars.innerHTML='';
  Object.entries(d.all_probabilities).sort((a,b)=>b[1]-a[1]).forEach(([lab,p],i)=>{
    const row=document.createElement('div'); row.className='bar'+(i===0?' top1':'');
    row.innerHTML=`<span>${EMO[lab].e} ${lab}</span><div class="t"><div class="f"></div></div><span>${(p*100).toFixed(1)}%</span>`;
    bars.append(row);
    setTimeout(()=>row.querySelector('.f').style.width=Math.max(p*100,1.5)+'%', 120+i*90);
  });
  burst(m.e);
  res.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function countUp(el,to){
  const t0=performance.now(), dur=1100;
  (function f(t){ const p=Math.min((t-t0)/dur,1), v=to*(1-Math.pow(1-p,3));
    el.textContent=v.toFixed(1)+'%'; if(p<1) requestAnimationFrame(f); })(t0);
}

function burst(emoji){
  if(matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const rect=$('em').getBoundingClientRect(), cx=rect.left+rect.width/2, cy=rect.top+rect.height/2;
  for(let i=0;i<14;i++){
    const s=document.createElement('span'); s.className='fl'; s.textContent=emoji;
    const a=Math.random()*Math.PI*2, dist=90+Math.random()*130;
    s.style.cssText=`left:${cx}px;top:${cy}px;--x:${Math.cos(a)*dist}px;--y:${Math.sin(a)*dist-60}px;--r:${(Math.random()-.5)*160}deg;animation-delay:${Math.random()*.15}s`;
    document.body.append(s); setTimeout(()=>s.remove(),2300);
  }
}
