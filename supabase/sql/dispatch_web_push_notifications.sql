-- Dispatch only existing in-app notifications through Web Push.
alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check
  check (notification_type = any (array['MESSAGE','COMMENT','SAVE']));
create or replace function public.get_push_runtime_secrets()
returns jsonb language sql security definer set search_path = ''
as $$
  select jsonb_object_agg(name, decrypted_secret) from vault.decrypted_secrets
  where name in ('nexsv_vapid_private_key','nexsv_push_hook_secret');
$$;
revoke all on function public.get_push_runtime_secrets() from public, anon, authenticated;
grant execute on function public.get_push_runtime_secrets() to service_role;
create or replace function public.dispatch_web_push_for_notification()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare hook_secret text;
begin
  if new.notification_type not in ('MESSAGE','COMMENT','SAVE') then return new; end if;
  select decrypted_secret into hook_secret from vault.decrypted_secrets
  where name = 'nexsv_push_hook_secret' limit 1;
  if hook_secret is null then
    raise warning 'Web Push hook secret is not configured; notification remains in-app only.';
    return new;
  end if;
  perform net.http_post(
    url := 'https://hxlkshoexhbhsebkzjbk.supabase.co/functions/v1/send-web-push',
    headers := jsonb_build_object('Content-Type','application/json','x-nexsv-push-hook',hook_secret),
    body := jsonb_build_object('notification_id',new.id),
    timeout_milliseconds := 5000
  );
  return new;
end;
$$;
drop trigger if exists trg_dispatch_web_push_notification on public.notifications;
create trigger trg_dispatch_web_push_notification after insert on public.notifications
for each row execute function public.dispatch_web_push_for_notification();
