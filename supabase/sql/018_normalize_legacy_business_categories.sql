-- neXsv: normalización de categorías de los negocios históricos.
-- Los registros históricos conservaron las categorías originales del formulario antiguo.
-- Este ajuste las alinea con el catálogo actual de incorporar-negocio.html.

update public.businesses
set categoria = 'Profesionales'
where nombre = 'LMarketing';

update public.businesses
set categoria = 'Automotriz'
where nombre = 'MovuX';

update public.businesses
set categoria = 'Hogar'
where nombre = 'Corporación Prime - Ingeniería y construcción';

update public.businesses
set categoria = 'Tecnología'
where nombre = 'Umi El Salvador SA de CV';

update public.businesses
set categoria = 'Compras'
where nombre = 'Metzger Industrial Supplies SA de CV';

update public.businesses
set categoria = 'Salud'
where nombre in (
    'Clinica Odontológica Dr. Federico Rosales.',
    'Smile Factory Clinica Dental y de Ortodoncia'
);

update public.businesses
set categoria = 'Profesionales'
where nombre = 'VÁSQUEZ PRODUCTORES DE SEGUROS';

-- Verificación
select id, nombre, categoria, estado
from public.businesses
where nombre in (
    'LMarketing',
    'MovuX',
    'Corporación Prime - Ingeniería y construcción',
    'Umi El Salvador SA de CV',
    'Metzger Industrial Supplies SA de CV',
    'Clinica Odontológica Dr. Federico Rosales.',
    'VÁSQUEZ PRODUCTORES DE SEGUROS',
    'Smile Factory Clinica Dental y de Ortodoncia'
)
order by nombre;
