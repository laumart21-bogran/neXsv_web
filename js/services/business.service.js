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
    // OBTENER UN NEGOCIO POR ID
    // =====================================================

    async getBusinessById(businessId) {

        const { data, error } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", businessId)
            .single();

        return {
            data,
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


    // =====================================================
    // ACTUALIZAR NEGOCIO
    // =====================================================

    async updateBusiness(businessId, businessData) {

        const { data, error } = await supabase
            .from("businesses")
            .update(businessData)
            .eq("id", businessId)
            .select()
            .single();

        return {
            data,
            error
        };
    }

}


export default new BusinessService();
