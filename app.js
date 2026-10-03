const raw=[
[1243,2354,'+'],[4312,2567,'+'],[5024,3165,'+'],[6781,1207,'+'],[2456,3412,'+'],[7034,1825,'+'],[4567,3218,'+'],[5894,2047,'+'],[3768,4521,'+'],[8142,1756,'+'],
[4827,3596,'+'],[6798,2457,'+'],[7649,1988,'+'],[5386,4765,'+'],[8957,2876,'+'],[13245,24130,'+'],[27834,31562,'+'],[40128,17345,'+'],[52376,28149,'+'],[68425,11736,'+'],
[24987,35648,'+'],[38765,42987,'+'],[51649,27895,'+'],[74286,15749,'+'],[83567,12978,'+'],[16438,52769,'+'],[29574,60428,'+'],[43896,35127,'+'],[57643,21889,'+'],[69175,28746,'+'],
[4875,1324,'-'],[7632,2411,'-'],[9528,4316,'-'],[6841,2730,'-'],[5709,1465,'-'],[8043,3217,'-'],[7315,2148,'-'],[6482,3567,'-'],[9001,4786,'-'],[8120,3965,'-'],
[6342,2875,'-'],[7210,4586,'-'],[8005,3768,'-'],[9654,4879,'-'],[5430,2687,'-'],[35482,12341,'-'],[58764,23152,'-'],[70215,18463,'-'],[83642,31527,'-'],[95130,42718,'-'],
[62481,27896,'-'],[70004,35678,'-'],[81250,46793,'-'],[90321,58476,'-'],[54000,27865,'-'],[68420,39786,'-'],[73105,46879,'-'],[82003,57964,'-'],[96540,68795,'-'],[60000,34876,'-']
];

const presets=raw.map(([a,b,op],i)=>({id:i+1,a,b,op,answer:op==='+'?a+b:a-b}));
let current=presets[0],filter='all',score=0,attempts=0;
let lessonSteps=[],stepIndex=-1,rafId=null;
const $=s=>document.querySelector(s);
const fmt=n=>n.toLocaleString('uz-UZ').replace(/,/g,' ');
const expr=p=>`${fmt(p.a)} ${p.op} ${fmt(p.b)}`;
const names=['birlik','o‘nlik','yuzlik','minglik','o‘n minglik'];

function hasRegroup(p){
  if(p.op==='+'){
    const a=toDigits(p.a),b=toDigits(p.b);let carry=0;
    for(let i=4;i>=0;i--){const s=a[i]+b[i]+carry;if(s>=10)return true;carry=s>=10?1:0}
  }else{
    const a=toDigits(p.a),b=toDigits(p.b);
    for(let i=4;i>=0;i--){if(a[i]<b[i])return true}
  }
  return false;
}
function matching(){if(filter==='add')return presets.filter(p=>p.op==='+');if(filter==='sub')return presets.filter(p=>p.op==='-');if(filter==='borrow')return presets.filter(hasRegroup);return presets}
function toDigits(n){return String(Math.abs(n)).padStart(5,'0').slice(-5).split('').map(Number)}
function renderProblem(){
  if(rafId)cancelAnimationFrame(rafId);
  $('#problem').textContent=expr(current)+' = ?';
  $('#answer').value='';$('#feedback').textContent='';$('#feedback').className='feedback';
  $('#placeValues').innerHTML='';$('#columnMath').innerHTML='';
  $('#stepMessage').textContent='Har bir bosqichni o‘zingiz boshqarasiz.';
  $('#stepCounter').textContent='Boshlash uchun “Tushuntir”ni bosing';
  $('#nextStep').disabled=true;$('#restartSteps').disabled=true;$('#animate').disabled=true;
  $('#numberline').innerHTML='';$('#motionText').textContent='';
  lessonSteps=[];stepIndex=-1;$('#answer').focus();
}
function pick(){const a=matching();current=a[Math.floor(Math.random()*a.length)];renderProblem()}
function placeView(p){
  const labels=['10 000','1 000','100','10','1'],a=toDigits(p.a),b=toDigits(p.b);
  $('#placeValues').innerHTML=labels.map((l,i)=>`<div class="pv"><span>${l}</span><strong>${a[i]}</strong><span>${p.op} ${b[i]}</span></div>`).join('');
}

