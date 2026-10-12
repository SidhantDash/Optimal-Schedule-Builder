import { beforeEach, describe, expect, it, vi } from "vitest";

const { init, feedbackIntegration, envMock } = vi.hoisted(() => ({
  init: vi.fn(),
  feedbackIntegration: vi.fn(() => ({ name: "Feedback" })),
  envMock: {
    NEXT_PUBLIC_DEPLOY_ENV: "staging",
    NEXT_PUBLIC_SENTRY_DSN: undefined as string | undefined,
  },
}));

vi.mock("@sentry/nextjs", () => ({ init, feedbackIntegration }));
vi.mock("~/env", () => ({ env: envMock }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe("browser Sentry", () => {
  it("does nothing without a DSN", async () => {
    envMock.NEXT_PUBLIC_SENTRY_DSN = undefined;
    await import("./instrumentation-client");
    expect(init).not.toHaveBeenCalled();
    expect(feedbackIntegration).not.toHaveBeenCalled();
  });

  it("starts the User Feedback widget and leaves Replay off", async () => {
    envMock.NEXT_PUBLIC_SENTRY_DSN = "https://abc@o1.ingest.us.sentry.io/2";
    await import("./instrumentation-client");

    expect(feedbackIntegration).toHaveBeenCalledOnce();
    expect(feedbackIntegration).toHaveBeenCalledWith(
      expect.objectContaining({
        isEmailRequired: false,
        isNameRequired: false,
        enableScreenshot: true,
      }),
    );
    expect(init).toHaveBeenCalledOnce();
    const options = init.mock.calls[0]![0] as {
      integrations: { name: string }[];
      replaysSessionSampleRate: number;
      replaysOnErrorSampleRate: number;
      tracesSampleRate: number;
    };
    expect(options.integrations.map((i) => i.name)).toEqual(["Feedback"]);
    expect(options.replaysSessionSampleRate).toBe(0);
    expect(options.replaysOnErrorSampleRate).toBe(0);
    expect(options.tracesSampleRate).toBe(0);
  });
});
