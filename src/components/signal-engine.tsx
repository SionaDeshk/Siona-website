"use client";
import {useEffect,useRef} from "react";
export function SignalEngine({variant="group"}:{variant?:"group"|"bio"}){
 const canvas=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
 const el=canvas.current;if(!el)return;const ctx=el.getContext("2d");if(!ctx)return;
 const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;
 const strands=variant==="bio"?7:11;
 let w=0,h=0,dpr=1,frame=0,mouseX=0,mouseY=0,scroll=0,raf=0,visible=true;
 const resize=()=>{const b=el.getBoundingClientRect();w=b.width;h=b.height;dpr=Math.min(devicePixelRatio||1,2);el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);draw();};
 const draw=()=>{
 if(!w||!h)return;ctx.clearRect(0,0,w,h);
 const t=reduced?0:frame*.004;
 const cx=w*(variant==="bio"?.56:.59)+mouseX*13,cy=h*.5+mouseY*9;
 const size=Math.min(w,h)*(variant==="bio"?.39:.46);
 const wash=ctx.createRadialGradient(cx,cy,5,cx,cy,size*1.45);
 wash.addColorStop(0,variant==="bio"?"rgba(106,64,180,.19)":"rgba(29,91,176,.19)");
 wash.addColorStop(.55,variant==="bio"?"rgba(38,69,153,.075)":"rgba(26,49,98,.07)");
 wash.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=wash;ctx.fillRect(0,0,w,h);
 const palettes=variant==="bio"?[[122,190,255],[190,137,250],[239,122,204],[102,228,215]]:[[90,158,255],[151,195,247],[110,139,220],[176,197,225]];
 for(let s=0;s<strands;s++){
  const color=palettes[s%palettes.length];const points=[];
  const phase=s*Math.PI*2/strands;
  for(let i=0;i<=175;i++){
   const p=i/175,angle=p*Math.PI*(variant==="bio"?8:5.5)+phase+t*.28+scroll*.32;
   const envelope=Math.sin(p*Math.PI)**.75;
   const radius=size*(variant==="bio"?.31:.37)*envelope;
   const depth=Math.cos(angle);
   const perspective=.7+.3*(depth+1)/2;
   const x=cx+(p-.5)*size*2.15+Math.cos(angle)*radius*.72;
   const y=cy+Math.sin(angle)*radius*perspective+Math.sin(p*12+phase+t*.2)*size*.028;
   points.push({x,y,depth,p});
  }
  ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.lineWidth=variant==="bio"?1.8:1.2;
  ctx.strokeStyle=`rgba(${color.join(",")},${variant==="bio"?.42:.27})`;ctx.stroke();
  for(let i=0;i<points.length;i+=variant==="bio"?5:9){
   const p=points[i],alpha=.2+.65*(p.depth+1)/2;
   ctx.beginPath();ctx.arc(p.x,p.y,(variant==="bio"?1.7:1.3)*(1+.45*p.depth),0,Math.PI*2);
   ctx.fillStyle=`rgba(${color.join(",")},${alpha})`;ctx.fill();
  }
 }
 if(variant==="group"){
  for(let i=0;i<13;i++){const x=cx-size*.94+i*size*.15;ctx.strokeStyle="rgba(117,156,219,.08)";ctx.beginPath();ctx.moveTo(x,cy-size*.67);ctx.lineTo(x,cy+size*.67);ctx.stroke();}
 }
 };
 const onMove=(e:PointerEvent)=>{const b=el.getBoundingClientRect();mouseX=(e.clientX-b.left)/b.width-.5;mouseY=(e.clientY-b.top)/b.height-.5;if(reduced)draw();};
 const onScroll=()=>{scroll=Math.min(1.5,window.scrollY/Math.max(1,innerHeight));if(reduced)draw();};
 const loop=()=>{frame++;if(visible)draw();raf=requestAnimationFrame(loop);};
 const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;});observer.observe(el);
 addEventListener("resize",resize);addEventListener("scroll",onScroll,{passive:true});el.addEventListener("pointermove",onMove,{passive:true});resize();if(!reduced)loop();
 return()=>{cancelAnimationFrame(raf);observer.disconnect();removeEventListener("resize",resize);removeEventListener("scroll",onScroll);el.removeEventListener("pointermove",onMove);};
 },[variant]);
 return <canvas className={`signal-engine signal-engine-${variant}`} ref={canvas} aria-hidden="true"/>;
}
