import { supabase } from "./core/supabase-client.js";
import ProfileService from "./services/profile.service.js";

console.log("Profile.js cargado correctamente");

document.addEventListener("DOMContentLoaded", async () => {

    const {
        data: { user }
    } = await supabase.auth.getUser();

    console.log("Usuario:", user);

    const { data, error } = await ProfileService.getProfile(user.id);

    console.log("Perfil:", data);
    console.log("Error:", error);

});
