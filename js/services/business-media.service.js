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

    async getPublicBusinessMedia(businessId) {
        const { data, error } = await supabase.from("business_media").select("id, business_id, tipo, storage_path, public_url, created_at").eq("business_id", businessId).order("created_at", { ascending: true });
        if (error) return { data: [], error };
        const rows = [];
        for (const item of data || []) {
            const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrl(item.storage_path, 3600);
            rows.push({ ...item, url: signedError ? null : signed?.signedUrl });
        }
        return { data: rows.filter(item => item.url), error: null };
    }

    async getPublicBusinessMedia(businessId) {
        const { data, error } = await supabase
            .from("business_media")
            .select("id, business_id, tipo, slot, storage_path, public_url, created_at")
            .eq("business_id", businessId)
            .in("slot", [2, 3])
            .order("slot", { ascending: true });

        if (error) return { data: [], error };

        const items = (data || []).filter(item => item.storage_path);
        if (!items.length) return { data: [], error: null };

        // Supabase permite generar varias URLs firmadas en una sola llamada.
        // Esto evita una petición de Storage por cada fotografía.
        const { data: signedUrls, error: signedError } = await supabase
            .storage
            .from(BUCKET)
            .createSignedUrls(items.map(item => item.storage_path), 3600);

        if (signedError) return { data: [], error: signedError };

        const urlByPath = new Map(
            (signedUrls || []).map(item => [item.path, item.signedUrl])
        );

        return {
            data: items
                .map(item => ({ ...item, url: urlByPath.get(item.storage_path) || null }))
                .filter(item => item.url),
            error: null
        };
    }

    async getPresentationMedia(businessId) {
        const { data, error } = await supabase
            .from("business_media")
            .select("id, business_id, owner_id, tipo, slot, storage_path, public_url, created_at")
            .eq("business_id", businessId)
            .in("slot", [2, 3])
            .order("slot", { ascending: true });
        if (error) return { data: [], error };
        const items = (data || []).filter(item => item.storage_path);
        if (!items.length) return { data: [], error: null };
        const { data: signedUrls, error: signedError } = await supabase.storage.from(BUCKET).createSignedUrls(items.map(item => item.storage_path), 3600);
        if (signedError) return { data: [], error: signedError };
        const urlByPath = new Map((signedUrls || []).map(item => [item.path, item.signedUrl]));
        return { data: items.map(item => ({ ...item, url: urlByPath.get(item.storage_path) || null })).filter(item => item.url), error: null };
    }

    async replacePresentationImage(businessId, slot, file) {
        if (![2, 3].includes(Number(slot))) return { data: null, error: new Error("Slot de presentación no válido.") };
        const validation = this.validateFiles([file]);
        if (!validation.valid) return { data: null, error: new Error(validation.error) };
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: null, error: new Error("Usuario no autenticado.") };
        const { data: existing, error: existingError } = await supabase.from("business_media").select("id, storage_path").eq("business_id", businessId).eq("slot", Number(slot)).maybeSingle();
        if (existingError) return { data: null, error: existingError };
        const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const storagePath = userId + "/" + businessId + "/presentation-" + slot + "-" + crypto.randomUUID() + "." + extension;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) return { data: null, error: uploadError };
        const { data: row, error: rowError } = await supabase.from("business_media").insert({ business_id: businessId, owner_id: userId, tipo: "FOTO", slot: Number(slot), storage_path: storagePath, public_url: "" }).select().single();
        if (rowError) {
            await supabase.storage.from(BUCKET).remove([storagePath]);
            return { data: null, error: rowError };
        }
        if (existing) {
            await supabase.from("business_media").delete().eq("id", existing.id);
            if (existing.storage_path) await supabase.storage.from(BUCKET).remove([existing.storage_path]);
        }
        const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
        return { data: { ...row, url: signed?.signedUrl || null }, error: null };
    }

    async getBusinessMedia(businessId) {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: [], error: new Error("Usuario no autenticado.") };
        const { data: ownedBusiness, error: ownerError } = await supabase
            .from("businesses")
            .select("id")
            .eq("id", businessId)
            .eq("owner_id", userId)
            .maybeSingle();

        if (ownerError) return { data: [], error: ownerError };

        let mediaQuery = supabase
            .from("business_media")
            .select("id, business_id, tipo, storage_path, public_url, created_at")
            .eq("business_id", businessId);

        if (!ownedBusiness) mediaQuery = mediaQuery.eq("owner_id", userId);

        const { data, error } = await mediaQuery.order("created_at", { ascending: false });
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
        const uploaded = [], uploadedPaths = [];
        try {
            for (const file of validation.files) {
                const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
                const storagePath = `${userId}/${businessId}/${crypto.randomUUID()}.${extension}`;
                const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false });
                if (uploadError) throw uploadError;
                uploadedPaths.push(storagePath);
                const { data: row, error: rowError } = await supabase.from("business_media").insert({ business_id: businessId, owner_id: userId, tipo, storage_path: storagePath, public_url: "" }).select().single();
                if (rowError) throw rowError;
                const { data: signed } = await supabase.storage.from(BUCKET).createSignedUrl(storagePath, 3600);
                uploaded.push({ ...row, url: signed?.signedUrl || null });
            }
            return { data: uploaded, error: null };
        } catch (error) {
            if (uploaded.length) await supabase.from("business_media").delete().in("id", uploaded.map(item => item.id));
            if (uploadedPaths.length) await supabase.storage.from(BUCKET).remove(uploadedPaths);
            return { data: [], error };
        }
    }

    async deleteBusinessMedia(media) {
        if (!media?.id || !media?.storage_path) return { error: new Error("Material no válido.") };
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        const { error } = await supabase
            .from("business_media")
            .delete()
            .eq("id", media.id);
        if (error) return { error };
        const { error: storageError } = await supabase.storage.from(BUCKET).remove([media.storage_path]);
        return { error: storageError || null };
    }
}

export default new BusinessMediaService();
