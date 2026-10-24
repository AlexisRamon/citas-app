-- Avisos al consultorio y cancelación por parte del paciente.
-- EJECUTAR ESTE SQL ANTES de usar "Cancelar cita" en Mi cita y el correo de avisos.

-- 1) Datos privados del consultorio (NO legibles por pacientes ni anónimos)
create table if not exists public.tenant_private (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  contact_email text
    check (
      contact_email is null
      or (char_length(contact_email) <= 254 and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$')
    ),
  updated_at timestamptz default now()
);

alter table public.tenant_private enable row level security;

drop policy if exists tenant_private_doctor on public.tenant_private;
create policy tenant_private_doctor on public.tenant_private
  for all to authenticated
  using (
    tenant_id in (select tenant_id from public.doctor_profiles where user_id = auth.uid())
  )
  with check (
    tenant_id in (select tenant_id from public.doctor_profiles where user_id = auth.uid())
  );

revoke all on public.tenant_private from anon;
revoke truncate, references, trigger on public.tenant_private from authenticated;

-- 2) El servidor obtiene el correo de avisos SOLO para una cita del propio paciente
create or replace function public.get_notification_email(p_appointment uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.contact_email
  from public.appointments a
  join public.tenant_private p on p.tenant_id = a.tenant_id
  where a.id = p_appointment
    and a.patient_id = auth.uid()
  limit 1;
$$;

revoke all on function public.get_notification_email(uuid) from public, anon;
grant execute on function public.get_notification_email(uuid) to authenticated;

-- 3) El paciente puede cancelar su propia cita confirmada (con 2 h de anticipación)
drop policy if exists appointments_patient_cancel on public.appointments;
create policy appointments_patient_cancel on public.appointments
  for update to authenticated
  using (patient_id = auth.uid() and status = 'confirmed')
  with check (patient_id = auth.uid() and status = 'cancelled');

-- 4) Guardia de citas: ahora permite esa cancelación y nada más
create or replace function public.appointments_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_doctor boolean := false;
  tz text;
  local_start timestamp;
  local_end timestamp;
begin
  -- Sin sesión de usuario (SQL Editor / service role): sin restricciones.
  -- Los anónimos no tienen política de INSERT/UPDATE, así que RLS los frena.
  if auth.uid() is null then
    return new;
  end if;

  -- Serializa las reservas de un mismo consultorio
  perform pg_advisory_xact_lock(hashtextextended(new.tenant_id::text, 0));

  select exists (
    select 1 from public.doctor_profiles
    where user_id = auth.uid() and tenant_id = new.tenant_id
  ) into is_doctor;

  if tg_op = 'INSERT' then
    if not is_doctor then
      if exists (
        select 1 from public.tenants t
        where t.id = new.tenant_id and t.current_status = 'agenda-cerrada'
      ) then
        raise exception 'agenda_closed' using errcode = '23514';
      end if;
      if new.status <> 'confirmed' or new.patient_id is distinct from auth.uid() then
        raise exception 'invalid_booking' using errcode = '23514';
      end if;
      if new.ends_at <> new.starts_at + interval '30 minutes' then
        raise exception 'invalid_duration' using errcode = '23514';
      end if;
      if new.starts_at <= now() or new.starts_at > now() + interval '60 days' then
        raise exception 'invalid_start' using errcode = '23514';
      end if;

      -- La cita debe caer dentro del horario semanal del consultorio,
      -- alineada a bloques de 30 min desde el inicio de la ventana.
      select t.timezone into tz from public.tenants t where t.id = new.tenant_id;
      local_start := new.starts_at at time zone coalesce(tz, 'America/Mazatlan');
      local_end := new.ends_at at time zone coalesce(tz, 'America/Mazatlan');

      if local_start::date <> local_end::date or not exists (
        select 1 from public.availability_rules r
        where r.tenant_id = new.tenant_id
          and r.weekday = extract(dow from local_start)::int
          and local_start::time >= r.start_time
          and local_end::time <= r.end_time
          and mod(extract(epoch from (local_start::time - r.start_time))::int, 1800) = 0
      ) then
        raise exception 'outside_hours' using errcode = '23514';
      end if;
    end if;
  elsif not is_doctor then
    -- El paciente solo puede cancelar su propia cita confirmada, sin tocar nada más
    if old.patient_id is distinct from auth.uid()
       or old.status <> 'confirmed'
       or new.status <> 'cancelled'
       or new.tenant_id <> old.tenant_id
       or new.starts_at <> old.starts_at
       or new.ends_at <> old.ends_at
       or new.patient_id is distinct from old.patient_id
       or new.patient_email is distinct from old.patient_email
       or new.patient_name is distinct from old.patient_name
       or new.reason is distinct from old.reason
       or new.hold_expires_at is distinct from old.hold_expires_at then
      raise exception 'frozen_fields' using errcode = '23514';
    end if;
    if old.starts_at < now() + interval '2 hours' then
      raise exception 'cancel_too_late' using errcode = '23514';
    end if;
  end if;

  -- Sin solapamientos con otras citas ni bloqueos
  if new.status in ('confirmed', 'pending')
     and (
       tg_op = 'INSERT'
       or old.status is distinct from new.status
       or old.starts_at is distinct from new.starts_at
       or old.ends_at is distinct from new.ends_at
     ) then
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
