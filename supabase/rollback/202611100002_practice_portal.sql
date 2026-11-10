-- Destructive to practice access, publications and public updates. Export first; approve before production use.
-- Retains underlying Operations requests and internal audit snapshots. Roll back before Operations itself.
begin;
drop function public.ops_practice_access(),public.ops_list_practice_access(),public.ops_manage_practice_access(jsonb),public.ops_publish_practice_offer(jsonb),public.ops_post_practice_update(jsonb),public.ops_practice_snapshot(uuid),public.ops_practice_submit(jsonb),public.ops_practice_cancel(jsonb);
drop trigger portal_stage_update on public.ops_requests;
drop function ops_private.portal_stage_update(),ops_private.offer_available(public.ops_practice_offers);
drop table public.ops_practice_updates,public.ops_practice_members;
alter table public.ops_requests drop column portal_offer_id,drop column portal_submission_key,drop column portal_reference,drop column portal_message,drop column portal_product_name,drop column portal_unit;
drop table public.ops_practice_offers;
commit;
