import { supabase } from "./core/supabase-client.js";
import ProfileService from "./services/profile.service.js";

console.log("Profile.js cargado correctamente");

document.addEventListener("DOMContentLoaded", async () => {

    const { data: { user } } = await supabase.auth.getUser();

    console.log("Usuario:", user);

});
