document.addEventListener("DOMContentLoaded", () => {

    if (!isLogged()) {

        window.location.href = "acceso/login-usuario.html";
        return;

    }

    const nombre = getUserName();
    const correo = getUserEmail();

    const topUserName = document.getElementById("topUserName");
    const memberName = document.getElementById("memberName");
    const memberEmail = document.getElementById("memberEmail");

    if (topUserName) {

        topUserName.textContent = nombre || "Miembro";

    }

    if (memberName) {

        memberName.textContent = nombre || "Miembro";

    }

    if (memberEmail) {

        memberEmail.textContent = correo || "";

    }

});
