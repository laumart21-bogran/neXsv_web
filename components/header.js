/* ==========================================
   neXsv Header
========================================== */

document.addEventListener("DOMContentLoaded", () => {

    const usuario = getCurrentUser();

    const header = document.createElement("header");

    header.className = "nex-header";

    header.innerHTML = `

    <a href="index.html" class="nex-logo">
        <img src="logo.png" alt="neXsv">
    </a>

    <button class="menu-toggle" id="menuToggle">
        ☰
    </button>

    <nav class="nex-nav" id="mobileMenu">

        <a href="index.html">Inicio</a>

        <a href="como.html">Cómo funciona</a>

        <a href="beneficios.html">Beneficios</a>

        <a href="negocios.html">Negocios</a>

        <a href="blog.html">Blog</a>

        ${
            usuario
            ?

            `
            <a
                href="perfil.html"
                class="nex-btn"
                id="memberButton">

                👋 ${usuario.nombre.split(" ")[0]}

            </a>
            `

            :

            `
            <a
                href="acceso/index.html"
                class="nex-btn">

                <i class="fa-regular fa-user"></i>
                Acceder →

            </a>
            `
        }

    </nav>

    `;

    document.body.prepend(header);

    document
        .getElementById("menuToggle")
        .addEventListener("click", () => {

            document
                .getElementById("mobileMenu")
                .classList.toggle("active");

        });

});
