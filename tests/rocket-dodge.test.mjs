import {test} from 'node:test';import assert from 'node:assert/strict';
import {RocketGame,sweptHit,LEVELS} from '../public/games/rocket-dodge/engine.js';
const hit=g=>{g.cooldown=0;g.hazards=[{x:g.rocket.x,y:g.rocket.y,vx:0,vy:0,radius:5,reflected:false}];g.update(.016);};
test('four 30-second survival stages unlock the ghost finale',()=>{const g=new RocketGame(900,600,()=>.5);g.start();for(let level=0;level<4;level++){assert.equal(g.level,level);g.time=29.9;g.spawnIn=2;g.hazards=[];g.update(.05);assert.equal(g.level,level);g.update(.051);assert.equal(g.level,level+1);assert.equal(g.time,0);assert.equal(g.phase,'playing');}assert.equal(g.ghosts.length,6);assert.equal(LEVELS[g.level],'Ghost bounce');});
test('getting hit loses the current stage, and retry resets its timer without advancing',()=>{const g=new RocketGame();g.start();g.nextLevel();g.time=29;hit(g);assert.equal(g.phase,'burst');g.update(1.1);assert.equal(g.phase,'lost');assert.equal(g.level,1);const t=g.time;g.update(10);assert.equal(g.time,t);g.retryLevel();assert.equal(g.level,1);assert.equal(g.time,0);assert.equal(g.phase,'playing');assert.equal(g.hazards.length,0);});
test('star stages launch at least three times the original number of shots',()=>{const g=new RocketGame(900,600,()=>.5);g.start();g.cooldown=10;let count=0;g.spawn=()=>count++;for(let i=0;i<300;i++)g.update(1/60);assert.ok(count>=18);});
test('spawn protection avoids consecutive hits and movement stays inside the arena',()=>{const g=new RocketGame();g.start();g.move(-200,9000);assert.equal(g.rocket.x,24);assert.equal(g.rocket.y,576);g.hazards=[{...g.rocket,vx:0,vy:0,radius:22}];g.update(.016);assert.equal(g.phase,'playing');assert.equal(g.level,0);});
test('shield reflects stars and clearing the small ghosts unlocks the giant ghost',()=>{const g=new RocketGame();g.start();for(let i=0;i<4;i++)g.nextLevel();g.move(450,450);hit(g);assert.equal(g.phase,'playing');assert.equal(g.hazards[0].reflected,true);assert.ok(g.hazards[0].vy<0);assert.equal(g.level,4);
 for(const ghost of g.ghosts){const x=g.width*(.16+(ghost.id%3)*.34)+Math.sin((g.time+.016)*.65+ghost.id)*30;g.hazards=[{x,y:ghost.y,vx:0,vy:0,radius:5,reflected:true}];g.update(.016);assert.equal(ghost.alive,false);}
 assert.equal(g.level,5);assert.equal(g.phase,'playing');assert.ok(g.blocks.length>30);g.start();assert.equal(g.level,0);assert.equal(g.ghosts.length,0);assert.equal(g.dodged,0);
});
test('fast shots cannot tunnel through the rocket or ghosts',()=>{assert.equal(sweptHit(0,200,800,200,400,200,20),true);assert.equal(sweptHit(0,200,800,200,400,250,20),false);});
test('each hazard starts outside the arena and Nintendo hazards fall downwards',()=>{for(let level=0;level<5;level++){const g=new RocketGame();g.level=level;g.spawn();const b=g.hazards[0];assert.ok(b.x<0||b.x>g.width||b.y<0||b.y>g.height);if(level===3)assert.ok(b.vy>0);}});

test('each reflected boss laser removes exactly one block; only the last wins',()=>{
 const g=new RocketGame();g.start();for(let i=0;i<5;i++)g.nextLevel();g.move(450,500);hit(g);assert.equal(g.hazards[0].reflected,true);assert.equal(g.phase,'playing');
 let remaining=g.blocks.length;g.spawnIn=100;
 while(remaining){const p=g.blockPosition(g.blocks.find(b=>b.alive));g.hazards=[{x:p.x,y:p.y,vx:0,vy:0,radius:5,reflected:true}];g.update(.016);remaining--;assert.equal(g.blocks.filter(b=>b.alive).length,remaining);assert.equal(g.phase,remaining?'playing':'won');}
});
test('random stars use every edge and threaten stationary rockets even in corners',()=>{
 const rng=seed=>()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const g=new RocketGame(900,600,rng(17)),edges=new Set();g.start();for(let i=0;i<200;i++){g.spawn();const b=g.hazards.at(-1);edges.add(b.x<0?'left':b.x>900?'right':b.y<0?'top':'bottom');}assert.equal(edges.size,4);
 for(const [x,y]of [[24,24],[876,24],[24,576],[876,576],[450,300]]){const s=new RocketGame(900,600,rng(42));s.start();s.move(x,y);for(let n=0;n<1800&&s.phase==='playing';n++)s.update(1/60);assert.equal(s.phase,'burst',`stationary at ${x},${y}`);assert.equal(s.level,0);}
});
test('giant ghost fits mobile and landscape arenas and survives resizing',()=>{for(const [w,h]of [[390,790],[844,342]]){const g=new RocketGame(w,h);g.start();for(let i=0;i<5;i++)g.nextLevel();for(const b of g.blocks){const p=g.blockPosition(b);assert.ok(p.x-p.size/2>=0&&p.x+p.size/2<=w&&p.y-p.size/2>=0&&p.y+p.size/2<=h);}}});
