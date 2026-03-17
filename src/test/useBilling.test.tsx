import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useBilling } from "@/hooks/useBilling";

const { invokeMock, toastMock } = vi.hoisted(() => ({
  invokeMock: vi.fn(),
  toastMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}));

describe("useBilling", () => {
  beforeEach(() => {
    invokeMock.mockReset();
    toastMock.mockReset();
  });

  it("calls create-checkout with the requested plan", async () => {
    invokeMock.mockResolvedValue({ data: {}, error: null });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleUpgrade("starter", "/dashboard/settings");
    });

    expect(invokeMock).toHaveBeenCalledWith("create-checkout", {
      body: {
        plan: "starter",
        redirect_path: "/dashboard/settings",
      },
    });
  });

  it("shows an error toast when checkout fails", async () => {
    invokeMock.mockResolvedValue({ data: null, error: { message: "Stripe unavailable" } });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleUpgrade("starter");
    });

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Error",
        variant: "destructive",
      }),
    );
  });

  it("opens customer portal in a new tab", async () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
    invokeMock.mockResolvedValue({ data: { url: "https://example.com/portal" }, error: null });
    const { result } = renderHook(() => useBilling());

    await act(async () => {
      await result.current.handleManageSubscription();
    });

    expect(invokeMock).toHaveBeenCalledWith("customer-portal");
    expect(openSpy).toHaveBeenCalledWith("https://example.com/portal", "_blank");
    openSpy.mockRestore();
  });
});
