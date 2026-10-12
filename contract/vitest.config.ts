import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["*.test.ts"],
    // The catalog is a real server: a cold edge or a slow scrape day should not
    // fail the contract, a changed shape should.
    testTimeout: 30_000,
    // Sequential: the search endpoint is limited to 60 requests a minute per IP.
    fileParallelism: false,
  },
});
