-- neXsv | Verificación de propietario del espacio de negocio
-- Solo informa si el usuario autenticado es propietario del negocio indicado.

create or replace function public.is_business_owner(p_business_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
    select
        auth.uid() is not null
        and exists (
            select 1
            from public.businesses b
            where b.id = p_business_id
              and b.owner_id = auth.uid()
        );
$$;

revoke all on function public.is_business_owner(uuid) from public;
grant execute on function public.is_business_owner(uuid) to authenticated;
