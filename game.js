'use strict';
const $=id=>document.getElementById(id), dialog=document.querySelector('dialog'), article=dialog.querySelector('article');
const ranks=['','A','2','3','4','5','6','7','8','9','10','J','Q','K'], suits=['♠','♥','♣','♦'];
const key='noctis.spider.v1', recordKey=key+'.records';
function read(k,fallback){try{return JSON.parse(localStorage.getItem(k))??fallback}catch{return fallback}}
function write(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{$('note').textContent='Armazenamento indisponível neste navegador.'}}
function create(n){
 const deck=[];for(let pack=0;pack<8;pack++)for(let r=1;r<=13;r++)deck.push({r,s:pack%n,up:false});
 for(let i=103;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
 const piles=Array.from({length:10},(_,i)=>deck.splice(0,i<4?6:5));piles.forEach(p=>p.at(-1).up=true);
 return {n,piles,stock:deck,done:[],moves:0,seconds:0,id:Date.now(),history:[]}
}
let saved=read(key,null),g=saved||create(1),selected=null,target=-1,animated=[],drag=null;
const save=()=>{if(saved)write(key,g)}, clock=t=>Math.floor(t/60)+':'+String(t%60).padStart(2,'0'), points=()=>500+100*g.done.length-g.moves;
function sequence(p,i){return !!p[i]?.up&&p.slice(i+1).every((c,k)=>c.up&&c.s===p[i].s&&p[i+k].r===c.r+1)}
function legal(a,i,b){const p=g.piles[a],q=g.piles[b];return a!==b&&sequence(p,i)&&(!q.length||q.at(-1).r===p[i].r+1)}
function checkpoint(){g.history.push(JSON.stringify([g.piles,g.stock,g.done]));if(g.history.length>80)g.history.shift()}
function settle(){
 lastTap=null;const before=g.done.length, distributed=animated.length===10;
 for(const p of g.piles){while(p.length){p.at(-1).up=true;if(p.length<13||!sequence(p,p.length-13))break;g.done.push(p.at(-1).s);p.splice(-13);$('note').textContent='Sequência completa! +100 pontos ✧'}}
 selected=null;target=-1;g.moves++;save();const landing=animated.at(-1);render();tone(g.done.length>before?'complete':distributed?'deal':'move');spark(landing);
 if(g.done.length===8){let list=read(recordKey,[]);if(!list.some(x=>x.id===g.id)){list.push({id:g.id,n:g.n,points:points(),time:g.seconds});write(recordKey,list)}show('<h2>Mesa completa ✧</h2><p>'+points()+' pontos em '+clock(g.seconds)+'. Seu resultado entrou nos recordes locais.</p>')}
}
function move(a,i,b){if(!legal(a,i,b))return false;checkpoint();g.piles[b].push(...g.piles[a].splice(i));animated=[b];settle();return true}
const sizeControl=$('size');
const savedSize=String(read(key+'.size',100));
sizeControl.value=['80','100','125'].includes(savedSize)?savedSize:'100';
function applySize(){
 $('board').style.width=sizeControl.value+'%';
 render();
}
sizeControl.onchange=()=>{write(key+'.size',Number(sizeControl.value));applySize()};
function render(){
 $('score').textContent=points();$('time').textContent=clock(g.seconds);const rows=g.stock.length/10; $('count').textContent=rows===0?'Reserva vazia':rows+(rows===1?' fileira restante':' fileiras restantes'); $('deal').disabled=!g.stock.length; $('progress').textContent=g.done.length+'/8'; $('undo').disabled=!g.history.length||g.done.length===8;
 const board=$('board');board.style.width=sizeControl.value+'%';board.replaceChildren();let max=0;
 g.piles.forEach((p,a)=>{const col=document.createElement('div');col.className='pile'+(a===target?' target':'');col.dataset.a=a;board.append(col);let top=0;
 p.forEach((c,i)=>{const el=document.createElement('div');el.className='card '+(!c.up?'back':c.s%2?'red':'')+(selected?.a===a&&i>=selected.i?' picked':'')+(animated.includes(a)&&i===p.length-1?' arrival':'');el.style.top=top+'px';el.dataset.i=i;
 if(c.up){el.innerHTML=ranks[c.r]+'<em>'+suits[c.s]+'</em><span class="pip">'+suits[c.s]+'</span><span class="corner">'+ranks[c.r]+'</span>';el.draggable=sequence(p,i)}
 col.append(el);if(i<p.length-1)top+=c.up?Math.max(18,col.clientWidth*.25):Math.max(6,Math.min(13,innerWidth*.011));
 });max=Math.max(max,top+col.clientWidth/0.71)});board.style.height=Math.ceil(max+12)+'px';animated=[]
}
function pos(e){const col=e.target.closest('.pile');return col?{a:+col.dataset.a,i:+(e.target.closest('.card')?.dataset.i??-1)}:null}
let lastTap=null;
function autoDestination(a,i){
 const card=g.piles[a][i];
 if(!sequence(g.piles[a],i))return -1;
 const options=g.piles.map((pile,b)=>({pile,b})).filter(({pile,b})=>pile.length&&legal(a,i,b));
 return (options.find(({pile})=>pile.at(-1).s===card.s)||options[0])?.b??-1;
}
$('board').onclick=e=>{
 const t=pos(e);if(!t)return;
 $('note').textContent='';
 const now=performance.now();
 if(lastTap&&lastTap.a===t.a&&lastTap.i===t.i&&now-lastTap.time<450){
  lastTap=null;const b=autoDestination(t.a,t.i);
  if(b!==-1){move(t.a,t.i,b);return}
  $('note').textContent='Nenhuma carta compatível para essa sequência.';return;
 }
 if(selected&&move(selected.a,selected.i,t.a)){lastTap=null;return}
 lastTap={...t,time:now};selected=sequence(g.piles[t.a],t.i)?t:null;target=-1;render();
};
$('board').ondragstart=e=>{drag=pos(e);if(!drag)return;e.dataTransfer.setData('text/plain','carta');e.dataTransfer.effectAllowed='move'};
$('board').ondragover=e=>e.preventDefault();$('board').ondrop=e=>{e.preventDefault();const t=pos(e);if(drag&&t)move(drag.a,drag.i,t.a);drag=null};$('board').ondragend=()=>drag=null;
$('deal').onclick=()=>{if(!g.stock.length)return;if(g.piles.some(p=>!p.length)){ $('note').textContent='Preencha as colunas vazias antes de distribuir.';return}checkpoint();g.piles.forEach(p=>{const c=g.stock.pop();c.up=true;p.push(c)});animated=g.piles.map((_,i)=>i);settle()};
$('undo').onclick=()=>{if(!g.history.length||g.done.length===8)return;[g.piles,g.stock,g.done]=JSON.parse(g.history.pop());lastTap=null;tone('undo');g.moves++;selected=null;target=-1;$('note').textContent='Última jogada desfeita.';save();render()};
$('hint').onclick=()=>{let best=null;g.piles.forEach((p,a)=>p.forEach((c,i)=>g.piles.forEach((q,b)=>{if(!legal(a,i,b)||(!i&&!q.length))return;const value=(q.at(-1)?.s===c.s?4:0)+(i&&!p[i-1].up?2:0)+(q.length?1:0);if(!best||value>best.value)best={a,i,b,value}})));if(best){selected={a:best.a,i:best.i};target=best.b;$('note').textContent='Mova '+ranks[g.piles[best.a][best.i].r]+suits[g.piles[best.a][best.i].s]+' da coluna '+(best.a+1)+' para a '+(best.b+1)+'.';render()}else $('note').textContent=g.stock.length?'Tente distribuir uma nova fileira.':'Tente desfazer uma jogada.'};
function show(html){article.innerHTML=html;if(!dialog.open)dialog.showModal()}
$('close').onclick=()=>dialog.close();$('help').onclick=()=>show('<h2>Como jogar</h2><p>Forme oito sequências do rei ao ás, todas do mesmo naipe. Coloque uma carta sobre outra de valor imediatamente maior. Uma coluna vazia aceita qualquer carta.</p><p>Dê dois cliques ou dois toques para encaixar automaticamente, com preferência pelo mesmo naipe. Arraste com o mouse ou toque na carta e depois na coluna de destino. Um grupo só se move junto quando está em ordem e tem o mesmo naipe.</p><p>Cada jogada custa 1 ponto. Completar uma sequência rende 100. A reserva distribui uma carta por coluna.</p>');
$('play').onclick=()=>{show('<h2>Nova partida</h2><p>Escolha a dificuldade para substituir a mesa atual.</p>'+[1,2,4].map(n=>'<button data-n="'+n+'">'+n+(n===1?' naipe':' naipes')+'</button>').join(''));article.querySelectorAll('button').forEach(b=>b.onclick=()=>{g=create(+b.dataset.n);saved=g;selected=null;target=-1;animated=g.piles.map((_,i)=>i);$('note').textContent='';dialog.close();enterTable();save()})};
$('records').onclick=()=>{const list=read(recordKey,[]);show('<h2>Recordes locais</h2>'+[1,2,4].map(n=>{const rows=list.filter(x=>x.n===n);return '<h3>'+n+(n===1?' naipe':' naipes')+'</h3><p>'+(rows.length?'Melhor pontuação · '+Math.max(...rows.map(x=>x.points))+'<br>Melhor tempo · '+clock(Math.min(...rows.map(x=>x.time))):'Nenhuma vitória ainda.')+'</p>'}).join(''))};
setInterval(()=>{if(!$('table').hidden&&!document.hidden&&!dialog.open&&g.done.length<8){g.seconds++;$('time').textContent=clock(g.seconds);if(g.seconds%5===0)save()}},1000);addEventListener('pagehide',save);document.addEventListener('visibilitychange',save);
const canvas=$('sky'),ctx=canvas.getContext('2d');let dx=0,dy=0;
function paint(){const w=canvas.width=innerWidth,h=canvas.height=innerHeight;ctx.clearRect(0,0,w,h);let seed=947;const rand=()=>((seed=seed*16807%2147483647)/2147483647);
 for(let i=0;i<220;i++){let x=rand()*w+dx,y=rand()*h+dy,r=rand();ctx.fillStyle='rgba(193,194,255,'+(.15+r*.55)+')';ctx.fillRect(x,y,r*2+.5,r*2+.5);if(r>.97){ctx.fillRect(x-3,y+1,8,1);ctx.fillRect(x+1,y-3,1,8)}}
 for(let layer=0;layer<3;layer++){ctx.beginPath();ctx.moveTo(-30,h);for(let x=-30;x<=w+30;x+=8){const base=h*(.78+layer*.085),ridge=Math.sin(x*.013+layer)*20+Math.cos(x*.005+layer)*32;ctx.lineTo(x+dx*layer,base+ridge-rand()*7+dy*layer)}ctx.lineTo(w+40,h);ctx.closePath();ctx.fillStyle=['#302852','#201e43','#131832'][layer];ctx.fill()}
}
let frame=0;addEventListener('pointermove',e=>{if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;dx=(e.clientX/innerWidth-.5)*8;dy=(e.clientY/innerHeight-.5)*6;if(!frame)frame=requestAnimationFrame(()=>{paint();frame=0})});addEventListener('resize',()=>{paint();render()});paint();syncLobby();

let muted=read(key+'.muted',false),audio;
function soundLabel(){ $('sound').textContent=muted?'Som desligado':'Som ligado';$('sound').setAttribute('aria-pressed',String(!muted)) }
function tone(type){
 if(muted)return;
 try{
  audio??=new (window.AudioContext||window.webkitAudioContext)();
  if(audio.state==='suspended')audio.resume().catch(()=>{});
  const notes={move:[392,523],deal:[247,294,349],complete:[392,494,587,784],undo:[392,294],start:[330,494]}[type];
  notes.forEach((freq,i)=>{const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime+i*.055;osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.001,t);gain.gain.exponentialRampToValueAtTime(.07,t+.009);gain.gain.exponentialRampToValueAtTime(.001,t+.18);osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.2)});
 }catch{}
}
function spark(col){
 if(col==null||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
 const card=$('board').children[col]?.lastElementChild;if(!card)return;
 const box=card.getBoundingClientRect();
 for(let i=0;i<6;i++){const star=document.createElement('span');star.className='spark';star.textContent='✦';star.style.left=box.left+box.width/2+'px';star.style.top=box.top+box.height/2+'px';const angle=i*Math.PI/3;star.style.setProperty('--x',Math.cos(angle)*box.width*.65+'px');star.style.setProperty('--y',Math.sin(angle)*box.width*.65+'px');document.body.append(star);setTimeout(()=>star.remove(),700)}
}
function syncLobby(){ $('resume').hidden=!saved||g.done.length===8;$('play').firstChild.textContent=saved?'Nova partida ':'Jogar agora ' }
function enterTable(){lastTap=null;$('lobby').hidden=true;$('table').hidden=false;render();tone('start')}
$('resume').onclick=enterTable;
$('home').onclick=()=>{save();selected=null;target=-1;lastTap=null;$('lobby').hidden=false;$('table').hidden=true;syncLobby();scrollTo(0,0)};
$('sound').onclick=()=>{muted=!muted;write(key+'.muted',muted);soundLabel();tone('move')};soundLabel();
