-- neXsv | Reemisión controlada de invitaciones de gestión
-- Esta función es una herramienta operativa para el SQL Editor de Supabase.
-- No expone la creación de invitaciones a usuarios del sitio.
-- Conserva las invitaciones anteriores (las marca REVOCADA); nunca las elimina.
-- No modifica el flujo de alta de nuevos negocios.

create or replace function public.issue_business_management_invite(
    p_business_id uuid,
    p_invite_email text,
    p_valid_days integer default 30
)
returns table (
    invite_id uuid,
    business_id uuid,
    invite_email text,
    token uuid,
    status text,
    created_at timestamptz,
    expires_at timestamptz
)
language plpgsql
set search_path = public
as $function$
declare
    v_owner_id uuid;
    v_business_status text;
    v_email text;
begin
    v_email := lower(trim(coalesce(p_invite_email, '')));

    if v_email = '' or position('@' in v_email) < 2 then
        raise exception 'INVALID_INVITE_EMAIL';
    end if;

    if p_valid_days is null or p_valid_days < 1 or p_valid_days > 90 then
        raise exception 'INVALID_INVITE_VALIDITY_DAYS';
    end if;

    select b.owner_id, upper(coalesce(b.estado, ''))
      into v_owner_id, v_business_status
      from public.businesses b
     where b.id = p_business_id
     for update;

    if not found then
        raise exception 'BUSINESS_NOT_FOUND';
    end if;

    if v_business_status <> 'ACTIVO' then
        raise exception 'BUSINESS_NOT_ACTIVE';
    end if;

    if v_owner_id is not null then
        raise exception 'BUSINESS_ALREADY_ASSIGNED';
    end if;

    -- Reemisión idempotente respecto a la restricción actual:
    -- conserva el historial y libera el índice único de invitación pendiente.
    update public.business_management_invites i
       set status = 'REVOCADA'
     where i.business_id = p_business_id
       and i.status = 'PENDIENTE';

    return query
    insert into public.business_management_invites (
        business_id,
        invite_email,
        status,
        expires_at
    )
    values (
        p_business_id,
        v_email,
        'PENDIENTE',
        now() + make_interval(days => p_valid_days)
    )
    returning
        public.business_management_invites.id,
        public.business_management_invites.business_id,
        public.business_management_invites.invite_email,
        public.business_management_invites.token,
        public.business_management_invites.status,
        public.business_management_invites.created_at,
        public.business_management_invites.expires_at;
end;
$function$;

-- Bloquea el uso desde el frontend público o cuentas autenticadas.
revoke all on function public.issue_business_management_invite(uuid, text, integer) from public;
revoke all on function public.issue_business_management_invite(uuid, text, integer) from anon;
revoke all on function public.issue_business_management_invite(uuid, text, integer) from authenticated;
grant execute on function public.issue_business_management_invite(uuid, text, integer) to postgres;
