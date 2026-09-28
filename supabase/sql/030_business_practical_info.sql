-- neXsv | Información práctica del negocio
-- No elimina ni modifica datos existentes. Añade los campos opcionales
-- que el propietario puede mostrar en la ficha pública.

alter table public.businesses
add column if not exists dias_atencion text;

alter table public.businesses
add column if not exists horario_atencion text;
