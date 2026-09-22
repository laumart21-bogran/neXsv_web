-- neXsv · Invitaciones privadas para gestión de negocios migrados
-- MVP limitado a negocios invitados individualmente.
-- No modifica ni elimina negocios existentes.

create table if not exists public.business_management_invites (
    id uuid primary key default gen_random_uuid(),
    business_id uuid not null references public.businesses(id) on delete cascade,
    invite_email text not null,
    token uuid not null unique default gen_random_uuid(),
    status text not null default 'PENDIENTE'
        check (status in ('PENDIENTE', 'ACEPTADA', 'REVOCADA')),
    created_at timestamptz not null default now(),
    accepted_at timestamptz null,
    accepted_by uuid null references auth.users(id) on delete set null,
    expires_at timestamptz null
);

create unique index if not exists uq_business_management_invites_active_business
    on public.business_management_invites(business_id)
    where status = 'PENDIENTE';

create index if not exists idx_business_management_invites_email
    on public.business_management_invites(lower(invite_email));

alter table public.business_management_invites enable row level security;

revoke all on table public.business_management_invites from public;
revoke all on table public.business_management_invites from anon;
revoke all on table public.business_management_invites from authenticated;

-- Datos mínimos que puede mostrar la página pública de invitación.
create or replace function public.get_business_management_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    result jsonb;
begin
    select jsonb_build_object(
        'invite_id', i.id,
        'business_id', b.id,
        'nombre', b.nombre,
        'categoria', b.categoria,
        'descripcion', b.descripcion,
        'logo', b.logo,
        'status', i.status,
        'expires_at', i.expires_at
    )
    into result
    from public.business_management_invites i
    join public.businesses b on b.id = i.business_id
    where i.token = p_token
      and i.status = 'PENDIENTE'
      and upper(coalesce(b.estado, '')) = 'ACTIVO'
      and (i.expires_at is null or i.expires_at > now());

    if result is null then
        raise exception 'INVITATION_NOT_FOUND';
    end if;

    return result;
end;
$$;

revoke all on function public.get_business_management_invite(uuid) from public;
grant execute on function public.get_business_management_invite(uuid) to anon, authenticated;

-- Invitaciones pendientes del usuario autenticado.
create or replace function public.get_my_business_management_invites()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    result jsonb;
begin
    if auth.uid() is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    select coalesce(jsonb_agg(
        jsonb_build_object(
            'invite_id', i.id,
            'business_id', b.id,
            'nombre', b.nombre,
            'categoria', b.categoria,
            'logo', b.logo,
            'token', i.token,
            'status', i.status
        )
        order by i.created_at desc
    ), '[]'::jsonb)
    into result
    from public.business_management_invites i
    join public.businesses b on b.id = i.business_id
    where lower(trim(i.invite_email)) = lower(trim((select email from auth.users where id = auth.uid())))
      and i.status = 'PENDIENTE'
      and (i.expires_at is null or i.expires_at > now());

    return result;
end;
$$;

revoke all on function public.get_my_business_management_invites() from public;
grant execute on function public.get_my_business_management_invites() to authenticated;

-- Vincula el negocio existente al usuario autenticado.
-- Nunca crea un negocio nuevo.
create or replace function public.accept_business_management_invite(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user uuid;
    v_email text;
    v_business_id uuid;
    v_status text;
    v_owner uuid;
    result jsonb;
begin
    v_user := auth.uid();

    if v_user is null then
        raise exception 'AUTH_REQUIRED';
    end if;

    select email into v_email
    from auth.users
    where id = v_user;

    select
        i.business_id,
        i.status,
        b.owner_id
    into
        v_business_id,
        v_status,
        v_owner
    from public.business_management_invites i
    join public.businesses b on b.id = i.business_id
    where i.token = p_token
      and lower(trim(i.invite_email)) = lower(trim(v_email))
      and (i.expires_at is null or i.expires_at > now())
    for update of i;

    if v_business_id is null then
        raise exception 'INVITATION_NOT_FOUND';
    end if;

    if v_status <> 'PENDIENTE' then
        raise exception 'INVITATION_NOT_PENDING';
    end if;

    if v_owner is not null and v_owner <> v_user then
        raise exception 'BUSINESS_ALREADY_ASSIGNED';
    end if;

    update public.businesses
       set owner_id = v_user
     where id = v_business_id
       and (owner_id is null or owner_id = v_user);

    update public.business_management_invites
       set status = 'ACEPTADA',
           accepted_at = now(),
           accepted_by = v_user
     where token = p_token;

    select jsonb_build_object(
        'business_id', b.id,
        'nombre', b.nombre,
        'status', 'ACEPTADA'
    )
    into result
    from public.businesses b
    where b.id = v_business_id;

    return result;
end;
$$;

revoke all on function public.accept_business_management_invite(uuid) from public;
grant execute on function public.accept_business_management_invite(uuid) to authenticated;
