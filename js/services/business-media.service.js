import { supabase } from "../core/supabase-client.js";

const BUCKET = "business-media";
const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

class BusinessMediaService {
    validateFiles(files = []) {
        const selected = Array.from(files || []);
        for (const file of selected) {
            if (!ALLOWED_TYPES.includes(file.type)) return { valid: false, error: "Solo se permiten imágenes JPG, PNG o WebP." };
            if (file.size > MAX_SIZE) return { valid: false, error: "Cada imagen debe pesar máximo 5 MB." };
        }
        return { valid: true, files: selected };
    }

    async getBusinessMedia(businessId) {
        const { data, error } = await supabase
            .from("business_media")
            .select("id, business_id, tipo, storage_path, public_url, created_at")
            .eq("business_id", businessId)
            .eq("owner_id", (await supabase.auth.getUser()).data.user?.id)
            .order("created_at", { ascending: false });
        if (error) return { data: [], error };

        const rows = [];
        for (const item of data || []) {
            const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(item.storage_path, 3600);
            rows.push({ ...item, url: signedError ? null : signed?.signedUrl });
        }
        return { data: rows, error: null };
    }

    async uploadBusinessMedia(businessId, files = [], tipo = "FOTO") {
        const validation = this.validateFiles(files);
        if (!validation.valid) return { data: [], error: new Error(validation.error) };
        if (!validation.files.length) return { data: [], error: null };

        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: [], error: new Error("Usuario no autenticado.") };

        const uploaded = [];
        try {
            for (const file of validation.files) {
                const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
                const storagePath = `${userId}/${businessId}/${crypto.randomUUID()}.${extension}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false });
                if (uploadError) throw uploadError;
                const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
                const { data: row, error: rowError } = await supabase.from("business_media").insert({ business_id: businessId, owner_id: userId, tipo, storage_path: storagePath, public_url: signed?.signedUrl || "" }).select().single();
                if (rowError) throw rowError;
                uploaded.push({ ...row, url: signed?.signedUrl || null });
            }
            return { data: uploaded, error: null };
        } catch (error) {
            if (uploaded.length) await supabase.from("business_media").delete().in("id", uploaded.map(item => item.id));
            return { data: [], error };
        }
    }

    async deleteBusinessMedia(media) {
        if (!media?.id || !media?.storage_path) return { error: new Error("Material no válido.") };
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        const { error } = await supabase.from("business_media").delete().eq("id", media.id).eq("owner_id", userId);
        if (error) return { error };
        await supabase.storage.from(BUCKET).remove([media.storage_path]);
        return { error: null };
    }
}

export default new BusinessMediaService();
