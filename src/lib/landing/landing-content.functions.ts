// Server fn para SSR da landing — evita flash de copy default → copy real.
// Lê o singleton público via supabaseAdmin no servidor (sem necessidade de auth).

import { createServerFn } from "@tanstack/react-start";
import {
  DEFAULT_LANDING_CONTENT,
  mergeLandingContent,
  type LandingContent,
} from "./landing-content";

export const getLandingContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingContent> => {
    try {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      const { data, error } = await supabaseAdmin
        .from("landing_content")
        .select("content")
        .eq("singleton", true)
        .maybeSingle();
      if (error) {
        console.error("[landing.server] fetch error:", error);
        return DEFAULT_LANDING_CONTENT;
      }
      return mergeLandingContent(
        data?.content as Partial<LandingContent> | null,
      );
    } catch (e) {
      console.error("[landing.server] fetch exception:", e);
      return DEFAULT_LANDING_CONTENT;
    }
  },
);
