
/* ============================================================
   BAG BASHERS - Mario-style platformer prototype
   All tuning lives in CONFIG so it is easy to rebalance.
   ============================================================ */


const cv=document.getElementById('c'), ctx=cv.getContext('2d');
const W=cv.width, H=cv.height;
const GROUND=H-46;

let money=0, strength=0, gloveLevel=1, shoeLevel=0, gloveSkin=0, bagSkin=0;
let level=1; const MAX_LEVEL=LEVELS.length;

let player, bags, plats, poisonHits, health, regenTimer, punchTimer, greenFlash, levelIntroT=0;
let particles=[], popIcons=[], shakeT=0, levelWidth=W, portalOut, tyson;
let running=false, state='title';
let characterSkin=0, ownedSkins=[0], armorLevel=0, jumpLevel=0, shields=0, scanner=false, checkpoint=null;
let eggs=[], bossClock=0, pausedFrom='play', bombTimer=null;
let SAVE_KEY='evans-bag-bashers-v2';

const CSS=getComputedStyle(document.documentElement);
const COL={ bone:CSS.getPropertyValue('--bone').trim(), gold:CSS.getPropertyValue('--gold').trim(),
  steel:CSS.getPropertyValue('--steel').trim(), blood:CSS.getPropertyValue('--blood').trim(),
  grass:CSS.getPropertyValue('--grass').trim(), ink:CSS.getPropertyValue('--ink').trim() };
// Five distinct worlds. Each level reads its whole design from here.


// ---------------- input ----------------
const input={left:false,right:false};
let jumpQueued=false;
addEventListener('keydown',e=>{
  const k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a') input.left=true;
  if(k==='arrowright'||k==='d') input.right=true;
  if((k==='arrowup'||k==='w')&&!e.repeat&&state==='play') jumpQueued=true;
  if((k==='p'||k==='escape')&&!e.repeat) togglePause();
  if(k===' ') doPunch();
  if(['arrowleft','arrowright','arrowup','arrowdown',' '].includes(k)) e.preventDefault();
});
addEventListener('keyup',e=>{
  const k=e.key.toLowerCase();
  if(k==='arrowleft'||k==='a') input.left=false;
  if(k==='arrowright'||k==='d') input.right=false;
});
function hold(id,on,off){
  const b=document.getElementById(id);
  b.addEventListener('pointerdown',e=>{e.preventDefault();on();});
  ['pointerup','pointerleave','pointercancel'].forEach(ev=>
    b.addEventListener(ev,e=>{e.preventDefault();off();}));
}
hold('leftBtn',()=>input.left=true,()=>input.left=false);
hold('rightBtn',()=>input.right=true,()=>input.right=false);
document.getElementById('jumpBtn').addEventListener('pointerdown',e=>{e.preventDefault();jumpQueued=true;});
document.getElementById('punchBtn').addEventListener('pointerdown',e=>{e.preventDefault();doPunch();});
document.getElementById('fsBtn').addEventListener('click',()=>{
  const el=document.getElementById('wrap');
  if(!document.fullscreenElement){ (el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el); }
  else { (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document); }
});
cv.addEventListener('pointerdown',e=>{
  if(state!=='play')return;
  const r=cv.getBoundingClientRect();
  const wx=(e.clientX-r.left)*(W/r.width)+camX();
  const b=nearestBag(); if(b && Math.abs(b.x-wx)<80) doPunch();
});

// ---------------- helpers ----------------
function d2(ax,ay,bx,by){return Math.hypot(ax-bx,ay-by);}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=(Math.random()*(i+1))|0;[a[i],a[j]]=[a[j],a[i]];}return a;}
function rand(a,b){return a+Math.random()*(b-a);}
function damagePerPunch(){return CONFIG.baseGloveDamage*Math.min(CONFIG.maxGloveLevel,gloveLevel)+Math.floor(Math.min(CONFIG.maxStrength,strength)/CONFIG.strengthToDamage);}
function runSpeed(){return CONFIG.runSpeed+Math.min(CONFIG.maxShoeLevel,shoeLevel)*CONFIG.shoeBonus;}
function camX(){return Math.max(0,Math.min(levelWidth-W, player.x-W*0.4));}
function nearestBag(){
  let best=null,bd=1e9;
  for(const b of bags){ if(b.broken)continue;
    const d=d2(player.x,player.y,b.x,b.y); if(d<bd){bd=d;best=b;} }
  return (best && bd<=CONFIG.punchRange)?best:null;
}

