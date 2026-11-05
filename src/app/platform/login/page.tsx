"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function LoginPage(){
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [mode,setMode]=useState<"login"|"register">("register");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setNotice("");
    try{
      const client=supabaseBrowser();
      if(mode==="register"){
        const {error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin+"/auth/callback"}});
        if(error)throw error;
        setNotice("Check your email for a confirmation link. If you already have an account, sign in instead.");
      }else{
        const {error}=await client.auth.signInWithPassword({email,password});
        if(error)throw error;
        window.location.assign("/platform/profile");
      }
    }catch(error){setNotice(error instanceof Error?error.message:"Something went wrong.");}
    finally{setBusy(false);}
  }
  return <main id="main" className="platform-page page-gutter">
    <div className="platform-top"><Link href="/platform" className="platform-back">← SIONA</Link><span>CLINICIAN ACCESS</span></div>
    <section className="platform-panel" style={{maxWidth:580,margin:"auto"}}>
      <p className="eyebrow">SIONA / CLINICIANS</p>
      <h1 style={{fontSize:"clamp(40px,6vw,72px)",fontWeight:400,margin:"24px 0"}}>{mode==="register"?"Join the network.":"Welcome back."}</h1>
      <p>Early-access clinician accounts. Please do not upload or enter credentials, identity documents, or sensitive information.</p>
      <form className="platform-form" style={{gridTemplateColumns:"1fr"}} onSubmit={submit}>
        <label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>Password<input type="password" required minLength={8} autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button className="platform-primary" disabled={busy} type="submit">{busy?"Working…":mode==="register"?"Create account →":"Sign in →"}</button>
      </form>
      {notice&&<p role="status" style={{marginTop:24}}>{notice}</p>}
      <button type="button" style={{marginTop:24,textDecoration:"underline"}} onClick={()=>{setMode(mode==="register"?"login":"register");setNotice("");}}>{mode==="register"?"Already registered? Sign in":"New to Siona? Create an account"}</button>
    </section>
  </main>;
}
