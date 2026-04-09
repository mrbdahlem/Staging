import { render, screen, waitFor } from "@testing-library/react";

import { App } from "./App.js";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renders the shell and shows health data from the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          checkedAt: "2026-04-09T00:00:00.000Z",
          status: "ok"
        })
      })
    );

    render(<App />);

    expect(screen.getByRole("heading", { name: "Staging" })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("ok");
    });
  });

  it("falls back to degraded when the health endpoint returns a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({
          error: "Internal Server Error"
        })
      })
    );

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId("health-status")).toHaveTextContent("degraded");
    });
  });
});
