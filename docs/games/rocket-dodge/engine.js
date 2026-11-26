export const LEVEL_SECONDS=30;
export const LEVELS=['Shooting stars','Shooting burgers','Shooting lasers','Falling Nintendos','Ghost bounce'];
export function sweptHit(ax,ay,bx,by,x,y,r){const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/len)):0;return Math.hypot(x-ax-t*dx,y-ay-t*dy)<=r;}
export class RocketGame{
 constructor(width=900,height=600,random=Math.random){this.random=random;this.width=width;this.height=height;this.reset();}
 reset(){this.level=0;this.phase='ready';this.time=0;this.total=0;this.cooldown=0;this.spawnIn=.4;this.hazards=[];this.ghosts=[];this.events=[];this.rocket={x:this.width/2,y:this.height*.75,angle:-Math.PI/2};this.dodged=0;}
 start(){this.reset();this.phase='playing';this.cooldown=1.5;}
 retryLevel(){this.time=0;this.hazards=[];this.events=[];this.spawnIn=.3;this.cooldown=1.5;this.phase='playing';}
 resize(w,h){this.rocket.x*=w/this.width;this.rocket.y*=h/this.height;for(const g of this.ghosts){g.x*=w/this.width;g.y*=h/this.height;}this.width=w;this.height=h;this.hazards=[];}
 move(x,y){const p=this.rocket,nx=Math.max(24,Math.min(this.width-24,x)),ny=Math.max(24,Math.min(this.height-24,y));if(Math.hypot(nx-p.x,ny-p.y)>1)p.angle=Math.atan2(ny-p.y,nx-p.x);p.x=nx;p.y=ny;}
 nextLevel(){this.level++;this.time=0;this.hazards=[];this.spawnIn=.3;this.cooldown=2;this.phase='playing';if(this.level===4)this.ghosts=Array.from({length:6},(_,i)=>({id:i,x:this.width*(.16+(i%3)*.34),y:65+Math.floor(i/3)*80,alive:true}));this.events.push({type:'level'});}
 spawn(){const w=this.width,h=this.height,r=this.random,level=this.level,speed=Math.min(w,h)*(.36+Math.min(this.time,45)*.004);let x,y,vx,vy;
 if(level===3||level===4){x=30+r()*(w-60);y=-35;vx=level===3?(r()-.5)*60:0;vy=speed;}
 else {const side=r()<.5;x=side?-50:w+50;y=25+r()*Math.max(20,h*.65-25);const targetY=Math.min(h-25,y+80+r()*h*.3),targetX=side?w+50:-50,len=Math.hypot(targetX-x,targetY-y);vx=(targetX-x)/len*speed*(level===2?1.5:1);vy=(targetY-y)/len*speed*(level===2?1.5:1);}
 this.hazards.push({x,y,vx,vy,radius:level===1?17:level===3?22:5,angle:r()*6.28,reflected:false});}
 update(dt){if(this.phase==='ready'||this.phase==='won'||this.phase==='lost')return;this.total+=dt;this.cooldown=Math.max(0,this.cooldown-dt);
 if(this.phase==='burst'){this.transition-=dt;if(this.transition<=0){this.phase='lost';this.events.push({type:'lost'});}return;}
 this.time+=dt;this.spawnIn-=dt;if(this.spawnIn<=0){this.spawn();this.spawnIn=this.level===0||this.level===4?Math.max(.16,.26-this.time*.003):Math.max(.3,.65-this.time*.008);}
 for(const g of this.ghosts){g.x=this.width*(.16+(g.id%3)*.34)+Math.sin(this.time*.65+g.id)*Math.min(30,this.width*.04);}
 for(const b of this.hazards){if(b.dead)continue;const ax=b.x,ay=b.y;b.x+=b.vx*dt;b.y+=b.vy*dt;b.angle+=dt;
 if(b.reflected){for(const g of this.ghosts){if(g.alive&&sweptHit(ax,ay,b.x,b.y,g.x,g.y,25)){g.alive=false;b.dead=true;this.events.push({type:'ghost',x:g.x,y:g.y});break;}}}
 else if(sweptHit(ax,ay,b.x,b.y,this.rocket.x,this.rocket.y,18+b.radius)){
 if(this.level===4){const targets=this.ghosts.filter(g=>g.alive).sort((a,c)=>Math.hypot(a.x-b.x,a.y-b.y)-Math.hypot(c.x-b.x,c.y-b.y));const g=targets[0];if(g){b.reflected=true;const len=Math.hypot(g.x-b.x,g.y-b.y)||1;b.vx=(g.x-b.x)/len*520;b.vy=(g.y-b.y)/len*520;this.events.push({type:'bounce',x:b.x,y:b.y});}}
 else if(!this.cooldown){this.phase='burst';this.transition=1;this.events.push({type:'hit',x:this.rocket.x,y:this.rocket.y});this.hazards=[];return;}
 }
 if(b.x< -160||b.x>this.width+160||b.y< -160||b.y>this.height+160){b.dead=true;if(!b.reflected)this.dodged++;}
 }
 this.hazards=this.hazards.filter(b=>!b.dead);if(this.level<4&&this.time>=LEVEL_SECONDS){this.nextLevel();return;}if(this.level===4&&this.ghosts.every(g=>!g.alive)){this.phase='won';this.events.push({type:'win',x:this.width/2,y:this.height/2});}
 }
}
