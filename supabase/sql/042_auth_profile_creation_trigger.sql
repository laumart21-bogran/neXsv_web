-- Create member profiles automatically when a Supabase Auth user is created.
-- This keeps profile creation server-side and avoids granting browser INSERT access
-- to the profiles table.

create or replace function public.handle_new_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (auth_user_id, nombre, apellido)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', '')
  )
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

revoke all on function public.handle_new_auth_user_profile() from public;
revoke all on function public.handle_new_auth_user_profile() from anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_auth_user_profile();
