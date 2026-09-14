-- ==========================================================
-- neXsv Platform v2
-- Mensajería — identificación segura del otro participante
-- ==========================================================

-- La RLS de conversation_participants puede ocultar al usuario
-- la fila del otro participante. Esta RPC expone únicamente su
-- user_id y solo si quien consulta pertenece a la conversación.

create or replace function public.get_other_conversation_participant(p_conversation_id uuid)
returns table (
    user_id uuid
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
    select cp.user_id
    from public.conversation_participants as cp
    where cp.conversation_id = p_conversation_id
      and cp.user_id <> auth.uid()
      and exists (
          select 1
          from public.conversation_participants as me
          where me.conversation_id = p_conversation_id
            and me.user_id = auth.uid()
      )
    limit 1;
$$;

revoke all on function public.get_other_conversation_participant(uuid) from public;
grant execute on function public.get_other_conversation_participant(uuid) to authenticated;
