"use client";

import { useState } from "react";
import Link from "next/link";

type Clinician = { id: number; name: string; specialty: string; region: string; employment: string; status: "Interested" | "Contacted" | "In conversation"; };
const sample: Clinician[] = [
  { id: 1, name: "Sample Clinician A", specialty: "ICU / Critical Care", region: "Pacific Northwest", employment: "Travel", status: "Interested" },
  { id: 2, name: "Sample Clinician B", specialty: "Emergency Department", region: "Alaska", employment: "Per diem", status: "Contacted" },
  { id: 3, name: "Sample Clinician C", specialty: "Medical-Surgical", region: "Northeast", employment: "Permanent", status: "In conversation" },
];
const specialties = ["ICU / Critical Care", "Emergency Department", "Medical-Surgical", "Operating Room", "Labor & Delivery", "Telemetry", "Other"];
const regions = ["Alaska", "Pacific Northwest", "California", "Northeast", "Southeast", "Flexible / Nationwide"];
const arrangements = ["Travel", "Permanent", "Per diem", "Flexible"];

export default function PlatformPage() {
  const [tab, setTab] = useState<"clinician" | "dashboard">("clinician");
  const [specialty, setSpecialty] = useState(specialties[0]);
  const [region, setRegion] = useState(regions[0]);
  const [employment, setEmployment] = useState(arrangements[0]);
  const [experience, setExperience] = useState("1–3 years");
  const [saved, setSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All specialties");
  const [candidates, setCandidates] = useState(sample);
  const visible = candidates.filter(c => (filter === "All specialties" || c.specialty === filter) && [c.name,c.specialty,c.region,c.employment].some(v => v.toLowerCase().includes(query.toLowerCase())));
  return (
    <main className="platform-page page-gutter">
      <div className="platform-top"><Link href="/" className="platform-back">← SIONA</Link><span>PLATFORM / PROTOTYPE 0.1</span></div>
      <header className="platform-intro"><p className="eyebrow">People first. Systems that evolve.</p><h1>The Siona <em>network.</em></h1><p>An early look at the clinician experience and recruitment workspace. This is a demonstration only: no accounts, submissions, or real clinician records are stored.</p></header>
      <div className="platform-tabs" role="tablist" aria-label="Platform prototype views">
        <button type="button" role="tab" aria-selected={tab === "clinician"} onClick={() => setTab("clinician")}>Clinician experience</button>
        <button type="button" role="tab" aria-selected={tab === "dashboard"} onClick={() => setTab("dashboard")}>Recruitment dashboard</button>
      </div>
      {tab === "clinician" ? (
        <section className="platform-panel" aria-labelledby="profile-title">
          <div className="platform-panel-head"><span className="eyebrow">01 / CLINICIAN EXPERIENCE</span><h2 id="profile-title">Your next chapter, on your terms.</h2><p>Explore the preferences a future Siona profile could capture. Do not enter personal information; this is an interactive mockup.</p></div>
          <form className="platform-form" onSubmit={event => {event.preventDefault();setSaved(true);}}>
            <label>Clinical specialty<select value={specialty} onChange={e => {setSpecialty(e.target.value);setSaved(false);}}>{specialties.map(x=><option key={x}>{x}</option>)}</select></label>
            <label>Preferred region<select value={region} onChange={e => {setRegion(e.target.value);setSaved(false);}}>{regions.map(x=><option key={x}>{x}</option>)}</select></label>
            <label>Work arrangement<select value={employment} onChange={e => {setEmployment(e.target.value);setSaved(false);}}>{arrangements.map(x=><option key={x}>{x}</option>)}</select></label>
            <label>Clinical experience<select value={experience} onChange={e => {setExperience(e.target.value);setSaved(false);}}>{["Less than 1 year","1–3 years","4–7 years","8+ years"].map(x=><option key={x}>{x}</option>)}</select></label>
            <button className="platform-primary" type="submit">Preview preferences →</button>
          </form>
          {saved && <div className="platform-preview" role="status"><strong>Your preference preview</strong><p>{specialty} · {region} · {employment} · {experience}</p><small>Preview only. Nothing was submitted, saved, or sent to Siona.</small></div>}
        </section>
      ) : (
        <section className="platform-panel" aria-labelledby="dashboard-title">
          <div className="platform-panel-head"><span className="eyebrow">02 / RECRUITMENT WORKSPACE</span><h2 id="dashboard-title">A clearer view of the network.</h2><p>Sample records only. This dashboard has no authentication or live database and must not be used for real applicant information.</p></div>
          <div className="platform-metrics"><div><strong>{candidates.length}</strong><span>Sample profiles</span></div><div><strong>{candidates.filter(c=>c.status==="Interested").length}</strong><span>Interested</span></div><div><strong>{candidates.filter(c=>c.status==="In conversation").length}</strong><span>In conversation</span></div></div>
          <div className="platform-filters"><label>Search sample profiles<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search specialty, region, name…" /></label><label>Specialty<select value={filter} onChange={e=>setFilter(e.target.value)}><option>All specialties</option>{specialties.map(x=><option key={x}>{x}</option>)}</select></label></div>
          <div className="platform-table-wrap"><table className="platform-table"><thead><tr><th>Clinician</th><th>Specialty</th><th>Region</th><th>Work type</th><th>Status</th></tr></thead><tbody>{visible.map(c=><tr key={c.id}><td>{c.name}</td><td>{c.specialty}</td><td>{c.region}</td><td>{c.employment}</td><td><select aria-label={`Status for ${c.name}`} value={c.status} onChange={e=>setCandidates(prev=>prev.map(x=>x.id===c.id?{...x,status:e.target.value as Clinician["status"]}:x))}><option>Interested</option><option>Contacted</option><option>In conversation</option></select></td></tr>)}</tbody></table>{visible.length===0&&<p>No sample profiles match your search.</p>}</div>
          <p className="platform-disclaimer">All data is fictional. Changes reset on refresh. No information is transmitted or persisted.</p>
        </section>
      )}
      <footer className="platform-footer">SIONA GROUP · THE PATH IS THE WAY.</footer>
    </main>
  );
}
