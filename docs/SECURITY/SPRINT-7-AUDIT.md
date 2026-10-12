# neXsv — Sprint 7: Auditoría de seguridad y preparación pública

Fecha: 2026-10-06

## Objetivo

Comprobar que visitante, miembro, propietario y administrador no puedan acceder o modificar datos fuera de su ámbito antes de abrir neXsv al público.

## Primera auditoría del repositorio

### Hallazgos corregidos en 7.1

1. **Funciones SECURITY DEFINER**
   - Varias RPC utilizaban `search_path = public`.
   - Se añadió `036_sprint7_security_hardening.sql` para fijar `search_path = ''` en las funciones de producción revisadas.
   - La función histórica de migración de negocios quedó deliberadamente fuera de este cambio porque utiliza `information_schema` y debe endurecerse como herramienta administrativa separada.

2. **Métricas de publicaciones**
   - `get_community_publication_metrics(uuid)` aceptaba cualquier UUID de publicación para un usuario autenticado.
   - Ahora devuelve métricas solamente cuando la publicación pertenece al usuario autenticado.

3. **Superficie de datos de negocios**
   - Las RPC públicas/autenticadas utilizaban `to_jsonb(b) - 'owner_id'`.
   - Se añadió `037_sprint7_business_data_surface.sql` para devolver una lista explícita de campos comerciales.
   - Esto evita que una futura columna interna de `businesses` quede expuesta automáticamente.

### Avance Sprint 7.3

7. **Funciones administrativas**
   - `is_business_owner(uuid)` quedó endurecida con `search_path = ''`.
   - La RPC histórica `migrate_legacy_businesses(jsonb)` quedó endurecida con `search_path = ''` y mantiene validación de administrador.
   - Se añadió `039_sprint7_admin_function_hardening.sql`.

### Hallazgos pendientes de validar en Supabase

4. **RLS de tablas base**
   - El repositorio no contiene la migración que crea/protege las tablas base `businesses`, `business_requests`, `profiles` y `admin_users`.
   - Por tanto, el estado real de RLS/grants de esas tablas no puede darse por garantizado solo revisando GitHub.
   - Este es el siguiente punto bloqueante de la auditoría.

5. **Flujo de incorporación**
   - El frontend crea directamente el negocio y después crea `business_requests`.
   - La seguridad real depende de las políticas de `businesses` y `business_requests`.
   - Debemos comprobar que un usuario no pueda crear/activar/publicar un negocio sin pasar por revisión administrativa.

6. **Storage**
   - Los archivos de `business-media` y `business-logos` usan rutas `usuario/negocio/archivo`.
   - Las políticas actuales comprueban principalmente el primer segmento (usuario).
   - Debemos comprobar y endurecer el vínculo entre el segundo segmento y un negocio realmente propiedad del usuario.

7. **Admin**
   - La interfaz comprueba `admin_users`, pero el control definitivo debe existir en RLS/RPC, nunca solo en JavaScript.
   - Las operaciones de aprobación/rechazo deben quedar blindadas a administradores.

## Matriz de roles a validar

| Acción | Visitante | Miembro | Propietario | Admin |
|---|---|---|---|---|
| Ver negocios activos | ✅ | ✅ | ✅ | ✅ |
| Ver comunidad pública | ✅ | ✅ | ✅ | ✅ |
| Crear publicación | ❌ | ✅ | ✅ | ✅ |
| Editar publicación propia | ❌ | ✅ | ✅ | ✅ |
| Editar publicación ajena | ❌ | ❌ | ❌ | revisar |
| Ver conversación propia | ❌ | ✅ | ✅ | ✅ |
| Ver conversación ajena | ❌ | ❌ | ❌ | revisar |
| Gestionar negocio propio | ❌ | según propiedad | ✅ | ✅ |
| Gestionar negocio ajeno | ❌ | ❌ | ❌ | solo admin |
| Aprobar negocio | ❌ | ❌ | ❌ | ✅ |
| Ver solicitudes de otros usuarios | ❌ | ❌ | ❌ | ✅ |

## Criterio de cierre del Sprint 7

No se considerará cerrado hasta comprobar:

- RLS habilitado en todas las tablas expuestas.
- Grants mínimos para `anon` y `authenticated`.
- Ningún miembro puede leer/modificar datos de otro miembro fuera de lo previsto.
- Ningún propietario puede apropiarse de otro negocio.
- Ningún propietario puede cambiar por sí mismo el estado de aprobación.
- Ningún miembro puede acceder a métricas privadas de otro propietario.
- Storage queda vinculado al propietario y al negocio.
- Solo administradores pueden aprobar/rechazar solicitudes.
- Existe una prueba reproducible de permisos permitidos y denegados.


## Evidencia para cerrar la auditoría

Se añadió `supabase/sql/040_sprint7_rls_diagnostic.sql`. Debe ejecutarse en el SQL Editor de Supabase para obtener el estado real de RLS, policies, grants y Storage. El repositorio por sí solo no puede confirmar ese estado.

### Estado actual

- 7.1 Hardening de RPC y superficie de datos: **implementado**.
- 7.2 Vinculación de Storage con propietario + negocio: **implementado en migración**.
- 7.3 Hardening de funciones administrativas: **implementado en migración**.
- 7.4 RLS/grants reales de tablas base: **pendiente de ejecutar/verificar en Supabase**.
- Cierre del Sprint 7: **NO CERRADO todavía**.
