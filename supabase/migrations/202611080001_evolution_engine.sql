-- Siona Evolution Engine. Additive, isolated tables; no changes to Passport or existing policies.
-- Apply with the Supabase migration runner / SQL editor as the database owner.
begin;
create schema if not exists intel_private;
revoke all on schema intel_private from public;
grant usage on schema intel_private to authenticated;
create table public.intel_members (
 user_id uuid primary key references auth.users(id), display_name text not null,
 role text not null check(role in ('admin','analyst','viewer')), active boolean not null default true
);
alter table public.intel_members enable row level security;
create function intel_private.role() returns text language sql stable security definer set search_path='' as $$
 select role from public.intel_members where user_id=auth.uid() and active;
$$;
revoke all on function intel_private.role() from public;
grant execute on function intel_private.role() to authenticated;
create policy member_read on public.intel_members for select to authenticated using(user_id=auth.uid() or intel_private.role() is not null);
grant select on public.intel_members to authenticated;
create table public.intel_weights (criterion text primary key check(criterion in ('demand','market','differentiation','economics','feasibility','fit','regulatory','capital','evidence')), weight numeric not null check(weight between 0 and 100));
insert into public.intel_weights values ('demand',15),('market',10),('differentiation',10),('economics',10),('feasibility',10),('fit',10),('regulatory',10),('capital',10),('evidence',15);
alter table public.intel_weights enable row level security;
create policy weights_read on public.intel_weights for select to authenticated using(intel_private.role() is not null);
create policy weights_write on public.intel_weights for update to authenticated using(intel_private.role()='admin') with check(intel_private.role()='admin');
grant select,update on public.intel_weights to authenticated;
create table public.intel_activity (id uuid primary key default gen_random_uuid(), occurred_at timestamptz not null default now(), actor_id uuid references auth.users(id), entity_type text not null, entity_id uuid, event text not null, stage text);
alter table public.intel_activity enable row level security;
create policy activity_read on public.intel_activity for select to authenticated using(intel_private.role() is not null);
grant select on public.intel_activity to authenticated;
create table public.intel_sources (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 name text not null, url text not null unique check(url ~ '^https://'), adapter text not null default 'manual' check(adapter in ('manual','federal-register')), approved boolean not null default false, publisher text not null, last_ingested_at timestamptz
);
create table public.intel_signals (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 title text not null, summary text not null, source_id uuid references public.intel_sources(id), source_url text not null check(source_url ~ '^https?://'), publisher text not null, published_on date not null, collected_at timestamptz not null default now(), industry text not null, geography text not null, evidence_type text not null check(evidence_type in ('verified_fact','third_party_claim','ai_interpretation')), reliability text not null check(reliability in ('primary','secondary','unverified')), reliability_notes text not null, why_matters text not null, siona_relevance text not null, confidence text not null check(confidence in ('low','medium','high')), review_status text not null default 'unreviewed' check(review_status in ('unreviewed','reviewed','dismissed')), review_notes text, reviewed_by uuid references auth.users(id), unique(source_url,title)
);
create table public.intel_organizations (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 legal_name text not null, kind text not null, location text not null, website text, notes text not null default ''
);
create table public.intel_contacts (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 organization_id uuid not null references public.intel_organizations(id), name text not null, role text not null default '', email text not null default '', notes text not null default ''
);
create table public.intel_categories (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 name text not null unique, intended_use text not null default ''
);
create table public.intel_opportunities (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 title text not null, problem text not null, affected text not null, proposition text not null, customers text not null, partners text not null default '', revenue text not null default '', barriers text not null default '', assumptions text not null, invalidation text not null, stage text not null default 'Discovered' check(stage in ('Discovered','Evaluating','Validating','Developing','Active','Rejected','On Hold'))
);
create table public.intel_evidence (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 opportunity_id uuid not null references public.intel_opportunities(id), signal_id uuid not null references public.intel_signals(id), interpretation text not null default '', unique(opportunity_id,signal_id)
);
create table public.intel_suppliers (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 organization_id uuid not null references public.intel_organizations(id), classification text not null check(classification in ('Manufacturer','Distributor','Intermediary')), manufacturing_locations text not null, quality_documentation text not null default '', coa_available boolean not null default false, traceability text not null default '', moq_pricing text not null default '', lead_shipping text not null default '', verification text not null default 'Unverified' check(verification in ('Unverified','In progress','Independently verified')), stage text not null default 'Identified' check(stage in ('Identified','Contacted','Responded','Under Review','Qualified','Negotiating','Approved','Rejected')), outstanding text not null default '', next_action text not null, owner_id uuid not null references public.intel_members(user_id), category_id uuid references public.intel_categories(id), unique(organization_id)
);
create table public.intel_documents (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 supplier_id uuid not null references public.intel_suppliers(id), name text not null, storage_path text not null unique, content_type text not null check(content_type in ('application/pdf','image/png','image/jpeg','text/plain')), bytes integer not null check(bytes between 1 and 4194304), verified_at timestamptz, verified_by uuid references auth.users(id), verification_notes text, check(storage_path like supplier_id::text || '/%')
);
create table public.intel_supplier_reviews (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 supplier_id uuid not null references public.intel_suppliers(id), verdict text not null check(verdict in ('Qualified','Approved','Rejected')), rationale text not null check(length(rationale)>=20), gates text[] not null, human_reviewed boolean not null check(human_reviewed)
);
create table public.intel_links (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 opportunity_id uuid not null references public.intel_opportunities(id), supplier_id uuid references public.intel_suppliers(id), organization_id uuid references public.intel_organizations(id), rationale text not null, check(num_nonnulls(supplier_id,organization_id)=1), unique nulls not distinct(opportunity_id,supplier_id,organization_id)
);
create table public.intel_notes (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 organization_id uuid not null references public.intel_organizations(id), opportunity_id uuid references public.intel_opportunities(id), body text not null, next_action text not null default '', follow_up_on date, owner_id uuid not null references public.intel_members(user_id)
);
create table public.intel_tasks (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 title text not null, details text not null default '', opportunity_id uuid references public.intel_opportunities(id), organization_id uuid references public.intel_organizations(id), owner_id uuid not null references public.intel_members(user_id), due_on date not null, kind text not null check(kind in ('Validation','Follow-up','Documentation','Research')), success_criteria text not null, status text not null default 'Open' check(status in ('Open','In progress','Completed','Cancelled')), result text not null default ''
);
create table public.intel_evaluations (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 opportunity_id uuid not null references public.intel_opportunities(id), criterion text not null check(criterion in ('demand','market','differentiation','economics','feasibility','fit','regulatory','capital','evidence')), score integer check(score between 0 and 5), rationale text not null check(length(rationale)>=10), unique(opportunity_id,criterion)
);
create table public.intel_decisions (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 opportunity_id uuid not null references public.intel_opportunities(id), stage text not null check(stage in ('Discovered','Evaluating','Validating','Developing','Active','Rejected','On Hold')), rationale text not null check(length(rationale)>=20), assumptions_changed text not null default ''
);
create table public.intel_decision_evidence (
 id uuid primary key default gen_random_uuid(),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 created_by uuid not null default auth.uid() references auth.users(id), updated_by uuid default auth.uid() references auth.users(id),
 demo_batch_id uuid,
 decision_id uuid not null references public.intel_decisions(id), signal_id uuid not null references public.intel_signals(id), unique(decision_id,signal_id)
);

