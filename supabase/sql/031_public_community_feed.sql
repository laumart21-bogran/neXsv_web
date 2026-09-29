-- ==========================================================
-- neXsv | Comunidad pública
-- Garantiza que toda publicación PUBLICADA sea visible en la
-- Comunidad general, incluidas las publicaciones asociadas a
-- negocios.
-- No modifica ni elimina publicaciones.
-- ==========================================================

drop policy if exists "Miembros pueden ver publicaciones activas"
    on public.community_publications;

create policy "Miembros pueden ver publicaciones activas"
on public.community_publications
for select
to anon, authenticated
using (status = 'PUBLICADA');
