/* Versioned checkpoints are stored locally, never sent to a server. */
function snapshot(phase='play'){return {version:2,phase,level,money,strength,gloveLevel,shoeLevel,gloveSkin,bagSkin,characterSkin,ownedSkins:[...ownedSkins],armorLevel,jumpLevel,shields,scanner};}
function validSave(s){return s&&s.version===2&&['play','shop','win'].includes(s.phase)&&Number.isInteger(s.level)&&s.level>=1&&s.level<=MAX_LEVEL&&['money','strength','gloveLevel','shoeLevel','gloveSkin','bagSkin','characterSkin','armorLevel','jumpLevel','shields'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)&&s.gloveLevel>=1&&s.shoeLevel<=5&&s.gloveSkin<5&&s.bagSkin<5&&s.characterSkin<CHARACTER_SKINS.length&&s.armorLevel<=5&&s.jumpLevel<=3&&s.shields<=5&&Array.isArray(s.ownedSkins)&&s.ownedSkins.every(k=>Number.isInteger(k)&&k>=0&&k<CHARACTER_SKINS.length)&&s.ownedSkins.includes(s.characterSkin)&&typeof s.scanner==='boolean';}
function restoreSnapshot(s){({level,money,strength,gloveLevel,shoeLevel,gloveSkin,bagSkin,characterSkin,armorLevel,jumpLevel,shields,scanner}=s);ownedSkins=[...s.ownedSkins];strength=Math.min(strength,CONFIG.maxStrength);gloveLevel=Math.min(gloveLevel,CONFIG.maxGloveLevel);shoeLevel=Math.min(shoeLevel,CONFIG.maxShoeLevel);jumpLevel=Math.min(jumpLevel,CONFIG.maxJumpLevel);armorLevel=Math.min(armorLevel,CONFIG.maxArmorLevel);scanner=false;}
function saveCheckpoint(phase='play'){
  checkpoint=snapshot(phase);
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(checkpoint));document.getElementById('continueBtn').hidden=false;}
  catch(e){document.getElementById('saveNotice').textContent='Browser storage is unavailable. Progress will last until this page is closed.';}
}
function readSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return validSave(s)?s:null;}catch(e){return null;}}
function continueGame(){const s=readSave()||checkpoint;if(!s)return;restoreSnapshot(s);checkpoint=s;buildLevel(level);if(s.phase==='win'){state='win';running=false;showVictory();}else if(s.phase==='shop'){openShop();}else{hideAll();state='play';running=true;}}
function extraShopItems(){
  const armorCost=500*(armorLevel+1), jumpCost=400*(jumpLevel+1);
  const items=[
    {t:'Feather Armour '+armorLevel+'/2',d:'Take 3 less damage per level from boss attacks.',c:armorCost,can:armorLevel<CONFIG.maxArmorLevel&&money>=armorCost,act:()=>{money-=armorCost;armorLevel++;}},
    {t:'Spring Boots '+jumpLevel+'/1',d:'Jump higher to reach bags and dodge eggs.',c:jumpCost,can:jumpLevel<CONFIG.maxJumpLevel&&money>=jumpCost,act:()=>{money-=jumpCost;jumpLevel++;}},
    {t:'Bomb Shield ('+shields+'/5)',d:'Absorbs one bomb. Carry up to five.',c:750,can:money>=750&&shields<5,act:()=>{money-=750;shields++;}},
    {t:'Power Training',d:'+10 strength. Maximum 50.',c:600,can:money>=600&&strength<CONFIG.maxStrength,act:()=>{money-=600;strength=Math.min(CONFIG.maxStrength,strength+10);}},
  ];
  CHARACTER_SKINS.forEach((skin,i)=>{const owned=ownedSkins.includes(i);items.push({t:skin.name+(characterSkin===i?' • ON':''),d:owned?'Owned outfit. Switch for free.':'Unlock a new character outfit.',c:owned?0:skin.cost,can:characterSkin!==i&&money>=(owned?0:skin.cost),act:()=>{if(!owned){money-=skin.cost;ownedSkins.push(i);}characterSkin=i;}});});
  return items;
}
function togglePause(){if(state==='play'&&running){pausedFrom=state;running=false;state='paused';input.left=input.right=false;jumpQueued=false;show('ovPause');}else if(state==='paused'){state='play';running=true;hideAll();last=performance.now();}}
function goMenu(){clearTimeout(bombTimer);running=false;state='title';input.left=input.right=false;show('ovTitle');document.getElementById('continueBtn').hidden=!(readSave()||checkpoint);}
addEventListener('blur',()=>{input.left=input.right=false;jumpQueued=false;if(state==='play'&&running)togglePause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='play'&&running)togglePause();});
const notice=document.createElement('div');notice.id='saveNotice';notice.setAttribute('role','status');document.getElementById('wrap').appendChild(notice);
document.getElementById('continueBtn').hidden=!readSave();
requestAnimationFrame(loop);

// A website game card opens its own five-level campaign and save slot.
if(typeof location!=='undefined'){
 const params=new URLSearchParams(location.search);
 if(params.get('embed')==='1')document.body.classList.add('embedded');
 const campaign=params.get('chapter');
 if(campaign==='mike-tyson'||campaign==='chicken-boss'){
  const chicken=campaign==='chicken-boss';
  SAVE_KEY=chicken?'evans-chicken-boss-v2':'evans-mike-tyson-v2';
  const saved=readSave();
  if(saved&&((saved.level>5)===chicken))continueGame();else startGame(chicken);
 }
}

function chooseCampaign(chicken){
 SAVE_KEY=chicken?'evans-chicken-boss-v2':'evans-mike-tyson-v2';
 const saved=readSave();
 if(saved&&saved.phase!=='win'&&((saved.level>5)===chicken))continueGame();else startGame(chicken);
}
