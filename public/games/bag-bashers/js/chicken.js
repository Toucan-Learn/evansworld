/* Chicken World: original canvas artwork inspired by Evan's sketchbook. */
function oval(x,y,rx,ry,color,stroke='#252337') {
  ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}
}
function poly(points,color,stroke=null){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function drawChickenBackdrop(theme,cx){
  const lava=theme==='lava', volcano=theme==='volcano';
  if(!lava){
    oval(600,77,29,29,volcano?'#ed8466':'#fff1b5',null);
    tile(230,.12,cx,(x)=>{oval(x+40,86,42,12,volcano?'#765670':'#e3f2e4',null);oval(x+66,75,31,14,volcano?'#765670':'#e3f2e4',null);});
  }
  if(theme==='coop'||theme==='field'){
    tile(460,.2,cx,x=>oval(x+160,335,270,155,'#709979',null));
    tile(360,.35,cx,x=>oval(x+80,366,215,128,'#557f62',null));
    if(theme==='coop') tile(600,.55,cx,x=>{
      px(x+50,166,190,193,'#b96449');poly([[x+25,175],[x+145,91],[x+265,175]],'#6a3e46');
      for(let i=0;i<7;i++)px(x+55+i*27,179,2,178,'#8f4c3e');
      px(x+115,245,64,114,'#583d3b');px(x+120,250,54,109,'#312d37');
      px(x+78,192,33,34,'#ffda81');px(x+91,192,4,34,'#65423b');px(x+78,207,33,4,'#65423b');
      ctx.font='bold 10px Courier New';ctx.textAlign='center';ctx.fillStyle='#fff0c2';ctx.fillText("EVAN'S COOP",x+149,155);
    });
    tile(62,.7,cx,x=>{px(x,298,7,61,'#d7b27a');poly([[x-1,298],[x+3,289],[x+8,298]],'#d7b27a');px(x,310,62,5,'#b58a60');px(x,336,62,5,'#b58a60');});
    if(theme==='field') tile(44,.8,cx,x=>{px(x,335,2,22,'#dec46b');oval(x+1,333,4,7,'#efda8c',null);});
  } else if(theme==='mountain'){
    tile(340,.2,cx,x=>{poly([[x-80,GROUND],[x+130,76],[x+340,GROUND]],'#697e9e');poly([[x+85,136],[x+130,76],[x+178,142],[x+137,123],[x+116,138]],'#eef2e9');});
    tile(210,.5,cx,x=>{poly([[x,GROUND],[x+96,187],[x+220,GROUND]],'#54647f');px(x+130,274,7,85,'#3c465d');poly([[x+102,304],[x+133,239],[x+164,304]],'#3d5c61');});
  } else if(volcano){
    tile(640,.22,cx,x=>{poly([[x-50,GROUND],[x+195,110],[x+275,110],[x+540,GROUND]],'#352d42');poly([[x+195,110],[x+220,151],[x+208,219],[x+242,198],[x+265,268],[x+250,170],[x+275,110]],'#ef754d');oval(x+235,107,42,9,'#ffcb63',null);oval(x+250,66,51,27,'#6b5265',null);});
    tile(180,.6,cx,x=>poly([[x,GROUND],[x+47,280],[x+84,319],[x+136,265],[x+184,GROUND]],'#584151'));
  } else {
    tile(120,.2,cx,x=>{poly([[x,0],[x+42,110],[x+75,0]],'#423047');poly([[x,GROUND],[x+68,242],[x+124,GROUND]],'#432e42');});
    tile(250,.35,cx,x=>{px(x+110,82,20,270,'#a64437');px(x+115,94,10,258,'#ff9952');});
    oval(W/2,GROUND+25,420,34,'#ff713b',null);
  }
  if(volcano||lava){
    tile(75,.7,cx,x=>{const yy=205+Math.sin(performance.now()/900+x)*35;oval(x,yy,2,4,'#fba65b',null);});
  }
}
function drawChickenBag(b,cx){
  const x=b.x-cx+(b.shake>0?rand(-2,2):0),y=b.y;
  if(x< -60||x>W+60)return;
  const colors=['#bdd973','#ed927f','#91cee0','#f1cb62','#bda0e6','#8bc9ae'];
  const body=colors[(b.design+bagSkin)%6];
  px(x-2,y+11,4,12,'#4a3541');px(x-13,y+22,26,4,'#302738');
  if(b.design===0){px(x-19,y-23,38,40,body);px(x-23,y-17,6,23,body);px(x+17,y-17,6,23,body);}
  else if(b.design===1){oval(x,y-5,19,24,body);oval(x-22,y-5,8,7,body);oval(x+22,y-5,8,7,body);}
  else if(b.design===2){px(x-25,y-22,50,34,body);poly([[x-24,y-22],[x-14,y-36],[x-8,y-22],[x+6,y-34],[x+16,y-22]],body,'#252337');}
  else if(b.design===3){oval(x,y-4,22,23,body);for(let a=0;a<7;a++) {const r=a*Math.PI/3.5;poly([[x+Math.cos(r)*22,y-4+Math.sin(r)*22],[x+Math.cos(r+.12)*31,y-4+Math.sin(r+.12)*31],[x+Math.cos(r+.3)*22,y-4+Math.sin(r+.3)*22]],'#f6c867');}}
  else if(b.design===4){oval(x,y-3,20,24,body);oval(x-22,y-7,7,13,'#f4d889');oval(x+22,y-7,7,13,'#f4d889');}
  else {px(x-20,y-22,40,37,body);for(let j=0;j<4;j++)px(x-16+j*9,y-20,4,31,'#d2e8a9');}
  poly([[x-13,y-26],[x-15,y-40],[x-6,y-33],[x,y-45],[x+6,y-33],[x+14,y-40],[x+12,y-26]],'#edc85d','#393044');
  oval(x-7,y-9,4,6,'#eee8d0');oval(x+7,y-9,4,6,'#eee8d0');px(x-7,y-11,2,5,'#252337');px(x+7,y-11,2,5,'#252337');
  ctx.textAlign='center';ctx.font='bold 10px Courier New';ctx.fillStyle='#292538';
  ctx.fillText('?',x,y+9);
  if(b.hp<b.maxHp){px(x-20,y-52,40,4,'#232239');px(x-20,y-52,40*Math.max(0,b.hp/b.maxHp),4,'#f4ce64');}
  if(nearestBag()===b){ctx.strokeStyle='#fff0bd';ctx.lineWidth=1;ctx.strokeRect(x-29,y-48,58,69);}
}
function buildChickenBoss(){
  tyson={chicken:true,x:W-135,hp:1200,maxHp:1200,st:'idle',t:.6,dir:-1,hurt:0,reach:92,cycle:0};
  plats=[{x:155,y:GROUND-88,w:100},{x:365,y:GROUND-88,w:95}];
  bags=[];
}
function hurtPlayer(damage){health-=Math.max(5,damage-armorLevel*3);regenTimer=2;greenFlash=0;shakeT=.14;beep(85,.08);if(health<=0)die('Grandma Chicken got you! Watch the warning, jump low eggs and pecks, and stay down for high eggs.');}
function updateChickenBoss(dt){
  const t=tyson;t.t-=dt;t.hurt=Math.max(0,t.hurt-dt);bossClock+=dt;t.dir=player.x<t.x?-1:1;
  if(t.st==='idle'){
    if(Math.abs(player.x-t.x)>115)t.x+=Math.sign(player.x-t.x)*85*dt;
    if(t.t<=0){t.cycle++;t.st=t.cycle%3===0?'peckWarning':'eggWarning';t.high=t.cycle%2===0;t.t=t.hp<t.maxHp/2?.45:.6;}
  }else if(t.st==='eggWarning'&&t.t<=0){
    eggs.push({x:t.x+t.dir*48,y:GROUND-(t.high?112:25),vx:t.dir*(t.hp<t.maxHp/2?365:310),life:4,spin:0});t.st='recover';t.t=.45;beep(380,.06);
  }else if(t.st==='peckWarning'&&t.t<=0){t.st='peck';t.t=.24;t.hitDone=false;
  }else if(t.st==='peck'){
    if(!t.hitDone&&Math.abs(player.x-t.x)<155&&player.y+player.h/2>GROUND-63){t.hitDone=true;hurtPlayer(36);}
    if(t.t<=0){t.st='recover';t.t=.6;}
  }else if(t.st==='recover'&&t.t<=0){t.st='idle';t.t=.3;}
  t.x=Math.max(80,Math.min(W-85,t.x));
  for(let i=eggs.length-1;i>=0;i--){const e=eggs[i];e.x+=e.vx*dt;e.spin+=dt*7;e.life-=dt;
    if(Math.abs(e.x-player.x)<player.w/2+9&&Math.abs(e.y-player.y)<player.h/2+11){eggs.splice(i,1);burst(e.x,e.y,['#fff7d9','#ffca65'],8,85);hurtPlayer(30);if(state!=='play')return;}
    else if(e.life<=0||e.x< -20||e.x>W+20)eggs.splice(i,1);
  }
}
function chickenHint(){const t=tyson;if(t.st==='peckWarning'||t.st==='peck')return 'PECK! Jump up or move away!';if(t.st==='eggWarning')return t.high?'HIGH EGG! Stay on the ground.':'LOW EGG! Get ready to JUMP!';return 'Punch Grandma Chicken • Watch the warnings • P to pause';}
function drawChickenBoss(t,cx){
  const x=t.x-cx,y=GROUND,dir=t.dir;
  // Silver hair, round goggle and yellow body echo Evan's whiteboard boss.
  px(x-20,y-26,9,26,'#edb94f');px(x+13,y-26,9,26,'#edb94f');
  poly([[x-31,y],[x-16,y-5],[x-5,y]],'#f0c15a');poly([[x+6,y],[x+19,y-5],[x+35,y]],'#f0c15a');
  oval(x,y-62,46,48,t.hurt>0?'#fff':'#f5d367');
  oval(x-dir*29,y-61,20,29,'#e5ba50');
  const ext=t.st==='peck'?55:0,headX=x+dir*(16+ext);
  oval(headX,y-112,34,31,t.hurt>0?'#fff':'#fff0b2');
  for(let j=0;j<5;j++)oval(headX-26+j*12,y-142-Math.sin(j*.8)*5,12,12,'#b6aabd');
  oval(headX+dir*12,y-115,14,15,'#eee8d9');oval(headX+dir*15,y-115,5,7,'#282538');
  px(headX-33,y-120,24,5,'#38313e');
  poly([[headX+dir*30,y-112],[headX+dir*54,y-102],[headX+dir*29,y-98]],'#e77354','#342a39');
  oval(headX+dir*26,y-88,7,12,'#c95263');
  if(t.st==='peckWarning'){ctx.strokeStyle='#ffb966';ctx.lineWidth=3;ctx.setLineDash([7,6]);ctx.strokeRect(x-155,y-59,310,58);ctx.setLineDash([]);}
  if(t.st==='eggWarning'){ctx.strokeStyle='#ffe1a1';ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(0,y-(t.high?112:25));ctx.lineTo(W,y-(t.high?112:25));ctx.stroke();ctx.setLineDash([]);}
  px(x-60,y-188,120,7,'#171725');px(x-60,y-188,120*Math.max(0,t.hp/t.maxHp),7,'#ed9b70');
  ctx.font='bold 10px Courier New';ctx.textAlign='center';ctx.fillStyle='#fff0d4';ctx.fillText('GRANDMA CHICKEN',x,y-197);
}
function drawEggs(cx){for(const e of eggs){ctx.save();ctx.translate(e.x-cx,e.y);ctx.rotate(e.spin);oval(0,0,9,12,'#fff4d4');ctx.restore();}}

// Small chickens count landed punches, so every upgrade still takes five hits.
let littleChickens=[];
function buildLittleChickens(n){
  littleChickens=n<6?[]:[.28,.52,.76].map((fraction,i)=>({x:levelWidth*fraction,home:levelWidth*fraction,hits:5,dir:i%2?1:-1,st:'walk',t:0,hurt:0}));
}
function punchLittleChicken(){
  const target=littleChickens.filter(c=>c.hits>0&&Math.abs(c.x-player.x)<CONFIG.punchRange&&Math.abs(player.y-(GROUND-18))<36).sort((a,b)=>Math.abs(a.x-player.x)-Math.abs(b.x-player.x))[0];
  if(!target)return false;
  punchTimer=.22;target.hits--;target.hurt=.18;target.st='recover';target.t=.45;
  target.x=Math.max(35,Math.min(levelWidth-35,target.x+(target.x<player.x?-12:12)));
  burst(target.x,GROUND-23,['#fff1d0','#e5ba67'],6,70);beep(340,.05);
  return true;
}
function updateLittleChickens(dt){
  for(const c of littleChickens){
    if(c.hits<=0)continue;
    c.hurt=Math.max(0,c.hurt-dt);c.t-=dt;
    const dx=player.x-c.x,grounded=player.y+player.h/2>GROUND-42;
    if(c.st==='walk'){
      if(Math.abs(dx)<48&&grounded){c.dir=dx<0?-1:1;c.st='warning';c.t=.4;}
      else {if(Math.abs(dx)<155)c.dir=dx<0?-1:1;else if(Math.abs(c.x-c.home)>65)c.dir=c.x>c.home?-1:1;c.x+=c.dir*32*dt;}
    }else if(c.st==='warning'&&c.t<=0){
      c.st='peck';c.t=.16;
      if(Math.abs(dx)<58&&grounded){health-=Math.max(6,14-armorLevel*2);regenTimer=Math.max(regenTimer,1.8);shakeT=.1;beep(100,.06);if(health<=0){die();return;}}
    }else if(c.st==='peck'&&c.t<=0){c.st='recover';c.t=1.1;}
    else if(c.st==='recover'&&c.t<=0)c.st='walk';
    c.x=Math.max(35,Math.min(levelWidth-35,c.x));
  }
}
function drawLittleChickens(cx){
  for(const c of littleChickens){
    if(c.hits<=0)continue;
    const x=c.x-cx,y=GROUND;if(x< -50||x>W+50)continue;
    const stretch=c.st==='peck'?10:0;
    px(x-9,y-7,3,7,'#eca852');px(x+7,y-7,3,7,'#eca852');
    oval(x,y-19,19,14,c.hurt?'#ffffff':'#fff0cc');
    oval(x+c.dir*(13+stretch),y-31,10,11,'#ffe7ac');
    const head=x+c.dir*(13+stretch);
    poly([[head+c.dir*8,y-34],[head+c.dir*19,y-29],[head+c.dir*8,y-26]],'#ecac45');
    oval(head-3,y-42,4,5,'#e66158');oval(head+3,y-42,4,5,'#e66158');
    oval(head+c.dir*3,y-33,2,3,'#29243a');oval(x-c.dir*3,y-20,10,7,'#e4c790');
    if(c.st==='warning'){ctx.fillStyle='#ffce63';ctx.font='bold 18px Courier New';ctx.textAlign='center';ctx.fillText('!',x,y-55);}
    if(c.hits<5)for(let i=0;i<5;i++)px(x-17+i*7,y-51,5,4,i<c.hits?'#f3cd64':'#463445');
  }
}