function buildAdditionSteps(p){
  const a=toDigits(p.a),b=toDigits(p.b),result=['','','','',''],carryRow=['','','','',''];
  const steps=[];let carry=0;
  for(let col=4;col>=0;col--){
    const incoming=carry;
    const total=a[col]+b[col]+incoming;
    const digit=total%10;
    const outgoing=Math.floor(total/10);
    result[col]=String(digit);
    if(outgoing&&col>0)carryRow[col-1]=String(outgoing);
    let message=`${names[4-col]} xonasi: ${a[col]} + ${b[col]}`;
    if(incoming)message+=` + oldingi xonadan kelgan ${incoming}`;
    message+=` = ${total}. `;
    message+=outgoing?`${digit} ni pastga yozamiz, ${outgoing} ni chapdagi keyingi xonaga o‘tkazamiz.`:`${digit} ni pastga yozamiz. O‘tkazish yo‘q.`;
    steps.push({col,a:[...a],b:[...b],result:[...result],carryRow:[...carryRow],message,kind:'add'});
    carry=outgoing;
  }
  return steps;
}

function borrowFromLeft(top,col){
  let donor=col-1;
  while(donor>=0 && top[donor]===0)donor--;
  if(donor<0)return {top,note:'Qarz olishning iloji yo‘q.'};
  const originalDonor=top[donor];
  top[donor]-=1;
  for(let k=donor+1;k<col;k++)top[k]=9;
  top[col]+=10;
  const chain=col-donor>1
    ? `${names[4-donor]} xonasidagi ${originalDonor} dan 1 olinadi; oradagi nol xonalar 9 ga aylanadi.`
    : `Chapdagi ${names[4-donor]} xonasidan 1 qarz olamiz.`;
  return {top,note:chain};
}

function buildSubtractionSteps(p){
  const original=toDigits(p.a),bottom=toDigits(p.b),top=[...original],result=['','','','',''],steps=[];
  for(let col=4;col>=0;col--){
    let borrowText='';
    const before=top[col];
    if(top[col]<bottom[col]){
      const br=borrowFromLeft(top,col);
      borrowText=br.note+' ';
    }
    const value=top[col]-bottom[col];
    result[col]=String(value);
    let message=`${names[4-col]} xonasi: `;
    if(borrowText)message+=borrowText;
    message+=`${top[col]} − ${bottom[col]} = ${value}. ${value} ni pastga yozamiz.`;
    steps.push({col,a:[...top],original:[...original],b:[...bottom],result:[...result],carryRow:['','','','',''],message,kind:'sub',borrowed:before!==top[col]||borrowText!==''});
  }
  return steps;
}
function buildSteps(p){return p.op==='+'?buildAdditionSteps(p):buildSubtractionSteps(p)}

function renderColumn(step){
  const baseA=step?step.a:toDigits(current.a),baseB=step?step.b:toDigits(current.b);
  const result=step?step.result:['','','','',''];
  const carry=step?step.carryRow:['','','','',''];
  const active=step?step.col:-1;
  let html='<div class="math-grid">';
  html+='<div></div>'+carry.map((v,i)=>`<div class="math-cell carry ${i===active?'active':''}">${v||''}</div>`).join('');
  html+='<div></div>'+baseA.map((v,i)=>`<div class="math-cell ${i===active?'active':''}">${v}</div>`).join('');
  html+=`<div class="math-cell label">${current.op}</div>`+baseB.map((v,i)=>`<div class="math-cell ${i===active?'active':''}">${v}</div>`).join('');
  html+='<div class="math-sep"></div>';
  html+='<div></div>'+result.map((v,i)=>`<div class="math-cell ${v!==''?'revealed':'dim'} ${i===active?'active':''}">${v!==''?v:'·'}</div>`).join('');
  html+='</div>';
  $('#columnMath').innerHTML=html;
}

function startExplanation(){
  $('#explainTitle').textContent=expr(current)+' qanday ishlaydi?';
  placeView(current);
  lessonSteps=buildSteps(current);stepIndex=-1;
  renderColumn(null);
  $('#stepMessage').textContent='O‘ng tomondagi birliklar xonasidan boshlaymiz. Tayyor bo‘lsangiz “Keyingi qadam”ni bosing.';
  $('#stepCounter').textContent=`0 / ${lessonSteps.length} qadam`;
  $('#nextStep').disabled=false;$('#restartSteps').disabled=false;$('#animate').disabled=false;
  drawLine(false);
}
function nextStep(){
  if(stepIndex>=lessonSteps.length-1)return;
  stepIndex++;
  const s=lessonSteps[stepIndex];
  renderColumn(s);
  $('#stepMessage').textContent=s.message;
  $('#stepCounter').textContent=`${stepIndex+1} / ${lessonSteps.length} qadam`;
  if(stepIndex===lessonSteps.length-1){
    $('#nextStep').disabled=true;
    $('#stepMessage').textContent+=` Natija: ${fmt(current.answer)}.`;
  }
}
function restartSteps(){stepIndex=-1;renderColumn(null);$('#nextStep').disabled=false;$('#stepCounter').textContent=`0 / ${lessonSteps.length} qadam`;$('#stepMessage').textContent='Yana birliklar xonasidan boshlaymiz. “Keyingi qadam”ni bosing.'}

