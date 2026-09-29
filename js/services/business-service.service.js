import { supabase } from "../core/supabase-client.js";

class BusinessServiceCatalog {
    async getOwnerServices(businessId) {
        const { data, error } = await supabase
            .from("business_services")
            .select("id, business_id, nombre, descripcion, precio, precio_tipo, activo, orden, created_at, updated_at")
            .eq("business_id", businessId)
            .order("orden", { ascending: true })
            .order("created_at", { ascending: true });
        return { data: data || [], error };
    }

    async createService(serviceData) {
        const { data, error } = await supabase
            .from("business_services")
            .insert([serviceData])
            .select()
            .single();
        return { data, error };
    }

    async updateService(serviceId, serviceData) {
        const { data, error } = await supabase
            .from("business_services")
            .update({ ...serviceData, updated_at: new Date().toISOString() })
            .eq("id", serviceId)
            .select()
            .single();
        return { data, error };
    }

    async deleteService(serviceId) {
        const { error } = await supabase
            .from("business_services")
            .delete()
            .eq("id", serviceId);
        return { error };
    }

    async getPublicServices(businessId) {
        const { data, error } = await supabase
            .from("business_services")
            .select("id, business_id, nombre, descripcion, precio, precio_tipo, orden")
            .eq("business_id", businessId)
            .eq("activo", true)
            .order("orden", { ascending: true })
            .order("created_at", { ascending: true });
        return { data: data || [], error };
    }
}

export default new BusinessServiceCatalog();
