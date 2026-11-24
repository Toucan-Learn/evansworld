import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function game(name, stored=new Map()) {
  const nodes=new Map();
  class Element {
    constructor(){this.style={setProperty(){}};this.children=[];this.dataset={};this.hidden=false;this.clientWidth=800;this.isConnected=true;this.textContent='';this.classList={add(){},remove(){}};this.tagName='DIV';}
    querySelector(selector){if(!nodes.has(selector))nodes.set(selector,new Element());return nodes.get(selector);}
    querySelectorAll(selector){return selector==='button'?this.children:[];}
    append(...items){this.children.push(...items);}
    replaceChildren(...items){this.children=items;}
    setAttribute(){} addEventListener(){} focus(){} remove(){} setPointerCapture(){}
    click(){return this.onclick?.({detail:0});}
    getBoundingClientRect(){return {height:600,width:800,left:0,top:0};}
    getContext(){return new Proxy({}, {get:()=>()=>{}});}
  }
  const doc=new Element();doc.getElementById=id=>doc.querySelector('#'+id);doc.createElement=()=>new Element();doc.documentElement=new Element();doc.hidden=false;
  const env={document:doc,localStorage:{getItem:k=>stored.get(k)??null,setItem:(k,v)=>stored.set(k,v)},performance:{now:()=>10000},requestAnimationFrame:()=>1,cancelAnimationFrame(){},ResizeObserver:class{observe(){}},MutationObserver:class{observe(){}},getComputedStyle:()=>({color:'#fff'}),console};
  env.window={innerHeight:900,addEventListener(){},matchMedia:()=>({matches:true})};
  vm.createContext(env);
  const additions=name==='viking-chase'?`globalThis.api={snapshot:()=>({mode,lives,grown,wrong,points,asked,monk,vikings,dots:[...dots],fruit:[...fruit],questionOrder,questions,wish}),play,cont,answers,save,choose,walk,map,step,playerMove,collide,init,eatFruit:()=>{fruit.delete([...fruit][0]);openQuiz()}};`:`globalThis.api={snapshot:()=>({table,order,index,eaten,solved,busy,options}),next,again,eat,menu,save,restore,startTable,target,tables,picker,root,resume,change};`;
  const source=fs.readFileSync(new URL('../public/games/'+name+'/game.js',import.meta.url),'utf8').replace(/\}\)\(\);\s*$/,additions+'})();');
  vm.runInContext(source,env);return {api:env.api,stored};
}

test('Viking maze keeps every dot and fruit reachable from the monk',()=>{
  const {api}=game('viking-chase');const s=api.snapshot(),seen=new Set(),queue=[s.monk];
  for(let i=0;i<queue.length;i++){const p=queue[i],k=p.x+','+p.y;if(seen.has(k))continue;seen.add(k);for(const d of ['up','down','left','right']){const n=api.step(p,d);if(n&&!seen.has(n.x+','+n.y))queue.push(n);}}
  for(const k of [...s.dots,...s.fruit])assert.ok(seen.has(k),'unreachable collectible '+k);
  assert.ok(s.questions.length>=30);
});

test('Viking history supports 30 quizzes, wrong-answer speed growth and resume',()=>{
  const {api,stored}=game('viking-chase');api.play.click();api.choose('right');assert.equal(api.snapshot().wish,'right');
  for(let i=0;i<30;i++){
    api.eatFruit();const s=api.snapshot(),q=s.questions[s.questionOrder[s.asked]];
    const answer=api.answers.children.find(b=>b.textContent===q[1][i===0?1:q[2]]);assert.ok(answer);answer.onclick();api.cont.click();
  }
  const s=api.snapshot();assert.equal(s.asked,30);assert.equal(s.grown,30);assert.equal(s.wrong,1);assert.equal(s.fruit.length,0);
  const resumed=game('viking-chase',stored).api.snapshot();assert.equal(resumed.grown,30);assert.equal(resumed.mode,'paused');assert.equal(resumed.wrong,1);
});

test('Viking pending quiz survives reload without extra fruit or points',()=>{
  const {api,stored}=game('viking-chase');api.play.click();api.eatFruit();const before=api.snapshot();const after=game('viking-chase',stored).api.snapshot();
  assert.equal(after.mode,'quiz');assert.equal(after.grown,before.grown);assert.equal(after.points,before.points);assert.equal(after.asked,0);
});

test('Burger Boom correct answers grow, resume and finish all twelve orders',async()=>{
  let {api,stored}=game('burger-boom');await api.eat(api.snapshot().order[0],api.menu.children[0]);assert.equal(api.snapshot().eaten,1);
  api=game('burger-boom',stored).api;assert.equal(api.snapshot().eaten,1);assert.equal(api.snapshot().solved,true);
  for(let i=1;i<12;i++){api.next.click();const s=api.snapshot();assert.equal(s.index,i);assert.ok(s.options.includes(s.order[i]));await api.eat(s.order[i],api.menu.children[0]);}
  assert.equal(api.snapshot().eaten,12);assert.equal(api.next.hidden,true);assert.equal(api.again.hidden,false);api.again.click();assert.equal(api.snapshot().eaten,0);
});

test('Burger Boom wrong answers reset growth and reject corrupt saves',async()=>{
  const {api}=game('burger-boom');let s=api.snapshot();await api.eat(s.order[0],api.menu.children[0]);api.next.click();s=api.snapshot();await api.eat(s.order[1]===1?2:1,api.menu.children[0]);
  assert.equal(api.snapshot().eaten,0);assert.equal(api.snapshot().index,0);assert.equal(api.snapshot().busy,false);
  assert.equal(api.restore({privateContent:{version:2,order:[]}}),false);
});


test('Burger table picker offers 1–12 and uses the selected table for every round',async()=>{
 const {api,stored}=game('burger-boom');assert.equal(api.tables.children.length,12);
 for(let table=1;table<=12;table++){
  api.startTable(table);let s=api.snapshot();assert.equal(s.table,table);assert.equal(s.eaten,0);assert.equal(api.picker.hidden,true);
  for(let round=0;round<12;round++){
   s=api.snapshot();assert.equal(api.target.textContent,'Eat the burger that makes '+s.order[round]*table);
   assert.ok(api.menu.children.every(b=>b.innerHTML.includes('<span>'+table+' × ')));
   await api.eat(s.order[round],api.menu.children[0]);if(round<11)api.next.click();
  }
  assert.equal(api.snapshot().eaten,12);
 }
 const restored=game('burger-boom',stored).api;assert.equal(restored.snapshot().table,12);assert.equal(restored.snapshot().eaten,12);assert.equal(restored.resume.hidden,false);
 restored.startTable(7);assert.equal(restored.snapshot().eaten,0);assert.equal(restored.snapshot().table,7);
 assert.equal(restored.restore({privateContent:{version:3,table:13}}),false);
});
