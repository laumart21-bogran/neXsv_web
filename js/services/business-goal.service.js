import { supabase } from "../core/supabase-client.js";

class BusinessGoalService {

    async getGoals() {
        const { data, error } = await supabase
            .from("business_goals_catalog")
            .select("id, nombre")
            .eq("activo", true)
            .order("nombre");

        return { data: data || [], error };
    }

    async addGoals(businessId, goalIds) {
        if (!businessId || !Array.isArray(goalIds) || goalIds.length === 0) {
            return { data: [], error: null };
        }

        const rows = goalIds.map((goalId) => ({
            business_id: businessId,
            goal_id: goalId
        }));

        const { data, error } = await supabase
            .from("business_goals")
            .insert(rows)
            .select();

        return { data: data || [], error };
    }
}

export default new BusinessGoalService();
