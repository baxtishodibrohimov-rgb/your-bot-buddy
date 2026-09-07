import type { CliniccardsAdapter } from "./types.ts";
import { MockCliniccardsAdapter } from "./mock-provider.ts";
import { HttpCliniccardsAdapter } from "./http-provider.ts";

/**
 * Returns the Cliniccards adapter to use. Real credentials (CLINICCARDS_API_URL
 * + CLINICCARDS_API_KEY, set via `supabase secrets set`) switch this to the
 * HTTP adapter automatically. Set CLINICCARDS_MODE=mock to force mock data
 * even if credentials are present (useful for demos/staging).
 */
export function getCliniccardsAdapter(): CliniccardsAdapter {
  const mode = (Deno.env.get("CLINICCARDS_MODE") || "").toLowerCase();
  const hasCreds = !!Deno.env.get("CLINICCARDS_API_URL") && !!Deno.env.get("CLINICCARDS_API_KEY");

  if (mode === "mock" || (!hasCreds && mode !== "http")) {
    return new MockCliniccardsAdapter();
  }
  return new HttpCliniccardsAdapter();
}
