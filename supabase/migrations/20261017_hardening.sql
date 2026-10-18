-- Endurecimiento de seguridad y reservas (aplicado manualmente en el SQL Editor).
-- Es re-ejecutable: usa "if exists" / "or replace".

-- 0) Permisos que la app no usa
revoke insert, update, delete on public.public_busy_slots from anon, authenticated;
revoke truncate, references, trigger
  on all tables in schema public from anon, authenticated;

-- 1) Los motivos de bloqueo ya no son públicos (la vista no depende de esta política)
drop policy if exists blocks_public_read on public.availability_blocks;

-- 2) Vista pública de horarios ocupados
create or replace view public.public_busy_slots as
  select tenant_id, starts_at, ends_at
  from public.appointments
  where status in ('confirmed', 'attended')
     or (status = 'pending' and hold_expires_at > now())
  union all
  select tenant_id, starts_at, ends_at
  from public.availability_blocks;

-- 3) Un solo horario confirmado por consultorio
create unique index if not exists appointments_one_booked_per_slot
  on public.appointments (tenant_id, starts_at)
  where status in ('confirmed', 'attended');

-- 4) Validaciones
alter table public.appointments
  drop constraint if exists appointments_range_check,
  drop constraint if exists appointments_patient_name_len,
  drop constraint if exists appointments_patient_email_len;

alter table public.appointments
  add constraint appointments_range_check check (ends_at > starts_at),
  add constraint appointments_patient_name_len
    check (patient_name is null or char_length(patient_name) <= 120),
  add constraint appointments_patient_email_len
    check (patient_email is null or char_length(patient_email) <= 254);

alter table public.tenants
  drop constraint if exists tenants_primary_color_hex,
  drop constraint if exists tenants_primary_hover_hex,
  drop constraint if exists tenants_photo_url_https,
  drop constraint if exists tenants_slug_format;

alter table public.tenants
  add constraint tenants_primary_color_hex
    check (primary_color is null or primary_color ~ '^#[0-9a-fA-F]{6}$'),
  add constraint tenants_primary_hover_hex
    check (primary_color_hover is null or primary_color_hover ~ '^#[0-9a-fA-F]{6}$'),
  add constraint tenants_photo_url_https
    check (photo_url is null or (photo_url ~ '^https://' and char_length(photo_url) <= 500)) not valid,
  add constraint tenants_slug_format
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- 5) Guardia de citas: valida holds, congela campos y evita solapamientos
create or replace function public.appointments_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_doctor boolean := false;
begin
  perform pg_advisory_xact_lock(hashtextextended(new.tenant_id::text, 0));

  if tg_op = 'INSERT' then
    if new.status <> 'pending' or new.patient_id is not null then
      raise exception 'invalid_hold' using errcode = '23514';
    end if;
    if new.ends_at <> new.starts_at + interval '30 minutes' then
      raise exception 'invalid_duration' using errcode = '23514';
    end if;
    if new.starts_at <= now() or new.starts_at > now() + interval '60 days' then
      raise exception 'invalid_start' using errcode = '23514';
    end if;
  else
    select exists (
      select 1 from public.doctor_profiles
      where user_id = auth.uid() and tenant_id = old.tenant_id
    ) into is_doctor;

    if not is_doctor and (
      new.tenant_id <> old.tenant_id
      or new.starts_at <> old.starts_at
      or new.ends_at <> old.ends_at
    ) then
      raise exception 'frozen_fields' using errcode = '23514';
    end if;
  end if;

  if new.status in ('pending', 'confirmed')
     and (tg_op = 'INSERT' or old.status is distinct from new.status) then
    if exists (
      select 1 from public.appointments a
      where a.tenant_id = new.tenant_id
        and a.id <> new.id
        and (
          a.status in ('confirmed', 'attended')
          or (a.status = 'pending' and a.hold_expires_at > now())
        )
        and tstzrange(a.starts_at, a.ends_at) && tstzrange(new.starts_at, new.ends_at)
    ) or exists (
      select 1 from public.availability_blocks b
      where b.tenant_id = new.tenant_id
        and tstzrange(b.starts_at, b.ends_at) && tstzrange(new.starts_at, new.ends_at)
    ) then
      raise exception 'slot_unavailable' using errcode = '23P01';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists appointments_guard on public.appointments;
create trigger appointments_guard
  before insert or update on public.appointments
  for each row execute function public.appointments_guard();

-- 6) Un doctor no puede cambiar id ni slug de su consultorio
create or replace function public.tenants_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if auth.uid() is not null and (new.id <> old.id or new.slug <> old.slug) then
    raise exception 'frozen_fields' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists tenants_guard on public.tenants;
create trigger tenants_guard
  before update on public.tenants
  for each row execute function public.tenants_guard();

-- 7) Confirmación del paciente: solo holds vigentes, sin dejar hold_expires_at
drop policy if exists appointments_hold_confirm on public.appointments;
create policy appointments_hold_confirm on public.appointments
  for update to authenticated
  using (
    status = 'pending'
    and hold_expires_at is not null
    and hold_expires_at > now()
    and patient_email = (auth.jwt() ->> 'email')
  )
  with check (
    status = 'confirmed'
    and hold_expires_at is null
    and patient_id = auth.uid()
    and patient_email = (auth.jwt() ->> 'email')
  );
