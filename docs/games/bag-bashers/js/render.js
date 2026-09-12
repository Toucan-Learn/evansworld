// ---------------- drawing ----------------
function px(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(x|0,y|0,w,h);}

// ---- per-world platform layouts (all tops within one jump of the ground) ----
function genPlatforms(L){
  const list=[], n=L.plats, usableW=levelWidth-520;
  if(L.layout==='flat'){
    for(let k=0;k<n;k++) list.push({x:420+k*300,y:GROUND-70,w:96});
  } else if(L.layout==='stairs'){
    for(let k=0;k<n;k++) list.push({x:340+k*(usableW/n),y:GROUND-(60+(k%4)*11),w:90});
  } else if(L.layout==='scatter'){
    for(let k=0;k<n;k++) list.push({x:340+k*(usableW/n)+rand(-40,40),y:GROUND-(60+((k*37)%34)),w:84});
  } else { // tiers: alternating high / low shelves
    for(let k=0;k<n;k++) list.push({x:360+k*(usableW/n),y:GROUND-((k%2)?94:66),w:88});
  }
  return list;
}

// ---- backdrop helpers ----
function shade(hex,amt){ const n=parseInt(hex.slice(1),16);
  const r=Math.max(0,Math.min(255,(n>>16)+amt)), g=Math.max(0,Math.min(255,((n>>8)&255)+amt)), b=Math.max(0,Math.min(255,(n&255)+amt));
  return '#'+((1<<24)+(r<<16)+(g<<8)+b).toString(16).slice(1); }
function tile(span,factor,cx,draw){ const start=-(((cx*factor)%span))-span;
  for(let x=start;x<W+span;x+=span){ const idx=Math.round((x+cx*factor)/span); draw(x,idx); } }
function ringDeco(x,y,r,c){ ctx.strokeStyle=c; ctx.lineWidth=2;
  for(let rr=r;rr>4;rr-=6){ ctx.beginPath(); ctx.arc(x,y,rr,0,Math.PI*2); ctx.stroke(); } }

