-- Practice access and a deliberately limited external projection of Operations.
-- Apply once, after 202611100001_operations.sql, in the existing Supabase project.
begin;
do $$ begin
 if to_regclass('public.ops_requests') is null then raise exception 'Install Operations before the practice portal.'; end if;
 if to_regclass('public.ops_practice_members') is not null then raise exception 'Practice portal already exists. Do not repeat its initial migration.'; end if;
end $$;

create table public.ops_practice_members (
 id uuid primary key default gen_random_uuid(), practice_id uuid not null references public.ops_practices(id), user_id uuid not null references auth.users(id),
 role text not null check(role in ('requester','viewer')), active boolean not null default true,
 revision integer not null default 1, created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
 unique(practice_id,user_id)
);
create index ops_practice_members_user on public.ops_practice_members(user_id) where active;
create table public.ops_practice_offers (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.ops_products(id), product_revision integer not null,
 state text not null check(ops_private.valid_state(state)), status text not null check(status in ('Published','Paused')),
 title text not null check(length(btrim(title)) between 3 and 180), summary text not null check(length(btrim(summary)) between 10 and 1000),
 valid_until date not null, review_notes text not null check(length(btrim(review_notes)) between 20 and 2000),
 revision integer not null default 1, created_at timestamptz not null default now(), reviewed_by uuid not null references auth.users(id),
 unique(product_id,state)
);
alter table public.ops_requests
 add column portal_offer_id uuid references public.ops_practice_offers(id),
 add column portal_submission_key uuid,
 add column portal_reference text not null default '' check(length(portal_reference)<=80),
 add column portal_message text not null default '' check(length(portal_message)<=1000),
 add column portal_product_name text not null default '' check(length(portal_product_name)<=180),
 add column portal_unit text not null default '' check(length(portal_unit)<=60);
create unique index ops_request_submission on public.ops_requests(practice_id,portal_submission_key) where portal_submission_key is not null;
create table public.ops_practice_updates (
 id uuid primary key default gen_random_uuid(), request_id uuid not null references public.ops_requests(id),
 created_at timestamptz not null default now(), actor_id uuid not null references auth.users(id),
 body text not null check(length(btrim(body)) between 3 and 1000), kind text not null check(kind in ('status','message'))
);
create index ops_practice_updates_request on public.ops_practice_updates(request_id,created_at);
do $$ declare t text; begin
 foreach t in array array['ops_practice_members','ops_practice_offers','ops_practice_updates'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  execute format('create policy internal_read on public.%I for select to authenticated using (intel_private.role() is not null)',t);
 end loop;
end $$;

create function ops_private.offer_available(o public.ops_practice_offers) returns boolean language sql stable set search_path='' as $$
 select o.status='Published' and o.valid_until >= (now() at time zone 'UTC')::date and exists(
  select 1 from public.ops_products p
  join public.intel_suppliers s on s.id=p.supplier_id
  join public.ops_eligibility e on e.product_id=p.id and e.product_revision=p.revision and e.state=o.state and e.channel='Clinician'
  where p.id=o.product_id and p.revision=o.product_revision and p.kind in ('Practice supplies','Partner service')
   and s.stage='Approved' and s.verification='Independently verified' and s.demo_batch_id is null
   and e.status='Approved' and e.valid_until >= (now() at time zone 'UTC')::date
 );
$$;
create function ops_private.portal_stage_update() returns trigger language plpgsql security definer set search_path='' as $$
declare message text;
begin
 if new.portal_offer_id is null then return new; end if;
 if TG_OP='UPDATE' and new.stage=old.stage then return new; end if;
 message=case new.stage when 'Review' then 'Submitted for coordination review.' when 'Ready' then 'Reviewed and ready for coordination.' when 'Coordinating' then 'Coordination with the external partner is in progress.' when 'Completed' then 'Coordination completed.' when 'Hold' then 'Coordination is on hold.' when 'Cancelled' then 'Coordination request cancelled.' else 'Request recorded.' end;
 insert into public.ops_practice_updates(request_id,actor_id,body,kind) values(new.id,auth.uid(),message,'status');
 return new;
end $$;
create trigger portal_stage_update after insert or update of stage on public.ops_requests for each row execute function ops_private.portal_stage_update();

create function public.ops_practice_access() returns jsonb language sql stable security definer set search_path='' as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'name',p.legal_name,'state',p.state,'status',p.status,'valid_until',p.valid_until,'role',m.role) order by p.legal_name,p.id),'[]'::jsonb)
 from public.ops_practice_members m join public.ops_practices p on p.id=m.practice_id where m.user_id=auth.uid() and m.active;
