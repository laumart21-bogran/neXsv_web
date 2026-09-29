-- ==========================================================
-- neXsv | Recuperación segura de publicaciones históricas
-- Reasocia publicaciones antiguas sin business_id únicamente
-- cuando el autor tiene exactamente un negocio.
-- No elimina ni modifica el contenido de ninguna publicación.
-- ==========================================================

update public.community_publications p
set business_id = b.id
from public.businesses b
where p.business_id is null
  and p.author_id = b.owner_id
  and (
      select count(*)
      from public.businesses b2
      where b2.owner_id = p.author_id
  ) = 1;
