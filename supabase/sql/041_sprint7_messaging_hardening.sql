-- ==========================================================
-- neXsv | Sprint 7.2 — Hardening de mensajería privada
-- Aplicar después de verificar los privilegios efectivos en producción.
-- No modifica ni elimina mensajes o conversaciones existentes.
-- ==========================================================

BEGIN;

-- A. Permisos mínimos para participantes:
-- usuarios autenticados pueden leer sus filas y actualizar solo last_read_at.
-- La creación de participantes queda reservada a la RPC SECURITY DEFINER.
REVOKE ALL PRIVILEGES
ON TABLE public.conversation_participants
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON TABLE public.conversation_participants
TO authenticated;

GRANT UPDATE (last_read_at)
ON TABLE public.conversation_participants
TO authenticated;

DROP POLICY IF EXISTS
    "Usuarios pueden crear su participación"
ON public.conversation_participants;

DROP POLICY IF EXISTS
    "Usuarios pueden actualizar lectura"
ON public.conversation_participants;

CREATE POLICY "Usuarios pueden actualizar lectura"
ON public.conversation_participants
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- B. Las conversaciones solo se leen directamente; creación y cambios
-- quedan reservados a funciones validadas.
REVOKE ALL PRIVILEGES
ON TABLE public.conversations
FROM PUBLIC, anon, authenticated;

GRANT SELECT
ON TABLE public.conversations
TO authenticated;

DROP POLICY IF EXISTS
    "Usuarios autenticados pueden crear conversaciones"
ON public.conversations;

DROP POLICY IF EXISTS
    "Participantes pueden actualizar conversaciones"
ON public.conversations;

DROP POLICY IF EXISTS
    "Participantes pueden actualizar origen de conversación"
ON public.conversations;

-- C. Al guardar un mensaje válido, actualizar updated_at desde la base de datos.
CREATE OR REPLACE FUNCTION public.touch_conversation_after_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
    UPDATE public.conversations
       SET updated_at = pg_catalog.now()
     WHERE id = NEW.conversation_id;

    RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.touch_conversation_after_message()
FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_touch_conversation_after_message
ON public.messages;

CREATE TRIGGER trg_touch_conversation_after_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.touch_conversation_after_message();

-- D. Permisos mínimos para mensajes: lectura y envío autenticados.
-- No se permiten acceso anónimo ni edición/eliminación directa.
REVOKE ALL PRIVILEGES
ON TABLE public.messages
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT
ON TABLE public.messages
TO authenticated;

DROP POLICY IF EXISTS
    "Usuarios pueden actualizar sus mensajes"
ON public.messages;

-- E. Asociar una publicación de origen solo si quien llama y el autor
-- de la publicación participan en esa conversación.
CREATE OR REPLACE FUNCTION public.set_conversation_origin(
    p_conversation_id uuid,
    p_publication_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_user_id uuid := auth.uid();
    v_author_id uuid;
    v_origin_id uuid;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT p.author_id
      INTO v_author_id
      FROM public.community_publications AS p
     WHERE p.id = p_publication_id
       AND p.status = 'PUBLICADA';

    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'PUBLICATION_NOT_AVAILABLE';
    END IF;

    IF v_author_id = v_user_id THEN
        RAISE EXCEPTION 'INVALID_PUBLICATION_OWNER';
    END IF;

    IF NOT EXISTS (
        SELECT 1
          FROM public.conversation_participants AS cp
         WHERE cp.conversation_id = p_conversation_id
           AND cp.user_id = v_user_id
    ) OR NOT EXISTS (
        SELECT 1
          FROM public.conversation_participants AS cp
         WHERE cp.conversation_id = p_conversation_id
           AND cp.user_id = v_author_id
    ) THEN
        RAISE EXCEPTION 'CONVERSATION_ACCESS_DENIED';
    END IF;

    SELECT c.origin_publication_id
      INTO v_origin_id
      FROM public.conversations AS c
     WHERE c.id = p_conversation_id
     FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CONVERSATION_NOT_FOUND';
    END IF;

    IF v_origin_id IS NOT NULL
       AND v_origin_id <> p_publication_id THEN
        RAISE EXCEPTION 'ORIGIN_ALREADY_SET';
    END IF;

    UPDATE public.conversations
       SET origin_publication_id = p_publication_id,
           updated_at = pg_catalog.now()
     WHERE id = p_conversation_id;

    RETURN true;
END;
$function$;

REVOKE ALL ON FUNCTION
    public.set_conversation_origin(uuid, uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
    public.set_conversation_origin(uuid, uuid)
TO authenticated;

-- F. Endurecer la RPC de apertura/reutilización ya existente.
-- Su cuerpo usa nombres de tablas y auth.uid() calificados por esquema.
ALTER FUNCTION public.get_or_create_direct_conversation(uuid)
SET search_path = '';

REVOKE ALL ON FUNCTION
    public.get_or_create_direct_conversation(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
    public.get_or_create_direct_conversation(uuid)
TO authenticated;

COMMIT;
