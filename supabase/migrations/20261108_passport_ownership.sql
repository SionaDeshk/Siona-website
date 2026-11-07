-- Apply AFTER 20261107_passport_initial.sql in the separate siona-passport project.
-- Composite FKs prevent linking a document to another clinician's credential,
-- including writes made directly through the Supabase API.
alter table public.passport_licenses add constraint passport_licenses_owner_key unique (id, user_id);
alter table public.passport_ce_entries add constraint passport_ce_owner_key unique (id, user_id);
alter table public.passport_certifications add constraint passport_certifications_owner_key unique (id, user_id);
alter table public.passport_documents
  add constraint passport_document_license_owner foreign key (license_id, user_id) references public.passport_licenses(id, user_id),
  add constraint passport_document_ce_owner foreign key (ce_entry_id, user_id) references public.passport_ce_entries(id, user_id),
  add constraint passport_document_certification_owner foreign key (certification_id, user_id) references public.passport_certifications(id, user_id);
-- Keep existing ON DELETE SET NULL single-column FKs; composite checks run after
-- those actions and null credential links satisfy MATCH SIMPLE.
alter table public.passport_documents add constraint passport_document_single_link
  check (num_nonnulls(license_id, ce_entry_id, certification_id) <= 1);
update storage.buckets set public = false, file_size_limit = 10485760,
  allowed_mime_types = array['application/pdf','image/jpeg','image/png']
where id = 'passport-private';
