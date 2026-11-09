-- ==========================================================
-- neXsv | Sprint UX: profesión, guardados y notificaciones
-- Migración propuesta. Revisar y ejecutar manualmente en Supabase.
-- ==========================================================

-- Perfil: profesión u ocupación opcional.
alter table public.profiles
    add column if not exists profesion text;

-- Recuperar los guardados del miembro autenticado.
create or replace function public.get_my_saved_community_publications()
returns setof public.community_publications
language sql
stable
security definer
set search_path = public
as $$
    select p.*
    from public.community_publication_saves s
    join public.community_publications p
      on p.id = s.publication_id
    where s.saver_id = auth.uid()
      and auth.uid() is not null
      and p.status = 'PUBLICADA'
    order by s.created_at desc;
$$;

revoke all on function public.get_my_saved_community_publications() from public;
grant execute on function public.get_my_saved_community_publications() to authenticated;

-- Centro de notificaciones para mensajes y comentarios.
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    recipient_id uuid not null references auth.users(id) on delete cascade,
    actor_id uuid null references auth.users(id) on delete set null,
    notification_type text not null,
    title text not null,
    body text not null default '',
    publication_id uuid null references public.community_publications(id) on delete cascade,
    conversation_id uuid null references public.conversations(id) on delete cascade,
    created_at timestamptz not null default now(),
    read_at timestamptz null,
    constraint notifications_type_check
      check (notification_type in ('MESSAGE', 'COMMENT'))
);

create index if not exists idx_notifications_recipient_created
    on public.notifications(recipient_id, created_at desc);
create index if not exists idx_notifications_unread
    on public.notifications(recipient_id)
    where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Members read own notifications" on public.notifications;
create policy "Members read own notifications"
on public.notifications
for select
to authenticated
using (recipient_id = auth.uid());

drop policy if exists "Members mark own notifications read" on public.notifications;
create policy "Members mark own notifications read"
on public.notifications
for update
to authenticated
using (recipient_id = auth.uid())
with check (recipient_id = auth.uid());

revoke all on public.notifications from anon;
grant select, update on public.notifications to authenticated;

-- Crear una notificación para cada participante distinto del emisor.
create or replace function public.notify_conversation_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.notifications (
        recipient_id, actor_id, notification_type, title, body, conversation_id
    )
    select
        cp.user_id,
        new.sender_id,
        'MESSAGE',
        'Nuevo mensaje',
        left(new.body, 180),
        new.conversation_id
    from public.conversation_participants cp
    where cp.conversation_id = new.conversation_id
      and cp.user_id <> new.sender_id;

    return new;
end;
$$;

drop trigger if exists trg_notify_conversation_message on public.messages;
create trigger trg_notify_conversation_message
after insert on public.messages
for each row execute function public.notify_conversation_message();

-- Avisar al autor de una publicación cuando otra persona comenta.
create or replace function public.notify_community_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    v_author_id uuid;
begin
    if new.status <> 'PUBLICADO' then
        return new;
    end if;

    select p.author_id
      into v_author_id
    from public.community_publications p
    where p.id = new.publication_id
      and p.status = 'PUBLICADA';

    if v_author_id is not null and v_author_id <> new.author_id then
        insert into public.notifications (
            recipient_id, actor_id, notification_type, title, body, publication_id
        ) values (
            v_author_id,
            new.author_id,
            'COMMENT',
            'Nuevo comentario en tu publicación',
            left(new.body, 180),
            new.publication_id
        );
    end if;

    return new;
end;
$$;

drop trigger if exists trg_notify_community_comment on public.community_publication_comments;
create trigger trg_notify_community_comment
after insert on public.community_publication_comments
for each row execute function public.notify_community_comment();
