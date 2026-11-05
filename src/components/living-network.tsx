"use client";
import { useEffect, useRef } from "react";

/** Original, lightweight particle field. Scroll and pointer motion change its perspective. */
export function LivingNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dots = Array.from({ length: 90 }, (_, i) => {
      const a = i * 2.39996323;
      const y = 1 - (i / 89) * 2;
      const r = Math.sqrt(1 - y * y);
      return { x: Math.cos(a) * r, y, z: Math.sin(a) * r, size: i % 13 === 0 ? 2.6 : 1.2 };
    });
    let width = 0, height = 0, frame = 0, scroll = 0, mouseX = 0, mouseY = 0, raf = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width; height = rect.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const onScroll = () => {
      const rect = canvas.getBoundingClientRect();
      scroll = Math.max(-1, Math.min(1.5, (window.innerHeight * .55 - rect.top) / Math.max(rect.height, 1)));
      if (reduced) draw();
    };
    const onMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = (event.clientX - rect.left) / rect.width - .5;
      mouseY = (event.clientY - rect.top) / rect.height - .5;
      if (reduced) draw();
    };
    function draw() {
      if (!ctx || !width || !height) return;
      ctx.clearRect(0, 0, width, height);
      const radius = Math.min(width * .42, height * .43);
      const rot = scroll * .85 + (reduced ? 0 : frame * .00012) + mouseX * .25;
      const tilt = -.28 + scroll * .19 + mouseY * .18;
      const projected = dots.map(p => {
        const x = p.x * Math.cos(rot) - p.z * Math.sin(rot);
        const z = p.x * Math.sin(rot) + p.z * Math.cos(rot);
        const y = p.y * Math.cos(tilt) - z * Math.sin(tilt);
        const depth = p.y * Math.sin(tilt) + z * Math.cos(tilt);
        const scale = 2.7 / (3.5 - depth);
        return { x: width * .51 + x * radius * scale, y: height * .49 + y * radius * scale, depth, size: p.size };
      });
      const glow = ctx.createRadialGradient(width * .51,height * .49,8,width * .51,height * .49,radius * 1.4);
      glow.addColorStop(0,"rgba(114,142,119,.14)");glow.addColorStop(1,"rgba(114,142,119,0)");
      ctx.fillStyle=glow;ctx.fillRect(0,0,width,height);
      // Only connect spatially adjacent points; avoids tangled web geometry.
      for(let i=0;i<dots.length;i++)for(let j=i+1;j<dots.length;j++){
        const a=dots[i],b=dots[j];
        const dist=Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
        if(dist>.43 || dist<.13)continue;
        const pa=projected[i],pb=projected[j];
        const opacity=Math.max(.04,Math.min(.29,(.43-dist)*1.05))*(.72+(pa.depth+pb.depth)*.12);
        ctx.strokeStyle=`rgba(65,103,82,${opacity})`;ctx.lineWidth=.85;
        ctx.beginPath();ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();
      }
      for(const p of projected){
        const alpha=.33+(p.depth+1)*.23;
        ctx.fillStyle=`rgba(65,104,80,${alpha})`;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size*(.7+(p.depth+1)*.2),0,Math.PI*2);ctx.fill();
      }
    }
    const animate = () => {frame++;draw();raf=requestAnimationFrame(animate);};
    window.addEventListener("resize",resize);
    window.addEventListener("scroll",onScroll,{passive:true});
    canvas.addEventListener("pointermove",onMove,{passive:true});
    resize();onScroll();if(!reduced)raf=requestAnimationFrame(animate);
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);window.removeEventListener("scroll",onScroll);canvas.removeEventListener("pointermove",onMove);};
  },[]);
  return <div className="living-network" aria-label="An abstract network of interconnected points that shifts perspective as the page scrolls" role="img"><canvas ref={canvasRef} aria-hidden="true"/><span className="network-caption">An evolving system of connections.</span></div>;
}
