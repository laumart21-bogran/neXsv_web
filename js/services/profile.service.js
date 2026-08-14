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
async createProfile({

    authUserId,
    nombre,
    apellido

}) {

    return await supabase
        .from("profiles")
        .insert({

            auth_user_id: authUserId,
            nombre,
            apellido

        })
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

/**
 * ==========================================================
 * Subir fotografía de perfil
 * ==========================================================
 */
async uploadProfilePhoto(authUserId, file) {

    const extension = file.name.split(".").pop();

    const fileName = `${authUserId}.${extension}`;

    const { error: uploadError } = await supabase.storage
        .from("profiles")
        .upload(fileName, file, {
            upsert: true
        });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from("profiles")
        .getPublicUrl(fileName);

    await this.updateProfile(authUserId, {
        fotografia_url: data.publicUrl
    });

    return data.publicUrl;

}

}

export default new ProfileService();

