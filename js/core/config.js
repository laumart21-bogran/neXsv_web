/**
 * ==========================================================
 * neXsv Platform v2
 * Configuración global de la aplicación
 * ==========================================================
 */

const previewHost = window.location.hostname.toLowerCase();
const isPreviewEnvironment = previewHost === "localhost"
    || /^ne-xsv-[a-z0-9]{8,}-laumart21-bograns-projects\\.vercel\\.app$/.test(previewHost)
    || previewHost === "ne-xsv-web-git-feature-commun-dddaee-laumart21-bograns-projects.vercel.app";

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
