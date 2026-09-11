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


    // =====================================================
    // ACTUALIZAR UNA SOLICITUD DESDE EL FLUJO DE CORRECCIÓN
    // =====================================================

    async resubmitCorrection(requestId) {

        const { data, error } = await supabase
            .from("business_requests")
            .update({
                estado: "PENDIENTE",
                reviewed_at: null,
                reviewed_by: null
            })
            .eq("id", requestId)
            .select()
            .single();

        return {
            data,
            error
        };
    }

}


export default new BusinessRequestService();
