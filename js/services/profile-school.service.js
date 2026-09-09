import { supabase } from "../core/supabase-client.js";

class ProfileSchoolService {

    async getSchools() {
        const { data, error } = await supabase
            .from("schools")
            .select("id, nombre")
            .eq("activo", true)
            .order("nombre");

        return { data: data || [], error };
    }

    async getProfileByAuthUser(authUserId) {
        const { data, error } = await supabase
            .from("profiles")
            .select("id")
            .eq("auth_user_id", authUserId)
            .single();

        return { data, error };
    }

    async addSchools(profileId, schoolIds) {
        if (!schoolIds.length) {
            return { data: [], error: null };
        }

        const rows = schoolIds.map((schoolId) => ({
            profile_id: profileId,
            school_id: schoolId
        }));

        const { data, error } = await supabase
            .from("profile_schools")
            .upsert(rows, {
                onConflict: "profile_id,school_id",
                ignoreDuplicates: true
            })
            .select();

        return { data: data || [], error };
    }
}

export default new ProfileSchoolService();
