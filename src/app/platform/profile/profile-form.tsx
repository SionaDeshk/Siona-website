"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Profile={display_name:string;specialty:string;preferred_region:string;work_arrangement:string;experience_years:number};
export function ProfileForm({initial}:{initial:Profile|null}){
  const [name,setName]=useState(initial?.display_name??"");
  const [specialty,setSpecialty]=useState(initial?.specialty??"ICU / Critical Care");
  const [region,setRegion]=useState(initial?.preferred_region??"Alaska");
  const [arrangement,setArrangement]=useState(initial?.work_arrangement??"Travel");
  const [years,setYears]=useState(initial?.experience_years??1);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");
  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();setBusy(true);setNotice("");
    try{
      const client=supabaseBrowser();
      const {data:{user},error:authError}=await client.auth.getUser();
      if(authError||!user)throw new Error("Your session expired. Sign in again.");
      const {error}=await client.from("clinician_profiles").upsert({user_id:user.id,display_name:name.trim(),specialty,preferred_region:region,work_arrangement:arrangement,experience_years:years},{onConflict:"user_id"});
      if(error)throw error;
      setNotice("Your preferences were saved.");
    }catch(err){setNotice(err instanceof Error?err.message:"Unable to save profile.");}
    finally{setBusy(false);}
  }
  async function signOut(){const client=supabaseBrowser();await client.auth.signOut();window.location.assign("/platform/login");}
  return <>
    <form className="platform-form" onSubmit={save}>
      <label>Display name<input required minLength={2} maxLength={100} value={name} onChange={e=>setName(e.target.value)} /></label>
      <label>Clinical specialty<select value={specialty} onChange={e=>setSpecialty(e.target.value)}>{["ICU / Critical Care","Emergency Department","Medical-Surgical","Operating Room","Labor & Delivery","Telemetry","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Preferred region<select value={region} onChange={e=>setRegion(e.target.value)}>{["Alaska","Pacific Northwest","California","Northeast","Southeast","Flexible / Nationwide"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Work arrangement<select value={arrangement} onChange={e=>setArrangement(e.target.value)}>{["Travel","Permanent","Per diem","Flexible"].map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Years of clinical experience<input type="number" required min={0} max={60} value={years} onChange={e=>setYears(Number(e.target.value))}/></label>
      <button className="platform-primary" type="submit" disabled={busy}>{busy?"Saving…":"Save preferences →"}</button>
    </form>
    {notice&&<p role="status" style={{marginTop:24}}>{notice}</p>}
    <button type="button" style={{marginTop:40,textDecoration:"underline"}} onClick={signOut}>Sign out</button>
  </>;
}
