-- ==========================================================
-- neXsv Platform v2
-- Corrección definitiva de identidad pública para mensajería
-- Devuelve únicamente nombre, apellido y foto.
-- ==========================================================

-- La función es SECURITY DEFINER para que las políticas RLS de
-- profiles no impidan consultar los datos públicos mínimos de
-- otro miembro autenticado.

create or replace function public.get_public_profile(p_user_id uuid)
returns table (
    auth_user_id uuid,
    nombre text,
    apellido text,
    foto text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select
        p.auth_user_id,
        p.nombre,
        p.apellido,
        p.foto
    from public.profiles as p
    where p.auth_user_id = p_user_id
      and p.auth_user_id is not null
    limit 1;
$$;

-- No dejamos la función abierta al público anónimo.
revoke all on function public.get_public_profile(uuid) from public;
grant execute on function public.get_public_profile(uuid) to authenticated;

-- El acceso a la tabla profiles NO se modifica aquí.
-- Los miembros siguen sin recibir directamente todos los campos
-- privados del perfil. Solo esta RPC expone los cuatro campos definidos arriba.
