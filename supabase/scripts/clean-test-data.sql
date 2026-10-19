-- Limpia los datos de prueba: borra TODAS las citas y TODOS los usuarios que no son doctores.
-- Conserva: tenants, doctor_profiles, availability_blocks y el usuario del doctor.
--
-- 1) Vista previa (ejecútala sola primero):
select count(*) as citas_a_borrar from public.appointments;

select id, email, created_at
from auth.users
where id not in (select user_id from public.doctor_profiles)
order by created_at;

-- 2) Borrado (ejecuta este bloque completo):
begin;

do $$
begin
  if (select count(*) from public.doctor_profiles) = 0 then
    raise exception 'No hay filas en doctor_profiles: abortando para no borrar al doctor';
  end if;
end $$;

delete from public.appointments;

delete from auth.users
where id not in (select user_id from public.doctor_profiles);

commit;

-- 3) Comprobación:
select
  (select count(*) from public.appointments)    as citas,
  (select count(*) from auth.users)             as usuarios,
  (select count(*) from public.doctor_profiles) as doctores,
  (select count(*) from public.tenants)         as tenants;
