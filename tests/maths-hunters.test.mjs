import test from 'node:test';
import assert from 'node:assert/strict';
import {areaChallenge,trackChallenge,isCorrect} from '../public/games/maths-hunters/rules.js';
test('monster nets use rectangular area in square units',()=>{for(let round=0;round<5;round++)for(const random of [()=>0,()=>.999]){const c=areaChallenge(round,random);assert.equal(c.answer,c.width*c.height);assert.ok(c.width>=2&&c.width<=10&&c.height>=2&&c.height<=8);}});
test('tracks are closed and label every side accurately',()=>{for(let round=0;round<5;round++)for(const random of [()=>0,()=>.999]){const c=trackChallenge(round,random);assert.equal(c.points.length,round<3?4:6);let sum=0;c.points.forEach((p,i)=>{const q=c.points[(i+1)%c.points.length];assert.ok(p[0]===q[0]||p[1]===q[1]);const length=Math.hypot(p[0]-q[0],p[1]-q[1]);assert.ok(length>0);assert.equal(c.lengths[i],length);sum+=length;});assert.equal(c.answer,sum);}});
test('answers reject blanks, negatives, and wrong units or values',()=>{for(const value of ['', ' ', '-12','12 m','1e1','11'])assert.equal(isCorrect(value,12),false);assert.equal(isCorrect('12',12),true);assert.equal(isCorrect(' 12 ',12),true);});
