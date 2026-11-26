import { test, expect } from "@playwright/test";

test.describe("UP Civic Grievance E2E Flows", () => {
  test("Flow 1: Default English, toggle to Hindi, persist across reload", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("h1")).toContainText("Know who to complain to.");

    const hiButton = page.locator("button:has-text('हिन्दी')");
    await hiButton.click();

    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.locator("h1")).toContainText("शिकायत किससे करें, यहाँ जानें।");

    await page.reload();

    await expect(page.locator("html")).toHaveAttribute("lang", "hi");
    await expect(page.locator("h1")).toContainText("शिकायत किससे करें, यहाँ जानें।");
  });

  test("Flow 2: 3-step location-first wizard in Jaunpur + Change returns to Step 2 keeping district", async ({ page }) => {
    await page.goto("/find/");

    // Step 1: Pick District Jaunpur first, then area type
    const districtInput = page.locator("input[role='combobox']");
    await districtInput.fill("Jaunpur");
    await page.locator("li[role='option']:has-text('Jaunpur')").first().click();

    await page.locator("button:has-text('Village / Gram Panchayat')").click();

    // Step 2: Pinpoint Village, Block, or Town
    await expect(page.locator("h1")).toContainText("Find your village");
    const villageInput = page.locator("input[role='combobox']");
    await villageInput.click();
    await page.locator("li[role='option']").first().click();

    // Step 3: Officers & honest GP Secretary note
    await expect(page.locator("h1")).toContainText("Your officers");
    await expect(page.locator("text=Gram Panchayat Secretary (Adhikari) office")).toBeVisible();
    await expect(page.locator("text=secretary post here is vacant")).toHaveCount(0);

    const callButtons = page.locator("a[href^='tel:']");
    await expect(callButtons.first()).toBeVisible();
    const href = await callButtons.first().getAttribute("href");
    expect(href).toMatch(/^tel:\d+/);

    // Click Change -> goes back to Step 2 keeping Jaunpur District
    await page.locator("button:has-text('Change')").first().click();
    await expect(page.locator("h1")).toContainText("Find your village");
    await expect(page.locator("text=Selected district: Jaunpur")).toBeVisible();
  });

  test("Flow 3: Feedback submission and rate limiting", async ({ request }, testInfo) => {
    // Isolate rate-limit bucket per project/run so desktop + Mobile Chrome don't collide on 127.0.0.1
    const baseOctet = testInfo.project.name.includes("Mobile") ? 120 : 10;
    const uniqueOctet = baseOctet + (Math.floor(Date.now() / 1000) % 90);
    const headers = { "x-forwarded-for": `198.51.100.${uniqueOctet}` };

    const res1 = await request.post("/api/feedback", {
      headers,
      data: { office_id: "up-jaunpur-dm", worked: true },
    });
    expect(res1.status()).toBe(204);

    let rateLimited = false;
    for (let i = 0; i < 12; i++) {
      const res = await request.post("/api/feedback", {
        headers,
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

    await page.locator("a[href*='/issue/street-light/']").click();
    await expect(page).toHaveURL(/\/issue\/street-light\//);

    const distInput = page.locator("input[role='combobox']").first();
    await distInput.fill("Bulandshahr");
    await page.locator("li[role='option']:has-text('Bulandshahr')").first().click();

    await page.locator("button:has-text('Towns / Wards')").click();
    const placeInput = page.locator("input[role='combobox']").nth(1);
    await expect(placeInput).toBeVisible();
    await placeInput.fill("Khurja");
    await page.locator("li[role='option']:has-text('Khurja')").first().click();

    const callBtn = page.locator("main a[href^='tel:']").first();
    await expect(callBtn).toBeVisible();
    await expect(page.locator("section[aria-labelledby='ladder-heading']")).toContainText(
      "Sub-Divisional Magistrate (SDM)"
    );

    await page.locator("main a[href^='/letter/']").first().click();
    await expect(page).toHaveURL(/\/letter\/.*district=bulandshahr.*issue=street-light/);
    await expect(page.locator("h1")).toContainText("Make a complaint letter");
    await expect(page.locator("article")).toContainText("Bulandshahr");
  });

  test("Flow 5: PIN-filtered real LGD Lucknow village lookup + 1076 summary + pincode preserved", async ({ page }) => {
    await page.goto("/find/?issue=garbage");
    await expect(page.locator("text=Active issue")).toBeVisible();

    // Enter Mohanlalganj PIN (226301) -> auto-detects Lucknow
    const pinInput = page.locator("#wizard-pincode-input");
    await pinInput.fill("226301");
    await expect(page.locator("text=Selected district: Lucknow")).toBeVisible();

    await page.locator("button:has-text('Village / Gram Panchayat')").click();

    // Step 2: PIN-to-place toggle should appear for 226301
    await expect(page.locator("button:has-text('Places matching PIN 226301')")).toBeVisible();

    const villageInput = page.locator("input[role='combobox']");
    await villageInput.click();
    await page.locator("li[role='option']").first().click();

    await expect(page.locator("h1")).toContainText("Your officers");
    await expect(page.locator("button:has-text('Copy 30-second 1076')").first()).toBeVisible();

    const ladderHref = await page.locator("a[href*='/issue/']").first().getAttribute("href");
    expect(ladderHref).toContain("/issue/garbage/");
    expect(ladderHref).toContain("pincode=226301");
  });

  test("Flow 6: Duplicate village search >10 results, Noida authority_area routing, urban MGNREGA, and localized directory", async ({ page }) => {
    // 1. Duplicate Rampur search in Jaunpur shows >10 options & Block filter exists
    await page.goto("/find/?type=gram_panchayat&district=jaunpur");
    await expect(page.locator("#find-block-filter")).toBeVisible();
    const placeInput = page.locator("input[role='combobox']");
    await placeInput.fill("Rampur");
    await expect(page.locator("li[role='option']").nth(15)).toBeVisible();

    // 2. Noida authority_area resolves directly to NOIDA Authority & switches cleanly to MGNREGA notice
    await page.goto("/issue/street-light/?district=gautam-buddha-nagar&place=lgd-ulb-301210");
    await expect(page.locator("a[href='tel:0120-2425025']").first()).toBeVisible();
    await expect(page.locator("text=Panchayati Raj Department UP")).toHaveCount(0);

    await page.locator("a[href*='/issue/mgnrega/']").first().click();
    await expect(page).toHaveURL(/\/issue\/mgnrega\//);
    await expect(page.locator("text=MGNREGA applies to rural Gram Panchayats")).toBeVisible();

    // 3. Directory search + Hindi section label localization
    await page.goto("/directory/lucknow/?lang=hi");
    await expect(page.locator("h2", { hasText: "जनपद स्तरीय प्रशासन" })).toBeVisible();
    await expect(page.locator("text=level administration")).toHaveCount(0);
  });

  test("Flow 7: Saved area persistence across reload, PIN re-entry after Back, and 1076 copy", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});

    // 1. Complete /find/ with 226301 -> click Back -> change PIN to 221001 (Varanasi)
    await page.goto("/find/");
    const pinInput = page.locator("#wizard-pincode-input");
    await pinInput.fill("226301");
    await expect(page.locator("text=Selected district: Lucknow")).toBeVisible();
    await page.locator("button:has-text('Village / Gram Panchayat')").click();
    await expect(page.locator("h1")).toContainText("Find your village");

    await page.locator("button:has-text('Back')").click();
    await expect(page.locator("#wizard-pincode-input")).toBeVisible();
    await page.locator("#wizard-pincode-input").fill("221001");
    await expect(page.locator("text=Selected district: Varanasi")).toBeVisible();

    // 2. Pick Village in Varanasi -> Step 3 auto-saves area & Copy 1076 summary works
    await page.locator("button:has-text('Village / Gram Panchayat')").click();
    const villageInput = page.locator("input[role='combobox']");
    await villageInput.click();
    await page.locator("li[role='option']").first().click();

    await expect(page.locator("h1")).toContainText("Your officers");
    const copy1076Btn = page.locator("button:has-text('Copy 30-second 1076')").first();
    await copy1076Btn.click();
    await expect(page.locator("text=1076 / Jansunwai summary copied").first()).toBeVisible();

    // 3. Reload homepage -> Saved area banner appears & bottom problem card prefills Varanasi
    await page.goto("/");
    await expect(page.locator("text=Saved area ready:")).toBeVisible();
    const drainHref = await page.locator("a[href*='/issue/drain/']").getAttribute("href");
    expect(drainHref).toContain("district=varanasi");

    // 4. Clear saved area on homepage
    await page.locator("button:has-text('Clear')").first().click();
    await expect(page.locator("text=Saved area ready:")).toHaveCount(0);
  });

  test("Flow 8: Letter CC checkboxes across EN/HI toggle, Hindi counterfoil, RTI issue prefill, and Directory filters", async ({ page }) => {
    // 1. /letter/ with real Town Khurja (lgd-ulb-249018): clean local body, CC persists across EN -> HI toggle, Hindi counterfoil
    await page.goto("/letter/?district=bulandshahr&place=lgd-ulb-249018&issue=street-light&pincode=203131");
    await expect(page.locator("article")).toContainText("Nagar Palika Khurja");
    await expect(page.locator("article")).not.toContainText("resident of Khurja (Nagar Palika Parishad), Executive Officer");

    const firstCcCheckbox = page.locator("input[type='checkbox']").first();
    await expect(firstCcCheckbox).toBeVisible();
    await firstCcCheckbox.check();
    await expect(page.locator("article")).toContainText("Copy forwarded for information");

    await page.locator("button:has-text('हिन्दी')").click();
    await expect(firstCcCheckbox).toBeChecked();
    await expect(page.locator("h4", { hasText: "पावती प्रति" })).toBeVisible();

    await page.locator("button:has-text('English')").click();
    await expect(firstCcCheckbox).toBeChecked();
    await expect(page.locator("h4", { hasText: "Acknowledgment copy" })).toBeVisible();

    // 2. Check rural drain ladder includes SDM (Tehsil Samadhan Diwas) + /rti/ road prefill
    await page.goto("/issue/drain/?district=jaunpur&place=block-badlapur");
    await expect(page.locator("section[aria-labelledby='ladder-heading']")).toContainText(
      "Sub-Divisional Magistrate (SDM)"
    );

    await page.goto("/rti/?issue=road&district=jaunpur");
    await expect(page.locator("textarea")).toContainText("Measurement Book");

    // 3. /directory/jaunpur/ role filter pills + search box
    await page.goto("/directory/jaunpur/");
    await expect(page.locator("text=BDOs with phones")).toBeVisible();
    await page.locator("button:has-text('Blocks (BDO)')").click();
    const dirSearch = page.locator("input[type='search']");
    await dirSearch.fill("Machhlishahr");
    await expect(page.locator("text=Machhlishahr").first()).toBeVisible();
    await expect(page.locator("text=District Magistrate")).toHaveCount(0);
  });
});
