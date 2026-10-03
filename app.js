const raw=[
[1243,2354,'+'],[4312,2567,'+'],[5024,3165,'+'],[6781,1207,'+'],[2456,3412,'+'],[7034,1825,'+'],[4567,3218,'+'],[5894,2047,'+'],[3768,4521,'+'],[8142,1756,'+'],
[4827,3596,'+'],[6798,2457,'+'],[7649,1988,'+'],[5386,4765,'+'],[8957,2876,'+'],[13245,24130,'+'],[27834,31562,'+'],[40128,17345,'+'],[52376,28149,'+'],[68425,11736,'+'],
[24987,35648,'+'],[38765,42987,'+'],[51649,27895,'+'],[74286,15749,'+'],[83567,12978,'+'],[16438,52769,'+'],[29574,60428,'+'],[43896,35127,'+'],[57643,21889,'+'],[69175,28746,'+'],
[4875,1324,'-'],[7632,2411,'-'],[9528,4316,'-'],[6841,2730,'-'],[5709,1465,'-'],[8043,3217,'-'],[7315,2148,'-'],[6482,3567,'-'],[9001,4786,'-'],[8120,3965,'-'],
[6342,2875,'-'],[7210,4586,'-'],[8005,3768,'-'],[9654,4879,'-'],[5430,2687,'-'],[35482,12341,'-'],[58764,23152,'-'],[70215,18463,'-'],[83642,31527,'-'],[95130,42718,'-'],
[62481,27896,'-'],[70004,35678,'-'],[81250,46793,'-'],[90321,58476,'-'],[54000,27865,'-'],[68420,39786,'-'],[73105,46879,'-'],[82003,57964,'-'],[96540,68795,'-'],[60000,34876,'-']
];
const presets=raw.map(([a,b,op],i)=>({id:i+1,a,b,op,answer:op==='+'?a+b:a-b}));
let current=presets[0],filter='all',score=0,attempts=0,animToken=0;const $=s=>document.querySelector(s);
const fmt=n=>n.toLocaleString('uz-UZ').replace(/,/g,' ');const expr=p=>`${fmt(p.a)} ${p.op} ${fmt(p.b)}`;
function hasRegroup(p){if(p.op==='+'){let a=p.a,b=p.b,c=0;while(a||b){if((a%10)+(b%10)+c>=10)return true;c=((a%10)+(b%10)+c)>=10?1:0;a=Math.floor(a/10);b=Math.floor(b/10)}}else{let a=p.a,b=p.b,borrow=0;while(a||b){let da=a%10-borrow,db=b%10;if(da<db)return true;borrow=da<db?1:0;a=Math.floor(a/10);b=Math.floor(b/10)}}return false}
function matching(){if(filter==='add')return presets.filter(p=>p.op==='+');if(filter==='sub')return presets.filter(p=>p.op==='-');if(filter==='borrow')return presets.filter(hasRegroup);return presets}
function renderProblem(){ $('#problem').textContent=expr(current)+' = ?';$('#answer').value='';$('#feedback').textContent='';$('#feedback').className='feedback';$('#steps').innerHTML='<li>“Tushuntir” tugmasini bosing.</li>';$('#placeValues').innerHTML='';$('#columnMath').textContent='';$('#numberline').innerHTML='';$('#answer').focus() }
function pick(){const a=matching();current=a[Math.floor(Math.random()*a.length)];renderProblem()}
function digits(n){return String(Math.abs(n)).padStart(5,'0').split('').map(Number)}
function placeView(p){const labels=['10 000','1 000','100','10','1'];const a=digits(p.a),b=digits(p.b);$('#placeValues').innerHTML=labels.map((l,i)=>`<div class="pv"><span>${l}</span><strong>${a[i]}</strong><span>${p.op} ${b[i]}</span></div>`).join('')}
function columnExplain(p){const w=Math.max(String(p.a).length,String(p.b).length,String(p.answer).length);const A=String(p.a).padStart(w),B=String(p.b).padStart(w),R=String(p.answer).padStart(w);$('#columnMath').textContent=`  ${A}\n${p.op} ${B}\n${'─'.repeat(w+2)}\n  ${R}`}
function stepExplain(p){
  const steps=[];
  let place=1,carry=0,borrow=0;
  const names=['birlik','o‘nlik','yuzlik','minglik','o‘n minglik'];
  for(let i=0;i<5;i++){
    const da=Math.floor(p.a/place)%10;
    const db=Math.floor(p.b/place)%10;
    if(p.op==='+'){
      const sum=da+db+carry;
      steps.push(`${names[i]}: ${da} + ${db}${carry?` + ${carry} (o‘tgan)`:''} = ${sum}. ${sum>=10?`${sum%10} yozamiz, 1 ni keyingi xonaga o‘tkazamiz.`:`${sum} yozamiz.`}`);
      carry=sum>=10?1:0;
    }else{
      let top=da-borrow;
      if(top<db){
        steps.push(`${names[i]}: ${top} dan ${db} ni ayirib bo‘lmaydi; chap xonadan 1 o‘nlik qarz olamiz. ${top+10} − ${db} = ${top+10-db}.`);
        borrow=1;
      }else{
        steps.push(`${names[i]}: ${top} − ${db} = ${top-db}.`);
        borrow=0;
      }
    }
    place*=10;
  }
  $('#steps').innerHTML=steps.map(s=>`<li>${s}</li>`).join('');
}
function drawLine(p,animate=false){const svg=$('#numberline'),L=55,R=845,Y=95;const start=p.a,end=p.answer;const min=Math.min(start,end),max=Math.max(start,end),span=Math.max(1,max-min),pad=Math.max(500,Math.ceil(span*.12));const lo=Math.max(0,min-pad),hi=max+pad;const x=v=>L+(v-lo)/(hi-lo)*(R-L);let out=`<line x1="${L}" y1="${Y}" x2="${R}" y2="${Y}" stroke="#222" stroke-width="3"/>`;for(let i=0;i<=8;i++){const v=Math.round(lo+(hi-lo)*i/8),xx=x(v);out+=`<line x1="${xx}" y1="${Y-7}" x2="${xx}" y2="${Y+7}" stroke="#777"/><text x="${xx}" y="${Y+28}" text-anchor="middle" font-size="13">${fmt(v)}</text>`}const sx=x(start),ex=x(end);out+=`<path d="M ${sx} ${Y-15} Q ${(sx+ex)/2} 25 ${ex} ${Y-15}" fill="none" stroke="#111" stroke-width="4" stroke-dasharray="8 7"/><circle id="walker" class="walker" cx="${sx}" cy="${Y}" r="10" fill="#111"/><text x="${sx}" y="45" text-anchor="middle" font-weight="700">${fmt(start)}</text><text x="${ex}" y="160" text-anchor="middle" font-weight="700">${fmt(end)}</text>`;svg.innerHTML=out;if(animate){const token=++animToken;const walker=$('#walker');requestAnimationFrame(()=>{if(token===animToken)walker.setAttribute('cx',ex)})}}
function explain(animate=false){$('#explainTitle').textContent=expr(current)+' qanday ishlaydi?';placeView(current);columnExplain(current);stepExplain(current);drawLine(current,animate)}
function check(){const v=Number($('#answer').value.replace(/\s/g,''));if(!Number.isFinite(v))return;attempts++;if(v===current.answer){score++;$('#feedback').textContent='To‘g‘ri! Zo‘r. Endi keyingisini quramiz.';$('#feedback').className='feedback ok'}else{$('#feedback').textContent='Hali emas. “Tushuntir” yoki “Harakatlantir”ni bosib ko‘r.';$('#feedback').className='feedback bad'}$('#score').textContent='To‘g‘ri: '+score;$('#attempts').textContent='Urinish: '+attempts}
function renderBank(list=presets){$('#problemBank').innerHTML=list.map(p=>`<button class="bank-item" data-id="${p.id}">${expr(p)}</button>`).join('');document.querySelectorAll('.bank-item').forEach(b=>b.onclick=()=>{current=presets.find(p=>p.id==b.dataset.id);renderProblem();window.scrollTo({top:0,behavior:'smooth'})})}
document.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{document.querySelectorAll('.chip').forEach(x=>x.classList.remove('active'));b.classList.add('active');filter=b.dataset.filter;pick()});$('#newProblem').onclick=pick;$('#check').onclick=check;$('#show').onclick=()=>explain(false);$('#animate').onclick=()=>explain(true);$('#shuffleBank').onclick=()=>renderBank([...presets].sort(()=>Math.random()-.5));$('#answer').addEventListener('keydown',e=>{if(e.key==='Enter')check()});renderBank();renderProblem();