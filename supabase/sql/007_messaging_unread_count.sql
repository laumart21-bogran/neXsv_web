-- ==========================================================
-- neXsv Platform v2
-- Mensajería — contador de mensajes no leídos
-- ==========================================================

create or replace function public.get_my_unread_message_count()
returns integer
language sql
security definer
set search_path = public
as $$
    select count(*)::integer
    from public.messages m
    inner join public.conversation_participants cp
        on cp.conversation_id = m.conversation_id
       and cp.user_id = auth.uid()
    where m.sender_id <> auth.uid()
      and m.created_at > coalesce(cp.last_read_at, 'epoch'::timestamptz);
$$;

grant execute on function public.get_my_unread_message_count() to authenticated;
