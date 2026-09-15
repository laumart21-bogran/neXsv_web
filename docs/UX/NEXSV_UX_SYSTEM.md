# neXsv — Sistema UX/UI Maestro

**Estado:** Sprint 0 — definición base
**Objetivo:** conectar las superficies existentes de neXsv sin rehacer la arquitectura funcional.

---

## 1. Principio rector

neXsv debe sentirse como **un solo producto con distintos espacios**, no como varias páginas independientes.

La arquitectura de experiencia se organiza alrededor de dos entidades principales:

- **Persona** — identidad, perfil, actividad y participación.
- **Negocio** — presencia pública, publicaciones, oportunidades, conversaciones y resultados.

La navegación y los componentes deben conservar una identidad común aunque cada espacio tenga un propósito diferente.

---

## 2. Recorrido principal de neXsv

```text
DESCUBRIR → CONOCER → CONFIAR → CONTACTAR
```

### Descubrir

- Index / sitio público
- Negocios
- Comunidad
- Blog / contenido

### Conocer

- Tarjeta de negocio
- Página completa del negocio
- Publicaciones
- Fotos
- Información pública

### Confiar

- Actividad reciente
- Reseñas
- Información consistente
- Señales de reputación

### Contactar

- Me interesa
- Conversar
- Mensajes
- WhatsApp
- Compartir

---

## 3. Modelo de acceso

### Visitante no autenticado

Puede descubrir negocios y consultar una versión limitada de su tarjeta.

**Visible sin cuenta:**

- Nombre del negocio
- Logo / imagen identificativa
- Actividad o categoría
- Descripción breve

**Requiere cuenta gratuita:**

- WhatsApp / datos de contacto
- Ubicación / cómo llegar
- Información ampliada
- Fotos completas
- Reseñas
- Novedades y demás contenido restringido
- Conversar / contactar
- Otras acciones personales como guardar o interactuar

La cuenta es **gratuita**. El objetivo es convertir descubrimiento en pertenencia a la comunidad, no crear un muro de pago.

### Miembro autenticado

Accede a la experiencia completa según sus permisos.

Si llega a un negocio mediante una invitación al registro, después de crear su cuenta debe poder **regresar al negocio que estaba consultando**, evitando perder el contexto.

---

## 4. Espacios del producto

```text
                         neXsv
                           │
              ┌────────────┼────────────┐
              │            │            │
           Público     Aplicación    Negocio
              │            │            │
        Marketing      Mi espacio    Dashboard
        Negocios       Comunidad     Resultados
        Blog           Mensajes      Gestión
```

No se busca que todos tengan exactamente el mismo layout. Se busca que compartan:

- tipografía
- colores
- iconografía
- botones
- tarjetas
- espaciado
- jerarquía visual
- lenguaje de acciones
- navegación coherente

---

## 5. Lenguaje de acciones

Estas etiquetas serán la referencia UX para futuras interfaces:

| Icono | Acción | Propósito |
|---|---|---|
| ✓ | **Me interesa** | Señal de interés |
| 🤝 | **Recomendar** | Recomendar a otras personas |
| 📌 | **Guardar** | Conservar para volver después |
| 💬 | **Conversar** | Iniciar conversación en neXsv |
| ↗️ | **Compartir** | Distribuir el contenido |
| 🔗 | **Conectar** | Establecer una conexión |

### Regla visual

El color debe ayudar a identificar la naturaleza de la acción, no decorar la interfaz.

- **Verde:** positivo, interés, conexión, confirmación.
- **Azul:** navegación, información y acción principal.
- **Amarillo:** compartir / destacar / acciones de atención.
- **Azul claro:** ubicación e información contextual.
- **Neutros:** estructura, texto secundario y superficies.

Evitar estrellas o elementos decorativos que parezcan una acción si no representan una acción real.

---

## 6. Entidad central: negocio

El negocio debe poder recorrerse de forma consistente:

```text
Tarjeta pública
      ↓
Página del negocio
      ↓
Información + fotos + reseñas + novedades
      ↓
Publicación
      ↓
Me interesa / Guardar / Compartir / Conversar
      ↓
Conversación / Mensajes
```

Las publicaciones de negocio deben seguir utilizando la entidad existente `community_publications`.

**No crear un segundo sistema de publicaciones para negocios.**

El vínculo negocio-publicación se realizará mediante `business_id`.

---

## 7. Comunidad ↔ Negocio

### Desde Comunidad

Una publicación debe poder llevar a:

- **Ver publicación** → detalle de la publicación.
- **Ver negocio** → página del negocio que originó la publicación, cuando corresponda.

### Desde Negocio

La sección **Novedades** debe mostrar las publicaciones existentes del negocio, sin duplicar contenido.

```text
             community_publications
                       │
             ┌─────────┴─────────┐
             │                   │
        Comunidad            Negocio
             │                   │
       publicación         novedades
```

