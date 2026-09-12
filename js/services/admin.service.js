import { supabase } from "../core/supabase-client.js";

const BUSINESS_FIELDS = `
    id,
    nombre,
    categoria,
    descripcion,
    tipo_oferta,
    etapa_negocio,
    departamento,
    municipio,
    whatsapp,
    email,
    sitio_web,
    google_maps_url,
    instagram,
    facebook,
    tiktok,
    otra_red_social,
    otro_objetivo,
    logo,
    estado,
    fecha_activacion,
    fecha_vencimiento
`;

class AdminService {
    async isAdmin(userId) {
        const { data, error } = await supabase
            .from("admin_users")
            .select("user_id")
            .eq("user_id", userId)
            .eq("activo", true)
            .maybeSingle();

        return { isAdmin: !!data, error };
    }

    async getIncorporationRequests() {
        const { data, error } = await supabase
            .from("business_requests")
            .select(`
                id,
                estado,
                observaciones,
                created_at,
                reviewed_at,
                business_id,
                user_id,
                businesses (${BUSINESS_FIELDS})
            `)
            .order("created_at", { ascending: false });

        return { data: data || [], error };
    }

    async getIncorporationRequestById(requestId) {
        const { data, error } = await supabase
            .from("business_requests")
            .select(`
                id,
                estado,
                observaciones,
                created_at,
                reviewed_at,
                business_id,
                user_id,
                businesses (${BUSINESS_FIELDS})
            `)
            .eq("id", requestId)
            .maybeSingle();

        return { data, error };
    }

    async updateRequestStatus(requestId, status, observation, reviewerId) {
        const payload = {
            estado: status,
            observaciones: observation || null,
            reviewed_at: new Date().toISOString(),
            reviewed_by: reviewerId
        };

        const { data, error } = await supabase
            .from("business_requests")
            .update(payload)
            .eq("id", requestId)
            .select("id, estado, observaciones, reviewed_at, reviewed_by")
            .single();

        return { data, error };
    }
}

export default new AdminService();
