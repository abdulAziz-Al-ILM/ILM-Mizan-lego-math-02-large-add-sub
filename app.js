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
  $('#moneyVisual').innerHTML='';$('#moneyStory').innerHTML='';$('#motionText').textContent='';
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

function drawLine(animate=false){
 const p=current;const before=p.a,delta=p.op==='+'?p.b:-p.b,after=p.answer;
 const value=n=>fmt(n)+' so‘m';
 const describe=n=>n<0?value(Math.abs(n))+' qarz':n===0?'Hisob teng: 0 so‘m':value(n)+' mablag‘';
 $('#moneyStory').innerHTML='<p><strong>Boshlanish:</strong> '+value(before)+'</p><p><strong>'+(delta>=0?'Kirim':'Chiqim')+':</strong> '+(delta>=0?'+':'−')+value(Math.abs(delta))+'</p><p><strong>Natija:</strong> '+describe(after)+'</p>';
 const max=Math.max(before,Math.abs(delta),Math.abs(after),1);
 const percent=v=>Math.max(1,Math.round(Math.abs(v)/max*100));
 $('#moneyVisual').innerHTML='<div class="money-line"><span>Bor edi</span><div class="money-track"><div class="money-fill" style="width:'+percent(before)+'%"></div></div><strong>'+value(before)+'</strong></div>'+
 '<div class="money-line"><span>'+(delta>=0?'Keladi':'To‘lanadi')+'</span><div class="money-track"><div class="money-fill '+(delta<0?'expense':'')+'" style="width:'+percent(delta)+'%"></div></div><strong>'+(delta>=0?'+':'−')+value(Math.abs(delta))+'</strong></div>'+
 '<div class="money-line"><span>Qoladi</span><div class="money-track"><div class="money-fill '+(after<0?'expense':'')+'" style="width:'+(animate?percent(after):0)+'%"></div></div><strong>'+describe(after)+'</strong></div>';
 $('#motionText').textContent=animate?'Avvalgi mablag‘ + kirim yoki − chiqim = yakuniy holat.':'«O‘zgarishni ko‘rsat» orqali natijani ko‘ring.';
}
function check(){
  const v=Number($('#answer').value.replace(/\s/g,''));
  if(!$('#answer').value.trim() || !Number.isFinite(v))return;
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
/* Ikkinchi sahifa: takrorlanadigan emas, oldindan belgilangan 60 ta ikki xonali mashq. */
const chainPresets=Array.from({length:60},(_,i)=>{
  const start=12+(i*17)%77;
  const length=i%2===0?5:6;
  const ops=Array.from({length},(_,j)=>{
    const amount=10+((i*19+j*23+i*j*7)%80);
    const sign=(i+j*3+Math.floor(i/4))%4<2?1:-1;
    return sign*amount;
  });
  return {id:i+1,start,ops,answer:ops.reduce((s,x)=>s+x,start)};
});
let activeChain=chainPresets[0],chainCorrect=0,chainAttempts=0,chainIndex=-1;
const chainExpr=p=>fmt(p.start)+p.ops.map(n=>' '+(n>=0?'+':'−')+' '+fmt(Math.abs(n))).join('')+' = ?';
const moneyState=n=>n<0?fmt(-n)+' so‘m qarz':n===0?'0 so‘m, hisob teng':fmt(n)+' so‘m mablag‘';
function renderChain(){
 $('#chainProblem').textContent=chainExpr(activeChain);
 $('#chainAnswer').value='';$('#chainFeedback').textContent='';$('#chainFeedback').className='feedback';
 $('#chainSteps').innerHTML='';chainIndex=-1;
 $('#chainStory').innerHTML='<strong>Vaziyat:</strong> Avval '+fmt(activeChain.start)+' so‘m mablag‘ bor. Har bir + pul kelishini, har bir − to‘lov yoki yangi majburiyatni bildiradi.';
 document.querySelectorAll('#chainBank .bank-item').forEach(x=>x.classList.toggle('chosen',Number(x.dataset.id)===activeChain.id));
}
function chainStepsView(){
 let total=activeChain.start;
 const rows=[{text:'Boshlanish: '+moneyState(total),balance:total}];
 for(let i=0;i<activeChain.ops.length;i++){
   const x=activeChain.ops[i],old=total;total+=x;
   const description=x>=0?'Sizga '+fmt(x)+' so‘m keldi':'Siz '+fmt(-x)+' so‘m to‘ladingiz yoki shu miqdorda majburiyat oldingiz';
   rows.push({text:(i+1)+'-qadam: '+description+'. '+fmt(old)+(x>=0?' + ':' − ')+fmt(Math.abs(x))+' = '+fmt(total)+'. Holat: '+moneyState(total)+'.',balance:total});
 }
 return rows;
}
function showChainNextStep(){
 const rows=chainStepsView();if(chainIndex>=rows.length-1)return;
 chainIndex++;
 const row=rows[chainIndex],node=document.createElement('div');node.className='chain-step';node.textContent=row.text;$('#chainSteps').appendChild(node);
 if(chainIndex===rows.length-1){const end=document.createElement('strong');end.textContent='Yakun: '+moneyState(activeChain.answer);$('#chainSteps').appendChild(end)}
 else {const b=document.createElement('button');b.className='secondary next-chain-step';b.textContent='Keyingi qadam →';b.onclick=showChainNextStep;$('#chainSteps').appendChild(b)}
 const prev=$('.next-chain-step');if(prev&&prev!==$('#chainSteps').lastElementChild)prev.remove();
}
function renderChainBank(list=chainPresets){
 $('#chainBank').innerHTML=list.map(p=>'<button class="bank-item" data-id="'+p.id+'">#'+p.id+' · '+p.ops.length+' amal</button>').join('');
 document.querySelectorAll('#chainBank .bank-item').forEach(b=>b.onclick=()=>{activeChain=chainPresets[Number(b.dataset.id)-1];renderChain();document.querySelector('#chainPage').scrollIntoView({behavior:'smooth'})});
 renderChain();
}
document.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{
 document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t===b));
 const first=b.dataset.page==='large';$('#largePage').hidden=!first;$('#chainPage').hidden=first;
});
$('#chainCheck').onclick=()=>{
 const raw=$('#chainAnswer').value.replace(/\s/g,'').replace('−','-');
 if(!/^-?\d+$/.test(raw)){$('#chainFeedback').textContent='Butun son kiriting.';return}
 chainAttempts++;
 const good=Number(raw)===activeChain.answer;if(good)chainCorrect++;
 $('#chainFeedback').textContent=good?'To‘g‘ri! '+moneyState(activeChain.answer)+'.':'Hozircha noto‘g‘ri. Har bir amalni ketma-ket tekshiring.';
 $('#chainFeedback').className='feedback '+(good?'ok':'bad');
 $('#chainProgress').textContent='To‘g‘ri: '+chainCorrect+' · Urinish: '+chainAttempts;
};
$('#chainExplain').onclick=()=>{chainIndex=-1;$('#chainSteps').innerHTML='';showChainNextStep()};
$('#chainNext').onclick=()=>{activeChain=chainPresets[(activeChain.id)%60];renderChain()};
$('#chainShuffle').onclick=()=>renderChainBank([...chainPresets].sort(()=>Math.random()-.5));
$('#chainAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')$('#chainCheck').click()});
renderChainBank();
