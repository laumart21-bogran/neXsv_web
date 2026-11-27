-- Secure soft-delete endpoint: members can only remove their own publications.
create or replace function public.delete_my_community_publication(p_publication_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_result jsonb;
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado.';
  end if;

  update public.community_publications
  set status = 'ELIMINADA',
      updated_at = now()
  where id = p_publication_id
    and author_id = v_user_id
    and status = 'PUBLICADA'
  returning jsonb_build_object('id', id, 'status', status) into v_result;

  if v_result is null then
    raise exception 'No tienes permiso para eliminar esta publicación o ya no está disponible.';
  end if;

  return v_result;
end;
$$;

revoke all on function public.delete_my_community_publication(uuid) from public, anon;
grant execute on function public.delete_my_community_publication(uuid) to authenticated;