// ---------------- level building ----------------
function buildLevel(n){
  poisonHits=0; health=CONFIG.maxHealth; regenTimer=0; punchTimer=0; greenFlash=0;
  clearTimeout(bombTimer); eggs=[]; bossClock=0; input.left=input.right=false; jumpQueued=false;
  particles=[]; popIcons=[]; shakeT=0; tyson=null; levelIntroT=1.7;
  const L=LEVELS[n-1];
  levelWidth=L.boss?W:L.width;
  player={x:70,y:GROUND-17,vy:0,onGround:true,face:1,w:26,h:34};
  portalOut={x:levelWidth-60,y:GROUND-30};
  plats=[]; bags=[];

  if(L.chicken){ buildChickenBoss(); return; }
  if(L.boss){ buildBoss(); return; }

  plats=genPlatforms(L);

  // hidden contents: this world's poison + bombs, the rest split money/strength
  const types=[];
  for(let i=0;i<L.poison;i++) types.push('poison');
  for(let i=0;i<L.bomb;i++)   types.push('bomb');
  const rem=L.total-types.length;
  for(let i=0;i<rem;i++) types.push(L.jackpot?'jackpot':i%2?'money':'strength');
  shuffle(types);

  // anchor points: a bag on some platforms, the rest on ground or floating
  const anchors=[];
  plats.forEach((p,idx)=>{ if(idx<Math.min(plats.length,4)) anchors.push({x:p.x+p.w/2,y:p.y-20}); });
  const spread=levelWidth-460, start=260;
  const need=L.total-anchors.length;
  for(let i=0;i<need;i++){
    const x=start+spread*(i/(need-1||1))+rand(-46,46);
    const fly=Math.random()<L.floatC;
    anchors.push({x, y: fly ? GROUND-rand(70,96) : GROUND-22});
  }
  // Keep the large sketchbook silhouettes apart even when platforms overlap the ground layout.
  if(n>=6){
    anchors.sort((a,b)=>a.x-b.x);
    for(let j=1;j<anchors.length;j++){
      if(anchors[j].x-anchors[j-1].x<75 && Math.abs(anchors[j].y-anchors[j-1].y)<65){
        anchors[j].y=anchors[j-1].y>GROUND-60?GROUND-110:GROUND-22;
      }
    }
  }
  shuffle(anchors);

  for(let i=0;i<types.length;i++){
    const hp=Math.ceil(Math.round(rand(L.tough[0],L.tough[1]))*CONFIG.bagHealthMultiplier);
    bags.push({x:anchors[i].x,y:anchors[i].y,design:i%6,type:types[i],maxHp:hp,hp,broken:false,shake:0});
  }
}

function buildBoss(){
  const contents=shuffle(['money','strength','money','strength','poison','money']);
  for(let i=0;i<contents.length;i++){
    const hp=Math.ceil(Math.round(rand(4,9))*CONFIG.bagHealthMultiplier);
    bags.push({x:150+i*80,y:(i%2?GROUND-84:GROUND-22),type:contents[i],maxHp:hp,hp,broken:false,shake:0});
  }
  tyson={x:W-120,hp:CONFIG.tysonHP,maxHp:CONFIG.tysonHP,st:'idle',t:0.6,dir:-1,hurt:0,reach:66};
  portalOut={x:W-40,y:GROUND-30};
}

// ---------------- punching ----------------
function doPunch(){
  if(state!=='play'||!running||punchTimer>0) return;
  if(tyson && Math.abs(player.x-tyson.x)<tyson.reach+8 && (!tyson.chicken || Math.abs(player.y-(GROUND-65))<86)){
    punchTimer=tyson&&tyson.chicken?.24:CONFIG.punchCooldown; regenTimer=Math.max(regenTimer,CONFIG.regenDelay);
    health-=CONFIG.chipPerPunch; tyson.hp-=damagePerPunch(); tyson.hurt=0.12;
    beep(180+Math.random()*40,0.04); burst(tyson.x,GROUND-40,[COL.gold,COL.blood],6,140);
    if(tyson.hp<=0) return win();
    if(health<=0) return die();
    return;
  }
  const b=nearestBag(); if(!b) return;
  punchTimer=tyson&&tyson.chicken?.24:CONFIG.punchCooldown; regenTimer=Math.max(regenTimer,CONFIG.regenDelay);
  health-=CONFIG.chipPerPunch; b.hp-=damagePerPunch(); b.shake=0.15; beep(240,0.03);
  if(b.hp<=0) resolveBag(b);
  if(health<=0 && state==='play') die('You wore yourself down to nothing.');
}

