import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";

export function createSupabaseServerClient() {
  const config = getSupabaseConfig();

  if (!config.enabled || !config.url || !config.key) {
    return null;
  }

  return createClient(config.url, config.key, {
    auth: {
      persistSession: false,
    },
  });
}
