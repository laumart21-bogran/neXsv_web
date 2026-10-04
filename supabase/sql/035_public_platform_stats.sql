-- neXsv | Estadísticas públicas de la plataforma
-- Expone únicamente contadores agregados para la página de inicio.
-- No devuelve nombres, correos ni datos personales.

create or replace function public.get_public_platform_stats()
returns table (
  businesses bigint,
  members bigint,
  opportunities bigint
)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.businesses where upper(coalesce(estado,'')) = 'ACTIVO') as businesses,
    (select count(*) from public.profiles) as members,
    (select count(*) from public.community_publications where status = 'PUBLICADA') as opportunities;
$$;

revoke all on function public.get_public_platform_stats() from public;
grant execute on function public.get_public_platform_stats() to anon, authenticated;
