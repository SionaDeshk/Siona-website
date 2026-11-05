"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const chapters=[
 {number:"01",eyebrow:"THE ORIGIN",title:"The path is the way.",body:"An institution built to outgrow its founder.",detail:"We begin with people, conviction, and the freedom to question what exists."},
 {number:"02",eyebrow:"THE CONNECTION",title:"Progress is interconnected.",body:"Relationships become networks. Networks become capability.",detail:"Clinicians, institutions, manufacturers, and ideas connected through trust and shared knowledge."},
 {number:"03",eyebrow:"THE EVOLUTION",title:"Build what comes next.",body:"Healthcare. Life sciences. Intelligence.",detail:"Each capability creates the conditions for the next. The ambition is expansive. The execution is disciplined."}
];
export function PathExperience(){
 const root=useRef<HTMLDivElement>(null);
 const [progress,setProgress]=useState(0);
 const [active,setActive]=useState(0);
 useEffect(()=>{
  const update=()=>{const el=root.current;if(!el)return;const rect=el.getBoundingClientRect();const span=Math.max(1,rect.height-window.innerHeight);const p=Math.max(0,Math.min(1,-rect.top/span));setProgress(p);setActive(Math.min(2,Math.floor(p*3.05)));};
  update();window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);
  return()=>{window.removeEventListener("scroll",update);window.removeEventListener("resize",update);};
 },[]);
 return <div ref={root} className="path-experience" id="path" style={{"--path-progress":progress} as React.CSSProperties}>
  <div className="path-stage">
   <div className="path-art" aria-hidden="true">
    <svg viewBox="0 0 720 860" preserveAspectRatio="xMidYMid meet">
     <defs>
      <linearGradient id="path-gradient" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d4c58d"/><stop offset=".45" stopColor="#a2d7c1"/><stop offset=".75" stopColor="#7b96d0"/><stop offset="1" stopColor="#d6a4c5"/></linearGradient>
      <filter id="path-glow"><feGaussianBlur stdDeviation="9"/></filter>
     </defs>
     <g fill="none" stroke="url(#path-gradient)" strokeLinecap="round">
      <path d="M345 -40 C100 145 560 225 360 420 S90 660 360 910" strokeWidth="21" opacity=".25" filter="url(#path-glow)" pathLength="100" strokeDasharray={100} strokeDashoffset={100-progress*100}/>
      <path d="M345 -40 C100 145 560 225 360 420 S90 660 360 910" strokeWidth="3.5" pathLength="100" strokeDasharray={100} strokeDashoffset={100-progress*100}/>
      <path d="M360 420 C550 330 575 530 655 580" strokeWidth="2" opacity={Math.max(0,(progress-.25)*1.8)} />
      <path d="M290 650 C110 510 90 390 25 315" strokeWidth="2" opacity={Math.max(0,(progress-.42)*1.8)} />
      <path d="M360 420 C420 230 620 200 665 115" strokeWidth="1.5" opacity={Math.max(0,(progress-.55)*1.8)} />
      <path d="M290 650 C500 690 530 750 665 805" strokeWidth="1.5" opacity={Math.max(0,(progress-.62)*1.8)} />
     </g>
     {[[360,420],[290,650],[530,370],[580,540],[150,490],[465,715],[625,195]].map(([x,y],i)=><circle key={i} cx={x} cy={y} r={i===0?7:4} fill={i%2?"#c9b5dd":"#a8ddc6"} opacity={Math.max(0,Math.min(1,progress*3-i*.12))}/>)}
    </svg>
    <span className="path-art-label">A system in motion / 001</span>
   </div>
   <div className="path-copy" aria-live="off">
    <span className="path-kicker">SIONA GROUP <span> / {chapters[active].eyebrow}</span></span>
    <h1 key={active}>{chapters[active].title}</h1>
    <p className="path-lead">{chapters[active].body}</p>
    <p className="path-detail">{chapters[active].detail}</p>
    {active===2&&<div className="path-ventures"><Link href="/biologics">Explore Biologics ↗</Link><Link href="/intelligence">Explore Intelligence ↗</Link><a href="#contact">Build with us ↗</a></div>}
    <div className="path-navigation" aria-label="Explore Siona chapters">{chapters.map((c,i)=><button key={c.number} type="button" aria-label={`Go to chapter ${c.number}: ${c.eyebrow}`} aria-current={i===active?"step":undefined} onClick={()=>{const el=root.current;if(!el)return;const y=window.scrollY+el.getBoundingClientRect().top+(el.offsetHeight-window.innerHeight)*i/2;window.scrollTo({top:y,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"instant":"smooth"});}}><span>{c.number}</span><i/></button>)}</div>
   </div>
   <div className="path-scroll-hint">SCROLL TO EXPLORE <span>↓</span></div>
  </div>
 </div>;
}
