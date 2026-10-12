/**
 * DogDays' catalog client: the SDK's generated one (`@devdogsuga/sdk/catalog`,
 * built from the catalog's OpenAPI file) with DogDays' name on it.
 *
 * The base URL always comes from the environment (`CATALOG_URL`, validated in
 * `src/env.ts`), never from this file: staging reads the staging catalog and
 * production the production one from the same code. The catalog is public,
 * keyless and sends `Access-Control-Allow-Origin: *`, so this works in the
 * browser as well as on the server.
 *
 * `contract/` pins the shapes this client returns and runs against a real
 * catalog in CI; change a field the app reads and its test says so.
 */
import {
  createCatalogClient,
  type CatalogClient,
} from "@devdogsuga/sdk/catalog";

export type { CatalogClient } from "@devdogsuga/sdk/catalog";
export { ApiError } from "@devdogsuga/sdk/catalog";

/** Sent as `X-Client`, for the catalog's usage numbers only. */
export const CATALOG_CLIENT = "dogdays";

export function createDogDaysCatalog(
  baseUrl: string,
  options: { fetch?: typeof fetch } = {},
): CatalogClient {
  return createCatalogClient({
    baseUrl,
    client: CATALOG_CLIENT,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  });
}
