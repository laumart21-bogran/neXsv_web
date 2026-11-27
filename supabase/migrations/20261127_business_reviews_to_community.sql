-- neXsv | Publicar reseñas de negocios como recomendaciones de comunidad.
-- PRECONDICIONES: staging debe tener public.businesses, public.business_reviews
-- y public.community_publications con sus claves foráneas ya instaladas.
-- Esta migración NO crea ni replica el esquema comercial.
--
-- La función SECURITY DEFINER es intencional: business_reviews no permite
-- INSERT directo y la política de community_publications reserva el vínculo
-- business_id a propietarios. La función valida identidad, perfil, negocio
-- activo y contenido; solo authenticated puede ejecutarla.

alter table public.business_reviews
  add column if not exists publication_id uuid
    references public.community_publications(id) on delete set null;

create unique index if not exists business_reviews_publication_id_uidx
  on public.business_reviews(publication_id)
  where publication_id is not null;

create or replace function public.create_business_review_with_publication(
  p_business_id uuid,
  p_stars integer,
  p_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
  v_business_name text;
  v_business_state text;
  v_review_id uuid;
  v_publication_id uuid;
  v_comment text := btrim(coalesce(p_comment, ''));
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado.';
  end if;

  if p_business_id is null then
    raise exception 'Debes seleccionar un negocio.';
  end if;

  if p_stars is null or p_stars < 1 or p_stars > 5 then
    raise exception 'La calificación debe estar entre 1 y 5.';
  end if;

  if v_comment = '' or char_length(v_comment) > 1200 then
    raise exception 'El comentario debe contener entre 1 y 1200 caracteres.';
  end if;

  select nullif(btrim(concat_ws(' ', p.nombre, p.apellido)), '')
    into v_name
  from public.profiles p
  where p.auth_user_id = v_user_id;

  if v_name is null then
    raise exception 'Completa tu perfil antes de dejar una reseña.';
  end if;

  select b.nombre, upper(coalesce(b.estado, ''))
    into v_business_name, v_business_state
  from public.businesses b
  where b.id = p_business_id;

  if v_business_name is null then
    raise exception 'No se encontró el negocio seleccionado.';
  end if;

  if v_business_state <> 'ACTIVO' then
    raise exception 'Solo puedes recomendar negocios activos.';
  end if;

  insert into public.business_reviews
    (business_id, nombre, estrellas, comentario)
  values
    (p_business_id, v_name, p_stars, v_comment)
  returning id into v_review_id;

  insert into public.community_publications
    (author_id, business_id, type, title, body, status)
  values
    (v_user_id, p_business_id, 'RECOMENDACION',
     'Mi experiencia en ' || v_business_name,
     repeat('★', p_stars) || repeat('☆', 5 - p_stars) || E'\\n' || v_comment,
     'PUBLICADA')
  returning id into v_publication_id;

  update public.business_reviews
  set publication_id = v_publication_id
  where id = v_review_id;

  return jsonb_build_object(
    'review_id', v_review_id,
    'publication_id', v_publication_id,
    'business_id', p_business_id
  );
end;
$$;

revoke all on function public.create_business_review_with_publication(uuid, integer, text)
  from public, anon, authenticated;
grant execute on function public.create_business_review_with_publication(uuid, integer, text)
  to authenticated;

comment on function public.create_business_review_with_publication(uuid, integer, text)
  is 'Crea una reseña y su publicación RECOMENDACION de forma atómica; valida usuario, perfil y negocio activo.';

-- Las reseñas históricas no se atribuyen automáticamente.
-- Su autoría solo se migrará con identificadores de cuenta confirmados.
