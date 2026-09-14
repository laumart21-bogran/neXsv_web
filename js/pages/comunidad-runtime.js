/* neXsv — compatibilidad de RPC para Comunidad
 * Evita que una llamada RPC opcional de métricas pueda detener
 * la carga completa de publicaciones si Supabase devuelve un
 * PostgrestFilterBuilder sin .catch().
 */
import { supabase } from "../core/supabase-client.js";

const originalRpc = supabase.rpc.bind(supabase);

supabase.rpc = function rpcWithSafeViewHandling(functionName, args, options) {
    const result = originalRpc(functionName, args, options);

    if (functionName === "record_community_publication_view") {
        return Promise.resolve(result);
    }

    return result;
};
