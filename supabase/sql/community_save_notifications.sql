-- Notificar al autor cuando otro miembro guarda una publicación.
-- No notifica al quitar el guardado ni cuando el autor guarda su propio contenido.

alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check
  check (notification_type = any (array['MESSAGE'::text, 'COMMENT'::text, 'SAVE'::text]));

create or replace function public.notify_community_publication_save()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
    v_author_id uuid;
    v_actor_name text;
begin
    select p.author_id
      into v_author_id
    from public.community_publications p
    where p.id = new.publication_id
      and p.status = 'PUBLICADA';

    if v_author_id is null or v_author_id = new.saver_id then
        return new;
    end if;

    select nullif(trim(concat_ws(' ', pr.nombre, pr.apellido)), '')
      into v_actor_name
    from public.profiles pr
    where pr.auth_user_id = new.saver_id
    limit 1;

    if v_actor_name is null then
        v_actor_name := 'Un miembro de neXsv';
    end if;

    insert into public.notifications (
        recipient_id,
        actor_id,
        notification_type,
        title,
        body,
        publication_id
    ) values (
        v_author_id,
        new.saver_id,
        'SAVE',
        'Guardaron tu publicación',
        v_actor_name || ' guardó tu publicación.',
        new.publication_id
    );

    return new;
end;
$function$;

drop trigger if exists trg_notify_community_publication_save
on public.community_publication_saves;

create trigger trg_notify_community_publication_save
after insert on public.community_publication_saves
for each row
execute function public.notify_community_publication_save();
