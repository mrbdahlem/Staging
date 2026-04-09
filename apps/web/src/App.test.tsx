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
});
