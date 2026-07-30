/**
 * ==========================================================
 * neXsv Platform v2
 * AuthSession
 * Gestión centralizada de la sesión del usuario
 * ==========================================================
 */

import AuthService from "./auth.service.js";

class AuthSession {
    constructor() {
        this.session = null;
        this.user = null;
    }

    /**
     * Inicializa la sesión al cargar la aplicación.
     */
    async initialize() {
        const { data, error } = await AuthService.getSession();

        if (error) {
            console.error("Error al recuperar la sesión:", error);
            return;
        }

        this.session = data.session;
        this.user = data.session?.user ?? null;
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
     * Indica si existe una sesión activa.
     */
    isAuthenticated() {
        return this.session !== null;
    }

    /**
     * Escucha cambios de autenticación.
     */
    listen() {
        AuthService.onAuthStateChange(({ session }) => {
            this.session = session;
            this.user = session?.user ?? null;
        });
    }

    /**
     * Limpia la información local de la sesión.
     */
    clear() {
        this.session = null;
        this.user = null;
    }
}

export default new AuthSession();