function drawBackdrop(i,cx){
  if(LEVELS[i].theme){ drawChickenBackdrop(LEVELS[i].theme,cx); return; }
  const bg=LEVELS[i].bg, dark=shade(bg,-16), lite=shade(bg,26);
  if(i===0){                       // THE GYM: brick wall + wall targets
    ctx.globalAlpha=.07;
    for(let ry=6;ry<GROUND-4;ry+=16) px(-4,ry,W+8,2,'#fff');
    tile(40,0.3,cx,(x)=>{ for(let ry=6,r=0;ry<GROUND-4;ry+=16,r++) px(x+((r%2)?20:0),ry,2,16,'#fff'); });
    ctx.globalAlpha=1;
    tile(320,0.5,cx,(x)=>ringDeco(x+80,108,16,lite));
  } else if(i===1){                // THE ROOFTOPS: stars, moon, skyline
    ctx.globalAlpha=.6;
    tile(70,0.15,cx,(x,idx)=>px(x+((idx*23)%60),18+((idx*17)%90),2,2,'#fff'));
    ctx.globalAlpha=1;
    ctx.fillStyle='#e8e6d0'; ctx.beginPath(); ctx.arc(W-90,60,20,0,Math.PI*2); ctx.fill();
    tile(92,0.5,cx,(x,idx)=>{ const bw=72,h=70+(Math.abs(idx*53)%90);
      px(x,GROUND-h,bw,h,dark);
      ctx.globalAlpha=.4; for(let wy=GROUND-h+8;wy<GROUND-10;wy+=16) for(let wx=x+8;wx<x+bw-8;wx+=16) px(wx,wy,4,6,'#f2c14e'); ctx.globalAlpha=1; });
  } else if(i===2){                // THE DOCKS: masts, crates, water
    tile(170,0.3,cx,(x,idx)=>{ const my=GROUND-120-(idx%2)*20; px(x+40,my,3,120,lite); px(x+30,my,24,3,'#8d6e4a'); });
    tile(130,0.6,cx,(x,idx)=>{ const s=26,cy=GROUND-s;
      px(x,cy,s,s,'#8d5a28'); px(x+2,cy+2,s-4,s-4,'#a56a30');
      if(idx%2){ px(x,cy-s,s,s,'#7a4f24'); px(x+2,cy-s+2,s-4,s-4,'#8d5a28'); } });
    ctx.globalAlpha=.3; tile(24,0.85,cx,(x)=>px(x,GROUND-6,12,2,'#7fb2d9')); ctx.globalAlpha=1;
  } else if(i===3){                // THE VAULT: pillars, gold bars, bulbs
    tile(210,0.35,cx,(x)=>px(x+90,40,22,GROUND-40,dark));
    tile(64,0.55,cx,(x)=>{ for(let gy=90;gy<GROUND-70;gy+=42){ px(x+6,gy,28,11,'#f2c14e'); px(x+6,gy,28,3,'#fff2a8'); } });
    tile(230,0.2,cx,(x)=>{ px(x+100,0,2,28,'#000'); px(x+96,28,10,10,'#fff2a8'); });
  } else {                         // THE ARENA: crowd, spotlights, ropes
    ctx.globalAlpha=.5; for(let c=0;c<W;c+=14){ const hh=6+((c*13)%10); px(c,26-hh,10,hh+12,dark); } ctx.globalAlpha=1;
    ctx.globalAlpha=.10; ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.moveTo(W*0.30,0); ctx.lineTo(W*0.10,GROUND); ctx.lineTo(W*0.36,GROUND); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(W*0.70,0); ctx.lineTo(W*0.64,GROUND); ctx.lineTo(W*0.90,GROUND); ctx.closePath(); ctx.fill();
    ctx.globalAlpha=1;
    for(let ry=0;ry<3;ry++) px(-4,GROUND-44+ry*13,W+8,3,lite);
  }
}
function render(){
  const i=Math.min(level,MAX_LEVEL)-1;
  const BG=LEVELS[i].bg, FL=LEVELS[i].floor;
  if(state==='title' || !player){
    px(-4,0,W+8,H,BG);
    px(-4,GROUND,W+8,H-GROUND,FL);
    return;
  }
  const cx=camX();
  const sx=shakeT>0?(Math.random()*6-3):0, sy=shakeT>0?(Math.random()*6-3):0;
  ctx.save(); ctx.translate(sx,sy);

  px(-4,0,W+8,H,BG);
  drawBackdrop(i,cx);
  px(-4,GROUND,W+8,H-GROUND,FL);
  px(-4,GROUND,W+8,4,'#00000055');

  for(const p of plats){ const x=p.x-cx;
    px(x,p.y,p.w,10,FL); px(x,p.y,p.w,3,'#ffffff22'); px(x,p.y+8,p.w,2,'#00000055'); }

  drawPortal(60-cx,GROUND-30,COL.steel,'IN');
  if(!tyson) drawPortal(portalOut.x-cx,GROUND-30,COL.gold,'OUT');

  for(const b of bags) if(!b.broken) drawBag(b,cx);
  if(tyson) { if(tyson.chicken) drawChickenBoss(tyson,cx); else drawTyson(tyson,cx); }
  drawLittleChickens(cx);
  drawEggs(cx);
  drawPlayer(player,cx);
  drawParticles(cx); drawPopIcons(cx);

  ctx.restore();
  drawHUD();
  if(greenFlash>0){ ctx.globalAlpha=Math.min(.5,greenFlash); px(0,0,W,H,COL.grass); ctx.globalAlpha=1; }
}

function drawPortal(x,y,c,label){
  for(let r=30;r>5;r-=6){ ctx.strokeStyle=c; ctx.lineWidth=3;
    ctx.beginPath(); ctx.ellipse(x,y,r*0.62,r,0,0,Math.PI*2); ctx.stroke(); }
  ctx.fillStyle=c; ctx.font='bold 9px Courier New'; ctx.textAlign='center'; ctx.fillText(label,x,y+46);
}

