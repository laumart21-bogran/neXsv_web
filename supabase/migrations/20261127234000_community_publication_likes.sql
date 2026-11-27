create table if not exists public.community_publication_likes (
  publication_id uuid not null references public.community_publications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (publication_id, user_id)
);

alter table public.community_publication_likes enable row level security;

grant select on public.community_publication_likes to anon, authenticated;
grant insert, delete on public.community_publication_likes to authenticated;

create policy "Likes visibles en publicaciones públicas"
on public.community_publication_likes
for select
to anon, authenticated
using (
  exists (
    select 1 from public.community_publications p
    where p.id = community_publication_likes.publication_id
      and p.status = 'PUBLICADA'
  )
);

create policy "Miembros pueden dar me gusta"
on public.community_publication_likes
for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.community_publications p
    where p.id = community_publication_likes.publication_id
      and p.status = 'PUBLICADA'
  )
);

create policy "Miembros pueden quitar su me gusta"
on public.community_publication_likes
for delete
to authenticated
using (user_id = (select auth.uid()));