function lineGeometry(p){
  const L=55,R=845,Y=95,start=p.a,end=p.answer,min=Math.min(start,end),max=Math.max(start,end),span=Math.max(1,max-min),pad=Math.max(500,Math.ceil(span*.12));
  const lo=Math.max(0,min-pad),hi=max+pad,x=v=>L+(v-lo)/(hi-lo)*(R-L);
  return {L,R,Y,start,end,lo,hi,x,sx:x(start),ex:x(end)};
}
function drawLine(animate=false){
  if(rafId)cancelAnimationFrame(rafId);
  const p=current,g=lineGeometry(p),svg=$('#numberline');
  let out=`<line x1="${g.L}" y1="${g.Y}" x2="${g.R}" y2="${g.Y}" stroke="#222" stroke-width="3"/>`;
  for(let i=0;i<=8;i++){
    const v=Math.round(g.lo+(g.hi-g.lo)*i/8),xx=g.x(v);
    out+=`<line x1="${xx}" y1="${g.Y-7}" x2="${xx}" y2="${g.Y+7}" stroke="#777"/><text x="${xx}" y="${g.Y+28}" text-anchor="middle" font-size="13">${fmt(v)}</text>`;
  }
  out+=`<path d="M ${g.sx} ${g.Y-15} Q ${(g.sx+g.ex)/2} 25 ${g.ex} ${g.Y-15}" fill="none" stroke="#777" stroke-width="3" stroke-dasharray="8 7"/><circle id="walker" cx="${g.sx}" cy="${g.Y}" r="10" fill="#111"/><text x="${g.sx}" y="45" text-anchor="middle" font-weight="700">${fmt(g.start)}</text><text x="${g.ex}" y="160" text-anchor="middle" font-weight="700">${fmt(g.end)}</text>`;
  svg.innerHTML=out;
  $('#motionText').textContent=`Boshlanish: ${fmt(g.start)}. Natija tomon ${current.op==='+'?'qo‘shish':'ayirish'} yo‘nalishida boramiz.`;
  if(!animate)return;
  const walker=$('#walker');
  const duration=4200;
  const startTime=performance.now();
  const from=g.sx,to=g.ex;
  function tick(now){
    const t=Math.min(1,(now-startTime)/duration);
    const eased=t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
    walker.setAttribute('cx',String(from+(to-from)*eased));
    $('#motionText').textContent=t<1?`Harakat: ${Math.round(t*100)}% — shoshilmay kuzating.`:`Yetib keldik: ${fmt(g.end)}.`;
    if(t<1)rafId=requestAnimationFrame(tick);
  }
  rafId=requestAnimationFrame(tick);
}
function check(){
  const v=Number($('#answer').value.replace(/\s/g,''));
  if(!Number.isFinite(v))return;
  attempts++;
  if(v===current.answer){score++;$('#feedback').textContent='To‘g‘ri! Zo‘r. Endi keyingisini quramiz.';$('#feedback').className='feedback ok'}
  else{$('#feedback').textContent='Hali emas. “Tushuntir”ni bosib, qadam-baqadam ko‘rib chiq.';$('#feedback').className='feedback bad'}
  $('#score').textContent='To‘g‘ri: '+score;$('#attempts').textContent='Urinish: '+attempts;
}
function renderBank(list=presets){
  $('#problemBank').innerHTML=list.map(p=>`<button class="bank-item" data-id="${p.id}">${expr(p)}</button>`).join('');
  document.querySelectorAll('.bank-item').forEach(b=>b.onclick=()=>{current=presets.find(p=>p.id==b.dataset.id);renderProblem();window.scrollTo({top:0,behavior:'smooth'})});
}
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;pick()});
$('#newProblem').onclick=pick;
$('#check').onclick=check;
$('#show').onclick=startExplanation;
$('#nextStep').onclick=nextStep;
$('#restartSteps').onclick=restartSteps;
$('#animate').onclick=()=>drawLine(true);
$('#shuffleBank').onclick=()=>renderBank([...presets].sort(()=>Math.random()-.5));
$('#answer').addEventListener('keydown',e=>{if(e.key==='Enter')check()});
renderBank();renderProblem();