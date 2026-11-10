-- Destructive to Operations records. Back up and explicitly approve before any production use.
-- Run before rolling back Evolution Engine, which Operations references.
begin;
drop function public.ops_save(text,jsonb);
drop function ops_private.check_ready(public.ops_requests);
drop table public.ops_events, public.ops_requests, public.ops_eligibility, public.ops_products, public.ops_practices;
drop function ops_private.valid_state(text);
drop schema ops_private;
commit;
