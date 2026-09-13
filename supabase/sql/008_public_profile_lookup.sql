-- ==========================================================
-- neXsv Platform v2
-- Identidad pública básica para comunidad y mensajería
-- ==========================================================

create or replace function public.get_public_profile(p_user_id uuid)
returns table (
    auth_user_id uuid,
    nombre text,
    apellido text,
    foto text
)
language sql
security definer
set search_path = public
as $$
    select p.auth_user_id, p.nombre, p.apellido, p.foto
    from public.profiles p
    where p.auth_user_id = p_user_id;
$$;

grant execute on function public.get_public_profile(uuid) to authenticated;
