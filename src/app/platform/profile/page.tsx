import Link from "next/link";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";
export default async function ProfilePage(){
  const client=await supabaseServer();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)redirect("/platform/login");
  const {data:profile}=await client.from("clinician_profiles").select("display_name,specialty,preferred_region,work_arrangement,experience_years").eq("user_id",user.id).maybeSingle();
  return <main id="main" className="platform-page page-gutter">
    <div className="platform-top"><Link href="/platform" className="platform-back">← SIONA</Link><span>MY CLINICIAN PROFILE</span></div>
    <section className="platform-panel" style={{maxWidth:850,margin:"auto"}}>
      <p className="eyebrow">YOUR SIONA ACCOUNT</p><h1 style={{fontSize:"clamp(40px,6vw,72px)",fontWeight:400,margin:"24px 0"}}>Your next chapter.</h1>
      <p>Signed in as {user.email}. Only basic professional preferences are collected at this stage.</p>
      <ProfileForm initial={profile??null} />
    </section>
  </main>;
}
