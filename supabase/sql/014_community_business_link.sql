-- ==========================================================
-- neXsv | Relación publicación -> negocio
-- Permite que una publicación represente la actividad de un
-- negocio concreto sin romper publicaciones personales.
-- ==========================================================

alter table public.community_publications
    add column if not exists business_id uuid null references public.businesses(id) on delete set null;

create index if not exists idx_community_publications_business
    on public.community_publications(business_id);

-- Las publicaciones históricas de una persona que actualmente
-- tiene exactamente un negocio se pueden asociar sin ambigüedad.
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

-- Mantener las publicaciones personales permitidas, pero exigir
-- propiedad cuando una publicación se asocia a un negocio.
drop policy if exists "Miembros pueden crear publicaciones" on public.community_publications;
create policy "Miembros pueden crear publicaciones"
on public.community_publications
for insert
with check (
    author_id = auth.uid()
    and (
        business_id is null
        or exists (
            select 1
            from public.businesses b
            where b.id = business_id
              and b.owner_id = auth.uid()
        )
    )
);

drop policy if exists "Autores pueden actualizar publicaciones" on public.community_publications;
create policy "Autores pueden actualizar publicaciones"
on public.community_publications
for update
using (author_id = auth.uid())
with check (
    author_id = auth.uid()
    and (
        business_id is null
        or exists (
            select 1
            from public.businesses b
            where b.id = business_id
              and b.owner_id = auth.uid()
        )
    )
);
