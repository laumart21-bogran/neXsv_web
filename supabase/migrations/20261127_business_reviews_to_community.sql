-- Reviews linked to authenticated profiles and community recommendations.
-- Apply only after the staging schema includes businesses and business_reviews.

alter table public.business_reviews
  add column if not exists author_id uuid references auth.users(id),
  add column if not exists publication_id uuid references public.community_publications(id);

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
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
  v_business_name text;
  v_review_id uuid;
  v_publication_id uuid;
  v_comment text := btrim(coalesce(p_comment, ''));
begin
  if v_user_id is null then
    raise exception 'Usuario no autenticado.';
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

  select b.nombre into v_business_name
  from public.businesses b
  where b.id = p_business_id;

  if v_business_name is null then
    raise exception 'No se encontró el negocio seleccionado.';
  end if;

  insert into public.business_reviews
    (business_id, nombre, estrellas, comentario, author_id)
  values
    (p_business_id, v_name, p_stars, v_comment, v_user_id)
  returning id into v_review_id;

  insert into public.community_publications
    (author_id, business_id, type, title, body, status)
  values
    (v_user_id, p_business_id, 'RECOMENDACION',
     'Mi experiencia en ' || v_business_name,
     repeat('★', p_stars) || repeat('☆', 5 - p_stars) || E'\n' || v_comment,
     'PUBLICADA')
  returning id into v_publication_id;

  update public.business_reviews
  set publication_id = v_publication_id
  where id = v_review_id;

  return jsonb_build_object(
    'review_id', v_review_id,
    'publication_id', v_publication_id,
    'business_id', p_business_id,
    'author_id', v_user_id
  );
end;
$$;

revoke all on function public.create_business_review_with_publication(uuid, integer, text) from public;
grant execute on function public.create_business_review_with_publication(uuid, integer, text) to authenticated;

-- Historical attribution approved by the product owner:
-- Laura and Cindy's test reviews were both submitted from Laura's account.
do $$
declare
  v_author_id uuid;
  v_review record;
  v_publication_id uuid;
  v_business_name text;
begin
  select id into v_author_id
  from auth.users
  where lower(email) = lower('lauramartinezp9@gmail.com')
  limit 1;

  if v_author_id is null then
    raise notice 'Historical Laura/Cindy reviews not backfilled: account not found.';
    return;
  end if;

  for v_review in
    select id, business_id, estrellas, comentario
    from public.business_reviews
    where lower(coalesce(nombre, '')) in ('laura', 'cindy')
      and publication_id is null
  loop
    select nombre into v_business_name
    from public.businesses
    where id = v_review.business_id;

    if v_business_name is not null then
      insert into public.community_publications
        (author_id, business_id, type, title, body, status, created_at)
      values
        (v_author_id, v_review.business_id, 'RECOMENDACION',
         'Experiencia en ' || v_business_name,
         repeat('★', greatest(1, least(5, v_review.estrellas))) ||
           repeat('☆', 5 - greatest(1, least(5, v_review.estrellas))) ||
           E'\n' || coalesce(v_review.comentario, ''),
         'PUBLICADA', now())
      returning id into v_publication_id;

      update public.business_reviews
      set author_id = v_author_id, publication_id = v_publication_id,
          nombre = 'Laura'
      where id = v_review.id;
    end if;
  end loop;
end;
$$;