create function intel_private.touch() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='UPDATE' then
  new.id=old.id; new.created_at=old.created_at; new.created_by=old.created_by; new.demo_batch_id=old.demo_batch_id;
 end if;
 new.updated_at=clock_timestamp(); new.updated_by=auth.uid(); return new;
end; $$;
create function intel_private.audit() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.intel_activity(actor_id,entity_type,entity_id,event,stage)
 values(auth.uid(),TG_TABLE_NAME,coalesce(new.id,old.id),TG_OP,coalesce(to_jsonb(new)->>'stage',to_jsonb(old)->>'stage'));
 return coalesce(new,old);
end; $$;
revoke all on function intel_private.touch(), intel_private.audit() from public;
alter table public.intel_sources enable row level security;
create policy read_member on public.intel_sources for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_sources for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_sources for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_sources for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_sources to authenticated;
create trigger touch before update on public.intel_sources for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_sources for each row execute function intel_private.audit();
create index intel_sources_created_at on public.intel_sources(created_at desc);
alter table public.intel_signals enable row level security;
create policy read_member on public.intel_signals for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_signals for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_signals for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_signals for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_signals to authenticated;
create trigger touch before update on public.intel_signals for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_signals for each row execute function intel_private.audit();
create index intel_signals_created_at on public.intel_signals(created_at desc);
alter table public.intel_organizations enable row level security;
create policy read_member on public.intel_organizations for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_organizations for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_organizations for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_organizations for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_organizations to authenticated;
create trigger touch before update on public.intel_organizations for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_organizations for each row execute function intel_private.audit();
create index intel_organizations_created_at on public.intel_organizations(created_at desc);
alter table public.intel_contacts enable row level security;
create policy read_member on public.intel_contacts for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_contacts for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_contacts for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_contacts for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_contacts to authenticated;
create trigger touch before update on public.intel_contacts for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_contacts for each row execute function intel_private.audit();
create index intel_contacts_created_at on public.intel_contacts(created_at desc);
alter table public.intel_categories enable row level security;
create policy read_member on public.intel_categories for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_categories for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_categories for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_categories for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_categories to authenticated;
create trigger touch before update on public.intel_categories for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_categories for each row execute function intel_private.audit();
create index intel_categories_created_at on public.intel_categories(created_at desc);
alter table public.intel_opportunities enable row level security;
create policy read_member on public.intel_opportunities for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_opportunities for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_opportunities for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_opportunities for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_opportunities to authenticated;
create trigger touch before update on public.intel_opportunities for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_opportunities for each row execute function intel_private.audit();
create index intel_opportunities_created_at on public.intel_opportunities(created_at desc);
alter table public.intel_evidence enable row level security;
create policy read_member on public.intel_evidence for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_evidence for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_evidence for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_evidence for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_evidence to authenticated;
create trigger touch before update on public.intel_evidence for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_evidence for each row execute function intel_private.audit();
create index intel_evidence_created_at on public.intel_evidence(created_at desc);
alter table public.intel_suppliers enable row level security;
create policy read_member on public.intel_suppliers for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_suppliers for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_suppliers for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_suppliers for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_suppliers to authenticated;
create trigger touch before update on public.intel_suppliers for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_suppliers for each row execute function intel_private.audit();
create index intel_suppliers_created_at on public.intel_suppliers(created_at desc);
alter table public.intel_documents enable row level security;
create policy read_member on public.intel_documents for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_documents for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_documents for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_documents for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_documents to authenticated;
create trigger touch before update on public.intel_documents for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_documents for each row execute function intel_private.audit();
create index intel_documents_created_at on public.intel_documents(created_at desc);
alter table public.intel_supplier_reviews enable row level security;
create policy read_member on public.intel_supplier_reviews for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_supplier_reviews for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_supplier_reviews for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_supplier_reviews for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_supplier_reviews to authenticated;
create trigger touch before update on public.intel_supplier_reviews for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_supplier_reviews for each row execute function intel_private.audit();
create index intel_supplier_reviews_created_at on public.intel_supplier_reviews(created_at desc);
alter table public.intel_links enable row level security;
create policy read_member on public.intel_links for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_links for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_links for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_links for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_links to authenticated;
create trigger touch before update on public.intel_links for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_links for each row execute function intel_private.audit();
create index intel_links_created_at on public.intel_links(created_at desc);
alter table public.intel_notes enable row level security;
create policy read_member on public.intel_notes for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_notes for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_notes for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_notes for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_notes to authenticated;
create trigger touch before update on public.intel_notes for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_notes for each row execute function intel_private.audit();
create index intel_notes_created_at on public.intel_notes(created_at desc);
alter table public.intel_tasks enable row level security;
create policy read_member on public.intel_tasks for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_tasks for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_tasks for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_tasks for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_tasks to authenticated;
create trigger touch before update on public.intel_tasks for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_tasks for each row execute function intel_private.audit();
create index intel_tasks_created_at on public.intel_tasks(created_at desc);
alter table public.intel_evaluations enable row level security;
create policy read_member on public.intel_evaluations for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_evaluations for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_evaluations for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_evaluations for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_evaluations to authenticated;
create trigger touch before update on public.intel_evaluations for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_evaluations for each row execute function intel_private.audit();
create index intel_evaluations_created_at on public.intel_evaluations(created_at desc);
alter table public.intel_decisions enable row level security;
create policy read_member on public.intel_decisions for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_decisions for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_decisions for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_decisions for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_decisions to authenticated;
create trigger touch before update on public.intel_decisions for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_decisions for each row execute function intel_private.audit();
create index intel_decisions_created_at on public.intel_decisions(created_at desc);
alter table public.intel_decision_evidence enable row level security;
create policy read_member on public.intel_decision_evidence for select to authenticated using(intel_private.role() is not null);
create policy insert_writer on public.intel_decision_evidence for insert to authenticated with check(intel_private.role() in ('admin','analyst') and created_by=auth.uid());
create policy update_writer on public.intel_decision_evidence for update to authenticated using(intel_private.role() in ('admin','analyst')) with check(intel_private.role() in ('admin','analyst'));
create policy delete_own_demo on public.intel_decision_evidence for delete to authenticated using(demo_batch_id is not null and created_by=auth.uid() and intel_private.role() in ('admin','analyst'));
grant select,insert,update,delete on public.intel_decision_evidence to authenticated;
create trigger touch before update on public.intel_decision_evidence for each row execute function intel_private.touch();
create trigger audit after insert or update or delete on public.intel_decision_evidence for each row execute function intel_private.audit();
create index intel_decision_evidence_created_at on public.intel_decision_evidence(created_at desc);

