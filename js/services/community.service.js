import { supabase } from "../core/supabase-client.js";

class CommunityService {

    async getPublications({ type = "TODAS", limit = 30 } = {}) {
        let query = supabase
            .from("community_publications")
            .select("id, author_id, type, title, body, status, created_at, updated_at")
            .eq("status", "PUBLICADA")
            .order("created_at", { ascending: false })
            .limit(limit);

        if (type && type !== "TODAS") query = query.eq("type", type);

        const { data, error } = await query;
        return { data: data || [], error };
    }

    async getPublicationById(publicationId) {
        const { data, error } = await supabase
            .from("community_publications")
            .select("id, author_id, type, title, body, status, created_at, updated_at")
            .eq("id", publicationId)
            .single();

        return { data, error };
    }

    async createPublication({ type, title = null, body }) {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;

        if (!userId) {
            return { data: null, error: new Error("Usuario no autenticado.") };
        }

        const cleanBody = String(body || "").trim();
        if (!cleanBody) {
            return { data: null, error: new Error("La publicación no puede estar vacía.") };
        }

        const { data, error } = await supabase
            .from("community_publications")
            .insert({
                author_id: userId,
                type,
                title: title ? String(title).trim() : null,
                body: cleanBody,
                status: "PUBLICADA"
            })
            .select()
            .single();

        return { data, error };
    }

    async deletePublication(publicationId) {
        const { data, error } = await supabase
            .from("community_publications")
            .update({ status: "ELIMINADA", updated_at: new Date().toISOString() })
            .eq("id", publicationId)
            .eq("author_id", (await supabase.auth.getUser()).data.user?.id)
            .select()
            .single();

        return { data, error };
    }

    async setConversationOrigin(conversationId, publicationId) {
        const { data, error } = await supabase
            .from("conversations")
            .update({ origin_publication_id: publicationId, updated_at: new Date().toISOString() })
            .eq("id", conversationId)
            .select()
            .single();

        return { data, error };
    }

}

export default new CommunityService();
