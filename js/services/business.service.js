import { supabase } from "../core/supabase-client.js";

class BusinessService {

    // =====================================================
    // OBTENER UN NEGOCIO DEL PROPIETARIO
    // Método utilizado actualmente por el dashboard existente
    // =====================================================

    async getBusinessByOwner(ownerId) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("owner_id", ownerId)
            .maybeSingle();

        return {
            data,
            error
        };
    }


    // =====================================================
    // OBTENER TODOS LOS NEGOCIOS DEL PROPIETARIO
    // Nuevo método para la arquitectura de múltiples negocios
    // =====================================================

    async getBusinessesByOwner(ownerId) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("owner_id", ownerId)
            .order("created_at", { ascending: false });

        return {
            data: data || [],
            error
        };
    }


    // =====================================================
    // CREAR NEGOCIO
    // =====================================================

    async createBusiness(businessData) {

        const { data, error } = await supabase
            .from("businesses")
            .insert([businessData])
            .select()
            .single();

        return {
            data,
            error
        };
    }

}


export default new BusinessService();
