import { supabase } from "../core/supabase-client.js";

class BusinessService {

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

}

export default new BusinessService();
