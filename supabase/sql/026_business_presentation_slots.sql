-- neXsv | Presentación visual controlada por el propietario
-- Agrega slots para las imágenes complementarias de la ficha pública.
-- La Imagen 1 (logo sobre fondo blanco) continúa viviendo en businesses.logo
-- y en el bucket público business-logos.

alter table public.business_media
add column if not exists slot smallint;

alter table public.business_media
drop constraint if exists business_media_slot_check;

alter table public.business_media
add constraint business_media_slot_check
check (slot is null or slot in (2, 3));

create unique index if not exists uq_business_media_presentation_slot
on public.business_media (business_id, slot)
where slot is not null;

-- Las fotografías históricas migradas ya tienen un orden conocido.
update public.business_media
set slot = 2
where storage_path like 'migration/3007d57a-d04e-48ee-a4d6-f434ce0ff0d0/02.%'
   or storage_path like 'migration/afa06334-d6ee-417f-aef8-ca11cd11773c/02.%';

update public.business_media
set slot = 3
where storage_path like 'migration/3007d57a-d04e-48ee-a4d6-f434ce0ff0d0/03.%'
   or storage_path like 'migration/afa06334-d6ee-417f-aef8-ca11cd11773c/03.%';
