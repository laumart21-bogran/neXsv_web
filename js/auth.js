document.addEventListener("DOMContentLoaded", () => {

    const usuario = getCurrentUser();

    if (!usuario) {
        window.location.href = "acceso/";
        return;
    }

    const container = document.getElementById("profile-container");

    container.innerHTML = `

<div class="nex-profile">

    <div class="nex-profile-card">

        <div class="nex-profile-header">

            <div class="nex-avatar">
                👤
            </div>

            <div>

                <h1>${usuario.nombre}</h1>

                <span class="nex-role">
                    ${usuario.rol || "Miembro"}
                </span>

            </div>

        </div>

        <div class="nex-profile-grid">

            <div class="nex-info-card">

                <h3>Correo electrónico</h3>

                <p>${usuario.correo}</p>

            </div>

            <div class="nex-info-card">

                <h3>Miembro desde</h3>

                <p>2026</p>

            </div>

            <div class="nex-info-card">

                <h3>Estado</h3>

                <p>Activo</p>

            </div>

        </div>

        <div class="nex-stats">

            <div class="nex-stat">

                <h2>0</h2>

                <p>Favoritos</p>

            </div>

            <div class="nex-stat">

                <h2>0</h2>

                <p>Recomendaciones</p>

            </div>

            <div class="nex-stat">

                <h2>0</h2>

                <p>Oportunidades</p>

            </div>

        </div>

        <div class="nex-actions">

            <button
                class="nex-btn nex-btn-primary"
                id="logoutBtn">

                Cerrar sesión

            </button>

        </div>

    </div>

</div>

`;

    document
        .getElementById("logoutBtn")
        .addEventListener("click", logout);

});
