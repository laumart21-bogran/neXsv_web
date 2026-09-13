/**
 * ==========================================================
 * neXsv Platform v2
 * ProfileService
 * Servicio único para la gestión de perfiles
 * ==========================================================
 */

import { supabase } from "../core/supabase-client.js";

class ProfileService {
    async createProfile({ authUserId, nombre, apellido }) {
        return await supabase.from("profiles").insert({ auth_user_id: authUserId, nombre, apellido }).select().single();
    }

    async getProfile(authUserId) {
        return await supabase.from("profiles").select("*").eq("auth_user_id", authUserId).single();
    }

    async getPublicProfile(authUserId) {
        const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: authUserId });
        if (error) return { data: null, error };
        const profile = Array.isArray(data) ? data[0] : data;
        if (!profile) return { data: null, error: null };
        return { data: profile, error: null };
    }

    async updateProfile(authUserId, profileData) {
        return await supabase.from("profiles").update(profileData).eq("auth_user_id", authUserId).select().single();
    }

    async uploadProfilePhoto(authUserId, file) {
        const extension = file.name.split(".").pop();
        const fileName = `${authUserId}/${authUserId}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("profiles").upload(fileName, file, { upsert: true });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("profiles").getPublicUrl(fileName);
        await this.updateProfile(authUserId, { foto: data.publicUrl });
        return data.publicUrl;
    }
}

export default new ProfileService();