---

## 8. Dashboard personal

Propósito: administrar la identidad y actividad de la persona.

Debe conectar naturalmente con:

- Mi perfil
- Mis publicaciones
- Mis negocios
- Comunidad
- Mensajes

Cuando una persona tenga negocios, sus tarjetas deben llevar al dashboard del **negocio específico seleccionado**, no simplemente al primer negocio disponible.

---

## 9. Dashboard de negocio

Propósito: administrar la presencia del negocio y entender resultados.

Orden conceptual:

1. Bienvenida / negocio activo
2. Resumen de resultados
3. Mis publicaciones
4. Oportunidades
5. Comunidad
6. Mi negocio
7. Resultados
8. Educación para hacer crecer el negocio

El dashboard debe contar la historia:

```text
PUBLICAR
   ↓
VISTAS
   ↓
ME INTERESA
   ↓
CONVERSACIONES
   ↓
MENSAJES
```

Los indicadores que todavía no tengan implementación real deben conservarse como próximos, no inventarse como datos.

---

## 10. Página de negocio

La futura página completa del negocio será el punto de unión entre descubrimiento y contacto.

Estructura conceptual:

```text
Identidad del negocio
        ↓
Información principal
        ↓
Acciones de contacto
        ↓
Fotos
        ↓
Novedades
        ↓
Reseñas
        ↓
Información adicional
```

La tarjeta pública seguirá siendo una vista resumida; la página completa será la experiencia ampliada para miembros.

---

## 11. Sistema de componentes a normalizar

La primera versión del sistema UX/UI debe definir y reutilizar:

- Header / navegación
- Contenedor de página
- Títulos y subtítulos de sección
- Botón principal
- Botón secundario
- Botón de acción positiva
- Botón de compartir
- Botón contextual de ubicación
- Tarjeta de negocio
- Tarjeta de publicación
- Tarjeta de métrica
- Avatar / logo
- Badge / estado
- Selector de negocio
- Estado vacío
- Mensaje de acceso requerido
- Bloque de autenticación / registro

No se debe crear un componente nuevo si ya existe uno equivalente que pueda adaptarse.

---

## 12. Reglas de implementación

### Mantener

- arquitectura actual de Supabase
- `profiles`
- `businesses`
- `community_publications`
- conversaciones y mensajes existentes
- sistema actual de comentarios
- métricas existentes
- blog existente

### Evitar

- duplicar entidades
- crear feeds paralelos
- crear sistemas alternativos de mensajes
- rehacer funcionalidades que ya funcionan
- modificar mensajes salvo bug real o solicitud explícita
- añadir SQL únicamente "por si acaso"

### Principio técnico

**Primero conectar, después ampliar.**

---

## 13. Orden de implementación UX

### Sprint 0 — Sistema UX/UI

- Definir identidad compartida
- Definir navegación
- Definir componentes base
- Definir reglas de acceso
- Definir recorridos

### Sprint 1 — Mi espacio

- Aplicar lenguaje común
- Conectar tarjetas de negocio con negocio específico
- Mantener lógica existente

### Sprint 2 — Negocios público

- Tarjeta limitada para visitantes
- Experiencia ampliada para miembros
- Registro con retorno al contexto

### Sprint 3 — Página de negocio

- Crear la entidad visual de página de negocio
- Información
- Contacto
- Fotos
- Reseñas
- Novedades

### Sprint 4 — Comunidad ↔ Negocio

- Ver negocio desde publicación
- Ver publicaciones desde negocio
- Mantener `community_publications` como fuente única

### Sprint 5 — Interacciones

- Me interesa
- Recomendar
- Guardar
- Conversar
- Compartir
- Conectar

### Sprint 6 — Resultados

- Vistas
- Intereses
- Conversaciones
- Mensajes
- Comentarios
- Reseñas

### Sprint 7 — Fotos y contenido

- Galería
- Gestión de imágenes
- Reutilización de contenido

### Sprint 8 — Educación para negocios

- Reutilizar blog existente
- Consejos y guías
- Contenido dentro del ecosistema

### Sprint 9 — Inteligencia

- Análisis de resultados
- Recomendaciones
- Automatizaciones
- Futuro asistente para negocios

---

## 14. Regla de oro

Cada vez que agreguemos una nueva funcionalidad debemos poder responder:

> **¿En qué parte del recorrido DESCUBRIR → CONOCER → CONFIAR → CONTACTAR encaja?**

Si no podemos responderlo, no debemos agregarla todavía.

---

## 15. Protección de la experiencia de mensajes

El sistema de mensajería queda considerado **zona congelada** durante esta etapa de integración UX.

No modificar su estructura visual ni CSS como parte de la normalización general.

La integración debe realizarse alrededor de los mensajes, no reconstruyendo el sistema que ya funciona.
