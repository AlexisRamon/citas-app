-- Nuevo flujo: solo pacientes con cuenta verificada pueden agendar.
-- Se elimina la reserva anónima con "hold" + código por cita.
-- EJECUTAR ESTE SQL ANTES de usar el flujo nuevo de la app.

-- 1) Fuera las políticas de holds anónimos
drop policy if exists appointments_hold_insert on public.appointments;
drop policy if exists appointments_hold_confirm on public.appointments;
drop policy if exists appointments_hold_read_own on public.appointments;

-- 2) El paciente autenticado crea su propia cita, ya confirmada.
--    Con "Confirm email" activo, toda sesión tiene el correo verificado.
drop policy if exists appointments_patient_insert on public.appointments;
create policy appointments_patient_insert on public.appointments
  for insert to authenticated
  with check (
    status = 'confirmed'
    and patient_id = auth.uid()
    and patient_email = (auth.jwt() ->> 'email')
    and hold_expires_at is null
    and coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) = false
  );

-- 3) Guardia de citas
create or replace function public.appointments_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_doctor boolean := false;
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
    end if;
  elsif not is_doctor then
    -- Los pacientes no modifican citas
    raise exception 'frozen_fields' using errcode = '23514';
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

drop trigger if exists appointments_guard on public.appointments;
create trigger appointments_guard
  before insert or update on public.appointments
  for each row execute function public.appointments_guard();
