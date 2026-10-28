import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame,roll,answer,squarePoint } from '../public/games/snakes-ladders/engine.js';
test('two dice produce factors from one to ten and cannot be rerolled',()=>{const s=roll(newGame(),()=>0);assert.deepEqual(s.dice,[1,1]);assert.strictEqual(roll(s),s);assert.deepEqual(roll(newGame(),()=>.999).dice,[10,10]);});
test('incorrect or blank answers leave the same question and player in place',()=>{const s={...newGame(2),dice:[3,4]};for(const value of ['',7,'abc']){const r=answer(s,value);assert.equal(r.correct,false);assert.strictEqual(r.state,s);}});
test('correct multiplication moves by product and alternates players',()=>{const s={...newGame(2),dice:[3,4]};const r=answer(s,12);assert.equal(r.state.positions[0],12);assert.equal(r.state.turn,1);assert.equal(r.state.dice,null);assert.strictEqual(answer(r.state,12).state,r.state);});
test('single-player keeps its turn and ladders and snakes transport correctly',()=>{const up=answer({...newGame(),dice:[1,3]},3);assert.equal(up.state.positions[0],22);assert.equal(up.state.turn,0);const down=answer({...newGame(),positions:[15,0],dice:[3,4]},12);assert.equal(down.state.positions[0],10);});
test('reaching or passing 100 wins and prevents another roll',()=>{const r=answer({...newGame(2),positions:[0,95],turn:1,dice:[6,6]},36);assert.equal(r.state.winner,1);assert.equal(r.state.positions[1],100);assert.strictEqual(roll(r.state),r.state);});
test('board follows alternating rows from bottom left to top left',()=>{assert.deepEqual(squarePoint(1),{x:5,y:95});assert.deepEqual(squarePoint(10),{x:95,y:95});assert.deepEqual(squarePoint(11),{x:95,y:85});assert.deepEqual(squarePoint(100),{x:5,y:5});});

test('every 1–10 pair asks its product and moves that many spaces',()=>{for(let a=1;a<=10;a++)for(let b=1;b<=10;b++){let i=0;const factors=[a,b];const rolled=roll(newGame(),()=>(factors[i++]-0.5)/10);assert.deepEqual(rolled.dice,[a,b]);const result=answer(rolled,a*b);assert.equal(result.correct,true);assert.equal(result.landing,a*b);}});
