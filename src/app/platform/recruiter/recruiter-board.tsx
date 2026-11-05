"use client";
import { useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

type Profile={user_id:string;display_name:string;specialty:string;preferred_region:string;work_arrangement:string;experience_years:number;created_at:string};
type Pipeline={clinician_user_id:string;status:string};
const statuses=["Interested","Contacted","In conversation"] as const;
export function RecruiterBoard({profiles,pipeline}:{profiles:Profile[];pipeline:Pipeline[]}){
  const [specialty,setSpecialty]=useState("All");
  const [region,setRegion]=useState("All");
  const [statusFilter,setStatusFilter]=useState("All");
  const [search,setSearch]=useState("");
  const [statusesById,setStatusesById]=useState<Record<string,string>>(()=>Object.fromEntries(pipeline.map(x=>[x.clinician_user_id,x.status])));
  const [saving,setSaving]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const counts=useMemo(()=>Object.fromEntries(statuses.map(s=>[s,profiles.filter(p=>(statusesById[p.user_id]??"Interested")===s).length])),[profiles,statusesById]);
  const filtered=useMemo(()=>profiles.filter(p=>
    (specialty==="All"||p.specialty===specialty)&&
    (region==="All"||p.preferred_region===region)&&
    (statusFilter==="All"||(statusesById[p.user_id]??"Interested")===statusFilter)&&
    (p.display_name+" "+p.specialty+" "+p.preferred_region).toLowerCase().includes(search.trim().toLowerCase())
  ),[profiles,specialty,region,statusFilter,search,statusesById]);
  async function updateStatus(id:string,status:string){
    if(!statuses.some(s=>s===status))return;
    setSaving(id);setError("");setSuccess("");
    try {
      const client=supabaseBrowser();
      const {error}=await client.from("recruitment_pipeline").upsert({clinician_user_id:id,status},{onConflict:"clinician_user_id"});
      if(error)throw error;
      setStatusesById(current=>({...current,[id]:status}));
      setSuccess("Recruitment status saved.");
    }catch(err){setError(err instanceof Error?err.message:"Could not update status.");}
    finally{setSaving(null);}
  }
  return <>
    <div aria-label="Recruitment pipeline summary" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,margin:"24px 0"}}>
      {statuses.map(s=><div key={s} className="platform-panel" style={{padding:16,border:"1px solid #ddd"}}>
        <p style={{fontSize:13,marginBottom:8}}>{s}</p><strong style={{fontSize:28}}>{counts[s]}</strong>
      </div>)}
    </div>
    <p style={{margin:"24px 0"}}><strong>{profiles.length}</strong> clinician profile{profiles.length===1?"":"s"} · <strong>{filtered.length}</strong> shown</p>
    <div className="platform-form" style={{marginBottom:20}}>
      <label>Search clinicians<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Name, specialty, or region" /></label>
      <label>Recruitment stage<select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option>All</option>{statuses.map(s=><option key={s}>{s}</option>)}</select></label>
      <label>Specialty<select value={specialty} onChange={e=>setSpecialty(e.target.value)}><option>All</option>{Array.from(new Set(profiles.map(x=>x.specialty))).sort().map(x=><option key={x}>{x}</option>)}</select></label>
      <label>Preferred region<select value={region} onChange={e=>setRegion(e.target.value)}><option>All</option>{Array.from(new Set(profiles.map(x=>x.preferred_region))).sort().map(x=><option key={x}>{x}</option>)}</select></label>
    </div>
    <button type="button" style={{textDecoration:"underline",marginBottom:24}} onClick={()=>{setSearch("");setStatusFilter("All");setSpecialty("All");setRegion("All");}}>Clear filters</button>
    {error&&<p role="alert">{error}</p>}
    {success&&<p role="status">{success}</p>}
    {filtered.length===0?<p>No clinician profiles match these filters yet.</p>:
      <div style={{display:"grid",gap:16}}>
        {filtered.map(p=><article key={p.user_id} className="platform-panel" style={{border:"1px solid #ddd",padding:24}}>
          <h2 style={{fontSize:28,fontWeight:400,marginBottom:12}}>{p.display_name}</h2>
          <p>{p.specialty} · {p.preferred_region} · {p.work_arrangement} · {p.experience_years} year{p.experience_years===1?"":"s"} experience</p>
          <label style={{display:"block",marginTop:16}}>Recruitment status{" "}
            <select aria-label={`Recruitment status for ${p.display_name}`} disabled={saving===p.user_id} value={statusesById[p.user_id]??"Interested"} onChange={e=>updateStatus(p.user_id,e.target.value)} style={{padding:12,marginLeft:12}}>
              {statuses.map(s=><option key={s}>{s}</option>)}
            </select>
          </label>
        </article>)}
      </div>}
  </>;
}
