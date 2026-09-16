-- neXsv | Logos públicos de negocios
-- Ejecutar en Supabase antes de usar la carga de logo desde el dashboard.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'business-logos',
    'business-logos',
    true,
    5242880,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = true,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "business logos public read"
on storage.objects for select
to public
using (bucket_id = 'business-logos');

create policy "business owners upload logos"
on storage.objects for insert
to authenticated
with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "business owners update logos"
on storage.objects for update
to authenticated
using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "business owners delete logos"
on storage.objects for delete
to authenticated
using (
    bucket_id = 'business-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
);
