import { supabase } from "../core/supabase-client.js";

class BusinessRequestService {

    // =====================================================
    // CREAR SOLICITUD DE INCORPORACIÓN
    // =====================================================

    async createRequest(requestData) {

        const { data, error } = await supabase
            .from("business_requests")
            .insert([requestData])
            .select()
            .single();

        return {
            data,
            error
        };
    }


    // =====================================================
    // OBTENER SOLICITUDES DEL USUARIO
    // =====================================================

    async getRequestsByUser(userId) {

        const { data, error } = await supabase
            .from("business_requests")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        return {
            data: data || [],
            error
        };
    }

}


export default new BusinessRequestService();