function resolveBag(b){
  b.broken=true;
  switch(b.type){
    case 'money':{
      const g=Math.round((rand(8,14)+level*2)*(LEVELS[level-1].reward||1)); money+=g;
      coinPop(b.x,b.y); popIcons.push({x:b.x,y:b.y,vy:-40,life:0.9,kind:'sack'});
      floatText(b.x,b.y-8,'+$'+g,COL.gold); beep(520,0.08); break;
    }
    case 'jackpot':{ money+=50000; coinPop(b.x,b.y); floatText(b.x,b.y-30,'+$50,000 JACKPOT!',COL.gold); beep(720,.2); break; }
    case 'strength':{
      const g=Math.min(CONFIG.maxStrength-strength,Math.round(rand(2,4)+(level>5?2:level))); strength=Math.min(CONFIG.maxStrength,strength+g);
      burst(b.x,b.y,[COL.steel,'#bfe3ff'],10,120,true);
      popIcons.push({x:b.x,y:b.y,vy:-40,life:0.9,kind:'arm'});
      floatText(b.x,b.y-8,'+'+g+' STR',COL.steel); beep(440,0.08); break;
    }
    case 'bomb':{
      explosion(b.x,b.y); shakeT=0.5; beep(90,0.25);
      popIcons.push({x:b.x,y:b.y,life:0.9,vy:-8,kind:'bang',text:['KAPOW!','BANG!','BOOM!'][Math.floor(Math.random()*3)]});
      if(shields>0){ shields--; floatText(b.x,b.y-45,'SHIELD SAVED YOU',COL.steel); break; }
      running=false;
      bombTimer=setTimeout(()=>{if(state==='play'||state==='paused') die('BOOM! A bomb bag got you. Banked loot is safe. Try again!');},650);
      break;
    }
    case 'poison':{
      poisonHits++; health-=CONFIG.poisonDamage; greenFlash=0.5;
      greenSmoke(b.x,b.y); beep(140,0.18);
      if(poisonHits>=CONFIG.poisonToKill||health<=0)
        die('Third poison bag. You hit the floor, all green.');
      break;
    }
  }
}

// ---------------- particle effects ----------------
function burst(x,y,cols,n,spd,rise){
  for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2;
    particles.push({x,y,vx:Math.cos(a)*spd*rand(.3,1),vy:Math.sin(a)*spd*rand(.3,1)-(rise?80:0),
      life:rand(.4,.8),max:.8,size:rand(3,6),color:cols[(Math.random()*cols.length)|0],grav:900}); }
}
function explosion(x,y){
  particles.push({x,y,vx:0,vy:0,life:.18,max:.18,size:46,color:'#fff',grav:0,flash:true});
  const cols=['#f2c14e','#ff7b00','#d9576b','#fff2a8'];
  for(let i=0;i<26;i++){ const a=Math.random()*Math.PI*2, s=rand(120,340);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.3,.7),max:.7,
      size:rand(4,9),color:cols[(Math.random()*cols.length)|0],grav:700}); }
}
function greenSmoke(x,y){
  for(let i=0;i<16;i++){
    particles.push({x:x+rand(-8,8),y:y+rand(-6,6),vx:rand(-24,24),vy:rand(-60,-20),
      life:rand(.8,1.4),max:1.4,size:rand(6,12),color:COL.grass,grav:-40,smoke:true}); }
}
function coinPop(x,y){
  for(let i=0;i<10;i++){ const a=-Math.PI/2+rand(-.7,.7), s=rand(120,240);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:rand(.5,.9),max:.9,
      size:rand(4,6),color:COL.gold,grav:800}); }
}
function floatText(x,y,t,c){ popIcons.push({x,y,vy:-42,life:.9,kind:'text',text:t,color:c}); }

