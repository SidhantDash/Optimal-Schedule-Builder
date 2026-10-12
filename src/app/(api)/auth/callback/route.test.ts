import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { exchangeCodeForSession, signOut, createClient } = vi.hoisted(() => ({
  exchangeCodeForSession: vi.fn(),
  signOut: vi.fn(),
  createClient: vi.fn(),
}));

const { envMock } = vi.hoisted(() => {
  const envMock: { DEPLOY_ENV: string } = { DEPLOY_ENV: "production" };
  return { envMock };
});

vi.mock("~/supabase/server", () => ({ createClient }));
vi.mock("~/env", () => ({ env: envMock }));

const { GET } = await import("./route");

beforeEach(() => {
  vi.clearAllMocks();
  envMock.DEPLOY_ENV = "production";
  createClient.mockResolvedValue({
    auth: { exchangeCodeForSession, signOut },
  });
  signOut.mockResolvedValue({ error: null });
});

describe("OAuth callback", () => {
  it("accepts a UGA identity", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "student@uga.edu" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        "https://schedule.devdogsuga.org/auth/callback?code=valid&next=/plans",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://schedule.devdogsuga.org/plans",
    );
    expect(signOut).not.toHaveBeenCalled();
  });

  it("signs out and refuses a non-UGA identity", async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "student@gmail.com" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        "https://schedule.devdogsuga.org/auth/callback?code=valid&next=/plans",
      ),
    );

    expect(signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(response.headers.get("location")).toBe(
      "https://schedule.devdogsuga.org/?error=uga_account_required",
    );
  });

  it("lets a non-UGA identity in outside production", async () => {
    envMock.DEPLOY_ENV = "staging";
    exchangeCodeForSession.mockResolvedValue({
      data: { user: { email: "tester@verify.devdogsuga.test" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        "https://staging.dogdays.dev/auth/callback?code=valid&next=/plans",
      ),
    );

    expect(response.headers.get("location")).toBe(
      "https://staging.dogdays.dev/plans",
    );
    expect(signOut).not.toHaveBeenCalled();
  });
});