function drawBag(b,cx){
  if(level>=6){drawChickenBag(b,cx); return;}
  const jit=b.shake>0?(Math.random()*4-2):0;
  const x=b.x-cx+jit, y=b.y, skins=[COL.blood,'#c77dff',COL.gold,'#4cc9f0',COL.bone], body=skins[bagSkin];
  px(x-1,y-34,3,10,'#8d6e4a');
  px(x-11,y-24,22,10,body); px(x-13,y-14,26,20,body); px(x-11,y+6,22,10,body);
  px(x-13,y-4,26,2,'#00000055');
  if(b.hp<b.maxHp){ const w=26,f=Math.max(0,Math.round(w*b.hp/b.maxHp));
    px(x-13,y-30,w,3,'#000'); px(x-13,y-30,f,3,COL.blood); }
  if(nearestBag()===b){ ctx.strokeStyle=COL.bone; ctx.lineWidth=1; ctx.strokeRect(x-15,y-26,30,34); }
  ctx.fillStyle='#00000088'; ctx.font='bold 14px Courier New'; ctx.textAlign='center'; ctx.fillText('?',x,y+2);
}

function drawPlayer(p,cx){
  const x=p.x-cx, y=p.y, f=p.face, gloves=[COL.blood,'#e63946',COL.gold,'#4cc9f0','#c77dff'];
  px(x-8,y+10,6,7,'#2b2b40'); px(x+2,y+10,6,7,'#2b2b40');
  px(x-9,y-8,18,20,CHARACTER_SKINS[characterSkin].shirt);
  if(characterSkin===4) {px(x-9,y-3,18,4,'#ffcf69');px(x-9,y+1,18,4,'#62d8c2');}
  px(x-7,y-22,14,14,CHARACTER_SKINS[characterSkin].skin); px(x-7,y-24,14,4,CHARACTER_SKINS[characterSkin].hair);
  const gx=f>0?x+9:x-17, punch=punchTimer>0.07;
  px(gx+(punch?f*6:0),y-4,10,10,gloves[gloveSkin]);
}

function drawTyson(t,cx){
  const x=t.x-cx, feet=GROUND, dir=t.dir||-1, W2=42;
  const body=t.hurt>0?'#fff':'#6b4a2f';
  // legs
  px(x-13,feet-16,9,16,'#3a2a1c'); px(x+4,feet-16,9,16,'#3a2a1c');
  // torso + head (about one and a half times the player)
  px(x-W2/2,feet-46,W2,32,body);
  px(x-13,feet-64,26,20,'#7a5638');
  px(x-8,feet-58,4,4,'#000'); px(x+4,feet-58,4,4,'#000'); px(x-6,feet-49,11,3,'#000');
  // back arm (static)
  px(dir>0? x-W2/2-6 : x+W2/2-2, feet-42, 8, 8, body);
  // punching arm: cocked on windup, thrust out on punch
  const ext = t.st==='punch'? 30 : (t.st==='windup'? -10 : 4);
  const shoulder = dir>0 ? x+W2/2 : x-W2/2;
  const fistX = shoulder + dir*(6+Math.max(-8,ext));
  px(Math.min(shoulder,fistX), feet-40, Math.abs(fistX-shoulder)+4, 8, body);
  px(fistX+(dir>0?0:-14), feet-44, 14, 14, COL.blood);
  // hp bar
  const w=88,f=Math.max(0,Math.round(w*t.hp/t.maxHp));
  px(x-w/2,feet-84,w,7,'#000'); px(x-w/2,feet-84,f,7,COL.blood);
  ctx.fillStyle=COL.bone; ctx.font='bold 9px Courier New'; ctx.textAlign='center'; ctx.fillText('MIKE TYSON',x,feet-88);
}

