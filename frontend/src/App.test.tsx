import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { Dashboard } from "./pages/Dashboard";

describe("Dashboard", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => "",
        json: async () => [],
      })),
    );
  });

  it("renders heading", async () => {
    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>,
    );
    expect(screen.getByText("Produkty")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Nie masz jeszcze żadnego produktu/i)).toBeInTheDocument();
    });
  });
});