// ---------------- state changes ----------------
function startGame(chicken=false){
  SAVE_KEY=chicken?'evans-chicken-boss-v2':'evans-mike-tyson-v2';
  money=chicken?250:0; strength=chicken?10:0; gloveLevel=chicken?3:1; shoeLevel=0;
  gloveSkin=0; bagSkin=0; characterSkin=0; ownedSkins=[0]; armorLevel=0; jumpLevel=0; shields=0; scanner=false;
  level=chicken?6:1; hideAll();state='play';running=true;buildLevel(level); saveCheckpoint();
}
function die(msg){ state='reset';running=false;
  const banked=checkpoint?checkpoint.money:0;
  money=banked;
  document.getElementById('resetTitle').textContent="KO’d";
  show('ovReset');
}
function restartLevel(){ if(checkpoint) restoreSnapshot(checkpoint); hideAll();state='play';running=true;buildLevel(level); }
function showVictory(){ document.getElementById('winTitle').textContent=level>5?'CHICKEN BOSS DEFEATED!':'MIKE TYSON DEFEATED!'; document.getElementById('winMessage').textContent=level>5?'+$10,000':'All five levels cleared.'; show('ovWin'); }
function win(){ state='win';running=false; money+=level>5?1500:1000; saveCheckpoint('win'); showVictory();beep(660,0.4); }
function openShop(){ state='shop';running=false;
  if(level===5){ gloveLevel=Math.min(CONFIG.maxGloveLevel,Math.max(gloveLevel,3)); strength=Math.min(CONFIG.maxStrength,Math.max(strength,10)); }
  document.getElementById('shopTitle').textContent=level===5?'CHICKEN WORLD UNLOCKED!':LEVELS[level-1].name+' • CLEARED';
  document.getElementById('shopMoney').textContent='You have $'+money.toLocaleString()+'  |  STR '+strength;
  renderShop(); show('ovShop'); saveCheckpoint('shop');
}
function nextLevel(){ level=Math.min(MAX_LEVEL,level+1);
  hideAll();state='play';running=true;buildLevel(level); saveCheckpoint(); }

// ---------------- shop ----------------
function gloveCost(){return (level>5?300:30)*gloveLevel;}
function shoeCost(){return (level>5?400:25)*(shoeLevel+1);}
const SKIN_COST=15;
function renderShop(){
  const grid=document.getElementById('shopGrid');
  const items=[
    {t:'Gloves '+gloveLevel+'/'+CONFIG.maxGloveLevel,d:'+1 damage per punch. Bags break faster.',
      c:gloveCost(),can:money>=gloveCost()&&gloveLevel<CONFIG.maxGloveLevel,act:()=>{money-=gloveCost();gloveLevel=Math.min(CONFIG.maxGloveLevel,gloveLevel+1);}},
    {t:'Shoes '+shoeLevel+'/'+CONFIG.maxShoeLevel,d:'Run quicker across the level. Maximum level 2.',
      c:shoeCost(),can:money>=shoeCost()&&shoeLevel<CONFIG.maxShoeLevel,act:()=>{money-=shoeCost();shoeLevel=Math.min(CONFIG.maxShoeLevel,shoeLevel+1);}},
    {t:'Glove Skin',d:'Cosmetic. Cycles glove colour.',
      c:SKIN_COST,can:money>=SKIN_COST,act:()=>{money-=SKIN_COST;gloveSkin=(gloveSkin+1)%5;}},
    {t:'Bag Skin',d:'Cosmetic. Cycles bag colour.',
      c:SKIN_COST,can:money>=SKIN_COST,act:()=>{money-=SKIN_COST;bagSkin=(bagSkin+1)%5;}},
  ];
  items.push(...extraShopItems());
  grid.innerHTML='';
  items.forEach(it=>{ const el=document.createElement('div'); el.className='shopitem';
    el.innerHTML=`<b>${it.t}</b><small>${it.d}</small>`;
    const btn=document.createElement('button'); btn.className='buy'; btn.textContent='$'+it.c;
    btn.disabled=!it.can; btn.onclick=()=>{it.act();saveCheckpoint('shop');renderShop();
      document.getElementById('shopMoney').textContent='You have $'+money+'  |  STR '+strength;};
    el.appendChild(btn); grid.appendChild(el); });
}
function hideAll(){document.body.dataset.panel='';document.querySelectorAll('.overlay').forEach(o=>o.classList.remove('show'));}
function show(id){hideAll();document.body.dataset.panel=id;document.getElementById(id).classList.add('show');}

// ---------------- sound ----------------
let actx=null;
function beep(f,dur){try{actx=actx||new(window.AudioContext||window.webkitAudioContext)();
  const o=actx.createOscillator(),g=actx.createGain();o.type='square';o.frequency.value=f;
  g.gain.value=0.05;o.connect(g);g.connect(actx.destination);o.start();
  g.gain.exponentialRampToValueAtTime(0.0001,actx.currentTime+dur);o.stop(actx.currentTime+dur);}catch(e){}}

