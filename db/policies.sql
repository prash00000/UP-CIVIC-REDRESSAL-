-- Row Level Security (RLS) & Audit Policies
-- Strictly satisfies Section 6 of AGENT_FULLSTACK_SPEC.md

-- Enable RLS on all tables
alter table districts enable row level security;
alter table blocks enable row level security;
alter table urban_bodies enable row level security;
alter table tehsils enable row level security;
alter table posts enable row level security;
alter table offices enable row level security;
alter table contact_versions enable row level security;
alter table contact_sources enable row level security;
alter table import_batches enable row level security;
alter table reports enable row level security;
alter table admin_profiles enable row level security;
alter table audit_log enable row level security;
alter table publish_runs enable row level security;

-- 1. Public Role: Zero direct access to tables
revoke all on districts from public, anon;
revoke all on blocks from public, anon;
revoke all on urban_bodies from public, anon;
revoke all on tehsils from public, anon;
revoke all on posts from public, anon;
revoke all on offices from public, anon;
revoke all on contact_versions from public, anon;
revoke all on contact_sources from public, anon;
revoke all on import_batches from public, anon;
revoke all on reports from public, anon;
revoke all on admin_profiles from public, anon;
revoke all on audit_log from public, anon;
revoke all on publish_runs from public, anon;

-- 2. Reviewer Role Policies
-- Reviewers can read all administrative and officer data
create policy reviewer_select_districts on districts for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_blocks on blocks for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_urban on urban_bodies for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_tehsils on tehsils for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_posts on posts for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_offices on offices for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_contacts on contact_versions for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_sources on contact_sources for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

create policy reviewer_select_reports on reports for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()));

-- Reviewers can update review_state on contact_versions
create policy reviewer_update_contact_versions on contact_versions for update to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()))
  with check (exists (select 1 from admin_profiles where user_id = auth.uid()));

-- Reviewers can resolve reports
create policy reviewer_update_reports on reports for update to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid()))
  with check (exists (select 1 from admin_profiles where user_id = auth.uid()));

-- 3. Admin Role Policies
create policy admin_all_offices on offices for all to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid() and role = 'admin'));

create policy admin_all_import_batches on import_batches for all to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid() and role = 'admin'));

create policy admin_all_publish_runs on publish_runs for all to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid() and role = 'admin'));

create policy admin_all_profiles on admin_profiles for all to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid() and role = 'admin'));

create policy admin_select_audit on audit_log for select to authenticated
  using (exists (select 1 from admin_profiles where user_id = auth.uid() and role = 'admin'));

-- 4. Audit Log Trigger Function
create or replace function record_audit_trail()
returns trigger as $$
begin
  insert into audit_log (actor, action, entity, entity_id, diff)
  values (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    coalesce(NEW.id::text, OLD.id::text),
    case
      when TG_OP = 'INSERT' then to_jsonb(NEW)
      when TG_OP = 'UPDATE' then jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
      when TG_OP = 'DELETE' then to_jsonb(OLD)
      else null
    end
  );
  return coalesce(NEW, OLD);
end;
$$ language plpgsql security definer;

-- Attach audit trigger to critical tables
drop trigger if exists trg_audit_contact_versions on contact_versions;
create trigger trg_audit_contact_versions
after insert or update or delete on contact_versions
for each row execute function record_audit_trail();

drop trigger if exists trg_audit_reports on reports;
create trigger trg_audit_reports
after insert or update or delete on reports
for each row execute function record_audit_trail();

drop trigger if exists trg_audit_offices on offices;
create trigger trg_audit_offices
after insert or update or delete on offices
for each row execute function record_audit_trail();
