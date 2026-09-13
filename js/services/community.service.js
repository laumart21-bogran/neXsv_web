import { supabase } from "../core/supabase-client.js";

const COMMUNITY_BUCKET = "community";
const MAX_IMAGES = 3;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

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
        if (error) return { data: [], error };

        if (!data?.length) return { data: [], error: null };

        const ids = data.map(item => item.id);
        const { data: images, error: imagesError } = await supabase
            .from("community_publication_images")
            .select("id, publication_id, storage_path, public_url, sort_order")
            .in("publication_id", ids)
            .order("sort_order", { ascending: true });

        if (imagesError) {
            console.warn("No se pudieron cargar las imágenes de Comunidad:", imagesError);
            return { data: data.map(item => ({ ...item, images: [] })), error: null };
        }

        const imagesByPublication = new Map();
        (images || []).forEach(image => {
            if (!imagesByPublication.has(image.publication_id)) imagesByPublication.set(image.publication_id, []);
            imagesByPublication.get(image.publication_id).push(image);
        });

        return {
            data: data.map(item => ({ ...item, images: imagesByPublication.get(item.id) || [] })),
            error: null
        };
    }

    async getPublicationById(publicationId) {
        const { data, error } = await supabase
            .from("community_publications")
            .select("id, author_id, type, title, body, status, created_at, updated_at")
            .eq("id", publicationId)
            .single();

        if (error || !data) return { data, error };

        const { data: images } = await supabase
            .from("community_publication_images")
            .select("id, publication_id, storage_path, public_url, sort_order")
            .eq("publication_id", publicationId)
            .order("sort_order", { ascending: true });

        return { data: { ...data, images: images || [] }, error: null };
    }

    async createPublication({ type, title = null, body }) {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;

        if (!userId) return { data: null, error: new Error("Usuario no autenticado.") };

        const cleanBody = String(body || "").trim();
        if (!cleanBody) return { data: null, error: new Error("La publicación no puede estar vacía.") };

        const { data, error } = await supabase
            .from("community_publications")
            .insert({ author_id: userId, type, title: title ? String(title).trim() : null, body: cleanBody, status: "PUBLICADA" })
            .select()
            .single();

        return { data, error };
    }

    validateImages(files = []) {
        const selected = Array.from(files || []);
        if (selected.length > MAX_IMAGES) return { valid: false, error: `Puedes agregar máximo ${MAX_IMAGES} fotos por publicación.` };
        for (const file of selected) {
            if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: "Solo se permiten imágenes JPG, PNG o WebP." };
            if (file.size > MAX_IMAGE_SIZE) return { valid: false, error: "Cada foto debe pesar máximo 5 MB." };
        }
        return { valid: true, files: selected };
    }

    async uploadPublicationImages(publicationId, files = []) {
        const validation = this.validateImages(files);
        if (!validation.valid) return { data: [], error: new Error(validation.error) };
        if (!validation.files.length) return { data: [], error: null };

        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: [], error: new Error("Usuario no autenticado.") };

        const uploaded = [];

        try {
            for (let index = 0; index < validation.files.length; index++) {
                const file = validation.files[index];
                const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
                const storagePath = `${userId}/${publicationId}/${crypto.randomUUID()}.${extension}`;

                const { error: uploadError } = await supabase.storage
                    .from(COMMUNITY_BUCKET)
                    .upload(storagePath, file, { contentType: file.type, upsert: false });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                    .from(COMMUNITY_BUCKET)
                    .getPublicUrl(storagePath);

                const { data: imageRow, error: rowError } = await supabase
                    .from("community_publication_images")
                    .insert({
                        publication_id: publicationId,
                        storage_path: storagePath,
                        public_url: publicUrlData.publicUrl,
                        sort_order: index + 1
                    })
                    .select()
                    .single();

                if (rowError) throw rowError;
                uploaded.push(imageRow);
            }

            return { data: uploaded, error: null };
        } catch (error) {
            if (uploaded.length) {
                await supabase.from("community_publication_images").delete().eq("publication_id", publicationId);
            }
            return { data: [], error };
        }
    }

    async deletePublication(publicationId) {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        const { data: images } = await supabase
            .from("community_publication_images")
            .select("storage_path")
            .eq("publication_id", publicationId);

        if (images?.length) await supabase.storage.from(COMMUNITY_BUCKET).remove(images.map(item => item.storage_path));

        const { data, error } = await supabase
            .from("community_publications")
            .update({ status: "ELIMINADA", updated_at: new Date().toISOString() })
            .eq("id", publicationId)
            .eq("author_id", userId)
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
