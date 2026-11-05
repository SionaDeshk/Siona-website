# Siona Platform v0.3: production release gate

Status: **HOLD. Do not merge into main or invite clinicians yet.**

## Confirmed
- Vercel preview build passed for the authentication and recruiter branch.
- Founder manually confirmed email signup, login, profile persistence and recruiter dashboard visibility.
- Founder recruiter membership was inserted manually in Supabase.

## Required before release
- [ ] Investigate Chrome's **Dangerous / deceptive site** warning on the Vercel preview. Do not dismiss the warning as a false positive without verification. Check Google Safe Browsing site status and request a review if warranted. Avoid entering passwords on flagged domains.
- [ ] Test a **separate non-recruiter account**: it must not read another clinician profile, read recruiter_memberships for others, access recruiter dashboard data, or write recruitment_pipeline.
- [ ] Verify a signed-out visitor cannot read clinician profiles or recruitment pipeline via the Supabase REST API.
- [ ] Verify recruiter status changes persist after refresh, and an ordinary clinician cannot change them.
- [ ] Verify auth callback on the intended production domain and allowlisted redirect URLs.
- [ ] Verify RLS is enabled on all three tables and review every policy against least privilege.
- [ ] Test session expiration, sign-out, refresh and cookies on production domain.
- [ ] Confirm Supabase publishable key only in NEXT_PUBLIC variables; no service role/secret keys in browser.
- [ ] Confirm privacy policy, consent, retention, deletion process and data minimization before onboarding outside testers.
- [ ] Review npm lockfile consistency and dependencies; run production build and automated tests.

## Deployment
- Keep PR #4 **draft** and do not merge until the checklist passes.
- PR #3 contains the original schema migration, which was reportedly executed manually in Supabase; reconcile migration history before production deployment.
- The original /platform page remains a sample-data demo and should be clearly labeled as such.
