-- neXsv | Fotos públicas de presentación
-- Las fotografías de presentación se muestran públicamente en la ficha del negocio.
-- El bucket sigue requiriendo políticas para subir, modificar y eliminar archivos.
update storage.buckets
set public = true
where id = 'business-media';
