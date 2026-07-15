/* ==========================================
   neXsv Authentication Manager
========================================== */

const SESSION_KEY = "nexsv.member";

function isLogged() {
    return localStorage.getItem(SESSION_KEY) !== null;
}

function getCurrentUser() {

    const user = localStorage.getItem(SESSION_KEY);

    if (!user) return null;

    return JSON.parse(user);

}

function login(userData) {

    localStorage.setItem(
        SESSION_KEY,
        JSON.stringify(userData)
    );

}

function logout() {

    localStorage.removeItem(SESSION_KEY);

}

function requireMember(callback) {

    if (isLogged()) {

        callback();

        return true;

    }

    showMemberModal();

    return false;

}
