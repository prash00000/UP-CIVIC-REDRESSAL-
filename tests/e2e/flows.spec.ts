import { test, expect } from "@playwright/test";

test.describe("UP Civic Grievance E2E Flows", () => {
  test("Flow 1: Default English, toggle to Hindi, persist across reload", async ({ page }) => {
    await page.goto("/");

    // Verify HTML lang default
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toContainText("Know who to complain to.");

    // Click Hindi toggle
    const hiButton = page.locator("button:has-text('हिन्दी')");
    await hiButton.click();

    // Verify HTML lang changed to hi
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.locator("h1")).toContainText("शिकायत किससे करें, यहाँ जानें।");

    // Reload page
    await page.reload();

    // Verify language state preserved from localStorage
    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.locator("h1")).toContainText("शिकायत किससे करें, यहाँ जानें।");
  });

  test("Flow 2: Wizard as gram_panchayat in Jaunpur, see officers with tel: links", async ({ page }) => {
    await page.goto("/find/");

    // Step 1: Gram Pradhan
    await page.locator("button:has-text('Gram Pradhan')").click();

    // Step 2: Pick District Jaunpur
    const districtInput = page.locator("input[role='combobox']");
    await districtInput.fill("Jaunpur");
    await page.locator("li[role='option']:has-text('Jaunpur')").first().click();

    // Step 3: Pick Village
    const villageInput = page.locator("input[role='combobox']");
    await villageInput.click();
    await page.locator("li[role='option']").first().click();

    // Step 4: Results page
    await expect(page.locator("h1")).toContainText("Your officers");
    const callButtons = page.locator("a[href^='tel:']");
    await expect(callButtons.first()).toBeVisible();
    const href = await callButtons.first().getAttribute("href");
    expect(href).toMatch(/^tel:\d+/);
  });

  test("Flow 3: Feedback submission and rate limiting", async ({ request }) => {
    // 1st request returns 204
    const res1 = await request.post("/api/feedback", {
      data: { office_id: "up-jaunpur-dm", worked: true },
    });
    expect(res1.status()).toBe(204);

    // Spam requests to trigger rate limit (10 limit)
    let rateLimited = false;
    for (let i = 0; i < 11; i++) {
      const res = await request.post("/api/feedback", {
        data: { office_id: "up-jaunpur-dm", worked: false },
      });
      if (res.status() === 429) {
        rateLimited = true;
        break;
      }
    }
    expect(rateLimited).toBe(true);
  });

  test("Flow 4: Bottom problem card -> /issue/street-light -> select area & see callable officer + prefilled letter", async ({ page }) => {
    await page.goto("/");

    // Click the first problem card at the bottom of home
    await page.locator("a[href*='/issue/street-light/']").click();
    await expect(page).toHaveURL(/\/issue\/street-light\//);

    // Inline location picker appears: pick Bulandshahr -> Khurja
    const distInput = page.locator("input[role='combobox']").first();
    await distInput.fill("Bulandshahr");
    await page.locator("li[role='option']:has-text('Bulandshahr')").first().click();

    // Click Towns / Wards filter and pick Khurja NPP
    await page.locator("button:has-text('Towns / Wards')").click();
    const placeInput = page.locator("input[role='combobox']").nth(1);
    await expect(placeInput).toBeVisible();
    await placeInput.fill("Khurja");
    await page.locator("li[role='option']:has-text('Khurja')").first().click();

    // Direct call button resolves right on the issue page (Khurja EO)
    const callBtn = page.locator("main a[href^='tel:']").first();
    await expect(callBtn).toBeVisible();

    // Proceed to pre-filled Complaint Letter from inside <main>
    await page.locator("main a[href^='/letter/']").first().click();
    await expect(page).toHaveURL(/\/letter\/.*district=bulandshahr.*issue=street-light/);
    await expect(page.locator("h1")).toContainText("Make a complaint letter");
    await expect(page.locator("article")).toContainText("Bulandshahr");
  });

  test("Flow 5: Search real LGD village in Lucknow inside /find/?issue=garbage", async ({ page }) => {
    await page.goto("/find/?issue=garbage");
    await expect(page.locator("text=Active issue")).toBeVisible();

    await page.locator("button:has-text('Gram Pradhan')").click();

    const distInput = page.locator("input[role='combobox']");
    await distInput.fill("Lucknow");
    await page.locator("li[role='option']:has-text('Lucknow')").first().click();

    // Step 3: Filter or search real LGD village in Lucknow
    const villageInput = page.locator("input[role='combobox']");
    await villageInput.fill("Mohanlalganj");
    await page.locator("li[role='option']").first().click();

    await expect(page.locator("h1")).toContainText("Your officers");
    // Step 4 maintains garbage issue in next-step links (not hardcoded street-light)
    const ladderHref = await page.locator("a[href*='/issue/']").first().getAttribute("href");
    expect(ladderHref).toContain("/issue/garbage/");
  });
});
