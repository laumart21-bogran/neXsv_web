/* ==========================================
   neXsv - Dashboard del Miembro v1.0
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Verificar sesión
    if (typeof getCurrentUser !== "function") return;

    const usuario = getCurrentUser();

    if (!usuario) return;

    const publicHome = document.getElementById("public-home");
    const memberHome = document.getElementById("member-home");

    if (!publicHome || !memberHome) return;

    publicHome.style.display = "none";
    memberHome.style.display = "block";

    const nombre = (usuario.nombre || "Miembro").split(" ")[0];

    memberHome.innerHTML = `

<section class="member-dashboard">

<div class="dashboard-container">

<!-- ===========================
BIENVENIDA
=========================== -->

<section class="dashboard-hero">

    <div class="dashboard-hero-content">

        <span class="welcome-badge">
            👋 Bienvenida de nuevo
        </span>

        <h1>

            ${nombre}

        </h1>

        <p>

            Qué bueno tenerte nuevamente en neXsv.

            Descubre negocios confiables y mantente al día con lo que sucede dentro de tu comunidad.

        </p>

    </div>

</section>

<!-- ===========================
ACCIONES RÁPIDAS
=========================== -->

<section class="quick-actions">

<div class="quick-card">

<div class="quick-icon">
🏪
</div>

<h3>

Buscar negocios

</h3>

<p>

Explora negocios confiables dentro de tu comunidad.

</p>

<a
href="negocios.html"
class="quick-button">

Explorar

</a>

</div>

<div class="quick-card">

<div class="quick-icon">
👤
</div>

<h3>

Mi perfil

</h3>

<p>

Consulta y administra la información de tu cuenta.

</p>

<a
href="perfil.html"
class="quick-button">

Abrir perfil

</a>

</div>

<div class="quick-card disabled">

<div class="quick-icon">
📢
</div>

<h3>

Oportunidades

</h3>

<p>

Muy pronto podrás descubrir oportunidades para tu familia.

</p>

<span class="coming">

Próximamente

</span>

</div>

</section>

<!-- ===========================
LO NUEVO
=========================== -->

<section class="community-news">

<h2>

Lo nuevo en tu comunidad

</h2>

<div class="stats-grid">

<div class="stat-card">

<div class="stat-number">

127

</div>

<div class="stat-label">

Miembros

</div>

</div>

<div class="stat-card">

<div class="stat-number">

18

</div>

<div class="stat-label">

Negocios

</div>

</div>

<div class="stat-card">

<div class="stat-number">

8

</div>

<div class="stat-label">

Promociones

</div>

</div>

<div class="stat-card">

<div class="stat-number">

3

</div>

<div class="stat-label">

Eventos

</div>

</div>

</div>

</section>

<!-- ===========================
NEGOCIOS RECOMENDADOS
=========================== -->

<section class="recommended-section">

<div class="section-header">

<h2>

Negocios recomendados para ti

</h2>

<a href="negocios.html" class="section-link">

Ver todos →

</a>

</div>

<p class="section-description">

Explora negocios verificados que forman parte de la comunidad neXsv.

</p>

<div class="recommended-placeholder">

<div class="placeholder-icon">

🏪

</div>

<h3>

Explora negocios de confianza

</h3>

<p>

Accede al directorio completo de negocios recomendados por la comunidad.

</p>

<a href="negocios.html" class="quick-button">

Ir al directorio

</a>

</div>

</section>

<!-- ===========================
ACTIVIDAD RECIENTE
=========================== -->

<section class="activity-section">

<div class="section-header">

<h2>

Actividad reciente

</h2>

</div>

<div class="activity-list">

<div class="activity-item">

<div class="activity-circle">

🏪

</div>

<div class="activity-content">

<strong>

Nuevo negocio incorporado

</strong>

<p>

Un nuevo emprendimiento se unió a la comunidad.

</p>

<span>

Hace unas horas

</span>

</div>

</div>

<div class="activity-item">

<div class="activity-circle">

🎉

</div>

<div class="activity-content">

<strong>

Nueva promoción disponible

</strong>

<p>

Hay promociones activas para miembros de la comunidad.

</p>

<span>

Hoy

</span>

</div>

</div>

<div class="activity-item">

<div class="activity-circle">

👥

</div>

<div class="activity-content">

<strong>

La comunidad continúa creciendo

</strong>

<p>

Cada vez más familias forman parte de neXsv.

</p>

<span>

Esta semana

</span>

</div>

</div>

</div>

</section>

</div>

</section>

`;

}); // Fin del DOMContentLoaded

