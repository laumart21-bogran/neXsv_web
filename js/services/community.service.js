import { supabase } from "../core/supabase-client.js";

const COMMUNITY_BUCKET = "community";
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

class CommunityService {
    async getPublications({ type = "TODAS", limit = 30, authorId = null, excludeAuthorId = null, businessId = null } = {}) {
        let query = supabase.from("community_publications").select("id, author_id, business_id, type, title, body, status, created_at, updated_at").eq("status", "PUBLICADA").order("created_at", { ascending: false }).limit(limit);
        if (type && type !== "TODAS") query = query.eq("type", type);
        if (authorId) query = query.eq("author_id", authorId);
        if (excludeAuthorId) query = query.neq("author_id", excludeAuthorId);
        if (businessId) query = query.eq("business_id", businessId);
        const { data, error } = await query;
        if (error) return { data: [], error };
        if (!data?.length) return { data: [], error: null };
        const { data: images, error: imagesError } = await supabase.from("community_publication_images").select("id, publication_id, storage_path, public_url, sort_order").in("publication_id", data.map(item => item.id)).order("sort_order", { ascending: true });
        if (imagesError) return { data: data.map(item => ({ ...item, images: [] })), error: null };
        const imagesByPublication = new Map();
        (images || []).forEach(image => { if (!imagesByPublication.has(image.publication_id)) imagesByPublication.set(image.publication_id, []); imagesByPublication.get(image.publication_id).push(image); });
        return { data: data.map(item => ({ ...item, images: imagesByPublication.get(item.id) || [] })), error: null };
    }

    async getPublicationById(publicationId) {
        const { data, error } = await supabase.from("community_publications").select("id, author_id, business_id, type, title, body, status, created_at, updated_at").eq("id", publicationId).single();
        if (error || !data) return { data, error };
        const { data: images } = await supabase.from("community_publication_images").select("id, publication_id, storage_path, public_url, sort_order").eq("publication_id", publicationId).order("sort_order", { ascending: true });
        return { data: { ...data, images: images || [] }, error: null };
    }

    async getComments(publicationId, limit = 50) {
        const { data, error } = await supabase.from("community_publication_comments").select("id, publication_id, author_id, parent_id, body, status, created_at, updated_at").eq("publication_id", publicationId).eq("status", "PUBLICADO").order("created_at", { ascending: true }).limit(limit);
        return { data: data || [], error };
    }

    async getCommentCounts(publicationIds = []) {
        const ids = [...new Set((publicationIds || []).filter(Boolean))];
        if (!ids.length) return { data: {}, error: null };
        const { data, error } = await supabase.from("community_publication_comments").select("publication_id").in("publication_id", ids).eq("status", "PUBLICADO");
        if (error) return { data: {}, error };
        const counts = {};
        (data || []).forEach(row => { counts[row.publication_id] = (counts[row.publication_id] || 0) + 1; });
        return { data: counts, error: null };
    }

