document.addEventListener("DOMContentLoaded", () => {

    if (typeof getCurrentUser !== "function") return;

    const usuario = getCurrentUser();

    if (!usuario) {

        window.location.href = "acceso/";

        return;

    }

    const contenedor = document.getElementById("profile-container");

    contenedor.innerHTML = `

<div class="profile-card">

    <div class="profile-avatar">

        👤

    </div>

    <h1>${usuario.nombre}</h1>

    <span class="profile-role">

        ${usuario.rol}

    </span>

    <hr>

    <div class="profile-item">

        <strong>Correo</strong>

        <p>${usuario.email}</p>

    </div>

    <div class="profile-item">

        <strong>Miembro desde</strong>

        <p>2026</p>

    </div>

    <hr>

    <div class="profile-stats">

        <div>

            <h2>0</h2>

            <p>Favoritos</p>

        </div>

        <div>

            <h2>0</h2>

            <p>Recomendaciones</p>

        </div>

        <div>

            <h2>0</h2>

            <p>Oportunidades</p>

        </div>

    </div>

    <button class="btn btn-primary" id="logoutBtn">

        Cerrar sesión

    </button>

</div>

`;

    document.getElementById("logoutBtn").addEventListener("click", () => {

        localStorage.removeItem("nexsv_user");

        window.location.href = "index.html";

    });

});