// ---------------- loop ----------------
let last=performance.now();
function loop(now){ const dt=Math.min(0.045,(now-last)/1000); last=now;
  if(running&&state==='play') update(dt);
  updateFx(dt); render(); requestAnimationFrame(loop); }

function update(dt){
  let vx=0; if(input.left)vx-=1; if(input.right)vx+=1;
  if(vx){ player.x+=vx*runSpeed()*dt; player.face=vx>0?1:-1; }
  if(jumpQueued && player.onGround){ player.vy=CONFIG.jumpVel-jumpLevel*28; player.onGround=false; beep(300,0.05); }
  jumpQueued=false;
  player.vy+=CONFIG.gravity*dt;
  const feetPrev=player.y+player.h/2;
  player.y+=player.vy*dt;
  let feet=player.y+player.h/2;
  player.onGround=false;
  if(feet>=GROUND){ player.y=GROUND-player.h/2; player.vy=0; player.onGround=true; feet=GROUND; }
  if(player.vy>0){
    for(const p of plats){
      if(player.x>p.x-4 && player.x<p.x+p.w+4 && feetPrev<=p.y+2 && feet>=p.y){
        player.y=p.y-player.h/2; player.vy=0; player.onGround=true; feet=p.y; break;
      }
    }
  }
  if(player.vy<0){
    const head=player.y-player.h/2, headPrev=feetPrev-player.h;
    for(const p of plats){
      const pb=p.y+10;
      if(player.x>p.x-4 && player.x<p.x+p.w+4 && headPrev>=pb && head<=pb){
        player.y=pb+player.h/2; player.vy=0; break;
      }
    }
  }
  player.x=Math.max(24,Math.min(levelWidth-24,player.x));

  if(punchTimer>0)punchTimer-=dt;
  if(regenTimer>0)regenTimer-=dt;
  else if(health<CONFIG.maxHealth) health=Math.min(CONFIG.maxHealth,health+(tyson&&tyson.chicken?4:CONFIG.regenPerSec)*dt);
  if(greenFlash>0)greenFlash-=dt;
  for(const b of bags) if(b.shake>0)b.shake-=dt;

  if(tyson && tyson.chicken){ updateChickenBoss(dt); if(state!=='play') return; }
  else if(tyson){
    if(tyson.hurt>0)tyson.hurt-=dt;
    const dx=player.x-tyson.x;
    tyson.dir = dx<0?-1:1;
    if(tyson.st==='idle'){
      if(Math.abs(dx)<tyson.reach){ tyson.st='windup'; tyson.t=0.42; }
      else tyson.x += Math.sign(dx)*72*dt;               // stalk toward you
    } else if(tyson.st==='windup'){
      tyson.t-=dt; if(tyson.t<=0){ tyson.st='punch'; tyson.t=0.16; tyson.hitDone=false; }
    } else if(tyson.st==='punch'){
      tyson.t-=dt;
      if(!tyson.hitDone && Math.abs(player.x-tyson.x)<tyson.reach+6){
        health-=Math.max(5,CONFIG.tysonHitDamage-armorLevel*3); regenTimer=CONFIG.regenDelay; tyson.hitDone=true; shakeT=0.22; beep(70,0.15);
        if(health<=0) return die();
      }
      if(tyson.t<=0){ tyson.st='recover'; tyson.t=0.5; }
    } else {
      tyson.t-=dt; if(tyson.t<=0) tyson.st='idle';
    }
    tyson.x=Math.max(60,Math.min(W-40,tyson.x));
  }

  if(!tyson && Math.abs(player.x-portalOut.x)<26 && state==='play'){
    if(!LEVELS[level-1].jackpot || bags.some(b=>b.type==='jackpot'&&b.broken)) openShop();
  }
}

function updateFx(dt){
  if(shakeT>0)shakeT-=dt;
  if(levelIntroT>0)levelIntroT-=dt;
  for(let i=particles.length-1;i>=0;i--){ const p=particles[i];
    p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=p.grav*dt; if(p.smoke)p.size+=14*dt;
    p.life-=dt; if(p.life<=0)particles.splice(i,1); }
  for(let i=popIcons.length-1;i>=0;i--){ const q=popIcons[i];
    q.y+=q.vy*dt; q.life-=dt; if(q.life<=0)popIcons.splice(i,1); }
}

