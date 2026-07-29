-- Admin action audit log — immutable record of all admin mutations
create table if not exists admin_audit_log (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  admin_id    uuid        references auth.users(id) on delete set null,
  admin_email text        not null,
  action      text        not null,   -- e.g. 'licence.approved', 'booking.cancelled'
  resource    text,                   -- table / domain name
  resource_id text,                   -- the affected record id
  details     jsonb                   -- before/after values or extra context
);

-- Append-only: no updates, no deletes (audit trail must be immutable)
alter table admin_audit_log enable row level security;

-- Admins can read audit log; nobody can mutate it via client
create policy "admin_audit_log_read" on admin_audit_log
  for select using (
    (auth.jwt() -> 'app_metadata' ->> 'role') in ('admin', 'staff')
  );

-- Index for common queries
create index admin_audit_log_admin_id_idx  on admin_audit_log (admin_id);
create index admin_audit_log_created_at_idx on admin_audit_log (created_at desc);
create index admin_audit_log_resource_idx  on admin_audit_log (resource, resource_id);
