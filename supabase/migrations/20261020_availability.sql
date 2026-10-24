-- Disponibilidad configurable: horario semanal + zona horaria por consultorio.
-- Reemplaza los días y horas fijos que estaban en el código de la app.
-- EJECUTAR ESTE SQL ANTES de usar la pantalla Disponibilidad y el nuevo flujo del paciente.

-- 1) Zona horaria del consultorio
alter table public.tenants
  add column if not exists timezone text not null default 'America/Mazatlan';

-- 2) Horario semanal (weekday: 0 = domingo ... 6 = sábado)
create table if not exists public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz default now(),
  constraint availability_rules_range check (end_time > start_time)
);

create index if not exists availability_rules_tenant_idx
  on public.availability_rules (tenant_id, weekday);

alter table public.availability_rules enable row level security;

-- Los pacientes (incluso sin sesión) necesitan leer el horario para ver el calendario
drop policy if exists rules_public_read on public.availability_rules;
create policy rules_public_read on public.availability_rules
  for select to anon, authenticated
  using (true);

drop policy if exists rules_doctor_write on public.availability_rules;
create policy rules_doctor_write on public.availability_rules
  for all to authenticated
  using (
    tenant_id in (select tenant_id from public.doctor_profiles where user_id = auth.uid())
  )
  with check (
    tenant_id in (select tenant_id from public.doctor_profiles where user_id = auth.uid())
  );

revoke insert, update, delete, truncate, references, trigger
  on public.availability_rules from anon;
revoke truncate, references, trigger
  on public.availability_rules from authenticated;

-- 3) Horario inicial = el que tenía la app fija:
--    lunes, miércoles, jueves, viernes y sábado, 9:00-12:00 y 16:00-17:00
insert into public.availability_rules (tenant_id, weekday, start_time, end_time)
select t.id, d.weekday, w.s, w.e
from public.tenants t
cross join (values (1), (3), (4), (5), (6)) as d(weekday)
cross join (values ('09:00'::time, '12:00'::time), ('16:00'::time, '17:00'::time)) as w(s, e)
where not exists (
  select 1 from public.availability_rules r where r.tenant_id = t.id
);

-- 4) Guardar el horario completo de forma atómica (borra + inserta en una transacción).
--    SECURITY INVOKER: aplica la RLS del doctor que la llama.
create or replace function public.save_availability_rules(p_tenant uuid, p_rules jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.availability_rules where tenant_id = p_tenant;

  insert into public.availability_rules (tenant_id, weekday, start_time, end_time)
  select
    p_tenant,
    (r ->> 'weekday')::smallint,
    (r ->> 'start')::time,
    (r ->> 'end')::time
  from jsonb_array_elements(p_rules) as r;
end;
$$;

revoke all on function public.save_availability_rules(uuid, jsonb) from public, anon;
grant execute on function public.save_availability_rules(uuid, jsonb) to authenticated;

-- 5) Guardia de citas: ahora también exige que la cita caiga dentro del horario
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
