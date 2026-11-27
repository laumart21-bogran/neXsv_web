import { supabase } from "../core/supabase-client.js";

class BusinessService {

    // =====================================================
    // DIRECTORIO PÚBLICO
    // Solo devuelve información básica de negocios publicados.
    // No expone datos de contacto, ubicación ni propietario.
    // =====================================================

    async getPublicBusinessDirectory() {

        const { data, error } = await supabase
            .rpc("get_public_business_directory");

        return {
            data: data || [],
            error
        };
    }

    // =====================================================
    // DETALLE PÚBLICO
    // =====================================================

    async getPublicBusinessDetail(businessId) {
        const { data, error } = await supabase.rpc("get_public_business_detail", {
            p_business_id: businessId
        });
        return {
            data,
            error
        };
    }

    async createBusinessReview({ businessId, estrellas, comentario }) {
        const cleanComment = String(comentario || "").trim();
        const rating = Number(estrellas);
        if (!businessId) return { data: null, error: new Error("Negocio no válido.") };
        if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { data: null, error: new Error("Selecciona una calificación válida.") };
        if (!cleanComment || cleanComment.length > 1200) return { data: null, error: new Error("Escribe un comentario de hasta 1200 caracteres.") };
        const { data: userResult, error: authError } = await supabase.auth.getUser();
        if (authError || !userResult?.user) return { data: null, error: new Error("Usuario no autenticado.") };
        return await supabase.rpc("create_business_review_with_publication", {
            p_business_id: businessId,
            p_stars: rating,
            p_comment: cleanComment
        });
    }

    async getPublicBusinessReviews(businessId) {
        const { data, error } = await supabase
            .from("business_reviews")
            .select("id, business_id, nombre, estrellas, comentario, created_at")
            .eq("business_id", businessId)
            .order("created_at", { ascending: true });

        return {
            data: data || [],
            error
        };
    }

    // =====================================================
    // DETALLE PARA MIEMBROS AUTENTICADOS
    // El RPC controla qué datos comerciales puede recibir un miembro.
    // =====================================================

    async getBusinessManagementInvite(token) {
        const { data, error } = await supabase.rpc("get_business_management_invite", {
            p_token: token
        });
        return { data, error };
    }

    async getMyBusinessManagementInvites() {
        const { data, error } = await supabase.rpc("get_my_business_management_invites");
        return { data: data || [], error };
    }

    async acceptBusinessManagementInvite(token) {
        const { data, error } = await supabase.rpc("accept_business_management_invite", {
            p_token: token
        });
        return { data, error };
    }

    // =====================================================
    // DETALLE PARA MIEMBROS AUTENTICADOS
    // El RPC controla qué datos comerciales puede recibir un miembro.
    // =====================================================

    async isBusinessOwner(businessId) {
        const { data, error } = await supabase.rpc("is_business_owner", {
            p_business_id: businessId
        });
        return { data: data === true, error };
    }

    // =====================================================
    // DETALLE PARA MIEMBROS AUTENTICADOS
    // El RPC controla qué datos comerciales puede recibir un miembro.
    // =====================================================

    async getAuthenticatedBusinessDetail(businessId) {

        const { data, error } = await supabase
            .rpc("get_authenticated_business_detail", {
                p_business_id: businessId
            });

        return {
            data,
            error
        };
    }

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
