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

    async getGoalsByBusiness(businessId) {
        const { data, error } = await supabase
            .from("business_goals")
            .select("goal_id")
            .eq("business_id", businessId);

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

    async replaceGoals(businessId, goalIds) {
        const { error: deleteError } = await supabase
            .from("business_goals")
            .delete()
            .eq("business_id", businessId);

        if (deleteError) return { data: [], error: deleteError };

        return this.addGoals(businessId, goalIds);
    }
}

export default new BusinessGoalService();