revoke update on public.intel_decisions,public.intel_decision_evidence,public.intel_supplier_reviews from authenticated;
create index intel_evidence_signal on public.intel_evidence(signal_id);
create index intel_tasks_due on public.intel_tasks(status,due_on);
create index intel_notes_follow_up on public.intel_notes(follow_up_on);
create index intel_documents_supplier on public.intel_documents(supplier_id);
create index intel_decisions_opportunity on public.intel_decisions(opportunity_id,created_at desc);
create index intel_links_opportunity on public.intel_links(opportunity_id);
create index intel_suppliers_stage on public.intel_suppliers(stage);
create index intel_activity_entity on public.intel_activity(entity_type,entity_id,occurred_at desc);

create function intel_private.supplier_gate() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' and new.stage<>'Identified' then raise exception 'New suppliers start at Identified'; end if;
 if TG_OP='UPDATE' and new.stage<>old.stage and new.stage in ('Qualified','Approved') then
  if not new.coa_available or length(new.traceability)<10 or length(new.quality_documentation)<10 or new.verification<>'Independently verified' then raise exception 'COA, traceability, quality documentation and independent verification are required'; end if;
  if not exists(select 1 from public.intel_documents d where d.supplier_id=new.id and d.verified_at is not null and d.verified_by is not null and length(d.verification_notes)>=10) then raise exception 'A verified supporting document is required'; end if;
  if not exists(select 1 from public.intel_supplier_reviews r where r.supplier_id=new.id and r.verdict=new.stage and r.created_by=auth.uid() and r.created_at>=old.updated_at and r.human_reviewed and r.gates @> array['identity','classification','quality','traceability','commercial','pilot']) then raise exception 'All six human qualification gates must be documented'; end if;
 end if;
 return new;
