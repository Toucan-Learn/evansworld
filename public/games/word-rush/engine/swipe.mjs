const interactive = target => Boolean(target?.closest?.('button,a,input,select,textarea,[role="button"],[contenteditable="true"]'));
export function swipeDirection(dx,dy,threshold=28){
  const x=Math.abs(dx),y=Math.abs(dy);
  if(Math.max(x,y)<threshold)return null;
  if(x>y*1.15)return dx<0?'left':'right';
  if(y>x*1.15)return dy<0?'up':'down';
  return null;
}
// One command per stroke. Pointer capture keeps a finger crossing a HUD/control
// from becoming a second gesture or an accidental button tap.
export function bindSwipes(surface,{enabled,command,threshold=()=>28,pointerEvents=typeof globalThis.PointerEvent!=='undefined',view=globalThis.window}){
  let stroke=null;const listeners=[];
  const listen=(name,fn)=>{surface.addEventListener(name,fn,{passive:false});listeners.push([name,fn])};
  const prevent=e=>{if(e.cancelable)e.preventDefault()};
  function cancel(){const old=stroke;stroke=null;if(old&&pointerEvents){try{surface.releasePointerCapture?.(old.id)}catch{}}}
  function begin(e,id,x,y){cancel();if(!enabled()||interactive(e.target))return;stroke={id,x,y,used:false};prevent(e);if(pointerEvents){try{surface.setPointerCapture?.(id)}catch{}}}
  function update(e,id,x,y){if(!stroke||id!==stroke.id)return;if(!enabled()){cancel();return}prevent(e);if(stroke.used)return;const direction=swipeDirection(x-stroke.x,y-stroke.y,threshold());if(direction){stroke.used=true;if(direction!=='down')command(direction)}}
  if(pointerEvents){
    listen('pointerdown',e=>{if(e.isPrimary===false){cancel();return}if(e.button!==undefined&&e.button!==0)return;begin(e,e.pointerId,e.clientX,e.clientY)});
    listen('pointermove',e=>update(e,e.pointerId,e.clientX,e.clientY));
    listen('pointerup',e=>{if(stroke?.id!==e.pointerId)return;update(e,e.pointerId,e.clientX,e.clientY);cancel()});
    listen('pointercancel',e=>{if(stroke?.id===e.pointerId)cancel()});
    listen('lostpointercapture',e=>{if(stroke?.id===e.pointerId)cancel()});
  }else{
    listen('touchstart',e=>{if(e.touches.length!==1){cancel();return}const t=e.touches[0];begin(e,t.identifier,t.clientX,t.clientY)});
    listen('touchmove',e=>{if(e.touches.length!==1){cancel();return}const t=e.touches[0];update(e,t.identifier,t.clientX,t.clientY)});
    listen('touchend',e=>{if(!stroke)return;const t=Array.from(e.changedTouches).find(t=>t.identifier===stroke.id);if(t){update(e,t.identifier,t.clientX,t.clientY);cancel()}});
    listen('touchcancel',cancel);
  }
  view?.addEventListener('blur',cancel);view?.addEventListener('resize',cancel);view?.addEventListener('orientationchange',cancel);
  return {cancel,destroy(){cancel();for(const [name,fn] of listeners)surface.removeEventListener(name,fn);for(const name of ['blur','resize','orientationchange'])view?.removeEventListener(name,cancel)}};
}
