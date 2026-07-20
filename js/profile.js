/*=========================================
neXsv
Perfil del Miembro
=========================================*/

document.addEventListener("DOMContentLoaded", () => {

    if (!isLogged()) {

        window.location.href = "acceso/login-usuario.html";
        return;

    }

    const usuario = getCurrentUser();

    //========================
    // Header
    //========================

    const topUserName = document.getElementById("topUserName");
    const topUserRole = document.getElementById("topUserRole");

    if (topUserName)
        topUserName.textContent = usuario.nombre || "Miembro";

    if (topUserRole)
        topUserRole.textContent = usuario.rol || "Miembro";

    //========================
    // Sidebar
    //========================

    document.getElementById("memberName").textContent =
        usuario.nombre || "";

    document.getElementById("memberEmail").textContent =
        usuario.correo || usuario.email || "";

    //========================
    // Formulario
    //========================

    document.getElementById("nombre").value =
        usuario.nombre || "";

    document.getElementById("correo").value =
        usuario.correo || usuario.email || "";

    document.getElementById("telefono").value =
        usuario.telefono || "";

    document.getElementById("ciudad").value =
        usuario.ciudad || "";

    document.getElementById("colegio").value =
        usuario.colegio || "";

    //========================
    // Guardar cambios
    //========================

    document
        .getElementById("profileForm")
        .addEventListener("submit", guardarPerfil);

});

/*=========================================
Guardar Perfil
=========================================*/

function guardarPerfil(e){

    e.preventDefault();

    const usuario = getCurrentUser();

    usuario.nombre =
        document.getElementById("nombre").value;

    usuario.telefono =
        document.getElementById("telefono").value;

    usuario.ciudad =
        document.getElementById("ciudad").value;

    usuario.colegio =
        document.getElementById("colegio").value;

    login(usuario);

    alert("Perfil actualizado correctamente.");

}
