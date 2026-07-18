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

memberHome.innerHTML = renderDashboard(nombre);

function renderDashboard(nombre){

return `

<section class="member-dashboard">

    <div class="dashboard-container">

        <section class="dashboard-hero">

    <div class="hero-content">

        <span class="welcome-badge">
            ✨ Comunidad exclusiva
        </span>

        <h1>
            ¡Hola, ${nombre}!
        </h1>

        <p class="hero-description">
            Bienvenida nuevamente a <strong>neXsv</strong>.
            Descubre negocios recomendados, promociones exclusivas y mantente conectada con una comunidad construida sobre confianza.
        </p>

        <div class="hero-actions">

            <a href="negocios.html" class="hero-primary">
                Explorar negocios
            </a>

            <a href="perfil.html" class="hero-secondary">
                Mi perfil
            </a>

        </div>

    </div>

    <div class="hero-summary">

    </div>

</section>

        <div class="summary-card">
            <span class="summary-number">127</span>
            <span class="summary-label">Miembros</span>
        </div>

        <div class="summary-card">
            <span class="summary-number">18</span>
            <span class="summary-label">Negocios</span>
        </div>

        <div class="summary-card">
            <span class="summary-number">8</span>
            <span class="summary-label">Promociones</span>
        </div>

    </div>

<section class="quick-actions">

    <a href="negocios.html" class="quick-card">

        <div class="quick-icon">🏪</div>

        <h3>Explorar negocios</h3>

        <p>
            Encuentra negocios recomendados por tu comunidad.
        </p>

        <span class="quick-link">
            Explorar →
        </span>

    </a>

    <a href="perfil.html" class="quick-card">

        <div class="quick-icon">👤</div>

        <h3>Mi perfil</h3>

        <p>
            Actualiza tu información y administra tu cuenta.
        </p>

        <span class="quick-link">
            Abrir perfil →
        </span>

    </a>

    <a href="blog.html" class="quick-card">

        <div class="quick-icon">📰</div>

        <h3>Blog</h3>

        <p>
            Descubre consejos y novedades para la comunidad.
        </p>

        <span class="quick-link">
            Leer artículos →
        </span>

    </a>

    <div class="quick-card disabled">

        <div class="quick-icon">🎁</div>

        <h3>Beneficios</h3>

        <p>
            Muy pronto tendrás promociones exclusivas para miembros.
        </p>

        <span class="coming">
            Próximamente
        </span>

    </div>

</section>
            </div>

        <section class="community-news">

            <h2>Lo nuevo en tu comunidad</h2>

            <div class="stats-grid">

                <div class="stat-card">
                    <div class="stat-number">127</div>
                    <div class="stat-label">Miembros</div>
                </div>

                <div class="stat-card">
                    <div class="stat-number">18</div>
                    <div class="stat-label">Negocios</div>
                </div>

                <div class="stat-card">
                    <div class="stat-number">8</div>
                    <div class="stat-label">Promociones</div>
                </div>

                <div class="stat-card">
                    <div class="stat-number">3</div>
                    <div class="stat-label">Eventos</div>
                </div>

            </div>

        </section>

        <section class="recommended-section">

            <div class="section-header">

                <h2>Negocios destacados</h2>

                <a href="negocios.html" class="section-link">
                    Ver todos →
                </a>

            </div>

            <div class="recommended-placeholder">

                <div class="placeholder-icon">
                    🏪
                </div>

                <h3>
                    Descubre negocios confiables
                </h3>

                <p>
                    Muy pronto mostraremos recomendaciones personalizadas.
                </p>

            </div>

        </section>

        <section class="activity-section">

            <h2>Actividad reciente</h2>

            <div class="activity-list">

                <div class="activity-item">

                    <div class="activity-circle">
                        🎉
                    </div>

                    <div class="activity-content">

                        <strong>
                            Bienvenida a neXsv
                        </strong>

                        <p>
                            Tu cuenta ya forma parte de la comunidad.
                        </p>

                        <span>
                            Hoy
                        </span>

                    </div>

                </div>

                <div class="activity-item">

                    <div class="activity-circle">
                        🏪
                    </div>

                    <div class="activity-content">

                        <strong>
                            Explora negocios
                        </strong>

                        <p>
                            Descubre negocios recomendados por tu comunidad.
                        </p>

                    </div>

                </div>

            </div>

        </section>

    </div>

</section>

`;

}

}); // Fin del DOMContentLoaded

