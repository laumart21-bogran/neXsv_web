/**
 * ==========================================================
 * neXsv Platform v2
 * App
 * Punto de entrada de la aplicación
 * ==========================================================
 */

import AuthSession from "./auth/auth.session.js";

async function bootstrap() {

    try {

        // Inicializa la sesión del usuario
        await AuthSession.initialize();

        // Escucha cambios de autenticación
        AuthSession.startListener();

        console.log("✅ neXsv inicializado correctamente.");

        if (AuthSession.isAuthenticated()) {

            console.log("👤 Usuario autenticado:", AuthSession.getCurrentUser());

        } else {

            console.log("👤 No existe una sesión activa.");

        }

    } catch (error) {

        console.error("❌ Error al iniciar la aplicación:", error);

    }

}

bootstrap();
