import { expect, test } from "@playwright/test";

test("loads the landing page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Staging" })).toBeVisible();
  await expect(page.getByText("A lightweight deployment dashboard")).toBeVisible();
});
