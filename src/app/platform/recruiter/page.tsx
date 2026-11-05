import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { RecruiterBoard } from "./recruiter-board";

export const dynamic = "force-dynamic";
export default async function RecruiterPage() {
  const client = await supabaseServer();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/platform/login");
  // Membership is checked on the server and RLS independently protects every query.
  const { data: membership, error: membershipError } = await client.from("recruiter_memberships")
    .select("user_id").eq("user_id", user.id).maybeSingle();
  if (membershipError || !membership) {
    return <main className="platform-page page-gutter"><div className="platform-top"><Link href="/platform/profile">← MY PROFILE</Link></div><section className="platform-panel"><h1>Access restricted</h1><p>This workspace is available only to authorized Siona recruiters.</p></section></main>;
  }
  const { data: profiles, error: profileError } = await client.from("clinician_profiles")
    .select("user_id,display_name,specialty,preferred_region,work_arrangement,experience_years,created_at")
    .order("created_at",{ascending:false}).limit(100);
  const { data: pipeline, error: pipelineError } = await client.from("recruitment_pipeline")
    .select("clinician_user_id,status");
  return <main className="platform-page page-gutter">
    <div className="platform-top"><Link href="/platform/profile" className="platform-back">← MY PROFILE</Link><span>FOUNDER / RECRUITER</span></div>
    <section className="platform-panel">
      <p className="eyebrow">SIONA / PRIVATE WORKSPACE</p>
      <h1 style={{fontSize:"clamp(40px,6vw,72px)",fontWeight:400,margin:"24px 0"}}>The network, taking shape.</h1>
      <p>Authenticated recruiter access. Clinician preferences only, not verified credentials or clinical qualifications.</p>
      {profileError || pipelineError ? <p role="alert">Unable to load recruitment data. Check database permissions and try again.</p> :
        <RecruiterBoard profiles={profiles??[]} pipeline={pipeline??[]} />}
    </section>
  </main>;
}
