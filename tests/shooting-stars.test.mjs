import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SHOOTING_STAR_COUNT,shootingStar,starHitsRocket} from '../components/shooting-stars.ts';
test('six staggered stars keep several visible across the sky',()=>{
 assert.equal(SHOOTING_STAR_COUNT,6);
 for(let time=0;time<6;time+=.1){const stars=Array.from({length:6},(_,i)=>shootingStar(time,i,1200,800)).filter(s=>s&&s.x>=0&&s.x<=1200);assert.ok(stars.length>=2);}
});
test('star contact includes movement between frames but not a distant near miss',()=>{
 const a={x:0,y:100,phase:1},b={x:100,y:100,phase:1.1};
 assert.equal(starHitsRocket(a,b,50,100),true);
 assert.equal(starHitsRocket(a,b,50,130),false);
 assert.equal(starHitsRocket(a,null,50,100),false);
});
test('a wrapping star cannot hit a rocket across the screen',()=>{
 assert.equal(starHitsRocket({x:1400,y:100,phase:3},{x:-100,y:100,phase:0},600,100),false);
});
