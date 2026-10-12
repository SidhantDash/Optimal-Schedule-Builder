import { supabase } from "~/supabase/client";

/**
 * Moves what the member had in the old DogDays (copied into this project with
 * a `legacyUserId`) onto their account. The database function decides who the
 * member was from their DevDogs identity, never from anything sent here, and
 * is safe to call on every sign-in: a second call moves nothing.
 *
 * A failure must not stop sign-in or the local-data merge that follows, so it
 * is reported and swallowed.
 */
export async function claimLegacyData(): Promise<void> {
  try {
    const { error } = await supabase.rpc("claim_legacy_data");
    if (error)
      console.error("[claim] claim_legacy_data failed:", error.message);
  } catch (error) {
    console.error("[claim] claim_legacy_data failed:", error);
  }
}
