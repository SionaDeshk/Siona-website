"use client";
import { useEffect, useRef } from "react";

export function IntelligenceField(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current;if(!canvas)return;
  const ctx=canvas.getContext("2d");if(!ctx)return;
  const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nodes=Array.from({length:68},(_,i)=>({x:(Math.sin(i*127.1)*43758.5453)%1,y:(Math.sin(i*311.7)*12783.217)%1,z:i%7}));
  nodes.forEach(n=>{n.x=Math.abs(n.x);n.y=Math.abs(n.y)});
  let w=0,h=0,dpr=1,mouse={x:.5,y:.5},scroll=0,frame=0,raf=0,visible=true;
  function resize(){if(!canvas||!ctx)return;const r=canvas.getBoundingClientRect();w=r.width;h=r.height;dpr=Math.min(devicePixelRatio||1,2);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  function draw(){if(!ctx||!w||!h)return;ctx.clearRect(0,0,w,h);
   const t=reduce?0:frame*.002;const pts=nodes.map((n,i)=>({x:(.08+n.x*.84)*w+Math.sin(t+i*.7)*3+(mouse.x-.5)*(n.z-3)*5,y:(.1+n.y*.8)*h+Math.cos(t*.8+i)*3+(mouse.y-.5)*(n.z-3)*5+scroll*14}));
   for(let i=0;i<pts.length;i++){let near=[];for(let j=0;j<pts.length;j++){if(i===j)continue;const d=Math.hypot(pts[i].x-pts[j].x,pts[i].y-pts[j].y);if(d<Math.min(w,h)*.22)near.push({j,d})}near.sort((a,b)=>a.d-b.d);
    near.slice(0,2).forEach(({j,d})=>{if(j<i)return;ctx.strokeStyle=`rgba(94,153,233,${Math.max(.035,.22-d/Math.min(w,h)*.5)})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(pts[i].x,pts[i].y);ctx.lineTo(pts[j].x,pts[j].y);ctx.stroke();});}
   pts.forEach((p,i)=>{const active=i%11===0;ctx.beginPath();ctx.arc(p.x,p.y,active?2.5:1.1,0,Math.PI*2);ctx.fillStyle=active?"rgba(153,198,255,.9)":"rgba(151,169,199,.55)";ctx.fill();if(active){ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.strokeStyle="rgba(91,153,244,.12)";ctx.stroke();}});
  }
  function move(e:PointerEvent){const r=canvas!.getBoundingClientRect();mouse={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};if(reduce)draw();}
  function onScroll(){scroll=Math.min(1,window.scrollY/Math.max(1,innerHeight));if(reduce)draw();}
  function loop(){if(visible)draw();frame++;raf=requestAnimationFrame(loop);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??true});observer.observe(canvas);
  window.addEventListener("resize",resize);window.addEventListener("scroll",onScroll,{passive:true});canvas.addEventListener("pointermove",move,{passive:true});resize();if(!reduce)loop();
  return()=>{cancelAnimationFrame(raf);observer.disconnect();window.removeEventListener("resize",resize);window.removeEventListener("scroll",onScroll);canvas.removeEventListener("pointermove",move);};
 },[]);
 return <canvas ref={ref} className="ia-field" aria-hidden="true"/>;
}
