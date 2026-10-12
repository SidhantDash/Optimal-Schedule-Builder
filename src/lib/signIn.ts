import { supabase } from "~/supabase/client";

/**
 * Signs in with the member's DevDogs account. DogDays' own Supabase project
 * registers the platform's OAuth server as the `custom:devdogsuga` provider, so
 * this works the same on a contributor's machine, on staging and in production.
 */
export default async function signIn() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "custom:devdogsuga",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });

  if (error) {
    console.error("signInWithOAuth error:", error);
  }
}
