const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const elements=new Map(),storage=new Map();
function element(id){if(!elements.has(id))elements.set(id,{id,width:720,height:405,hidden:false,textContent:'',innerHTML:'',children:[],classList:{add(){},remove(){}},addEventListener(){},appendChild(e){this.children.push(e)},getContext(){return new Proxy({},{get:(t,k)=>t[k]||(()=>{}),set:(t,k,v)=>(t[k]=v,true)})}});return elements.get(id);}
const sandbox={console,Math,performance:{now:()=>0},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame(){},addEventListener(){},window:{},getComputedStyle:()=>({getPropertyValue:()=> '#f2c14e'}),document:{body:{dataset:{}},documentElement:{},getElementById:element,querySelectorAll:()=>[],createElement:()=>({...element('generated'),setAttribute(){}}),addEventListener(){}},localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)||null}};
vm.createContext(sandbox);
for(const name of ['config','game','render','chicken','save-shop'])vm.runInContext(readFileSync(`${__dirname}/../public/games/bag-bashers/js/${name}.js`,'utf8'),sandbox,{filename:name+'.js'});
const run=s=>vm.runInContext(s,sandbox);
let count=0;
function test(name,fn){fn();count++;console.log('PASS '+name);}
test('all ten levels build and render without errors',()=>{for(let n=1;n<=10;n++){run(`level=${n};buildLevel(level);state='play';running=true;render();update(1/60);`);assert.equal(run('level'),n);}});
test('Mike Tyson is its own five-level campaign',()=>{run("startGame();level=5;buildLevel(5);tyson.hp=1;player.x=tyson.x;doPunch()");assert.equal(run('state'),'win');assert.equal(run('level'),5);assert.equal(element('winTitle').textContent,'MIKE TYSON DEFEATED!');});
test('campaigns keep independent save slots',()=>{run('startGame();money=123;saveCheckpoint();startGame(true);money=456;saveCheckpoint()');assert.equal(JSON.parse(storage.get('evans-mike-tyson-v2')).money,123);assert.equal(JSON.parse(storage.get('evans-chicken-boss-v2')).money,456);});
test('chicken quick start supplies usable starter gear',()=>{run('startGame(true)');assert.equal(run('money'),1500);assert.equal(run('level'),6);assert.equal(run('damagePerPunch()'),14);});
test('field cash bags pay more than coop bags',()=>{assert.ok(run('LEVELS[6].reward')>run('LEVELS[5].reward'));run("level=7;buildLevel(7);money=0;resolveBag(bags.find(b=>b.type==='money'))");assert.ok(run('money')>=3520);});
test('challenge always has exactly 15 bombs and one $50k bag',()=>{for(let j=0;j<40;j++){run('level=9;buildLevel(9)');assert.equal(run("bags.filter(b=>b.type==='bomb').length"),15);assert.equal(run("bags.filter(b=>b.type==='jackpot').length"),1);}});
test('challenge exit is locked until jackpot is claimed',()=>{run("level=9;buildLevel(9);state='play';running=true;player.x=portalOut.x;update(.016)");assert.equal(run('state'),'play');const before=run('money');run("resolveBag(bags.find(b=>b.type==='jackpot'));update(.016)");assert.equal(run('money'),before+50000);assert.equal(run('state'),'shop');});
test('bomb shield prevents reset and is consumed',()=>{run("startGame(true);shields=1;resolveBag(bags.find(b=>b.type==='bomb'))");assert.equal(run('shields'),0);assert.equal(run('running'),true);assert.ok(['KAPOW!','BANG!','BOOM!'].includes(run("popIcons.find(q=>q.kind==='bang').text")));});
test('retry restores banked checkpoint and prevents loot farming',()=>{run('startGame(true);money=3200;saveCheckpoint();money+=50000;strength+=100;die("test");restartLevel()');assert.equal(run('money'),3200);assert.equal(run('strength'),30);});
test('shop purchase and selected skin survive continue',()=>{run("startGame(true);money=5000;openShop();extraShopItems().find(x=>x.t==='Coop Keeper').act();saveCheckpoint('shop');characterSkin=0;money=0;continueGame()");assert.equal(run('characterSkin'),1);assert.equal(run('money'),4700);assert.equal(run('state'),'shop');});
test('corrupt and out-of-range saves are rejected',()=>{run("localStorage.setItem(SAVE_KEY,'not json')");assert.equal(run('readSave()'),null);assert.equal(run('validSave({...snapshot(),characterSkin:100})'),false);assert.equal(run('validSave({...snapshot(),level:11})'),false);});
test('gravity, jumping and platform landing work',()=>{run('startGame(true);plats=[];jumpQueued=true;update(.016)');assert.ok(run('player.vy')<0);for(let j=0;j<90;j++)run('update(1/60)');assert.equal(run('player.onGround'),true);assert.equal(run('player.y+player.h/2'),359);run('plats=[{x:50,y:GROUND-80,w:100}];player.x=90;player.y=180;player.vy=100;');for(let j=0;j<30;j++)run('update(1/60)');assert.equal(run('player.y+player.h/2'),279);});
test('low eggs hit on ground, are avoided by jumping, high eggs miss on ground',()=>{run("level=10;buildLevel(10);health=100;eggs=[{x:player.x,y:GROUND-25,vx:0,life:1,spin:0}];updateChickenBoss(.016)");assert.equal(run('health'),77);run('health=100;player.y=GROUND-100;eggs=[{x:player.x,y:GROUND-25,vx:0,life:1,spin:0}];updateChickenBoss(.016)');assert.equal(run('health'),100);run('player.y=GROUND-17;eggs=[{x:player.x,y:GROUND-112,vx:0,life:1,spin:0}];updateChickenBoss(.016)');assert.equal(run('health'),100);});
test('peck hits ground and can be dodged by jumping',()=>{run("buildLevel(10);player.x=tyson.x-100;tyson.st='peck';tyson.t=.2;tyson.hitDone=false;health=100;updateChickenBoss(.016)");assert.equal(run('health'),73);run("health=100;player.y=GROUND-110;tyson.hitDone=false;updateChickenBoss(.016)");assert.equal(run('health'),100);});
test('boss alternates telegraphed eggs and peck attacks',()=>{run("buildLevel(10);state='play';health=10000");const states=new Set();for(let j=0;j<700;j++){run('updateChickenBoss(.016)');states.add(run('tyson.st'));}for(const s of ['eggWarning','peckWarning','peck','recover'])assert.ok(states.has(s),s);});
test('pause freezes gameplay and resumes',()=>{run('startGame(true);togglePause()');assert.equal(run('running'),false);assert.equal(run('state'),'paused');run('togglePause()');assert.equal(run('running'),true);});
test('final chicken defeat awards victory and reloads win state',()=>{run("startGame(true);level=10;buildLevel(10);tyson.hp=1;player.x=tyson.x;doPunch()");assert.equal(run('state'),'win');const earned=run('money');run('continueGame()');assert.equal(run('state'),'win');assert.equal(run('money'),earned);});
test('website cards start the selected campaign and use separate saves',()=>{
 for(const [chapter,expected] of [['mike-tyson',1],['chicken-boss',6]]){
  const fresh={...sandbox,location:{search:'?chapter='+chapter+'&embed=1'},URLSearchParams,document:{...sandbox.document,body:{dataset:{},classList:{add(){}}}},localStorage:{getItem:()=>null,setItem(){}}};
  vm.createContext(fresh);
  for(const name of ['config','game','render','chicken','save-shop'])vm.runInContext(readFileSync(`${__dirname}/../public/games/bag-bashers/js/${name}.js`,'utf8'),fresh);
  assert.equal(vm.runInContext('level',fresh),expected);
  assert.equal(vm.runInContext('state',fresh),'play');
 }
});
test('in-game campaign choices resume their own progress',()=>{run('startGame();level=3;money=321;saveCheckpoint();startGame(true);level=8;money=654;saveCheckpoint();chooseCampaign(false)');assert.equal(run('level'),3);assert.equal(run('money'),321);run('chooseCampaign(true)');assert.equal(run('level'),8);assert.equal(run('money'),654);});
console.log(`\n${count} game checks passed.`);
