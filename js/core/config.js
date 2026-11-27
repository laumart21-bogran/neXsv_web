/**
 * ==========================================================
 * neXsv Platform v2
 * Configuración global de la aplicación
 * ==========================================================
 */

const isPreviewEnvironment = /(^localhost$|\\.vercel\\.app$)/i.test(window.location.hostname);

const SUPABASE_ENVIRONMENTS = {
    production: {
        url: "https://verswqljdxiaveicdtfq.supabase.co",
        anonKey: "sb_publishable_4jUefYv7Yd6Bw8q31IPTQQ_5eBgILOp"
    },
    staging: {
        url: "https://hxlkshoexhbhsebkzjbk.supabase.co",
        anonKey: "sb_publishable_21aLKMz56y4xL7SwzkArPw_4itECn0b"
    }
};

export const APP_CONFIG = {
    appName: "neXsv",
    environment: isPreviewEnvironment ? "staging" : "production",
    supabase: isPreviewEnvironment ? SUPABASE_ENVIRONMENTS.staging : SUPABASE_ENVIRONMENTS.production,
    routes: {
        login: "/acceso/login-usuario.html",
        dashboard: "/dashboard.html"
    }
};