$$;
create function public.ops_list_practice_access() returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if intel_private.role() is distinct from 'admin' then raise exception 'Administrator access is required.'; end if;
 return (select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) from (
  select m.id,m.practice_id,u.email,m.role,m.active,m.revision from public.ops_practice_members m join auth.users u on u.id=m.user_id order by m.created_at desc limit 500
 ) t);
end $$;
create function public.ops_manage_practice_access(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); target uuid; account uuid; accounts uuid[]; old_member public.ops_practice_members; snapshot jsonb;
begin
 if intel_private.role() is distinct from 'admin' then raise exception 'Administrator access is required.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4000 then raise exception 'A bounded access record is required.'; end if;
 select array_agg(id) into accounts from auth.users where lower(email)=lower(btrim(payload->>'email'));
 if coalesce(cardinality(accounts),0)=0 then raise exception 'Create this person in Supabase Auth before linking practice access. No invitation has been sent.'; end if;
 if cardinality(accounts)<>1 then raise exception 'The email must identify exactly one Auth account before practice access can be linked.'; end if;
 account=accounts[1];
 if payload->>'id' is null then
  insert into public.ops_practice_members(practice_id,user_id,role,active,created_by) values((payload->>'practice_id')::uuid,account,payload->>'role',(payload->>'active')::boolean,actor) returning id into target;
 else
  target=(payload->>'id')::uuid;
  select * into strict old_member from public.ops_practice_members where id=target for update;
  if old_member.revision is distinct from (payload->>'version')::integer then raise exception 'Access record changed. Refresh before saving.'; end if;
  if old_member.user_id<>account or old_member.practice_id<>(payload->>'practice_id')::uuid then raise exception 'Edit permissions for the same person and practice, or create a separate access record.'; end if;
  update public.ops_practice_members set role=payload->>'role',active=(payload->>'active')::boolean,revision=revision+1 where id=target;
 end if;
 select to_jsonb(t) into snapshot from public.ops_practice_members t where id=target;
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) values(actor,target,'practice_access','practice_access','Practice access recorded by an administrator.',snapshot);
 return target;
end $$;
create function public.ops_publish_practice_offer(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); p public.ops_products; existing public.ops_practice_offers; candidate public.ops_practice_offers; target uuid; expected integer;
begin
 if intel_private.role() is distinct from 'admin' then raise exception 'Administrator access is required.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>8000 then raise exception 'A bounded offer record is required.'; end if;
 select * into strict p from public.ops_products where id=(payload->>'product_id')::uuid for share;
 if p.revision is distinct from (payload->>'product_revision')::integer then raise exception 'Product changed. Refresh before publishing.'; end if;
 select * into existing from public.ops_practice_offers where product_id=p.id and state=payload->>'state' for update;
 expected=coalesce(existing.revision,0);
 if expected is distinct from (payload->>'expected_revision')::integer then raise exception 'Publication changed. Refresh before saving.'; end if;
 candidate.product_id=p.id; candidate.product_revision=p.revision; candidate.state=payload->>'state'; candidate.status=payload->>'status'; candidate.valid_until=(payload->>'valid_until')::date;
 if candidate.status='Published' and not ops_private.offer_available(candidate) then raise exception 'Current supplier approval and clinician eligibility are required before publication.'; end if;
 insert into public.ops_practice_offers(product_id,product_revision,state,status,title,summary,valid_until,review_notes,reviewed_by)
  values(p.id,p.revision,candidate.state,candidate.status,payload->>'title',payload->>'summary',candidate.valid_until,payload->>'review_notes',actor)
  on conflict(product_id,state) do update set product_revision=excluded.product_revision,status=excluded.status,title=excluded.title,summary=excluded.summary,valid_until=excluded.valid_until,review_notes=excluded.review_notes,reviewed_by=actor,revision=public.ops_practice_offers.revision+1,created_at=now() returning id into target;
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) select actor,target,'practice_offer','practice_offer',candidate.status||': '||(payload->>'review_notes'),to_jsonb(t) from public.ops_practice_offers t where id=target;
 return target;
