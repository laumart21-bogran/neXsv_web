/* ==========================================
   neXsv - Home para miembros
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    // Verificar si existe una sesión
    if (typeof getCurrentUser !== "function") return;

    const usuario = getCurrentUser();

    if (!usuario) return;

    const publicHome = document.getElementById("public-home");
    const memberHome = document.getElementById("member-home");

    if (!publicHome || !memberHome) return;

    // Oculta el Home público
    publicHome.style.display = "none";

    // Construye el Home del miembro
    memberHome.style.display = "block";

    memberHome.innerHTML = `

<section class="hero">

    <div class="hero-content">

        <h1>
            👋 Hola ${usuario.nombre.split(" ")[0]}
        </h1>

        <p>
            Bienvenido nuevamente a tu comunidad.
            Desde aquí podrás descubrir negocios,
            encontrar oportunidades y administrar tu experiencia dentro de neXsv.
        </p>

        <div class="hero-buttons">

            <a href="negocios.html" class="btn btn-primary">
                🏪 Explorar negocios
            </a>

            <a href="perfil.html" class="btn btn-secondary">
                👤 Mi perfil
            </a>

        </div>

    </div>

</section>

<section class="section">

<div class="container">

<h2>
Tu comunidad
</h2>

<div class="grid">

<div class="card">

<h3>
❤️ Favoritos
</h3>

<p>
Guarda los negocios que más te interesan y encuéntralos fácilmente.
</p>

<p style="margin-top:20px;color:#888;font-weight:bold;">
Próximamente
</p>

</div>

<div class="card">

<h3>
🎁 Oportunidades
</h3>

<p>
Compra, vende, dona o comparte artículos dentro de una comunidad basada en confianza.
</p>

<p style="margin-top:20px;color:#888;font-weight:bold;">
Próximamente
</p>

</div>

<div class="card">

<h3>
⭐ Recomendaciones
</h3>

<p>
Consulta las recomendaciones realizadas por otros miembros de tu comunidad.
</p>

<p style="margin-top:20px;color:#888;font-weight:bold;">
Próximamente
</p>

</div>

</div>

</div>

</section>

`;

});
