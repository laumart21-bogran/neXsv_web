-- ==========================================================
-- neXsv | Mensajería privada
-- MVP: usuario ↔ usuario
-- Preparado para relacionar una conversación con una publicación
-- y extender posteriormente a negocios.
-- ==========================================================

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    conversation_type text not null default 'DIRECTA',
    origin_publication_id uuid null,
    direct_key text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint conversations_type_check check (conversation_type in ('DIRECTA')),
    constraint conversations_direct_key_unique unique (direct_key)
);

create table if not exists public.conversation_participants (
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    last_read_at timestamptz null,
    primary key (conversation_id, user_id)
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations(id) on delete cascade,
    sender_id uuid not null references auth.users(id) on delete cascade,
    body text not null,
    created_at timestamptz not null default now(),
    edited_at timestamptz null,
    deleted_at timestamptz null,
    constraint messages_body_check check (char_length(trim(body)) > 0)
);

create index if not exists idx_conversation_participants_user
    on public.conversation_participants(user_id);

create index if not exists idx_messages_conversation_created
    on public.messages(conversation_id, created_at);

create index if not exists idx_conversations_updated
    on public.conversations(updated_at desc);

-- ----------------------------------------------------------
-- RLS
-- ----------------------------------------------------------

alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;

-- Una persona solo puede ver conversaciones en las que participa.
drop policy if exists "Participantes pueden ver conversaciones" on public.conversations;
create policy "Participantes pueden ver conversaciones"
on public.conversations
for select
using (
    exists (
        select 1
        from public.conversation_participants cp
        where cp.conversation_id = conversations.id
          and cp.user_id = auth.uid()
    )
);

-- Crear conversación solo desde una sesión autenticada.
drop policy if exists "Usuarios autenticados pueden crear conversaciones" on public.conversations;
create policy "Usuarios autenticados pueden crear conversaciones"
on public.conversations
for insert
with check (auth.uid() is not null);

-- Actualizar únicamente conversaciones propias.
drop policy if exists "Participantes pueden actualizar conversaciones" on public.conversations;
create policy "Participantes pueden actualizar conversaciones"
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

-- Los participantes solo pueden ver su propia pertenencia.
drop policy if exists "Usuarios pueden ver sus participaciones" on public.conversation_participants;
create policy "Usuarios pueden ver sus participaciones"
on public.conversation_participants
for select
using (user_id = auth.uid());

-- Un participante puede crear su propia participación.
drop policy if exists "Usuarios pueden crear su participación" on public.conversation_participants;
create policy "Usuarios pueden crear su participación"
on public.conversation_participants
for insert
with check (user_id = auth.uid());

-- Puede actualizar únicamente su last_read_at.
drop policy if exists "Usuarios pueden actualizar lectura" on public.conversation_participants;
create policy "Usuarios pueden actualizar lectura"
on public.conversation_participants
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Los mensajes solo son visibles para participantes de la conversación.
drop policy if exists "Participantes pueden ver mensajes" on public.messages;
create policy "Participantes pueden ver mensajes"
on public.messages
for select
using (
    exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = messages.conversation_id
          and cp.user_id = auth.uid()
    )
);

-- Solo se puede enviar como el usuario autenticado y dentro de una conversación propia.
drop policy if exists "Participantes pueden enviar mensajes" on public.messages;
create policy "Participantes pueden enviar mensajes"
on public.messages
for insert
with check (
    sender_id = auth.uid()
    and exists (
        select 1 from public.conversation_participants cp
        where cp.conversation_id = messages.conversation_id
          and cp.user_id = auth.uid()
    )
);

-- Un usuario solo puede editar/eliminar lógicamente sus propios mensajes.
drop policy if exists "Usuarios pueden actualizar sus mensajes" on public.messages;
create policy "Usuarios pueden actualizar sus mensajes"
on public.messages
for update
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

-- ----------------------------------------------------------
-- RPC segura para abrir/reutilizar una conversación directa.
-- Evita conversaciones duplicadas entre las mismas dos personas.
-- ----------------------------------------------------------

create or replace function public.get_or_create_direct_conversation(other_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    current_user_id uuid := auth.uid();
    conversation_id uuid;
    key_value text;
begin
    if current_user_id is null then
        raise exception 'Usuario no autenticado';
    end if;

    if other_user_id is null or other_user_id = current_user_id then
        raise exception 'Destinatario inválido';
    end if;

    key_value := least(current_user_id::text, other_user_id::text)
        || ':' || greatest(current_user_id::text, other_user_id::text);

    select id into conversation_id
    from public.conversations
    where direct_key = key_value
    limit 1;

    if conversation_id is null then
        insert into public.conversations (conversation_type, direct_key)
        values ('DIRECTA', key_value)
        on conflict (direct_key) do update set updated_at = now()
        returning id into conversation_id;
    end if;

    insert into public.conversation_participants (conversation_id, user_id)
    values (conversation_id, current_user_id), (conversation_id, other_user_id)
    on conflict (conversation_id, user_id) do nothing;

    return conversation_id;
end;
$$;

revoke all on function public.get_or_create_direct_conversation(uuid) from public;
grant execute on function public.get_or_create_direct_conversation(uuid) to authenticated;
