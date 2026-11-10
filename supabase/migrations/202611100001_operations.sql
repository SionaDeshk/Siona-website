-- Additive Operations module. Requires the existing Evolution Engine migration.
-- Apply once to the existing Supabase project. Does not change existing tables or policies.
begin;
do $$ begin
 if to_regclass('public.intel_members') is null then raise exception 'Install the Evolution Engine before Operations.'; end if;
 if to_regnamespace('ops_private') is not null then raise exception 'Operations already exists. Do not repeat the initial migration.'; end if;
end $$;
create schema ops_private;
revoke all on schema ops_private from public, anon, authenticated;

create function ops_private.valid_state(s text) returns boolean language sql immutable set search_path='' as $$
 select s = any(string_to_array('AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY',' '));
$$;

create table public.ops_practices (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 legal_name text not null check(length(btrim(legal_name)) between 2 and 180), state text not null check(ops_private.valid_state(state)),
 business_email text not null check(length(business_email) between 3 and 254 and business_email like '%@%'), website text not null default '' check(website='' or (website like 'https://%' and length(website)<=2000)),
 scope text not null check(length(btrim(scope)) between 10 and 2000), status text not null default 'Onboarding' check(status in ('Onboarding','Ready','Hold')),
 evidence_url text not null default '' check(evidence_url='' or (evidence_url like 'https://%' and length(evidence_url)<=2000)), valid_until date,
 review_notes text not null default '' check(length(review_notes)<=2000), reviewed_by uuid references auth.users(id), reviewed_at timestamptz,
 revision integer not null default 1 check(revision>0),
 check(status<>'Ready' or (valid_until is not null and evidence_url<>'' and length(btrim(review_notes))>=20 and reviewed_by is not null))
);
create table public.ops_products (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 name text not null check(length(btrim(name)) between 3 and 180), sku text not null unique check(length(btrim(sku)) between 2 and 80),
 supplier_id uuid not null references public.intel_suppliers(id), kind text not null check(kind in ('Practice supplies','Partner service','Prescription medicine','Research use only')),
 unit text not null check(length(btrim(unit)) between 2 and 60), description text not null check(length(btrim(description)) between 10 and 2000), revision integer not null default 1 check(revision>0)
);
create table public.ops_eligibility (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.ops_products(id), product_revision integer not null,
 state text not null check(ops_private.valid_state(state)), channel text not null check(channel in ('Clinician','Consumer')), status text not null check(status in ('Approved','Hold')),
 evidence_url text not null check(evidence_url like 'https://%' and length(evidence_url)<=2000), valid_until date not null,
 notes text not null check(length(btrim(notes)) between 20 and 2000), reviewed_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 unique(product_id,state,channel)
);
create table public.ops_requests (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 practice_id uuid references public.ops_practices(id), product_id uuid not null references public.ops_products(id), channel text not null check(channel in ('Clinician','Consumer')),
 state text not null check(ops_private.valid_state(state)), quantity integer not null check(quantity between 1 and 100000), needed_on date not null,
 notes text not null check(length(btrim(notes)) between 10 and 2000), stage text not null default 'Draft' check(stage in ('Draft','Review','Ready','Coordinating','Completed','Hold','Cancelled')),
 version integer not null default 1 check(version>0), handoff_reference text not null default '' check(length(handoff_reference)<=180),
 lot_reference text not null default '' check(length(lot_reference)<=180), lot_expires_on date,
 check((channel='Clinician' and practice_id is not null) or (channel='Consumer' and practice_id is null))
);
create table public.ops_events (
 id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), actor_id uuid not null references auth.users(id),
 entity_id uuid not null, entity_type text not null, action text not null, notes text not null,
 details jsonb not null default '{}'::jsonb
);
create index ops_requests_created_at on public.ops_requests(created_at desc);
create index ops_events_entity on public.ops_events(entity_id,created_at desc);
create index ops_products_supplier on public.ops_products(supplier_id);

