-- Additive quotes, fulfillment and follow-up module. Apply once after the practice portal.
begin;
do $$ begin
 if to_regclass('public.ops_practice_offers') is null then raise exception 'Install the practice portal before commerce.'; end if;
 if to_regclass('public.ops_quotes') is not null then raise exception 'Commerce already exists. Do not repeat its initial migration.'; end if;
end $$;
create table public.ops_rfqs (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.ops_requests(id), supplier_id uuid not null references public.intel_suppliers(id),
 product_revision integer not null, product_kind text not null, quantity integer not null, unit text not null, reference text not null check(length(btrim(reference)) between 3 and 180),
 due_on date not null, notes text not null check(length(btrim(notes)) between 10 and 2000), status text not null default 'Requested' check(status in ('Requested','Responded','Closed')),
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table public.ops_quotes (
 id uuid primary key default gen_random_uuid(), rfq_id uuid not null references public.ops_rfqs(id), request_id uuid not null references public.ops_requests(id),
 supplier_id uuid not null references public.intel_suppliers(id), product_revision integer not null, product_kind text not null, quantity integer not null check(quantity between 1 and 100000), unit text not null,
 supplier_reference text not null check(length(btrim(supplier_reference)) between 3 and 180), source_url text not null check(source_url like 'https://%' and length(source_url)<=2000),
 currency text not null check(currency in ('USD','CAD','EUR','GBP')), unit_minor bigint not null check(unit_minor between 1 and 999999999),
 shipping_minor bigint not null check(shipping_minor between 0 and 999999999), tax_minor bigint not null check(tax_minor between 0 and 999999999),
 total_minor bigint generated always as (unit_minor*quantity+shipping_minor+tax_minor) stored,
 lead_days integer not null check(lead_days between 0 and 365), valid_until date not null,
 delivery_terms text not null check(length(btrim(delivery_terms)) between 10 and 2000), practice_summary text not null check(length(btrim(practice_summary)) between 10 and 1000),
 internal_notes text not null default '' check(length(internal_notes)<=2000), status text not null default 'Draft' check(status in ('Draft','Shared','Accepted','Declined','Withdrawn')),
 version integer not null default 1, shared_at timestamptz, accepted_by uuid references auth.users(id), accepted_at timestamptz,
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table public.ops_quote_decisions (
 id uuid primary key default gen_random_uuid(), quote_id uuid not null references public.ops_quotes(id), request_id uuid not null references public.ops_requests(id),
 decision text not null check(decision in ('Accept','Decline')), actor_id uuid not null references auth.users(id), notes text not null check(length(btrim(notes)) between 10 and 2000),
 terms jsonb not null, created_at timestamptz not null default now()
);
-- Existing requests retain their original workflow; all new requests require quotes.
alter table public.ops_requests add column quote_required boolean not null default false, add column accepted_quote_id uuid references public.ops_quotes(id);
alter table public.ops_requests alter column quote_required set default true;
create table public.ops_shipments (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.ops_requests(id), quantity integer not null check(quantity between 1 and 100000),
 partner_reference text not null check(length(btrim(partner_reference)) between 3 and 180), carrier text not null default '' check(length(carrier)<=100),
 tracking_reference text not null default '' check(length(tracking_reference)<=180), expected_on date not null,
 status text not null default 'Preparing' check(status in ('Preparing','Dispatched','Delivered','Exception','Cancelled')), version integer not null default 1,
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id)
);
create table public.ops_shipment_lots (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.ops_shipments(id), supplier_id uuid not null references public.intel_suppliers(id),
 lot_code text not null check(length(btrim(lot_code)) between 2 and 100), expires_on date not null, quantity integer not null check(quantity between 1 and 100000),
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id), unique(shipment_id,lot_code)
);
create table public.ops_shipment_events (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.ops_shipments(id), status text not null, occurred_on date not null,
 practice_message text not null check(length(btrim(practice_message)) between 10 and 1000), internal_notes text not null check(length(internal_notes)<=2000),
 created_at timestamptz not null default now(), actor_id uuid not null references auth.users(id)
);
create table public.ops_recalls (
 id uuid primary key default gen_random_uuid(), supplier_id uuid not null references public.intel_suppliers(id), lot_code text not null check(length(btrim(lot_code)) between 2 and 100),
 reference text not null check(length(btrim(reference)) between 3 and 180), source_url text not null check(source_url like 'https://%' and length(source_url)<=2000),
 reason text not null check(length(btrim(reason)) between 20 and 2000), practice_message text not null check(length(btrim(practice_message)) between 10 and 1000),
 status text not null default 'Open' check(status in ('Open','Closed')), resolution text not null default '', version integer not null default 1,
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id), closed_by uuid references auth.users(id), closed_at timestamptz
);
create unique index ops_active_recall on public.ops_recalls(supplier_id,lot_code) where status='Open';
create table public.ops_issues (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.ops_requests(id), shipment_id uuid references public.ops_shipments(id), recall_id uuid references public.ops_recalls(id),
 kind text not null check(kind in ('Delivery exception','Recall')), practice_message text not null check(length(btrim(practice_message)) between 10 and 1000), internal_details text not null default '',
 status text not null default 'Open' check(status in ('Open','Resolved')), resolution text not null default '', version integer not null default 1,
 created_at timestamptz not null default now(), created_by uuid not null references auth.users(id), resolved_by uuid references auth.users(id), resolved_at timestamptz,
 unique(recall_id,request_id)
);
create unique index ops_open_shipment_issue on public.ops_issues(shipment_id) where kind='Delivery exception' and status='Open';
create index ops_rfq_request on public.ops_rfqs(request_id);
create index ops_quote_request on public.ops_quotes(request_id);
create index ops_shipment_request on public.ops_shipments(request_id);
create index ops_lot_source on public.ops_shipment_lots(supplier_id,lot_code);
create index ops_issue_request on public.ops_issues(request_id,status);
do $$ declare t text; begin
 foreach t in array array['ops_rfqs','ops_quotes','ops_quote_decisions','ops_shipments','ops_shipment_lots','ops_shipment_events','ops_recalls','ops_issues'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy internal_read on public.%I for select to authenticated using(intel_private.role() is not null)',t);
 end loop;
end $$;
create function ops_private.quote_ready(q public.ops_quotes,r public.ops_requests) returns void language plpgsql set search_path='' as $$
declare p public.ops_products;
begin
 perform ops_private.check_ready(r);
 select * into strict p from public.ops_products where id=r.product_id for share;
 if q.request_id<>r.id or q.supplier_id<>p.supplier_id or q.product_revision<>p.revision or q.quantity<>r.quantity or q.unit<>p.unit then raise exception 'The quoted scope changed. Obtain and review a new quote.'; end if;
 if q.status<>'Accepted' and q.valid_until<(now() at time zone 'UTC')::date then raise exception 'The quote has expired.'; end if;
end $$;
create function ops_private.commercial_gate() returns trigger language plpgsql security definer set search_path='' as $$
declare q public.ops_quotes;
begin
 if not new.quote_required then return new; end if;
 if new.stage='Cancelled' and exists(select 1 from public.ops_shipments where request_id=new.id and status<>'Cancelled') then raise exception 'A partner handoff exists. Contact Operations before cancellation.'; end if;
 if new.stage in ('Ready','Coordinating','Completed') then
  select * into q from public.ops_quotes where id=new.accepted_quote_id for share;
  if not found or q.status<>'Accepted' then raise exception 'An accepted quote is required before this request can progress.'; end if;
  if new.stage<>'Completed' then perform ops_private.quote_ready(q,new); end if;
 end if;
 if new.stage='Coordinating' and not exists(select 1 from public.ops_shipments where request_id=new.id and status<>'Cancelled') then raise exception 'Record the partner handoff in Quotes and fulfillment first.'; end if;
 if new.stage in ('Ready','Coordinating') and exists(select 1 from public.ops_issues where request_id=new.id and status='Open') then raise exception 'Resolve open delivery and recall follow-ups before resuming.'; end if;
 if new.stage='Completed' then
  if exists(select 1 from public.ops_issues where request_id=new.id and status='Open') then raise exception 'Resolve open delivery and recall follow-ups before completion.'; end if;
  if coalesce((select sum(quantity) from public.ops_shipments where request_id=new.id and status='Delivered'),0)<>new.quantity then raise exception 'All requested units must have recorded delivery before completion.'; end if;
 end if;
 return new;
end $$;
create trigger commercial_gate before update of stage on public.ops_requests for each row execute function ops_private.commercial_gate();
create function ops_private.practice_notice(target uuid,message text) returns void language sql set search_path='' as $$
 insert into public.ops_practice_updates(request_id,actor_id,body,kind) select id,auth.uid(),message,'message' from public.ops_requests where id=target and portal_offer_id is not null;
$$;
create function ops_private.attach_recall(c public.ops_recalls,target_request uuid) returns void language plpgsql set search_path='' as $$
begin
 insert into public.ops_issues(request_id,recall_id,kind,practice_message,internal_details,created_by) values(target_request,c.id,'Recall',c.practice_message,c.reason,auth.uid()) on conflict(recall_id,request_id) do nothing;
 if found then
  update public.ops_requests set stage='Hold',version=version+1 where id=target_request and stage in ('Ready','Coordinating');
  perform ops_private.practice_notice(target_request,c.practice_message);
 end if;
end $$;
create function ops_private.decide_quote(payload jsonb,practice_decision boolean) returns uuid language plpgsql set search_path='' as $$
declare actor uuid=auth.uid(); r public.ops_requests; q public.ops_quotes; member public.ops_practice_members; target uuid; decision_text text=payload->>'decision';
begin
 select request_id into target from public.ops_quotes where id=(payload->>'quote_id')::uuid;
 if target is null then raise exception 'This quote is unavailable.'; end if;
 select * into strict r from public.ops_requests where id=target for update;
 if practice_decision then
  select * into member from public.ops_practice_members where practice_id=r.practice_id and user_id=actor and active for share;
  if not found or member.role<>'requester' or r.portal_offer_id is null then raise exception 'This quote is unavailable.'; end if;
 else
  if intel_private.role() is distinct from 'admin' or r.portal_offer_id is not null then raise exception 'Practice quotes must be accepted by an authorized practice requester.'; end if;
 end if;
 select * into strict q from public.ops_quotes where id=(payload->>'quote_id')::uuid for update;
 if q.status='Accepted' and r.accepted_quote_id=q.id and q.accepted_by=actor and decision_text='Accept' then return q.id; end if;
 if q.version is distinct from (payload->>'quote_version')::integer or r.version is distinct from (payload->>'request_version')::integer then raise exception 'Quote or request changed. Refresh before deciding.'; end if;
 if q.status<>'Shared' or r.stage not in ('Review','Hold') or r.accepted_quote_id is not null then raise exception 'This quote is no longer awaiting a decision.'; end if;
 if decision_text not in ('Accept','Decline') or decision_text is null then raise exception 'Choose Accept or Decline.'; end if;
 if length(btrim(coalesce(payload->>'notes','')))<10 or length(payload->>'notes')>2000 then raise exception 'Record a decision reason.'; end if;
 if decision_text='Accept' then
  if (payload->>'confirmed')::boolean is distinct from true then raise exception 'Confirm the quoted terms before accepting.'; end if;
  perform ops_private.quote_ready(q,r);
  update public.ops_quotes set status='Accepted',accepted_by=actor,accepted_at=now(),version=version+1 where id=q.id;
  update public.ops_requests set quote_required=true,accepted_quote_id=q.id,stage=case when stage='Hold' then 'Review' else stage end,version=version+1 where id=r.id;
 else update public.ops_quotes set status='Declined',version=version+1 where id=q.id;
 end if;
 insert into public.ops_quote_decisions(quote_id,request_id,decision,actor_id,notes,terms) values(q.id,r.id,decision_text,actor,payload->>'notes',jsonb_build_object('currency',q.currency,'quantity',q.quantity,'unit',q.unit,'unit_minor',q.unit_minor,'shipping_minor',q.shipping_minor,'tax_minor',q.tax_minor,'total_minor',q.total_minor,'lead_days',q.lead_days,'valid_until',q.valid_until,'delivery_terms',q.delivery_terms));
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) values(actor,r.id,'request','quote_decision',decision_text||' quote for coordination.',jsonb_build_object('quote_id',q.id,'decision',decision_text,'total_minor',q.total_minor,'currency',q.currency));
 perform ops_private.practice_notice(r.id,case when decision_text='Accept' then 'Quoted terms accepted for coordination.' else 'The quoted terms were declined.' end);
 return q.id;
