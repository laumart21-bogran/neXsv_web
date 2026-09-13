-- ==========================================================
-- neXsv | Métricas de publicaciones de Comunidad
-- Vistas únicas por miembro/día + comentarios + conversaciones
-- ==========================================================

create table if not exists public.community_publication_views (
    publication_id uuid not null references public.community_publications(id) on delete cascade,
    viewer_id uuid not null references auth.users(id) on delete cascade,
    viewed_on date not null default current_date,
    created_at timestamptz not null default now(),
    primary key (publication_id, viewer_id, viewed_on)
);

create index if not exists idx_community_publication_views_publication
    on public.community_publication_views(publication_id);

alter table public.community_publication_views enable row level security;

drop policy if exists "Miembros pueden registrar sus vistas" on public.community_publication_views;
create policy "Miembros pueden registrar sus vistas"
on public.community_publication_views
for insert
with check (viewer_id = auth.uid());

-- El detalle de quién vio una publicación no se expone al cliente.
-- La aplicación consulta únicamente los totales mediante funciones seguras.

create or replace function public.record_community_publication_view(p_publication_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        return;
    end if;

    insert into public.community_publication_views (publication_id, viewer_id, viewed_on)
    select p_publication_id, auth.uid(), current_date
    where exists (
        select 1
        from public.community_publications p
        where p.id = p_publication_id
          and p.status = 'PUBLICADA'
    )
    on conflict (publication_id, viewer_id, viewed_on) do nothing;
end;
$$;

grant execute on function public.record_community_publication_view(uuid) to authenticated;

create or replace function public.get_community_publication_metrics(p_publication_id uuid)
returns table (
    views bigint,
    comments bigint,
    conversations bigint
)
language sql
security definer
set search_path = public
as $$
    select
        (select count(*) from public.community_publication_views v where v.publication_id = p_publication_id),
        (select count(*) from public.community_publication_comments c where c.publication_id = p_publication_id and c.status = 'PUBLICADO'),
        (select count(*) from public.conversations c where c.origin_publication_id = p_publication_id);
$$;

grant execute on function public.get_community_publication_metrics(uuid) to authenticated;

create or replace function public.get_my_community_publication_metrics()
returns table (
    publication_id uuid,
    views bigint,
    comments bigint,
    conversations bigint
)
language sql
security definer
set search_path = public
as $$
    select
        p.id,
        (select count(*) from public.community_publication_views v where v.publication_id = p.id),
        (select count(*) from public.community_publication_comments c where c.publication_id = p.id and c.status = 'PUBLICADO'),
        (select count(*) from public.conversations c where c.origin_publication_id = p.id)
    from public.community_publications p
    where p.author_id = auth.uid()
      and p.status = 'PUBLICADA';
$$;

grant execute on function public.get_my_community_publication_metrics() to authenticated;
