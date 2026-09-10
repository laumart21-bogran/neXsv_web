import { supabase } from "../core/supabase-client.js";

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
                businesses (
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
                    estado
                )
            `)
            .order("created_at", { ascending: false });

        return { data: data || [], error };
    }
}

export default new AdminService();