end $$;
create function public.ops_post_practice_update(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); r public.ops_requests; target uuid;
begin
 if intel_private.role() is null or intel_private.role() not in ('admin','analyst') then raise exception 'Writer access is required.'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4000 then raise exception 'A bounded practice update is required.'; end if;
 select * into strict r from public.ops_requests where id=(payload->>'request_id')::uuid for share;
 if r.portal_offer_id is null then raise exception 'This request was not submitted through the practice portal.'; end if;
 insert into public.ops_practice_updates(request_id,actor_id,body,kind) values(r.id,actor,payload->>'body','message') returning id into target;
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) values(actor,r.id,'request','practice_update','A practice-visible update was published.',jsonb_build_object('update_id',target,'body',payload->>'body'));
 return target;
end $$;

create function public.ops_practice_snapshot(target_practice uuid default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare memberships jsonb; selected public.ops_practices; access_role text; offers jsonb; requests jsonb; updates jsonb;
begin
 memberships=public.ops_practice_access();
 if jsonb_array_length(memberships)=0 then raise exception 'Practice access has not been granted.'; end if;
 if target_practice is null then target_practice=(memberships->0->>'id')::uuid; end if;
 select m.role into access_role from public.ops_practice_members m where m.practice_id=target_practice and m.user_id=auth.uid() and m.active;
 if access_role is null then raise exception 'Practice access has not been granted.'; end if;
 select * into strict selected from public.ops_practices where id=target_practice;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into offers from (
  select o.id,o.title,o.summary,p.unit,o.valid_until from public.ops_practice_offers o join public.ops_products p on p.id=o.product_id
  where o.state=selected.state and selected.status='Ready' and selected.valid_until >= (now() at time zone 'UTC')::date and ops_private.offer_available(o)
  order by o.title,o.id limit 101
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into requests from (
  select r.id,r.portal_product_name as title,r.portal_unit as unit,r.quantity,r.needed_on,r.stage,r.version,r.portal_reference as reference,r.portal_message as message,r.created_at
  from public.ops_requests r where r.practice_id=target_practice and r.portal_offer_id is not null order by r.created_at desc,r.id limit 101
 ) t;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into updates from (
  select u.id,u.request_id,u.body,u.kind,u.created_at from public.ops_practice_updates u
  where u.request_id in (select (value->>'id')::uuid from jsonb_array_elements(jsonb_path_query_array(requests,'$[0 to 99]'))) order by u.created_at desc,u.id limit 501
 ) t;
 return jsonb_build_object('practices',memberships,'practice_id',target_practice,'role',access_role,'offers',jsonb_path_query_array(offers,'$[0 to 99]'),'requests',jsonb_path_query_array(requests,'$[0 to 99]'),'updates',jsonb_path_query_array(updates,'$[0 to 499]'),
  'truncated',jsonb_array_length(offers)>100 or jsonb_array_length(requests)>100 or jsonb_array_length(updates)>500);
end $$;
create function public.ops_practice_submit(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); member public.ops_practice_members; offer public.ops_practice_offers; practice public.ops_practices; p public.ops_products; existing public.ops_requests; candidate public.ops_requests; target uuid; submission uuid;
begin
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4000 then raise exception 'A bounded supply request is required.'; end if;
 select * into member from public.ops_practice_members where practice_id=(payload->>'practice_id')::uuid and user_id=actor and active for share;
 if not found or member.role<>'requester' then raise exception 'Request permission for this practice is required.'; end if;
 submission=(payload->>'submission_key')::uuid;
 if submission is null then raise exception 'A submission key is required.'; end if;
 perform pg_advisory_xact_lock(hashtextextended(member.practice_id::text||submission::text,0));
 select * into existing from public.ops_requests where practice_id=member.practice_id and portal_submission_key=submission;
 if found then
  if existing.created_by=actor and existing.portal_offer_id=(payload->>'offer_id')::uuid and existing.quantity=(payload->>'quantity')::integer and existing.needed_on=(payload->>'needed_on')::date and existing.portal_reference=coalesce(payload->>'reference','') and existing.portal_message=coalesce(payload->>'message','') then return existing.id; end if;
  raise exception 'This submission key has already been used. Start a new request.';
 end if;
 select * into strict practice from public.ops_practices where id=member.practice_id for share;
 select * into offer from public.ops_practice_offers where id=(payload->>'offer_id')::uuid for share;
 if not found or offer.state<>practice.state then raise exception 'This offer is not available for your practice.'; end if;
 select * into strict p from public.ops_products where id=offer.product_id for share;
 candidate.practice_id=practice.id; candidate.product_id=p.id; candidate.channel='Clinician'; candidate.state=practice.state;
 perform ops_private.check_ready(candidate);
 if not ops_private.offer_available(offer) then raise exception 'This offer is not available for your practice.'; end if;
 if (payload->>'needed_on')::date < (now() at time zone 'UTC')::date or (payload->>'needed_on')::date > (now() at time zone 'UTC')::date+365 then raise exception 'Choose a requested date within the next year.'; end if;
 insert into public.ops_requests(created_by,practice_id,product_id,channel,state,quantity,needed_on,notes,stage,portal_offer_id,portal_submission_key,portal_reference,portal_message,portal_product_name,portal_unit)
  values(actor,practice.id,p.id,'Clinician',practice.state,(payload->>'quantity')::integer,(payload->>'needed_on')::date,'Submitted through the practice portal. Review before coordination.','Review',offer.id,submission,coalesce(payload->>'reference',''),coalesce(payload->>'message',''),offer.title,p.unit) returning id into target;
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) select actor,target,'request','practice_submit','Practice submitted a coordination request.',to_jsonb(t) from public.ops_requests t where id=target;
 return target;
end $$;
create function public.ops_practice_cancel(payload jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid=auth.uid(); r public.ops_requests; member public.ops_practice_members;
begin
 if payload is null or jsonb_typeof(payload)<>'object' or octet_length(payload::text)>4000 then raise exception 'A bounded cancellation request is required.'; end if;
 select * into r from public.ops_requests where id=(payload->>'request_id')::uuid for update;
 if not found or r.portal_offer_id is null then raise exception 'This request is unavailable.'; end if;
 select * into member from public.ops_practice_members where practice_id=r.practice_id and user_id=actor and active for share;
 if not found or member.role<>'requester' then raise exception 'This request is unavailable.'; end if;
 if r.version is distinct from (payload->>'version')::integer then raise exception 'Request changed. Refresh before cancelling.'; end if;
 if r.stage not in ('Review','Hold') then raise exception 'This request is already beyond the cancellation stage.'; end if;
 if length(btrim(coalesce(payload->>'reason','')))<10 or length(payload->>'reason')>1000 then raise exception 'Record a business reason (10–1000 characters).'; end if;
 update public.ops_requests set stage='Cancelled',version=version+1 where id=r.id;
 insert into public.ops_practice_updates(request_id,actor_id,body,kind) values(r.id,actor,payload->>'reason','message');
 insert into public.ops_events(actor_id,entity_id,entity_type,action,notes,details) values(actor,r.id,'request','practice_cancel','Practice cancelled a coordination request.',jsonb_build_object('reason',payload->>'reason'));
 return r.id;
end $$;

revoke all on all functions in schema ops_private from public,anon,authenticated;
revoke all on function public.ops_practice_access(),public.ops_list_practice_access(),public.ops_manage_practice_access(jsonb),public.ops_publish_practice_offer(jsonb),public.ops_post_practice_update(jsonb),public.ops_practice_snapshot(uuid),public.ops_practice_submit(jsonb),public.ops_practice_cancel(jsonb) from public,anon,authenticated;
grant execute on function public.ops_practice_access(),public.ops_list_practice_access(),public.ops_manage_practice_access(jsonb),public.ops_publish_practice_offer(jsonb),public.ops_post_practice_update(jsonb),public.ops_practice_snapshot(uuid),public.ops_practice_submit(jsonb),public.ops_practice_cancel(jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
