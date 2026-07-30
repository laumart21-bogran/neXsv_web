/**
 * ==========================================================
 * neXsv Platform v2
 * AuthService
 * Servicio único de autenticación
 * ==========================================================
 */

import { supabase } from "../core/supabase-client.js";

class AuthService {

    /**
     * Iniciar sesión
     */
    async signIn(email, password) {

        return await supabase.auth.signInWithPassword({
            email,
            password
        });

    }

    /**
     * Registrar usuario
     */
    async signUp({ firstName, lastName, email, password }) {

        return await supabase.auth.signUp({

            email,

            password,

            options: {

                data: {

                    first_name: firstName,

                    last_name: lastName

                }

            }

        });

    }

    /**
     * Recuperar contraseña
     */
    async resetPassword(email) {

        return await supabase.auth.resetPasswordForEmail(email);

    }

    /**
     * Obtener sesión actual
     */
    async getSession() {

        return await supabase.auth.getSession();

    }

    /**
     * Obtener usuario autenticado
     */
    async getUser() {

        return await supabase.auth.getUser();

    }

    /**
     * Escuchar cambios de autenticación
     */
    onAuthStateChange(callback) {

        return supabase.auth.onAuthStateChange((event, session) => {

            callback({
                event,
                session
            });

        });

    }

    /**
     * Cerrar sesión
     */
    async signOut() {

        return await supabase.auth.signOut();

    }

}

export default new AuthService();
