-- ==========================================================
-- neXsv | Fix mensajería directa
-- Corrige la ambigüedad de conversation_id dentro de la RPC.
-- ==========================================================

create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_user_id uuid := auth.uid();
    v_conversation_id uuid;
    v_direct_key text;
begin
    if v_current_user_id is null then
        raise exception 'Usuario no autenticado';
    end if;

    if other_user_id is null or other_user_id = v_current_user_id then
        raise exception 'Destinatario inválido';
    end if;

    v_direct_key := least(v_current_user_id::text, other_user_id::text)
        || ':' || greatest(v_current_user_id::text, other_user_id::text);

    select c.id
      into v_conversation_id
      from public.conversations as c
     where c.direct_key = v_direct_key
     limit 1;

    if v_conversation_id is null then
        insert into public.conversations (conversation_type, direct_key)
        values ('DIRECTA', v_direct_key)
        on conflict (direct_key)
        do update set updated_at = now()
        returning id into v_conversation_id;
    end if;

    insert into public.conversation_participants (conversation_id, user_id)
    values
        (v_conversation_id, v_current_user_id),
        (v_conversation_id, other_user_id)
    on conflict (conversation_id, user_id) do nothing;

    return v_conversation_id;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