end; $$;
create trigger supplier_gate before insert or update on public.intel_suppliers for each row execute function intel_private.supplier_gate();

create function intel_private.opportunity_gate() returns trigger language plpgsql set search_path='' as $$
begin
 if TG_OP='INSERT' and new.stage<>'Discovered' then raise exception 'New opportunities start at Discovered'; end if;
 if TG_OP='UPDATE' and new.stage<>old.stage and not exists(select 1 from public.intel_decisions d where d.opportunity_id=new.id and d.stage=new.stage and d.created_by=auth.uid() and d.created_at>=old.updated_at) then raise exception 'A documented decision is required to change stage'; end if;
 return new;
end; $$;
create trigger opportunity_gate before insert or update on public.intel_opportunities for each row execute function intel_private.opportunity_gate();

create function public.intel_create_opportunity(payload jsonb, signal_ids uuid[]) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; sid uuid;
begin
 if cardinality(signal_ids)<1 or cardinality(signal_ids)>30 then raise exception 'Link at least one signal'; end if;
 insert into public.intel_opportunities(title,problem,affected,proposition,customers,partners,revenue,barriers,assumptions,invalidation)
 values(payload->>'title',payload->>'problem',payload->>'affected',payload->>'proposition',payload->>'customers',coalesce(payload->>'partners',''),coalesce(payload->>'revenue',''),coalesce(payload->>'barriers',''),payload->>'assumptions',payload->>'invalidation') returning id into result;
 foreach sid in array signal_ids loop insert into public.intel_evidence(opportunity_id,signal_id) values(result,sid); end loop;
 return result;
