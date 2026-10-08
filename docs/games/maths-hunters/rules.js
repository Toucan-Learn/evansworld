export const ROUNDS = 5;
const integer = (min,max,random) => min + Math.floor(random()*(max-min+1));
export function areaChallenge(round, random=Math.random){
  const width=integer(2,Math.min(10,round+5),random),height=integer(2,Math.min(8,round+4),random);
  return {width,height,answer:width*height};
}
export function trackChallenge(round,random=Math.random){
  const w=integer(5,12,random),h=integer(4,9,random);
  const points=round<3?[[0,0],[w,0],[w,h],[0,h]]:[[0,0],[w,0],[w,h-2],[w-3,h-2],[w-3,h],[0,h]];
  const lengths=points.map((p,i)=>{const q=points[(i+1)%points.length];return Math.abs(q[0]-p[0])+Math.abs(q[1]-p[1]);});
  return {points,lengths,answer:lengths.reduce((a,b)=>a+b,0)};
}
export function isCorrect(value,expected){return /^\d+$/.test(String(value).trim())&&Number(value)===expected;}
