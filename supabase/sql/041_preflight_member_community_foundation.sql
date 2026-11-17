-- ==========================================================
-- neXsv | Preflight de migración 041
-- Solo lectura: verifica dependencias antes de aplicar cambios.
-- No crea, modifica ni elimina objetos o datos.
-- Ejecutar en Supabase SQL Editor y revisar el resultado.
-- ==========================================================

with required_columns(table_name, column_name) as (
    values
        ('profiles', 'profesion'),
        ('community_publications', 'id'),
        ('community_publications', 'author_id'),
        ('community_publications', 'status'),
        ('conversations', 'id'),
        ('conversation_participants', 'conversation_id'),
        ('conversation_participants', 'user_id'),
        ('messages', 'conversation_id'),
        ('messages', 'sender_id'),
        ('messages', 'body'),
        ('community_publication_comments', 'publication_id'),
        ('community_publication_comments', 'author_id'),
        ('community_publication_comments', 'status'),
        ('community_publication_comments', 'body')
),
checks as (
    select
        r.table_name,
        r.column_name,
        case
            when c.column_name is null then 'FALTA'
            else 'OK'
        end as result
    from required_columns r
    left join information_schema.columns c
        on c.table_schema = 'public'
       and c.table_name = r.table_name
       and c.column_name = r.column_name
)
select
    table_name,
    column_name,
    result
from checks
order by table_name, column_name;

-- Tablas que la migración 041 crea o utiliza como nuevas.
select
    expected.table_name,
    case
        when t.table_name is null then 'NO EXISTE (se creará en migración 041)'
        else 'YA EXISTE'
    end as current_state
from (
    values
        ('community_publication_saves'),
        ('community_publication_shares'),
        ('notifications')
) as expected(table_name)
left join information_schema.tables t
    on t.table_schema = 'public'
   and t.table_name = expected.table_name
order by expected.table_name;

-- La migración incorpora tablas a esta publicación solo si existe.
select
    'supabase_realtime' as publication_name,
    case
        when exists (
            select 1 from pg_publication where pubname = 'supabase_realtime'
        ) then 'EXISTE'
        else 'NO EXISTE'
    end as current_state;
