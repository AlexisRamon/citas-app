-- Con la agenda cerrada (tenants.current_status = 'agenda-cerrada') no se crean holds nuevos.
-- La app muestra el mensaje a partir de 'agenda_closed'. Trigger appointments_guard ya existe.

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
    if exists (
      select 1 from public.tenants t
      where t.id = new.tenant_id and t.current_status = 'agenda-cerrada'
    ) then
      raise exception 'agenda_closed' using errcode = '23514';
    end if;
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