end; $$;
create function public.intel_record_decision(payload jsonb, signal_ids uuid[]) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid; target uuid=(payload->>'opportunity_id')::uuid; sid uuid;
begin
 perform 1 from public.intel_opportunities where id=target for update;
 insert into public.intel_decisions(opportunity_id,stage,rationale,assumptions_changed) values(target,payload->>'stage',payload->>'rationale',coalesce(payload->>'assumptions_changed','')) returning id into result;
 foreach sid in array signal_ids loop insert into public.intel_decision_evidence(decision_id,signal_id) values(result,sid); end loop;
 update public.intel_opportunities set stage=payload->>'stage' where id=target;
 return result;
end; $$;
create function public.intel_review_supplier(target uuid, next_stage text, rationale text, gates text[], human_reviewed boolean) returns void language plpgsql security invoker set search_path='' as $$
begin
 perform 1 from public.intel_suppliers where id=target for update;
 if next_stage in ('Qualified','Approved','Rejected') then
  insert into public.intel_supplier_reviews(supplier_id,verdict,rationale,gates,human_reviewed) values(target,next_stage,rationale,gates,human_reviewed);
 end if;
 update public.intel_suppliers set stage=next_stage where id=target;
end; $$;
create function public.intel_save_evaluation(target uuid, scores jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare item jsonb;
begin
 if jsonb_array_length(scores)<>9 or (select count(distinct x->>'criterion') from jsonb_array_elements(scores) x)<>9 then raise exception 'Nine unique criteria required'; end if;
 foreach item in array (select array_agg(x) from jsonb_array_elements(scores) x) loop
  insert into public.intel_evaluations(opportunity_id,criterion,score,rationale) values(target,item->>'criterion',(item->>'score')::integer,item->>'rationale')
  on conflict(opportunity_id,criterion) do update set score=excluded.score,rationale=excluded.rationale;
 end loop;
end; $$;
create function public.intel_save_weights(weights jsonb) returns void language plpgsql security invoker set search_path='' as $$
declare item jsonb;
begin
 if jsonb_array_length(weights)<>9 or (select count(distinct x->>'criterion') from jsonb_array_elements(weights) x)<>9 or (select sum((x->>'weight')::numeric) from jsonb_array_elements(weights) x)<=0 then raise exception 'Nine unique weights with positive total required'; end if;
 for item in select * from jsonb_array_elements(weights) loop update public.intel_weights set weight=(item->>'weight')::numeric where criterion=item->>'criterion'; end loop;
end; $$;

-- Keep administrative source approval and completion attestations enforceable via direct API access.
create function intel_private.source_gate() returns trigger language plpgsql set search_path='' as $$
begin
 if intel_private.role()<>'admin' then
  if TG_OP='INSERT' and (new.approved or new.adapter<>'manual') then raise exception 'Only administrators approve ingestion sources'; end if;
  if TG_OP='UPDATE' and (new.approved is distinct from old.approved or new.adapter is distinct from old.adapter or new.url is distinct from old.url) then raise exception 'Only administrators configure ingestion destinations'; end if;
 end if;
 return new;
end; $$;
create trigger source_gate before insert or update on public.intel_sources for each row execute function intel_private.source_gate();
create function intel_private.document_gate() returns trigger language plpgsql set search_path='' as $$
begin
 if new.verified_at is not null and (new.verified_by is distinct from auth.uid() or length(coalesce(new.verification_notes,''))<10) then raise exception 'Document verification requires current reviewer and findings'; end if;
 return new;
end; $$;
create trigger document_gate before insert or update on public.intel_documents for each row execute function intel_private.document_gate();
alter table public.intel_tasks add constraint task_completion_evidence check(status<>'Completed' or length(result)>=10);
revoke all on function intel_private.source_gate(),intel_private.document_gate() from public;

create function public.intel_log_relationship(payload jsonb) returns uuid language plpgsql security invoker set search_path='' as $$
declare result uuid;
begin
 if nullif(payload->>'follow_up_on','') is not null and length(coalesce(payload->>'next_action',''))<3 then raise exception 'A dated follow-up needs a specific next action'; end if;
 insert into public.intel_notes(organization_id,opportunity_id,body,next_action,follow_up_on,owner_id)
 values((payload->>'organization_id')::uuid,(payload->>'opportunity_id')::uuid,payload->>'body',coalesce(payload->>'next_action',''),(payload->>'follow_up_on')::date,(payload->>'owner_id')::uuid) returning id into result;
 if nullif(payload->>'follow_up_on','') is not null then
  insert into public.intel_tasks(title,details,opportunity_id,organization_id,owner_id,due_on,kind,success_criteria)
  values(left('Follow up: '||(payload->>'next_action'),220),payload->>'body',(payload->>'opportunity_id')::uuid,(payload->>'organization_id')::uuid,(payload->>'owner_id')::uuid,(payload->>'follow_up_on')::date,'Follow-up','Record the conversation outcome and the next agreed action.');
 end if;
 return result;
end; $$;
revoke all on function public.intel_log_relationship(jsonb) from public;
grant execute on function public.intel_log_relationship(jsonb) to authenticated;

-- Storage is private. Policies use the same current membership checks as the data layer.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('intel-supplier-documents','intel-supplier-documents',false,4194304,array['application/pdf','image/png','image/jpeg','text/plain']);
create policy intel_docs_read on storage.objects for select to authenticated using(bucket_id='intel-supplier-documents' and intel_private.role() is not null);
create policy intel_docs_upload on storage.objects for insert to authenticated with check(bucket_id='intel-supplier-documents' and intel_private.role() in ('admin','analyst') and exists(select 1 from public.intel_suppliers s where s.id::text=(storage.foldername(name))[1]));
create policy intel_docs_delete on storage.objects for delete to authenticated using(bucket_id='intel-supplier-documents' and intel_private.role() in ('admin','analyst'));

create function public.intel_seed_demo() returns uuid language plpgsql security invoker set search_path='' as $$
declare batch uuid=gen_random_uuid(); org uuid; sig uuid; opp uuid; sup uuid;
begin
 if exists(select 1 from public.intel_signals where demo_batch_id is not null and created_by=auth.uid()) then raise exception 'Remove your existing demonstration before loading another'; end if;
 insert into public.intel_organizations(legal_name,kind,location,notes,demo_batch_id) values('SYNTHETIC · Example Research Institute','Research institution','Demonstration only','Fictional organization; no relationship or transaction exists.',batch) returning id into org;
 insert into public.intel_signals(title,summary,source_url,publisher,published_on,industry,geography,evidence_type,reliability,reliability_notes,why_matters,siona_relevance,confidence,demo_batch_id)
 values('SYNTHETIC · Documentation delays in a fictional laboratory','A fictional buyer reports recurring delays obtaining lot documentation. This is a demonstration, not a market finding.','https://example.com/synthetic-siona-signal','Synthetic demonstration',current_date,'Research supply','Demonstration only','third_party_claim','unverified','Fictional material. Do not use as evidence for a real decision.','Illustrates how to investigate a proposed procurement problem.','Test whether documentation support is a real unmet need.','low',batch) returning id into sig;
 insert into public.intel_opportunities(title,problem,affected,proposition,customers,partners,revenue,barriers,assumptions,invalidation,demo_batch_id)
 values('SYNTHETIC · Research documentation hypothesis','A fictional documentation gap requires validation.','Fictional laboratory procurement teams','Explore a documented, traceable research-supply relationship.','No actual customers identified.','No actual partners identified.','Unknown; willingness to pay is untested.','Product classification and intended-use review required.','Buyers experience a problem that existing vendors do not solve.','Buyer interviews show no unmet need or viable economics.',batch) returning id into opp;
 insert into public.intel_evidence(opportunity_id,signal_id,demo_batch_id) values(opp,sig,batch);
 insert into public.intel_suppliers(organization_id,classification,manufacturing_locations,owner_id,next_action,outstanding,demo_batch_id) values(org,'Intermediary','Unknown — demonstration only',auth.uid(),'Request fictional qualification documents','All qualification gates remain open.',batch) returning id into sup;
 insert into public.intel_links(opportunity_id,supplier_id,rationale,demo_batch_id) values(opp,sup,'Synthetic relationship used to demonstrate the network.',batch);
 insert into public.intel_tasks(title,details,opportunity_id,owner_id,due_on,kind,success_criteria,demo_batch_id) values('SYNTHETIC · Interview three prospective buyers','Demonstration only. Do not contact the fictional organization.',opp,auth.uid(),current_date+7,'Validation','Document whether the proposed problem exists.',batch);
 return batch;
end; $$;
create function public.intel_clear_demo() returns void language plpgsql security invoker set search_path='' as $$
begin
 -- RESTRICT foreign keys cause an atomic failure if real records now refer to a demo record.
 delete from public.intel_decision_evidence where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_decisions where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_evaluations where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_tasks where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_notes where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_links where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_evidence where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_opportunities where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_supplier_reviews where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_suppliers where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_contacts where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_organizations where demo_batch_id is not null and created_by=auth.uid();
 delete from public.intel_signals where demo_batch_id is not null and created_by=auth.uid();
end; $$;
revoke all on function public.intel_create_opportunity(jsonb,uuid[]) from public;
grant execute on function public.intel_create_opportunity(jsonb,uuid[]) to authenticated;
revoke all on function public.intel_record_decision(jsonb,uuid[]) from public;
grant execute on function public.intel_record_decision(jsonb,uuid[]) to authenticated;
revoke all on function public.intel_review_supplier(uuid,text,text,text[],boolean) from public;
grant execute on function public.intel_review_supplier(uuid,text,text,text[],boolean) to authenticated;
revoke all on function public.intel_save_evaluation(uuid,jsonb) from public;
grant execute on function public.intel_save_evaluation(uuid,jsonb) to authenticated;
revoke all on function public.intel_save_weights(jsonb) from public;
grant execute on function public.intel_save_weights(jsonb) to authenticated;
revoke all on function public.intel_seed_demo() from public;
grant execute on function public.intel_seed_demo() to authenticated;
revoke all on function public.intel_clear_demo() from public;
grant execute on function public.intel_clear_demo() to authenticated;
commit;
