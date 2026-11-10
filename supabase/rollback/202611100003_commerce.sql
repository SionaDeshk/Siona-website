-- Destructive to commercial records. Export first; explicit approval required in production.
-- Leaves existing Operations requests, practice access and the internal audit history intact.
begin;
drop function public.ops_commerce_save(text,jsonb),public.ops_commerce_snapshot(uuid),public.ops_practice_quote_decide(jsonb);
drop trigger commercial_gate on public.ops_requests;
drop function ops_private.commercial_gate(),ops_private.decide_quote(jsonb,boolean),ops_private.quote_ready(public.ops_quotes,public.ops_requests),ops_private.attach_recall(public.ops_recalls,uuid),ops_private.practice_notice(uuid,text);
alter table public.ops_requests drop column accepted_quote_id,drop column quote_required;
drop table public.ops_quote_decisions,public.ops_shipment_events,public.ops_issues,public.ops_recalls,public.ops_shipment_lots,public.ops_shipments,public.ops_quotes,public.ops_rfqs;
notify pgrst,'reload schema';
commit;