function drawParticles(cx){
  for(const p of particles){ const x=p.x-cx,y=p.y, a=Math.max(0,p.life/p.max);
    ctx.globalAlpha=p.flash?a:Math.min(1,a+.2);
    if(p.flash){ ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(x,y,p.size*a,0,Math.PI*2); ctx.fill(); }
    else px(x-p.size/2,y-p.size/2,p.size,p.size,p.color);
  } ctx.globalAlpha=1;
}
function drawPopIcons(cx){
  for(const q of popIcons){ const x=q.x-cx,y=q.y; ctx.globalAlpha=Math.max(0,Math.min(1,q.life/0.9));
    if(q.kind==='sack') drawSack(x,y);
    else if(q.kind==='arm') drawArm(x,y);
    else if(q.kind==='bang') drawBang(x,y,q.life,q.text);
    else if(q.kind==='text'){ ctx.fillStyle=q.color; ctx.font='bold 12px Courier New'; ctx.textAlign='center'; ctx.fillText(q.text,x,y); }
  } ctx.globalAlpha=1;
}
function drawSack(x,y){
  px(x-8,y-2,16,14,'#b5763b'); px(x-6,y+10,12,4,'#8d5a28');
  px(x-6,y-6,12,4,'#8d5a28');
  ctx.fillStyle='#3a2a12'; ctx.font='bold 11px Courier New'; ctx.textAlign='center'; ctx.fillText('$',x,y+9);
}
function drawArm(x,y){
  px(x-2,y+2,6,10,'#f1c27d'); px(x-2,y+2,12,6,'#f1c27d');
  px(x+8,y-2,8,8,'#e8b06a'); px(x-4,y-4,8,8,'#f6cf94');
}
function drawBang(x,y,life,text='BANG!'){
  const R=32*(1.25-0.25*Math.max(0,life/0.9));
  ctx.save(); ctx.translate(x,y);
  ctx.fillStyle='#f2c14e'; ctx.strokeStyle='#000'; ctx.lineWidth=3;
  ctx.beginPath();
  const spikes=11;
  for(let i=0;i<spikes*2;i++){ const rr=(i%2?R:R*0.5), ang=(i/(spikes*2))*Math.PI*2-Math.PI/2;
    const bx=Math.cos(ang)*rr, by=Math.sin(ang)*rr; i?ctx.lineTo(bx,by):ctx.moveTo(bx,by); }
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle='#d9576b'; ctx.font='bold 15px Courier New'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(text,0,1); ctx.textBaseline='alphabetic';
  ctx.restore();
}

function drawHUD(){
  px(0,0,W,45,'#191728dd'); px(0,GROUND+3,W,H-GROUND,'#191728ee');
  px(12,12,180,16,'#000'); const hw=Math.max(0,Math.round(176*health/CONFIG.maxHealth));
  px(14,14,hw,12, health>34?COL.grass:COL.blood);
  ctx.fillStyle=COL.bone; ctx.font='bold 10px Courier New'; ctx.textAlign='left'; ctx.fillText('HP '+Math.max(0,Math.round(health)),18,24);
  ctx.textAlign='right';
  ctx.fillStyle=COL.gold; ctx.fillText('$'+money.toLocaleString(),W-14,22);
  ctx.fillStyle=COL.steel; ctx.fillText('STR '+strength,W-14,36);
  ctx.fillStyle=COL.bone; ctx.fillText((level>5?'CHICKEN '+(level-5)+'/5':'CLASSIC '+level+'/5')+(tyson?' BOSS':'')+'  DMG '+damagePerPunch(),W-14,H-26);
  ctx.textAlign='center'; ctx.fillStyle=COL.bone; ctx.fillText(LEVELS[iSafe()].name,W/2,22);
  ctx.fillStyle=COL.steel; ctx.fillText('SHIELDS '+shields,W/2,37);
  if(LEVELS[level-1].jackpot){ctx.fillStyle=COL.gold;ctx.fillText('15 BOMBS • FIND & BREAK THE $50K BAG TO OPEN THE EXIT',W/2,H-9);}
  const done=bags.filter(b=>b.broken).length;
  ctx.textAlign='left'; ctx.fillStyle=COL.bone; ctx.fillText('BAGS '+done+'/'+bags.length,14,H-26);
  if(tyson){ ctx.textAlign='center'; ctx.fillStyle=COL.gold; ctx.fillText(tyson.chicken?chickenHint():'Tyson blocks the portal. Put him down.',W/2,H-9); }
  if(levelIntroT>0){
    const L=LEVELS[Math.min(level,MAX_LEVEL)-1];
    ctx.fillStyle='#000'; ctx.fillRect(W/2-150,H/2-38,300,64);
    ctx.strokeStyle=COL.gold; ctx.lineWidth=2; ctx.strokeRect(W/2-150,H/2-38,300,64);
    ctx.textAlign='center';
    ctx.fillStyle=COL.gold; ctx.font='bold 17px Courier New'; ctx.fillText(level>5?'CHICKEN WORLD • '+(level-5)+'/5':'CLASSIC • '+level+'/5',W/2,H/2-8);
    ctx.fillStyle=COL.bone; ctx.font='bold 13px Courier New'; ctx.fillText(L.name,W/2,H/2+16);
  }
}



function iSafe(){return Math.min(level,MAX_LEVEL)-1;}
