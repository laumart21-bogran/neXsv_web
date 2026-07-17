/*=========================================
neXsv
Authentication Manager
Versión 1.0
=========================================*/

const SESSION_KEY = "nexsv.member";

/*=========================================
Obtener usuario actual
=========================================*/

function getCurrentUser() {

    const user = localStorage.getItem(SESSION_KEY);

    if (!user) return null;

    try {

        return JSON.parse(user);

    } catch (error) {

        console.error("Sesión corrupta.", error);

        logout();

        return null;

    }

}

/*=========================================
¿Existe sesión?
=========================================*/

function isLogged() {

    return getCurrentUser() !== null;

}

/*=========================================
Iniciar sesión
=========================================*/

function login(userData) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(userData)
    );

}

/*=========================================
Cerrar sesión
=========================================*/

function logout() {

    localStorage.removeItem(SESSION_KEY);

    window.location.href = "/";

}

/*=========================================
Proteger funcionalidades privadas
=========================================*/

function requireMember(callback) {

    if (isLogged()) {

        callback();

        return true;

    }

    if (typeof showMemberModal === "function") {

        showMemberModal();

    }

    return false;

}

/*=========================================
Obtener nombre
=========================================*/

function getUserName() {

    const user = getCurrentUser();

    if (!user) return "";

    return user.nombre || "";

}

/*=========================================
Correo
=========================================*/

function getUserEmail() {

    const user = getCurrentUser();

    if (!user) return "";

    return user.correo || "";

}

/*=========================================
Rol
=========================================*/

function getUserRole() {

    const user = getCurrentUser();

    if (!user) return "";

    return user.rol || "";

}
