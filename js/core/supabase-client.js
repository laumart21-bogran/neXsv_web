/**
 * ==========================================================
 * Cliente único de Supabase
 * ==========================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { APP_CONFIG } from "./config.js";

export const supabase = createClient(

    APP_CONFIG.supabase.url,

    APP_CONFIG.supabase.anonKey

);
