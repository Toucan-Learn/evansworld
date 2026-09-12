// EDIT HERE: physics, original levels, then the five chicken levels.
const CONFIG = {
  maxStrength:50, maxGloveLevel:5, maxShoeLevel:2, maxJumpLevel:1, maxArmorLevel:2,
  maxHealth:100, chipPerPunch:1, regenPerSec:12, regenDelay:0.4,
  poisonDamage:34, poisonToKill:3,
  punchRange:66, punchCooldown:0.16,
  baseGloveDamage:1, strengthToDamage:5,
  bagHealthMultiplier:1.35,
  gravity:1500, jumpVel:-560, runSpeed:195, shoeBonus:45,
  tysonHP:130, tysonHitDamage:19, tysonHitEvery:1.4
};

const LEVELS=[
  {name:'THE GYM',      bg:'#3a2d5c', floor:'#241d3a', width:1400, plats:2, total:12, poison:2, bomb:1, tough:[4,8],   floatC:0.35, layout:'flat'},
  {name:'THE ROOFTOPS', bg:'#2d4a5c', floor:'#1d2f3a', width:1750, plats:5, total:15, poison:3, bomb:2, tough:[6,11],  floatC:0.60, layout:'stairs'},
  {name:'THE DOCKS',    bg:'#5c3a2d', floor:'#3a241d', width:1950, plats:5, total:16, poison:3, bomb:2, tough:[8,15],  floatC:0.50, layout:'scatter'},
  {name:'THE VAULT',    bg:'#2d5c3a', floor:'#1d3a24', width:2200, plats:6, total:18, poison:4, bomb:3, tough:[11,20], floatC:0.55, layout:'tiers'},
  {name:'THE ARENA',    bg:'#5c2d4a', floor:'#3a1d2f', boss:true},
  {name:'THE CHICKEN COOP', theme:'coop', bg:'#8acbd5', floor:'#73523b', width:1800, plats:5, total:14, poison:1, bomb:2, tough:[12,22], floatC:.4, layout:'stairs', reward:8},
  {name:'GOLDEN FIELDS', theme:'field', bg:'#a8dfe1', floor:'#526d3b', width:2150, plats:6, total:18, poison:2, bomb:2, tough:[18,30], floatC:.5, layout:'scatter', reward:12},
  {name:'FEATHERPEAK MOUNTAIN', theme:'mountain', bg:'#96b2cd', floor:'#555b72', width:2350, plats:8, total:18, poison:2, bomb:3, tough:[24,38], floatC:.55, layout:'tiers', reward:10},
  {name:'THE VOLCANO • JACKPOT RUN', theme:'volcano', bg:'#482f4e', floor:'#332735', width:2500, plats:9, total:16, poison:0, bomb:15, tough:[16,24], floatC:.5, layout:'stairs', reward:12, jackpot:true},
  {name:'INSIDE THE VOLCANO', theme:'lava', bg:'#291e38', floor:'#30242c', boss:true, chicken:true}
];

const CHARACTER_SKINS = [
 {name:"Classic Evan",shirt:"#3a86ff",hair:"#5a3b1a",skin:"#f1c27d",cost:0},
 {name:"Coop Keeper",shirt:"#eab44f",hair:"#a84931",skin:"#b87851",cost:300},
 {name:"Midnight Ninja",shirt:"#46355d",hair:"#222037",skin:"#f1c27d",cost:600},
 {name:"Lava Legend",shirt:"#ff623e",hair:"#ffcd59",skin:"#875536",cost:1200},
 {name:"Rainbow Hero",shirt:"#bc84ed",hair:"#54dccc",skin:"#efc6a0",cost:2000}
];