-- Read-only table privileges. All mutations pass through the bounded, attributed RPC.
do $$ declare t text; begin
 foreach t in array array['ops_practices','ops_products','ops_eligibility','ops_requests','ops_events'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy internal_read on public.%I for select to authenticated using (intel_private.role() is not null)',t);
 end loop;
end $$;

create function ops_private.check_ready(r public.ops_requests) returns void language plpgsql set search_path='' as $$
declare p public.ops_products; practice public.ops_practices; approval public.ops_eligibility; supplier public.intel_suppliers;
begin
 select * into strict p from public.ops_products where id=r.product_id for share;
 if p.kind in ('Prescription medicine','Research use only') then raise exception 'This product needs a licensed partner workflow before coordination is enabled.'; end if;
 select * into strict supplier from public.intel_suppliers where id=p.supplier_id for share;
 if supplier.stage<>'Approved' or supplier.verification<>'Independently verified' or supplier.demo_batch_id is not null then raise exception 'Supplier needs current approval and independent verification in Evo.'; end if;
 if r.channel='Clinician' then
  select * into strict practice from public.ops_practices where id=r.practice_id for share;
  if practice.status<>'Ready' or practice.valid_until is null or practice.valid_until<(now() at time zone 'UTC')::date or practice.evidence_url='' then raise exception 'Practice onboarding needs a current administrator review.'; end if;
  if practice.state<>r.state then raise exception 'The request state must match the practice location.'; end if;
 end if;
 select * into approval from public.ops_eligibility where product_id=p.id and state=r.state and channel=r.channel for share;
 if not found or approval.status<>'Approved' or approval.valid_until<(now() at time zone 'UTC')::date or approval.product_revision<>p.revision then raise exception 'Product needs a current state and channel eligibility review.'; end if;
end $$;

create function public.ops_save(action text,payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare member_role text; actor uuid; target uuid; p public.ops_products; practice public.ops_practices; r public.ops_requests; next_stage text; note text; snapshot jsonb;
begin
 member_role=intel_private.role(); actor=auth.uid();
 if member_role is null or member_role not in ('admin','analyst') then raise exception 'Writer access is required.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>16000 then raise exception 'A bounded operation payload is required.'; end if;
 if action in ('practice_review','eligibility') and member_role<>'admin' then raise exception 'An administrator must record this review.'; end if;
 case action
 when 'practice' then
  if payload->>'id' is null then
   insert into public.ops_practices(created_by,legal_name,state,business_email,website,scope) values(actor,payload->>'legal_name',payload->>'state',payload->>'business_email',coalesce(payload->>'website',''),payload->>'scope') returning id into target;
  else
   target=(payload->>'id')::uuid;
   select * into strict practice from public.ops_practices where id=target for update;
   if (payload->>'version')::integer is distinct from practice.revision then raise exception 'Record changed. Refresh before saving.'; end if;
   update public.ops_practices set legal_name=payload->>'legal_name',state=payload->>'state',business_email=payload->>'business_email',website=coalesce(payload->>'website',''),scope=payload->>'scope',status='Onboarding',evidence_url='',valid_until=null,review_notes='',reviewed_by=null,reviewed_at=null,revision=practice.revision+1 where id=target;
  end if;
  note='Practice details saved; onboarding review required.';
 when 'practice_review' then
  target=(payload->>'id')::uuid;
  select * into strict practice from public.ops_practices where id=target for update;
  if (payload->>'version')::integer is distinct from practice.revision then raise exception 'Record changed. Refresh before reviewing.'; end if;
  if payload->>'status'='Ready' and (nullif(payload->>'valid_until','') is null or (payload->>'valid_until')::date<(now() at time zone 'UTC')::date or coalesce(payload->>'evidence_url','') not like 'https://%') then raise exception 'Current dated evidence is required for practice readiness.'; end if;
  if length(btrim(coalesce(payload->>'notes','')))<20 then raise exception 'Document the review findings in at least 20 characters.'; end if;
  update public.ops_practices set status=payload->>'status', evidence_url=coalesce(payload->>'evidence_url',''),valid_until=nullif(payload->>'valid_until','')::date,review_notes=payload->>'notes',reviewed_by=actor,reviewed_at=now(),revision=practice.revision+1 where id=target;
  note=(payload->>'status')||': '||(payload->>'notes');
 when 'product' then
  if payload->>'id' is null then
   insert into public.ops_products(created_by,name,sku,supplier_id,kind,unit,description) values(actor,payload->>'name',payload->>'sku',(payload->>'supplier_id')::uuid,payload->>'kind',payload->>'unit',payload->>'description') returning id into target;
  else
   target=(payload->>'id')::uuid;
   select * into strict p from public.ops_products where id=target for update;
   if (payload->>'version')::integer is distinct from p.revision then raise exception 'Record changed. Refresh before saving.'; end if;
   update public.ops_products set name=payload->>'name',sku=payload->>'sku',supplier_id=(payload->>'supplier_id')::uuid,kind=payload->>'kind',unit=payload->>'unit',description=payload->>'description',revision=p.revision+1 where id=target;
  end if;
  note='Product details saved; state and channel review required.';
 when 'eligibility' then
  select * into strict p from public.ops_products where id=(payload->>'product_id')::uuid for share;
  if (payload->>'product_revision')::integer is distinct from p.revision then raise exception 'Product changed. Refresh before reviewing.'; end if;
  if payload->>'status'='Approved' then
   if p.kind in ('Prescription medicine','Research use only') then raise exception 'This product needs a licensed partner workflow before coordination is enabled.'; end if;
   if (payload->>'valid_until')::date<(now() at time zone 'UTC')::date then raise exception 'Eligibility evidence has expired.'; end if;
  end if;
  insert into public.ops_eligibility(product_id,product_revision,state,channel,status,evidence_url,valid_until,notes,reviewed_by) values(p.id,p.revision,payload->>'state',payload->>'channel',payload->>'status',payload->>'evidence_url',(payload->>'valid_until')::date,payload->>'notes',actor)
   on conflict(product_id,state,channel) do update set product_revision=excluded.product_revision,status=excluded.status,evidence_url=excluded.evidence_url,valid_until=excluded.valid_until,notes=excluded.notes,reviewed_by=actor,created_at=now() returning id into target;
  note=(payload->>'state')||' / '||(payload->>'channel')||' / '||(payload->>'status')||': '||(payload->>'notes');
 when 'request' then
  insert into public.ops_requests(created_by,practice_id,product_id,channel,state,quantity,needed_on,notes) values(actor,nullif(payload->>'practice_id','')::uuid,(payload->>'product_id')::uuid,payload->>'channel',payload->>'state',(payload->>'quantity')::integer,(payload->>'needed_on')::date,payload->>'notes') returning id into target;
  note='Draft: '||(payload->>'notes');
 when 'transition' then
  target=(payload->>'id')::uuid;
  select * into strict r from public.ops_requests where id=target for update;
  if (payload->>'version')::integer is distinct from r.version then raise exception 'Request changed. Refresh before changing its stage.'; end if;
  next_stage=payload->>'stage';
  if next_stage is null or not (
   (r.stage='Draft' and next_stage in ('Review','Cancelled')) or
   (r.stage='Review' and next_stage in ('Ready','Hold','Cancelled')) or
   (r.stage='Ready' and next_stage in ('Coordinating','Hold','Cancelled')) or
   (r.stage='Coordinating' and next_stage in ('Completed','Hold','Cancelled')) or
   (r.stage='Hold' and next_stage in ('Review','Cancelled'))
  ) then raise exception 'This stage transition is unavailable.'; end if;
  if length(btrim(coalesce(payload->>'notes','')))<10 or length(payload->>'notes')>2000 then raise exception 'Record the reason for this transition (10–2000 characters).'; end if;
  if next_stage in ('Ready','Coordinating','Completed') then perform ops_private.check_ready(r); end if;
  if next_stage in ('Coordinating','Completed') and length(btrim(coalesce(payload->>'handoff_reference','')))<3 then raise exception 'Record the external partner handoff reference.'; end if;
  if next_stage='Completed' then
   select * into strict p from public.ops_products where id=r.product_id;
   if p.kind='Practice supplies' and (length(btrim(coalesce(payload->>'lot_reference','')))<2 or nullif(payload->>'lot_expires_on','') is null or (payload->>'lot_expires_on')::date<(now() at time zone 'UTC')::date) then raise exception 'Record the supplied lot and a current expiry date before completion.'; end if;
  end if;
  update public.ops_requests set stage=next_stage,version=r.version+1,handoff_reference=coalesce(payload->>'handoff_reference',''),lot_reference=coalesce(payload->>'lot_reference',''),lot_expires_on=nullif(payload->>'lot_expires_on','')::date where id=target;
  note=r.stage||' → '||next_stage||': '||(payload->>'notes');
 else raise exception 'Unknown Operations action.';
 end case;
 -- Capture only the persisted, known fields, not arbitrary extra RPC payload keys.
 if action like 'practice%' then select to_jsonb(t) into snapshot from public.ops_practices t where id=target;
 elsif action='product' then select to_jsonb(t) into snapshot from public.ops_products t where id=target;
 elsif action='eligibility' then select to_jsonb(t) into snapshot from public.ops_eligibility t where id=target;
 else select to_jsonb(t) into snapshot from public.ops_requests t where id=target;
 end if;
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) values(actor,target,case when action like 'practice%' then 'practice' when action='product' then 'product' when action='eligibility' then 'eligibility' else 'request' end,action,note,snapshot);
 return target;
end $$;
revoke all on all functions in schema ops_private from public,anon,authenticated;
revoke all on function public.ops_save(text,jsonb) from public,anon,authenticated;
grant execute on function public.ops_save(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
