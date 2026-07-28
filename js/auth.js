/* ==========================================
   neXsv
   Authentication Manager
   Supabase
========================================== */

/* ==========================================
   Usuario actual
========================================== */

async function getCurrentUser() {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    return user;

}

/* ==========================================
   ¿Existe sesión?
========================================== */

async function isLogged() {

    const user = await getCurrentUser();

    return user !== null;

}

/* ==========================================
   Cerrar sesión
========================================== */

async function logout() {

    await supabase.auth.signOut();

    window.location.href = "/";

}

/* ==========================================
   Proteger páginas privadas
========================================== */

async function requireMember(callback) {

    const logged = await isLogged();

    if (logged) {

        callback();

        return true;

    }

    if (typeof showMemberModal === "function") {

        showMemberModal();

    } else {

        window.location.href = "../acceso/login-usuario.html";

    }

    return false;

}

/* ==========================================
   Nombre del usuario
========================================== */

async function getUserName() {

    const user = await getCurrentUser();

    if (!user) return "";

    return user.user_metadata?.nombre || "";

}

/* ==========================================
   Correo
========================================== */

async function getUserEmail() {

    const user = await getCurrentUser();

    if (!user) return "";

    return user.email || "";

}

/* ==========================================
   Rol
========================================== */

async function getUserRole() {

    const user = await getCurrentUser();

    if (!user) return "";

    return user.user_metadata?.rol || "usuario";

}
