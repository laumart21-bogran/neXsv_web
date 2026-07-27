// ==========================================
// neXsv - Auth Service
// ==========================================

import { supabase } from "../configu/supabase.js";

const authService = {

    // ==============================
    // LOGIN
    // ==============================
    async login(email, password) {

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            throw new Error(error.message);
        }

        return data.user;

    },

    // ==============================
    // REGISTRO
    // ==============================
    async register({ nombre, email, password, tipo = "usuario" }) {

        const { data, error } = await supabase.auth.signUp({

            email,
            password,

            options: {
                data: {
                    nombre,
                    tipo
                }
            }

        });

        if (error) {
            throw new Error(error.message);
        }

        return data.user;

    },

    // ==============================
    // RECUPERAR CONTRASEÑA
    // ==============================
    async resetPassword(email) {

        const { error } = await supabase.auth.resetPasswordForEmail(email, {

            redirectTo:
                window.location.origin +
                "/acceso/nueva-password.html"

        });

        if (error) {
            throw new Error(error.message);
        }

        return true;

    },

    // ==============================
    // NUEVA CONTRASEÑA
    // ==============================
    async updatePassword(password) {

        const { error } = await supabase.auth.updateUser({

            password

        });

        if (error) {
            throw new Error(error.message);
        }

        return true;

    },

    // ==============================
    // USUARIO ACTUAL
    // ==============================
    async getCurrentUser() {

        const {

            data: { user }

        } = await supabase.auth.getUser();

        return user;

    },

    // ==============================
    // SESIÓN
    // ==============================
    async getSession() {

        const {

            data: { session }

        } = await supabase.auth.getSession();

        return session;

    },

    // ==============================
    // LOGOUT
    // ==============================
    async logout() {

        const { error } = await supabase.auth.signOut();

        if (error) {
            throw new Error(error.message);
        }

        return true;

    }

};

export default authService;
