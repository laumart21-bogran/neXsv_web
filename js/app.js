/**
 * ==========================================================
 * neXsv Platform
 * Bootstrap de la aplicación
 * ==========================================================
 */

import { supabase } from "./core/supabase-client.js";

async function initializeApp() {

    try {

        const { data, error } = await supabase.auth.getSession();

        if (error) {

            console.error("Error inicializando Supabase:", error);

            return;

        }

        console.log("✔ neXsv Platform inicializada");

        console.log("Sesión actual:", data.session);

    }

    catch (error) {

        console.error("Error inesperado:", error);

    }

}

initializeApp();
