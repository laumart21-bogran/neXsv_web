-- neXsv | Detalle público de negocio
create or replace function public.get_public_business_detail(p_business_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare business_data jsonb;
begin
    select to_jsonb(b) - 'owner_id'
      into business_data
      from public.businesses b
     where b.id = p_business_id
       and upper(coalesce(b.estado,'')) = 'ACTIVO';
    if business_data is null then
        raise exception 'BUSINESS_NOT_FOUND';
    end if;
    return business_data;
end;
$$;
revoke all on function public.get_public_business_detail(uuid) from public;
grant execute on function public.get_public_business_detail(uuid) to anon, authenticated;
