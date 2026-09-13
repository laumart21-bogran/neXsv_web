-- ==========================================================
-- neXsv | Comunidad
-- MVP: publicaciones funcionales + punto de entrada a mensajería
-- ==========================================================

create table if not exists public.community_publications (
    id uuid primary key default gen_random_uuid(),
    author_id uuid not null references auth.users(id) on delete cascade,
    type text not null,
    title text null,
    body text not null,
    status text not null default 'PUBLICADA',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint community_publications_type_check check (type in ('VENTA','INTERCAMBIO','BUSCO','REGALO','RECOMENDACION','OFERTA','EVENTO')),
    constraint community_publications_status_check check (status in ('PUBLICADA','OCULTA','ELIMINADA')),
    constraint community_publications_body_check check (char_length(trim(body)) > 0)
);

create index if not exists idx_community_publications_created
    on public.community_publications(created_at desc);

create index if not exists idx_community_publications_author
    on public.community_publications(author_id);

create index if not exists idx_community_publications_type_status
    on public.community_publications(type, status);

alter table public.community_publications enable row level security;

drop policy if exists "Miembros pueden ver publicaciones activas" on public.community_publications;
create policy "Miembros pueden ver publicaciones activas"
on public.community_publications
for select
using (status = 'PUBLICADA' or author_id = auth.uid());

drop policy if exists "Miembros pueden crear publicaciones" on public.community_publications;
create policy "Miembros pueden crear publicaciones"
on public.community_publications
for insert
with check (author_id = auth.uid());

drop policy if exists "Autores pueden actualizar publicaciones" on public.community_publications;
create policy "Autores pueden actualizar publicaciones"
on public.community_publications
for update
using (author_id = auth.uid())
with check (author_id = auth.uid());

-- La eliminación es lógica para conservar trazabilidad.
drop policy if exists "Autores pueden eliminar publicaciones" on public.community_publications;
create policy "Autores pueden eliminar publicaciones"
on public.community_publications
for delete
using (author_id = auth.uid());

-- Relaciona la conversación con su publicación de origen.
-- No hacemos FK porque conversations ya existe independientemente del ciclo de vida de una publicación.
drop policy if exists "Participantes pueden actualizar origen de conversación" on public.conversations;
create policy "Participantes pueden actualizar origen de conversación"
on public.conversations
for update
using (
    exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = conversations.id
          and cp.user_id = auth.uid()
    )
)
with check (
    exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = conversations.id
          and cp.user_id = auth.uid()
    )
);
