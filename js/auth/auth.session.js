/**
 * ==========================================================
 * neXsv Platform v2
 * AuthSession
 * Gestión centralizada de la sesión
 * ==========================================================
 */

import AuthService from "./auth.service.js";

class AuthSession {

    constructor() {
        this.session = null;
        this.user = null;
        this.initialized = false;
    }

    /**
     * Inicializa la sesión al cargar la aplicación.
     */
    async initialize() {

        const { data, error } = await AuthService.getSession();

        if (error) {

            console.error("Error al obtener la sesión:", error);
            return;

        }

        this.session = data.session;
        this.user = data.session?.user ?? null;
        this.initialized = true;

    }

    /**
     * Escucha cambios en la autenticación.
     */
    startListener() {

        AuthService.onAuthStateChange(({ session }) => {

            this.session = session;
            this.user = session?.user ?? null;

        });

    }

    /**
     * Devuelve la sesión actual.
     */
    getSession() {

        return this.session;

    }

    /**
     * Devuelve el usuario autenticado.
     */
    getCurrentUser() {

        return this.user;

    }

    /**
     * Indica si el usuario está autenticado.
     */
    isAuthenticated() {

        return this.user !== null;

    }

    /**
     * Indica si AuthSession ya fue inicializado.
     */
    isInitialized() {

        return this.initialized;

    }

    /**
     * Limpia la sesión local.
     */
    clear() {

        this.session = null;
        this.user = null;

    }

}

export default new AuthSession();
