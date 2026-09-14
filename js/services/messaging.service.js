import { supabase } from "../core/supabase-client.js";

class MessagingService {
    async getOrCreateDirectConversation(otherUserId) {
        const { data, error } = await supabase.rpc("get_or_create_direct_conversation", { other_user_id: otherUserId });
        return { data, error };
    }

    async getOtherParticipant(conversationId, currentUserId) {
        const { data, error } = await supabase.rpc("get_other_conversation_participant", {
            p_conversation_id: conversationId
        });
        if (!error && data?.length) return { data, error: null };

        const { data: participantRows, error: participantError } = await supabase
            .from("conversation_participants")
            .select("user_id")
            .eq("conversation_id", conversationId)
            .neq("user_id", currentUserId)
            .limit(1);
        if (!participantError && participantRows?.length) return { data: participantRows, error: null };

        // En conversaciones iniciadas desde una publicación, el autor de la publicación
        // es el interlocutor aunque todavía no haya enviado ningún mensaje.
        const { data: conversation } = await supabase
            .from("conversations")
            .select("origin_publication_id")
            .eq("id", conversationId)
            .maybeSingle();

        if (conversation?.origin_publication_id) {
            const { data: publication } = await supabase
                .from("community_publications")
                .select("author_id")
                .eq("id", conversation.origin_publication_id)
                .maybeSingle();
            if (publication?.author_id && String(publication.author_id) !== String(currentUserId)) {
                return { data: [{ user_id: publication.author_id }], error: null };
            }
        }

        // Último respaldo para conversaciones antiguas que ya contienen mensajes del otro usuario.
        const { data: messages, error: messagesError } = await supabase
            .from("messages")
            .select("sender_id")
            .eq("conversation_id", conversationId)
            .neq("sender_id", currentUserId)
            .limit(1);

        if (messagesError) return { data: [], error: messagesError };
        const otherUserId = messages?.[0]?.sender_id || null;
        return { data: otherUserId ? [{ user_id: otherUserId }] : [], error: null };
    }

    async getMyConversations() {
        const { data, error } = await supabase.from("conversation_participants").select(`conversation_id,last_read_at,conversations(id,conversation_type,origin_publication_id,created_at,updated_at)`).eq("user_id", (await supabase.auth.getUser()).data.user?.id).order("created_at", { ascending: false });
        return { data: data || [], error };
    }

    async getUnreadCount() {
        const { data, error } = await supabase.rpc("get_my_unread_message_count");
        return { data: Number(data || 0), error };
    }

    async getMessages(conversationId) {
        const { data, error } = await supabase.from("messages").select("id, conversation_id, sender_id, body, created_at, edited_at, deleted_at").eq("conversation_id", conversationId).order("created_at", { ascending: true });
        return { data: data || [], error };
    }

    async sendMessage(conversationId, body) {
        const text = String(body || "").trim();
        if (!text) return { data: null, error: new Error("El mensaje no puede estar vacío.") };
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: null, error: new Error("Usuario no autenticado.") };
        const { data, error } = await supabase.from("messages").insert([{ conversation_id: conversationId, sender_id: userId, body: text }]).select().single();
        if (!error) await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
        return { data, error };
    }

    async markConversationRead(conversationId) {
        const { data: userResult } = await supabase.auth.getUser();
        const userId = userResult?.user?.id;
        if (!userId) return { data: null, error: new Error("Usuario no autenticado.") };
        const { data, error } = await supabase.from("conversation_participants").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conversationId).eq("user_id", userId).select().single();
        return { data, error };
    }

    async subscribeToMessages(conversationId, callback) {
        return supabase.channel(`messages:${conversationId}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, payload => callback(payload.new)).subscribe();
    }

    async unsubscribe(channel) { if (channel) await supabase.removeChannel(channel); }
}

export default new MessagingService();
