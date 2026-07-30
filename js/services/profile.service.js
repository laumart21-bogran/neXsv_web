/**
 * ==========================================================
 * neXsv Platform v2
 * ProfileService
 * Servicio único para la gestión de perfiles
 * ==========================================================
 */

import { supabase } from "../core/supabase-client.js";

class ProfileService {

    /**
     * Crear perfil
     */
    async createProfile(profileData) {

        return await supabase
            .from("profiles")
            .insert(profileData)
            .select()
            .single();

    }

    /**
     * Obtener perfil
     */
    async getProfile(authUserId) {

        return await supabase
            .from("profiles")
            .select("*")
            .eq("auth_user_id", authUserId)
            .single();

    }

    /**
     * Actualizar perfil
     */
    async updateProfile(authUserId, profileData) {

        return await supabase
            .from("profiles")
            .update(profileData)
            .eq("auth_user_id", authUserId)
            .select()
            .single();

    }

}

export default new ProfileService();