end $$;
create function public.ops_practice_quote_decide(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
begin
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4000 then raise exception 'A bounded quote decision is required.'; end if;
 return ops_private.decide_quote(payload,true);
end $$;
create function public.ops_commerce_save(action text,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); member_role text=intel_private.role(); target uuid; r public.ops_requests; p public.ops_products; f public.ops_rfqs; q public.ops_quotes; s public.ops_shipments; i public.ops_issues; c public.ops_recalls; item record; next_status text; snapshot jsonb;
begin
 if member_role is null or member_role not in ('admin','analyst') then raise exception 'Writer access is required.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>12000 then raise exception 'A bounded commerce operation is required.'; end if;
 if action in ('quote_status','internal_accept','recall','close_recall') and member_role<>'admin' then raise exception 'Administrator review is required.'; end if;
 case action
 when 'rfq' then
  select * into strict r from public.ops_requests where id=(payload->>'request_id')::uuid for update;
  if r.version is distinct from (payload->>'request_version')::integer then raise exception 'Request changed. Refresh before recording an RFQ.'; end if;
  if r.stage not in ('Draft','Review','Hold') or r.accepted_quote_id is not null then raise exception 'Record RFQs before acceptance and handoff.'; end if;
  select * into strict p from public.ops_products where id=r.product_id for share;
  insert into public.ops_rfqs(request_id,supplier_id,product_revision,product_kind,quantity,unit,reference,due_on,notes,created_by) values(r.id,p.supplier_id,p.revision,p.kind,r.quantity,p.unit,payload->>'reference',(payload->>'due_on')::date,payload->>'notes',actor) returning id into target;
  update public.ops_requests set quote_required=true,stage=case when stage='Draft' then 'Review' else stage end,version=version+1 where id=r.id;
  perform ops_private.practice_notice(r.id,'Supplier quote review is in progress.');
 when 'quote' then
  select request_id into target from public.ops_rfqs where id=(payload->>'rfq_id')::uuid;
  select * into strict r from public.ops_requests where id=target for update;
  select * into strict f from public.ops_rfqs where id=(payload->>'rfq_id')::uuid for update;
  if r.stage not in ('Draft','Review','Hold') or r.accepted_quote_id is not null then raise exception 'Record quotes before acceptance and handoff.'; end if;
  insert into public.ops_quotes(rfq_id,request_id,supplier_id,product_revision,product_kind,quantity,unit,supplier_reference,source_url,currency,unit_minor,shipping_minor,tax_minor,lead_days,valid_until,delivery_terms,practice_summary,internal_notes,created_by)
   values(f.id,r.id,f.supplier_id,f.product_revision,f.product_kind,f.quantity,f.unit,payload->>'supplier_reference',payload->>'source_url',payload->>'currency',(payload->>'unit_minor')::bigint,(payload->>'shipping_minor')::bigint,(payload->>'tax_minor')::bigint,(payload->>'lead_days')::integer,(payload->>'valid_until')::date,payload->>'delivery_terms',payload->>'practice_summary',coalesce(payload->>'internal_notes',''),actor) returning id into target;
  update public.ops_rfqs set status='Responded' where id=f.id;
 when 'quote_status' then
  select request_id into target from public.ops_quotes where id=(payload->>'quote_id')::uuid;
  select * into strict r from public.ops_requests where id=target for update;
  select * into strict q from public.ops_quotes where id=(payload->>'quote_id')::uuid for update;
  if q.version is distinct from (payload->>'version')::integer then raise exception 'Quote changed. Refresh before review.'; end if;
  if length(btrim(coalesce(payload->>'notes','')))<20 or length(payload->>'notes')>2000 then raise exception 'Record the pricing review in at least 20 characters.'; end if;
  next_status=payload->>'status';
  if next_status='Shared' then
   if q.status<>'Draft' or r.stage not in ('Draft','Review','Hold') or r.accepted_quote_id is not null then raise exception 'Only a draft quote awaiting acceptance can be shared.'; end if;
   perform ops_private.quote_ready(q,r);
   update public.ops_quotes set status='Shared',shared_at=now(),version=version+1 where id=q.id;
   perform ops_private.practice_notice(r.id,'A reviewed quote is available for your decision.');
  elsif next_status='Withdrawn' then
   if q.status not in ('Draft','Shared','Accepted') then raise exception 'This quote is already closed.'; end if;
   if q.status='Accepted' then
    if r.stage in ('Coordinating','Completed') or exists(select 1 from public.ops_shipments where request_id=r.id and status<>'Cancelled') then raise exception 'Record a follow-up after partner handoff instead of withdrawing accepted terms.'; end if;
    update public.ops_requests set stage='Hold',accepted_quote_id=null,version=version+1 where id=r.id;
   end if;
   update public.ops_quotes set status='Withdrawn',version=version+1 where id=q.id;
   if q.shared_at is not null then perform ops_private.practice_notice(r.id,'The quote was withdrawn; further review is required.'); end if;
  else raise exception 'Choose Shared or Withdrawn.';
  end if;
  target=q.id;
 when 'internal_accept' then
  return ops_private.decide_quote(payload||jsonb_build_object('decision','Accept'),false);
 when 'handoff' then
  select * into strict r from public.ops_requests where id=(payload->>'request_id')::uuid for update;
  if r.version is distinct from (payload->>'request_version')::integer then raise exception 'Request changed. Refresh before handoff.'; end if;
  if r.stage not in ('Ready','Coordinating') then raise exception 'Review and mark the request Ready before partner handoff.'; end if;
  select * into q from public.ops_quotes where id=r.accepted_quote_id for share;
  if not found or q.status<>'Accepted' then raise exception 'An accepted quote is required for partner handoff.'; end if;
  perform ops_private.quote_ready(q,r);
  if coalesce((select sum(quantity) from public.ops_shipments where request_id=r.id and status<>'Cancelled'),0)+(payload->>'quantity')::integer>r.quantity then raise exception 'Handoff quantities exceed the accepted request quantity.'; end if;
  insert into public.ops_shipments(request_id,quantity,partner_reference,carrier,tracking_reference,expected_on,created_by) values(r.id,(payload->>'quantity')::integer,payload->>'partner_reference',coalesce(payload->>'carrier',''),coalesce(payload->>'tracking_reference',''),(payload->>'expected_on')::date,actor) returning id into target;
  update public.ops_requests set stage='Coordinating',handoff_reference=payload->>'partner_reference',version=version+1 where id=r.id;
 when 'lot' then
  select * into strict s from public.ops_shipments where id=(payload->>'shipment_id')::uuid;
  select * into strict r from public.ops_requests where id=s.request_id;
  select * into strict q from public.ops_quotes where id=r.accepted_quote_id;
  perform pg_advisory_xact_lock(hashtextextended('siona-lot:'||q.supplier_id::text||':'||btrim(payload->>'lot_code'),0));
  select * into strict r from public.ops_requests where id=s.request_id for update;
  select * into strict s from public.ops_shipments where id=(payload->>'shipment_id')::uuid for update;
  if s.version is distinct from (payload->>'version')::integer then raise exception 'Shipment changed. Refresh before recording a lot.'; end if;
  if s.status not in ('Preparing','Exception') then raise exception 'Lots are immutable after dispatch. Record a follow-up for a correction.'; end if;
  if coalesce((select sum(quantity) from public.ops_shipment_lots where shipment_id=s.id),0)+(payload->>'quantity')::integer>s.quantity then raise exception 'Lot quantities exceed the shipment quantity.'; end if;
  insert into public.ops_shipment_lots(shipment_id,supplier_id,lot_code,expires_on,quantity,created_by) values(s.id,q.supplier_id,btrim(payload->>'lot_code'),(payload->>'expires_on')::date,(payload->>'quantity')::integer,actor) returning id into target;
  update public.ops_shipments set version=version+1 where id=s.id;
  for c in select * from public.ops_recalls where supplier_id=q.supplier_id and lot_code=btrim(payload->>'lot_code') and status='Open' loop perform ops_private.attach_recall(c,r.id); end loop;
 when 'shipment' then
  select request_id into target from public.ops_shipments where id=(payload->>'shipment_id')::uuid;
  select * into strict r from public.ops_requests where id=target for update;
  select * into strict s from public.ops_shipments where id=(payload->>'shipment_id')::uuid for update;
  if s.version is distinct from (payload->>'version')::integer then raise exception 'Shipment changed. Refresh before recording progress.'; end if;
  next_status=payload->>'status';
  if next_status is null or not ((s.status='Preparing' and next_status in ('Dispatched','Exception','Cancelled')) or (s.status='Dispatched' and next_status in ('Delivered','Exception')) or (s.status='Delivered' and next_status='Exception') or (s.status='Exception' and next_status in ('Dispatched','Delivered','Cancelled'))) then raise exception 'This shipment transition is unavailable.'; end if;
  if (payload->>'occurred_on')::date>(now() at time zone 'UTC')::date then raise exception 'Record observed shipment events with a current or past date.'; end if;
  if (payload->>'occurred_on')::date<coalesce((select max(occurred_on) from public.ops_shipment_events where shipment_id=s.id),(payload->>'occurred_on')::date) then raise exception 'Shipment progress cannot precede its recorded events.'; end if;
  select * into strict q from public.ops_quotes where id=r.accepted_quote_id;
  if next_status in ('Dispatched','Delivered') and q.product_kind='Practice supplies' then
   if coalesce((select sum(quantity) from public.ops_shipment_lots where shipment_id=s.id),0)<>s.quantity then raise exception 'Allocate every physical unit to a lot before recording dispatch or delivery.'; end if;
   if exists(select 1 from public.ops_shipment_lots where shipment_id=s.id and expires_on<(payload->>'occurred_on')::date) then raise exception 'Record an exception for expired supplies.'; end if;
  end if;
  if next_status='Dispatched' and exists(select 1 from public.ops_issues where request_id=r.id and status='Open') then raise exception 'Resolve open delivery and recall follow-ups before dispatch.'; end if;
  if next_status='Dispatched' and exists(select 1 from public.ops_shipment_lots l join public.ops_recalls recall_rows on recall_rows.supplier_id=l.supplier_id and recall_rows.lot_code=l.lot_code where l.shipment_id=s.id) then raise exception 'This lot has a recorded recall. Use a cleared replacement lot; case closure does not release stock.'; end if;
  update public.ops_shipments set status=next_status,version=version+1 where id=s.id;
  insert into public.ops_shipment_events(shipment_id,status,occurred_on,practice_message,internal_notes,actor_id) values(s.id,next_status,(payload->>'occurred_on')::date,payload->>'practice_message',coalesce(payload->>'internal_notes',''),actor);
  if next_status='Exception' then
   insert into public.ops_issues(request_id,shipment_id,kind,practice_message,internal_details,created_by) values(r.id,s.id,'Delivery exception',payload->>'practice_message',coalesce(payload->>'internal_notes',''),actor) on conflict(shipment_id) where kind='Delivery exception' and status='Open' do nothing;
   update public.ops_requests set stage='Hold',version=version+1 where id=r.id and stage in ('Ready','Coordinating');
  end if;
  perform ops_private.practice_notice(r.id,payload->>'practice_message'); target=s.id;
 when 'resolve_issue' then
  select * into strict i from public.ops_issues where id=(payload->>'issue_id')::uuid for update;
  if i.version is distinct from (payload->>'version')::integer or i.status<>'Open' then raise exception 'Follow-up changed or is already resolved.'; end if;
  if length(btrim(coalesce(payload->>'resolution','')))<20 or length(payload->>'resolution')>2000 then raise exception 'Record the follow-up resolution.'; end if;
  if length(btrim(coalesce(payload->>'practice_message','')))<10 or length(payload->>'practice_message')>1000 then raise exception 'Record the practice-visible resolution.'; end if;
  update public.ops_issues set status='Resolved',resolution=payload->>'resolution',version=version+1,resolved_by=actor,resolved_at=now() where id=i.id;
  perform ops_private.practice_notice(i.request_id,payload->>'practice_message'); target=i.id;
 when 'recall' then
  perform pg_advisory_xact_lock(hashtextextended('siona-lot:'||(payload->>'supplier_id')::uuid::text||':'||btrim(payload->>'lot_code'),0));
  insert into public.ops_recalls(supplier_id,lot_code,reference,source_url,reason,practice_message,created_by) values((payload->>'supplier_id')::uuid,btrim(payload->>'lot_code'),payload->>'reference',payload->>'source_url',payload->>'reason',payload->>'practice_message',actor) returning * into c;
  for item in select distinct shipment_rows.request_id from public.ops_shipments shipment_rows join public.ops_shipment_lots l on l.shipment_id=shipment_rows.id where l.supplier_id=c.supplier_id and l.lot_code=c.lot_code order by shipment_rows.request_id loop perform ops_private.attach_recall(c,item.request_id); end loop;
  target=c.id;
 when 'close_recall' then
  select * into strict c from public.ops_recalls where id=(payload->>'recall_id')::uuid;
  perform pg_advisory_xact_lock(hashtextextended('siona-lot:'||c.supplier_id::text||':'||c.lot_code,0));
  select * into strict c from public.ops_recalls where id=(payload->>'recall_id')::uuid for update;
  if c.version is distinct from (payload->>'version')::integer or c.status<>'Open' then raise exception 'Recall case changed or is already closed.'; end if;
  if exists(select 1 from public.ops_issues where recall_id=c.id and status='Open') then raise exception 'Resolve every affected request follow-up before closing this case.'; end if;
  if length(btrim(coalesce(payload->>'resolution','')))<20 or length(payload->>'resolution')>2000 then raise exception 'Record the recall case resolution.'; end if;
  update public.ops_recalls set status='Closed',resolution=payload->>'resolution',version=version+1,closed_by=actor,closed_at=now() where id=c.id; target=c.id;
 when 'ready','resume','complete' then
  select * into strict r from public.ops_requests where id=(payload->>'request_id')::uuid for update;
  if r.version is distinct from (payload->>'request_version')::integer then raise exception 'Request changed. Refresh before updating it.'; end if;
  if length(btrim(coalesce(payload->>'notes','')))<10 or length(payload->>'notes')>2000 then raise exception 'Record the operational review outcome.'; end if;
  if exists(select 1 from public.ops_issues where request_id=r.id and status='Open') then raise exception 'Resolve open follow-ups first.'; end if;
  if action='ready' then
   if r.stage<>'Review' then raise exception 'A reviewed request is required before marking it Ready.'; end if;
   update public.ops_requests set stage='Ready',version=version+1 where id=r.id;
  elsif action='resume' then
   if r.stage<>'Hold' then raise exception 'Only a held request can resume coordination.'; end if;
   update public.ops_requests set stage='Coordinating',version=version+1 where id=r.id;
  else
   if r.stage<>'Coordinating' then raise exception 'Resume coordination before recording completion.'; end if;
   update public.ops_requests set stage='Completed',version=version+1,
    lot_reference=coalesce((select case when length(string_agg(l.lot_code,', ' order by l.lot_code))>180 then 'Additional lots recorded in fulfillment' else string_agg(l.lot_code,', ' order by l.lot_code) end from public.ops_shipment_lots l join public.ops_shipments shipment_rows on shipment_rows.id=l.shipment_id where shipment_rows.request_id=r.id and shipment_rows.status='Delivered'),''),
    lot_expires_on=(select min(l.expires_on) from public.ops_shipment_lots l join public.ops_shipments shipment_rows on shipment_rows.id=l.shipment_id where shipment_rows.request_id=r.id and shipment_rows.status='Delivered') where id=r.id;
  end if; target=r.id;
 else raise exception 'Unknown commerce action.';
 end case;
 -- Preserve only known persisted fields, never arbitrary RPC payload keys.
 case action when 'rfq' then select to_jsonb(t) into snapshot from public.ops_rfqs t where id=target;
 when 'quote' then select to_jsonb(t) into snapshot from public.ops_quotes t where id=target;
 when 'quote_status' then select to_jsonb(t) into snapshot from public.ops_quotes t where id=target;
 when 'handoff' then select to_jsonb(t) into snapshot from public.ops_shipments t where id=target;
 when 'shipment' then select to_jsonb(t) into snapshot from public.ops_shipments t where id=target;
 when 'lot' then select to_jsonb(t) into snapshot from public.ops_shipment_lots t where id=target;
 when 'resolve_issue' then select to_jsonb(t) into snapshot from public.ops_issues t where id=target;
 when 'resume' then select to_jsonb(t) into snapshot from public.ops_requests t where id=target;
 when 'ready' then select to_jsonb(t) into snapshot from public.ops_requests t where id=target;
 when 'complete' then select to_jsonb(t) into snapshot from public.ops_requests t where id=target;
 else select to_jsonb(t) into snapshot from public.ops_recalls t where id=target; end case;
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) values(actor,target,'commerce',action,coalesce(nullif(payload->>'notes',''),nullif(payload->>'resolution',''),'Recorded '||replace(action,'_',' ')||'.'),snapshot);
 return target;
