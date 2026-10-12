import { env } from "~/env";
import { createDogDaysCatalog } from "./index";

/**
 * The app's catalog client, shared by the browser hooks and the server
 * actions. The catalog is public and keyless, so the same URL works in both.
 */
export const catalog = createDogDaysCatalog(env.NEXT_PUBLIC_CATALOG_URL);
