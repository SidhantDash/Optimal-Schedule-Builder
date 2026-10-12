import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("~/supabase/client", () => ({ supabase: { rpc } }));

const { claimLegacyData } = await import("./claimLegacyData");

beforeEach(() => {
  rpc.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("claimLegacyData", () => {
  it("calls the database function with no arguments", async () => {
    rpc.mockResolvedValue({ data: { claimed: true }, error: null });
    await claimLegacyData();
    expect(rpc).toHaveBeenCalledExactlyOnceWith("claim_legacy_data");
  });

  it("reports a refusal and carries on", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "denied" } });
    await expect(claimLegacyData()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("carries on when the call itself throws", async () => {
    rpc.mockRejectedValue(new Error("offline"));
    await expect(claimLegacyData()).resolves.toBeUndefined();
  });
});