end $$;
create function public.ops_commerce_snapshot(target_practice uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare base jsonb; allowed uuid[]; quotes jsonb; shipments jsonb; lots jsonb; issues jsonb;
begin
 base=public.ops_practice_snapshot(target_practice);
 select coalesce(array_agg((value->>'id')::uuid),'{}'::uuid[]) into allowed from jsonb_array_elements(base->'requests');
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into quotes from (
  select q.id,q.request_id,q.quantity,q.unit,q.currency,q.unit_minor,q.shipping_minor,q.tax_minor,q.total_minor,q.lead_days,q.valid_until,q.delivery_terms,q.practice_summary,q.status,q.version
  from public.ops_quotes q where q.request_id=any(allowed) and q.shared_at is not null order by q.created_at desc limit 501
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into shipments from (
  select s.id,s.request_id,s.quantity,s.carrier,s.tracking_reference,s.expected_on,s.status from public.ops_shipments s where s.request_id=any(allowed) order by s.created_at desc limit 501
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into lots from (
  select l.id,l.shipment_id,l.lot_code,l.expires_on,l.quantity from public.ops_shipment_lots l join public.ops_shipments s on s.id=l.shipment_id where s.request_id=any(allowed) limit 501
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into issues from (
  select i.id,i.request_id,i.kind,i.practice_message,i.status from public.ops_issues i where i.request_id=any(allowed) order by i.created_at desc limit 501
 ) t;
 base=jsonb_set(base,'{requests}',coalesce((select jsonb_agg(value||jsonb_build_object('quote_required',r.quote_required,'accepted_quote_id',r.accepted_quote_id,'cancellable',r.stage in ('Review','Hold') and not exists(select 1 from public.ops_shipments where request_id=r.id and status<>'Cancelled'))) from jsonb_array_elements(base->'requests') value join public.ops_requests r on r.id=(value->>'id')::uuid),'[]'::jsonb));
 return base||jsonb_build_object('commerce_ready',true,'quotes',jsonb_path_query_array(quotes,'$[0 to 499]'),'shipments',jsonb_path_query_array(shipments,'$[0 to 499]'),'lots',jsonb_path_query_array(lots,'$[0 to 499]'),'issues',jsonb_path_query_array(issues,'$[0 to 499]'),'truncated',coalesce((base->>'truncated')::boolean,false) or jsonb_array_length(quotes)>500 or jsonb_array_length(shipments)>500 or jsonb_array_length(lots)>500 or jsonb_array_length(issues)>500);
end $$;
revoke all on all functions in schema ops_private from public,anon,authenticated;
revoke all on function public.ops_commerce_save(text,jsonb),public.ops_commerce_snapshot(uuid),public.ops_practice_quote_decide(jsonb) from public,anon,authenticated;
grant execute on function public.ops_commerce_save(text,jsonb),public.ops_commerce_snapshot(uuid),public.ops_practice_quote_decide(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
