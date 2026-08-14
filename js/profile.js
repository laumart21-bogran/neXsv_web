import { supabase } from "./core/supabase-client.js";
import profileService from "./services/profile.service.js";

console.log("Profile.js cargado correctamente");

document.addEventListener("DOMContentLoaded", async () => {

    // ==============================
    // Obtener usuario autenticado
    // ==============================

    const {
        data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
        console.log("No hay usuario autenticado");
        return;
    }

    console.log("Usuario:", user);

    // ==============================
    // Buscar perfil
    // ==============================

    let { data: perfil, error } =
        await profileService.getProfile(user.id);

    // ==============================
    // Si no existe, crearlo
    // ==============================

    if (error) {

        console.log("No existe perfil. Creándolo...");

        const nuevo =
            await profileService.createProfile({

                authUserId: user.id,
                nombre: "",
                apellido: ""

            });

        perfil = nuevo.data;

    }

    console.log("Perfil final:", perfil);

    // ==============================
    // Llenar formulario
    // ==============================

    document.getElementById("nombre").value =
        `${perfil.nombre ?? ""} ${perfil.apellido ?? ""}`.trim();

    document.getElementById("correo").value =
        user.email ?? "";

    document.getElementById("telefono").value =
        perfil.telefono ?? "";

    document.getElementById("ciudad").value =
        perfil.ciudad ?? "";

    document.getElementById("colegio").value =
        perfil.colegio_interes ?? "";

});
