export const WIDTH=8.4, LANE=2.5, SPEED=6.7;
export const forward=h=>({x:-Math.sin(h),z:-Math.cos(h)});
export const right=h=>({x:Math.cos(h),z:-Math.sin(h)});
export function point(seg,t,x=0,y=0){const f=forward(seg.h),r=right(seg.h);return {x:seg.x+f.x*t+r.x*x,y,z:seg.z+f.z*t+r.z*x}}
export function sampleWords(bank,count,last=[],random=Math.random){const shuffle=a=>{a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};const recent=new Set(last),fresh=shuffle(bank.filter(q=>!recent.has(q.word))),old=shuffle(bank.filter(q=>recent.has(q.word)));return [...fresh,...old].slice(0,Math.min(count,bank.length))}
export function buildCourse(questions,random=Math.random){let x=0,z=0,h=0,turnSign=random()<.5?-1:1;const segments=[];function add(kind,q){const length=kind==='gate'?38:kind==='turn'?19:kind==='platform'?25:22;const seg={id:segments.length,kind,q,x,z,h,length,gate:24,front:9,back:14.5,passed:false,dir:0};if(kind==='gap')seg.gaps=[[10,12.4]];else if(kind==='platform')seg.gaps=[[15.2,17.4]];else seg.gaps=[];if(kind==='turn'){seg.dir=turnSign;turnSign*=-1}segments.push(seg);const end=point(seg,length);x=end.x;z=end.z;if(kind==='turn')h-=seg.dir*Math.PI/2;}
questions.forEach((q,i)=>{add('gate',q);if(i<questions.length-1){add(['log','platform','gap'][i%3]);if(i%2===0)add('turn')}});return segments}
export function supportRanges(seg){let cursor=0,ranges=[];for(const [a,b] of seg.gaps){ranges.push([cursor,a]);cursor=b}ranges.push([cursor,seg.length+(seg.kind==='turn'?WIDTH/2:0)]);return ranges}