    async addComment(publicationId, body, parentId = null) {
        const cleanBody = String(body || "").trim();
        if (!cleanBody) return { data: null, error: new Error("Escribe un comentario.") };
        if (cleanBody.length > 1000) return { data: null, error: new Error("El comentario no puede superar 1000 caracteres.") };
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: null, error: new Error("Usuario no autenticado.") };
        return await supabase.from("community_publication_comments").insert({ publication_id: publicationId, author_id: userId, parent_id: parentId || null, body: cleanBody, status: "PUBLICADO" }).select().single();
    }

    async getPublicAuthorProfile(userId) {
        const fallback = { name: "Miembro neXsv", photo: null };
        if (!userId) return fallback;
        const { data, error } = await supabase.rpc("get_public_profile", { p_user_id: userId });
        if (error) { console.warn("No se pudo obtener el perfil público del autor:", error); return fallback; }
        const profile = Array.isArray(data) ? data[0] : data;
        if (!profile) return fallback;
        return { name: [profile.nombre, profile.apellido].filter(Boolean).join(" ").trim() || "Miembro neXsv", photo: profile.foto || null };
    }

    async createPublication({ type, title = null, body, businessId = null }) {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: null, error: new Error("Usuario no autenticado.") };
        const cleanBody = String(body || "").trim();
        if (!cleanBody) return { data: null, error: new Error("La publicación no puede estar vacía.") };
        return await supabase.from("community_publications").insert({ author_id: userId, business_id: businessId || null, type, title: title ? String(title).trim() : null, body: cleanBody, status: "PUBLICADA" }).select().single();
    }

    async updatePublication(publicationId, { type, title = null, body, businessId = null }) {
        const cleanBody = String(body || "").trim();
        if (!cleanBody) return { data: null, error: new Error("La publicación no puede estar vacía.") };
        if (!type) return { data: null, error: new Error("Selecciona un tipo de publicación.") };
        return await supabase.from("community_publications").update({ type, title: title ? String(title).trim() : null, business_id: businessId || null, updated_at: new Date().toISOString() }).eq("id", publicationId).eq("author_id", (await supabase.auth.getUser()).data.user?.id).select().single();
    }

    validateImages(files = []) {
        const selected = Array.from(files || []);
        if (selected.length > MAX_IMAGES) return { valid: false, error: `Puedes agregar máximo ${MAX_IMAGES} fotos por publicación.` };
        for (const file of selected) { if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: "Solo se permiten imágenes JPG, PNG o WebP." }; if (file.size > MAX_IMAGE_SIZE) return { valid: false, error: "Cada foto debe pesar máximo 5 MB." }; }
        return { valid: true, files: selected };
    }

    async uploadPublicationImages(publicationId, files = []) {
        const validation = this.validateImages(files);
        if (!validation.valid) return { data: [], error: new Error(validation.error) };
        if (!validation.files.length) return { data: [], error: null };
        const { data: userResult } = await supabase.auth.getUser(); const userId = userResult?.user?.id;
        if (!userId) return { data: [], error: new Error("Usuario no autenticado.") };
        const uploadedPaths = []; const insertedRows = [];
        try {
            for (let index = 0; index < validation.files.length; index++) {
                const file = validation.files[index]; const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg"; const storagePath = `${userId}/${publicationId}/${crypto.randomUUID()}.${extension}`;
                const { error: uploadError } = await supabase.storage.from(COMMUNITY_BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false }); if (uploadError) throw uploadError; uploadedPaths.push(storagePath);
                const { data: imageRow, error: rowError } = await supabase.from("community_publication_images").insert({ publication_id: publicationId, storage_path: storagePath, public_url: supabase.storage.from(COMMUNITY_BUCKET).getPublicUrl(storagePath).data.publicUrl, sort_order: index + 1 }).select().single(); if (rowError) throw rowError; insertedRows.push(imageRow);
            }
            return { data: insertedRows, error: null };
        } catch (error) { if (insertedRows.length) await supabase.from("community_publication_images").delete().eq("publication_id", publicationId); if (uploadedPaths.length) await supabase.storage.from(COMMUNITY_BUCKET).remove(uploadedPaths); return { data: [], error }; }
    }

    async deletePublication(publicationId) {
        const { data: userResult } = await supabase.auth.getUser(); const userId = userResult?.user?.id;
        const { data: images } = await supabase.from("community_publication_images").select("storage_path").eq("publication_id", publicationId); if (images?.length) await supabase.storage.from(COMMUNITY_BUCKET).remove(images.map(item => item.storage_path));
        return await supabase.from("community_publications").update({ status: "ELIMINADA", updated_at: new Date().toISOString() }).eq("id", publicationId).eq("author_id", userId).select().single();
    }

    async setConversationOrigin(conversationId, publicationId) { return await supabase.from("conversations").update({ origin_publication_id: publicationId, updated_at: new Date().toISOString() }).eq("id", conversationId).select().single(); }
}

export default new CommunityService();
