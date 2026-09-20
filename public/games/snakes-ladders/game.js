import { LADDERS, SNAKES, newGame, roll, answer, squarePoint } from './engine.js';
const $ = id => document.getElementById(id);
let state = newGame();
for (let row = 9; row >= 0; row--) for (let col = 0; col < 10; col++) {
  const n = row * 10 + (row % 2 ? 10 - col : col + 1), cell = document.createElement('div');
  cell.className = `cell ${(row + col) % 2 ? 'alt' : ''} ${n === 100 ? 'finish' : ''}`;
  cell.innerHTML = `<span>${n}</span>`; $('board').append(cell);
}
const svg = $('paths');
function shape(tag, attrs) { const el = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,String(v))); svg.append(el); }
for (const [from,to] of Object.entries(LADDERS)) {
  const a=squarePoint(+from), b=squarePoint(to), dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len*1.05,ny=dx/len*1.05;
  for (const side of [-1,1]) shape('line',{x1:a.x+nx*side,y1:a.y+ny*side,x2:b.x+nx*side,y2:b.y+ny*side,stroke:'#98632f','stroke-width':.85,'stroke-linecap':'round'});
  const steps=Math.ceil(len/3);for(let i=0;i<=steps;i++){const t=i/steps;shape('line',{x1:a.x+dx*t-nx,y1:a.y+dy*t-ny,x2:a.x+dx*t+nx,y2:a.y+dy*t+ny,stroke:'#ad793a','stroke-width':.7});}
}
for (const [from,to] of Object.entries(SNAKES)) {
  const a=squarePoint(+from),b=squarePoint(to);
  const d=`M ${a.x} ${a.y} C ${a.x+12} ${a.y+8}, ${b.x-12} ${b.y-8}, ${b.x} ${b.y}`;
  shape('path',{d,fill:'none',stroke:'#784290','stroke-width':2.4,'stroke-linecap':'round'});
  shape('path',{d,fill:'none',stroke:'#c28bc8','stroke-width':.5,'stroke-dasharray':'1 2'});
  shape('ellipse',{cx:a.x,cy:a.y,rx:2.2,ry:1.7,fill:'#784290'});
  for(const offset of [-.7,.7])shape('circle',{cx:a.x+offset,cy:a.y-.6,r:.35,fill:'#fff4c9'});
}
function render(){
  $('players').innerHTML=Array.from({length:state.players},(_,i)=>`<div class="player ${state.turn===i?'active':''}">Player ${i+1}<strong>${state.positions[i] ? 'Square '+state.positions[i] : 'Start'}</strong></div>`).join('');
  $('turn').textContent=state.winner!==null?`Player ${state.winner+1} wins! 🏆`:`Player ${state.turn+1}’s turn`;
  for(let i=0;i<2;i++){
    let token=$('token-'+i);if(!token){token=document.createElement('div');token.id='token-'+i;$('tokens').append(token);}
    token.className=`token ${i===1?'p2':''} ${state.positions[i]===0?'start':''}`;token.textContent=i+1;token.hidden=i>=state.players;
    const p=squarePoint(state.positions[i]);token.style.left=(p.x+(state.players===2?(i?1.6:-1.6):0))+'%';token.style.top=p.y+'%';
  }
  $('roll').hidden=Boolean(state.dice)||state.winner!==null;
  $('question').hidden=!state.dice||state.winner!==null;$('again').hidden=state.winner===null;
  if(state.dice){$('die-a').textContent=state.dice[0];$('die-b').textContent=state.dice[1];$('equation').textContent=`${state.dice[0]} × ${state.dice[1]} = ?`;}
}
function start(players){state=newGame(players);$('setup').hidden=true;$('play').hidden=false;$('restart').hidden=false;$('message').textContent='Roll to begin.';$('die-a').textContent='?';$('die-b').textContent='?';render();$('roll').focus();}
document.querySelectorAll('[data-players]').forEach(button=>button.onclick=()=>start(Number(button.dataset.players)));
$('roll').onclick=()=>{state=roll(state);$('answer').value='';$('message').textContent='Multiply the two dice.';render();$('answer').focus();};
$('question').onsubmit=event=>{event.preventDefault();const result=answer(state,$('answer').value);if(!result.correct){$('message').textContent='Not quite — try again!';$('answer').select();return;}state=result.state;const action=result.destination>result.landing?' Up the ladder!':result.destination<result.landing?' Down the snake!':'';$('message').textContent=state.winner!==null?`You reached 100 in ${state.moves} turns!`:`Player ${result.player+1} → ${result.destination}.${action}`;render();(state.winner!==null?$('again'):$('roll')).focus();};
$('restart').onclick=()=>{$('play').hidden=true;$('setup').hidden=false;$('restart').hidden=true;document.querySelector('[data-players]').focus();};
$('again').onclick=()=>start(state.players);
