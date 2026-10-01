-- neXsv | Reparación de información práctica del negocio
-- Seguro de ejecutar aunque los campos ya existan.
-- No elimina ni modifica datos existentes.

alter table public.businesses
  add column if not exists dias_atencion text;

alter table public.businesses
  add column if not exists horario_atencion text;

-- Actualiza el esquema que utiliza PostgREST para que reconozca
-- inmediatamente las columnas recién creadas.
notify pgrst, 'reload schema';
