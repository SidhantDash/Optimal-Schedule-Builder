import { nextEslintConfig } from "@devdogsuga/config/eslint";

export default nextEslintConfig({
  ignores: [
    // Written by `supabase gen types`; any edit is gone at the next generation.
    "src/supabase/database.types.ts",
  ],
});
