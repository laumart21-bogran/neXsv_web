drop policy if exists "Likes visibles en publicaciones públicas" on public.community_publication_likes;

create policy "Cada miembro ve sus propios likes"
on public.community_publication_likes
for select
to authenticated
using (user_id = (select auth.uid()));

create or replace function public.get_community_publication_like_metrics(p_publication_ids uuid[])
returns table(publication_id uuid, like_count bigint, liked_by_me boolean)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    p.id as publication_id,
    count(l.user_id)::bigint as like_count,
    coalesce(bool_or(l.user_id = (select auth.uid())), false) as liked_by_me
  from public.community_publications p
  left join public.community_publication_likes l on l.publication_id = p.id
  where p.id = any(coalesce(p_publication_ids, array[]::uuid[]))
    and p.status = 'PUBLICADA'
  group by p.id;
$$;

revoke all on function public.get_community_publication_like_metrics(uuid[]) from public;
revoke all on function public.get_community_publication_like_metrics(uuid[]) from anon;
grant execute on function public.get_community_publication_like_metrics(uuid[]) to authenticated;
