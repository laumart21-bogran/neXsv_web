/**
 * ==========================================================
 * neXsv Platform v2
 * Configuración global de la aplicación
 * ==========================================================
 */

export const APP_CONFIG = {

    appName: "neXsv",

    environment: "development",

    supabase: {

        url: "https://verswqljdxiaveicdtfq.supabase.co",

        anonKey: "sb_publishable_4jUefYv7Yd6Bw8q31IPTQQ_5eBgILOp"

    },

    push: {
        vapidPublicKey: "BGY__39TQ9LmwXuTQ1hRaqKajPesPsehwbF3Rp6Jw5FMganSMemF_jBgnH-sujLxs8VcEEOiZHd79omSJg0aLls"
    },

    routes: {

        login: "/acceso/login-usuario.html",

        dashboard: "/dashboard.html"

    }

};
