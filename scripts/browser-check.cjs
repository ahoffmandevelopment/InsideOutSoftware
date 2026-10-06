// Optional verification runner. No browser package is shipped with the site.
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.PREVIEW_URL || "http://127.0.0.1:8766";
const output = process.env.QA_OUTPUT || "/private/tmp/copper-qa";
const projectData = require("../src/data/projects.json");
const routes = [
  "/",
  ...projectData.map((p) => "/project/" + p.id + "/"),
  ...projectData.filter(p => p.demoPath).map(p => p.demoPath.replace(/\.html$/, "")),
  "/missing-copper-page",
];
const passed = [],
  errors = [];
let browser;
function monitor(page) {
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !/Failed to load resource|net::ERR/.test(message.text())
    )
      errors.push(message.text());
  });
}
async function check(name, action) {
  if (
    process.env.CHECK_FILTER &&
    !new RegExp(process.env.CHECK_FILTER).test(name)
  )
    return;
  await action();
  passed.push(name);
  console.log("PASS " + name);
}
async function overflow(page) {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "Horizontal page overflow at " + page.url(),
  );
}
async function dialogFocus(page, selector) {
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    assert.ok(
      await page.evaluate(
        (selector) =>
          document.querySelector(selector).contains(document.activeElement),
        selector,
      ),
      "Dialog lost focus containment",
    );
  }
}
async function loadPageImages(page) {
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight,
  );
  for (let top = 0; top < height; top += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), top);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForFunction(() =>
    [...document.images]
      .filter((image) => image.src.startsWith(location.origin))
      .every((image) => image.complete && image.naturalWidth > 0),
  );
}
async function run() {
  await fs.mkdir(output, { recursive: true });
  browser = await chromium.launch({
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  monitor(page);
  await check("All views at desktop and 375px", async () => {
    for (const width of [1440, 375]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const route of routes) {
        const response = await page.goto(base + route);
        assert.equal(
          response.status(),
          route.startsWith("/missing") ? 404 : 200,
        );
        await page.locator("h1").waitFor();
        await overflow(page);
        const name =
          route === "/" ? "home" : route.split("/").filter(Boolean).join("-");
        await loadPageImages(page);
        await page.screenshot({
          path: path.join(output, name + "-" + width + ".png"),
          fullPage: true,
        });
      }
    }
  });
  await check(
    "Responsive boundaries at 320, 768, 1024, and 1440px",
    async () => {
      for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 950 });
        for (const route of [
          "/",
          "/project/pharmacy-app/",
          "/projects/glacier",
          "/projects/news",
          "/projects/newsletterarchive",
          "/missing-copper-page",
        ]) {
          await page.goto(base + route);
          await overflow(page);
        }
      }
    },
  );
  await check(
    "Homepage anchors, mobile navigation, and contact links",
    async () => {
      await page.setViewportSize({ width: 375, height: 850 });
      await page.goto(base + "/");
      await page.getByRole("button", { name: "Menu" }).click();
      assert.equal(
        await page
          .getByRole("button", { name: "Menu" })
          .getAttribute("aria-expanded"),
        "true",
      );
      await page.locator('#site-navigation a[href="/#projects"]').click();
      assert.ok(page.url().endsWith("/#projects"));
      assert.equal(
        await page
          .getByRole("button", { name: "Menu" })
          .getAttribute("aria-expanded"),
        "false",
      );
      for (const id of ["about", "experience", "contact"]) {
        await page.getByRole("button", { name: "Menu" }).click();
        await page.locator('#site-navigation a[href="/#' + id + '"]').click();
        assert.ok(page.url().endsWith("/#" + id));
      }
      assert.equal(
        await page.locator('.contact-links a[href^="mailto:"]').count(),
        1,
      );
      assert.equal(
        await page.locator('.contact-links a[target="_blank"]').count(),
        2,
      );
    },
  );
  await check(
    "All gallery images, arrow keys, touch buttons, focus containment and restoration",
    async () => {
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 900 });
        for (const project of projectData.filter(
          (p) => p.type === "imageGallery",
        )) {
          await page.goto(base + "/project/" + project.id + "/");
          const count = project.galleryImages.length;
          for (let index = 0; index < count; index++) {
            const thumbnail = page.locator(".gallery-item").nth(index);
            await thumbnail.click();
            assert.equal(
              await page.locator("[data-viewer-count]").textContent(),
              index + 1 + " of " + count,
            );
            await page
              .locator(".viewer-image img")
              .evaluate((image) => image.decode());
            await dialogFocus(page, ".image-viewer");
            await page.keyboard.press("Escape");
            assert.ok(
              await thumbnail.evaluate(
                (element) => element === document.activeElement,
              ),
            );
          }
          await page.locator(".gallery-item").first().click();
          assert.ok(!(await page.locator("[data-viewer-previous]").isEnabled()));
          for (let index = 1; index < count; index++) {
            if (index % 2) await page.keyboard.press("ArrowRight");
            else await page.locator("[data-viewer-next]").click();
            assert.equal(await page.locator("[data-viewer-count]").textContent(), (index + 1) + " of " + count);
          }
          assert.ok(!(await page.locator("[data-viewer-next]").isEnabled()));
          await page.keyboard.press("ArrowRight");
          assert.equal(await page.locator("[data-viewer-count]").textContent(), count + " of " + count);
          for (let index = count - 2; index >= 0; index--) {
            if (index % 2) await page.keyboard.press("ArrowLeft");
            else await page.locator("[data-viewer-previous]").click();
            assert.equal(await page.locator("[data-viewer-count]").textContent(), (index + 1) + " of " + count);
          }
          await page.keyboard.press("ArrowLeft");
          assert.equal(await page.locator("[data-viewer-count]").textContent(), "1 of " + count);
          await page.locator("[data-viewer-close]").click();
        }
      }
    },
  );
  await check(
    "Galleries with one, two, or seven screenshots work without optional fields",
    async () => {
      const { renderProjectPage } = await import("../src/templates/render.mjs");
      const site = require("../src/data/site.json");
      const examples = projectData.find(project => project.type === "imageGallery").galleryImages;
      const url = base + "/gallery-fixture";
      for (const count of [1, 2, 7]) {
        const project = {
          id: "gallery-fixture",
          type: "imageGallery",
          title: "Gallery fixture",
          category: "Mobile",
          description: "A project added through data alone.",
          technologies: [],
          galleryImages: Array.from({ length: count }, (_, index) => {
            const image = { ...examples[index % examples.length] };
            if (index % 2 === 0) delete image.original;
            return image;
          }),
        };
        await page.route(url, route => route.fulfill({
          contentType: "text/html",
          body: renderProjectPage(site, project, [...projectData, project]),
        }));
        await page.goto(url);
        assert.equal(await page.locator(".gallery-item").count(), count);
        await page.locator(".gallery-item").first().click();
        for (let index = 0; index < count; index++) {
          const image = project.galleryImages[index];
          assert.equal(await page.locator("[data-viewer-count]").textContent(), (index + 1) + " of " + count);
          assert.equal(await page.locator("[data-viewer-previous]").isEnabled(), index > 0);
          assert.equal(await page.locator("[data-viewer-next]").isEnabled(), index < count - 1);
          assert.equal(await page.locator(".viewer-image img").getAttribute("src"), base + (image.original ?? image.src));
          assert.equal(await page.locator(".viewer-image img").getAttribute("alt"), image.alt);
          await page.keyboard.press("ArrowRight");
        }
        assert.equal(await page.locator("[data-viewer-count]").textContent(), count + " of " + count);
        for (let index = count - 2; index >= 0; index--) {
          await page.keyboard.press("ArrowLeft");
          assert.equal(await page.locator("[data-viewer-count]").textContent(), (index + 1) + " of " + count);
        }
        await page.keyboard.press("ArrowLeft");
        assert.equal(await page.locator("[data-viewer-count]").textContent(), "1 of " + count);
        await page.keyboard.press("Escape");
        await page.locator(".image-viewer").waitFor({ state: "hidden" });
        assert.ok(await page.locator(".gallery-item").first().evaluate(element => element === document.activeElement));
        await page.unroute(url);
      }
    },
  );
  await check(
    "Previous/next project links follow the homepage order",
    async () => {
      for (let index = 0; index < projectData.length; index++) {
        await page.goto(base + "/project/" + projectData[index].id + "/");
        const links = await page
          .locator(".project-pagination a")
          .evaluateAll((links) => links.map((a) => a.getAttribute("href")));
        assert.deepEqual(
          links,
          [projectData[index - 1], projectData[index + 1]]
            .filter(Boolean)
            .map((p) => "/project/" + p.id + "/"),
        );
      }
    },
  );
  await check(
    "Phone previews defer all iframes; 768px embeds hide portfolio chrome",
    async () => {
      for (const project of projectData.filter((p) => p.demoPath)) {
        await page.setViewportSize({ width: 375, height: 850 });
        await page.goto(base + "/project/" + project.id + "/");
        assert.equal(await page.locator("iframe").getAttribute("src"), null);
        assert.ok(await page.locator(".demo-preview").isVisible());
        await page.setViewportSize({ width: 768, height: 900 });
        const frame = page.frameLocator("iframe");
        await frame.locator("h1").waitFor();
        assert.equal(await page.locator("iframe").getAttribute("height"), null);
        assert.equal(
          await page
            .locator("iframe")
            .evaluate((frame) =>
              Math.round(frame.getBoundingClientRect().height),
            ),
          800,
        );
        assert.ok(!(await frame.locator(".demo-chrome").isVisible()));
        assert.ok(await frame.locator(".demo-heading").isVisible());
        await page.setViewportSize({ width: 375, height: 850 });
        await page.waitForFunction(
          () => !document.querySelector("iframe").hasAttribute("src"),
        );
      }
    },
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  for (const embedded of [false, true]) {
    const suffix = embedded ? "?embedded=1" : "";
    await check(
      "Glacier years, slider, table rows and calculations " +
        (embedded ? "embedded" : "standalone"),
      async () => {
        await page.goto(base + "/projects/glacier" + suffix);
        assert.equal(await page.locator("#year-display").textContent(), "1990");
        assert.equal(
          await page.locator("#volume-value").textContent(),
          "50 Gt",
        );
        for (let year = 1990; year <= 2024; year++) {
          const slider = page.locator("#timeline-slider");
          if (year === 1990) await slider.press("Home");
          else await slider.press("ArrowRight");
          assert.equal(
            await page.locator("#year-display").textContent(),
            String(year),
          );
          assert.equal(
            await page.locator("tr.selected").getAttribute("data-year"),
            String(year),
          );
          if (year === 1996 || year === 2003) {
            assert.equal(
              await page.locator("#volume-value").textContent(),
              year === 1996 ? "54 Gt" : "81 Gt",
            );
            assert.equal(
              await page.locator("#flow-rate").textContent(),
              year === 1996 ? "1696 K L/s" : "2553 K L/s",
            );
          }
        }
        assert.equal(
          await page.locator("#volume-value").textContent(),
          "500 Gt",
        );
        await page
          .getByRole("button", { name: "Select year 2000", exact: true })
          .press("Enter");
        assert.equal(await page.locator("#year-display").textContent(), "2000");
        await page.locator('tr[data-year="2010"] td').first().click();
        assert.equal(await page.locator("#year-display").textContent(), "2010");
        assert.equal(await page.locator(".ticker-items").count(), 0);
      },
    );
    await check(
      "News previews, category collapse, saved dialog and ticker " +
        (embedded ? "embedded" : "standalone"),
      async () => {
        await page.goto(base + "/projects/news" + suffix);
        assert.equal(await page.locator(".article-card").count(), 9);
        await page.locator("[data-expand]").first().click();
        assert.equal(
          await page
            .locator("[data-expand]")
            .first()
            .getAttribute("aria-expanded"),
          "true",
        );
        await page.locator("[data-expand]").first().click();
        await page.locator('[data-category="tech"]').click();
        assert.ok(!(await page.locator("#section-tech").isVisible()));
        await page.locator('[data-category="tech"]').click();
        await page.locator('[data-save="politics-1"]').click();
        await page.locator("#saved-articles-toggle").click();
        assert.ok(await page.locator("#saved-dialog").isVisible());
        await dialogFocus(page, "#saved-dialog");
        await page.keyboard.press("Escape");
        assert.ok(
          await page
            .locator("#saved-articles-toggle")
            .evaluate((element) => element === document.activeElement),
        );
        await page.reload();
        assert.equal(
          await page
            .locator('[data-save="politics-1"]')
            .getAttribute("aria-pressed"),
          "true",
        );
        await page.locator('[data-save="politics-1"]').click();
        await page.locator("#saved-articles-toggle").click();
        assert.ok(await page.getByText("No saved articles yet").isVisible());
        await page.keyboard.press("Escape");
        for (const key of ["economics", "health", "science"]) {
          await page.locator('[data-breaking="' + key + '"]').click();
          assert.ok(await page.locator("#breaking-dialog").isVisible());
          await dialogFocus(page, "#breaking-dialog");
          await page.keyboard.press("Escape");
        }
        assert.equal(
          await page
            .locator(".ticker-items")
            .evaluate((element) => getComputedStyle(element).animationName),
          "none",
        );
      },
    );
    await check(
      "Archive combinations, saving, sorting, dates and full reader " +
        (embedded ? "embedded" : "standalone"),
      async () => {
        await page.goto(base + "/projects/newsletterarchive" + suffix);
        assert.equal(await page.locator(".newsletter-card").count(), 26);
        assert.ok(await page.locator("#preview-placeholder").isVisible());
        await page.locator("#search").fill("AI");
        assert.ok((await page.locator(".newsletter-card").count()) > 0);
        await page.locator("#search").fill("no-match-example");
        assert.ok(await page.locator("#no-results").isVisible());
        await page.locator("#search").fill("");
        await page.locator('#category-filter input[value="__all"]').uncheck();
        assert.equal(await page.locator(".newsletter-card").count(), 0);
        await page
          .locator('#category-filter input[value="Technology"]')
          .check();
        assert.ok((await page.locator(".newsletter-card").count()) > 0);
        await page.locator('#tag-filter input[value="__all"]').uncheck();
        assert.equal(await page.locator(".newsletter-card").count(), 0);
        await page.locator('#tag-filter input[value="AI"]').check();
        assert.ok((await page.locator(".newsletter-card").count()) > 0);
        await page.locator('#category-filter input[value="__all"]').check();
        await page.locator('#tag-filter input[value="__all"]').check();
        await page.locator("#sort-order").selectOption("oldest");
        const first = await page
          .locator(".newsletter-open")
          .first()
          .innerText();
        await page.reload();
        assert.equal(await page.locator("#sort-order").inputValue(), "oldest");
        assert.equal(
          await page.locator(".newsletter-open").first().innerText(),
          first,
        );
        const save = page.locator("[data-save-newsletter]").first(),
          id = await save.getAttribute("data-save-newsletter");
        await save.click();
        await page.reload();
        assert.equal(
          await page
            .locator('[data-save-newsletter="' + id + '"]')
            .getAttribute("aria-pressed"),
          "true",
        );
        await page.locator("#show-saved-btn").click();
        assert.equal(await page.locator(".newsletter-card").count(), 1);
        await page.locator("[data-save-newsletter]").click();
        assert.ok(await page.getByText("No saved newsletters yet").isVisible());
        await page.locator("#show-saved-btn").click();
        for (const value of ["last-month", "last-quarter", "last-year"]) {
          await page.locator("#date-filter").selectOption(value);
          assert.ok(await page.locator("#results-count").isVisible());
        }
        await page.locator("#date-filter").selectOption("custom");
        await page.locator("#date-from").fill("2024-06-01");
        await page.locator("#date-to").fill("2024-01-01");
        assert.ok(await page.locator("#date-error").isVisible());
        await page.locator("#date-from").fill("2024-01-01");
        await page.locator("#date-to").fill("2024-06-01");
        assert.ok(!(await page.locator("#date-error").isVisible()));
        assert.ok((await page.locator(".newsletter-card").count()) > 0);
        await page.locator("#date-filter").selectOption("all");
        await page.locator("#sort-order").selectOption("newest");
        await page.locator(".newsletter-open").first().click();
        assert.ok(await page.locator("#preview-content").isVisible());
        assert.ok(
          !(await page
            .locator("#preview-content [data-reader-prev]")
            .isEnabled()),
        );
        await page.locator("[data-fullscreen]").click();
        await dialogFocus(page, "#reading-dialog");
        await page.locator("#reading-dialog [data-reader-next]").click();
        assert.ok(
          await page.locator("#reading-dialog [data-reader-prev]").isEnabled(),
        );
        await page.keyboard.press("ArrowRight");
        await page.keyboard.press("Escape");
        await page.locator(".newsletter-open").last().click();
        assert.ok(
          !(await page
            .locator("#preview-content [data-reader-next]")
            .isEnabled()),
        );
      },
    );
  }
  await check(
    "Reader navigation preserves keyboard focus at both endpoints",
    async () => {
      for (const width of [1440, 375]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(base + "/projects/newsletterarchive");
        const scopes =
          width === 1440
            ? ["#preview-content", "#reading-dialog"]
            : ["#reading-dialog"];
        for (const scope of scopes) {
          for (const endpoint of ["first", "last"]) {
            const cards = page.locator(".newsletter-open");
            await (endpoint === "first" ? cards.first() : cards.last()).click();
            if (scope === "#reading-dialog" && width === 1440)
              await page.locator("[data-fullscreen]").click();
            const direction = endpoint === "first" ? "next" : "prev";
            const opposite = endpoint === "first" ? "prev" : "next";
            const forward = page.locator(
              scope + " [data-reader-" + direction + "]",
            );
            const back = page.locator(
              scope + " [data-reader-" + opposite + "]",
            );
            const heading = page.locator(scope + " h2");
            const title = await heading.textContent();
            await forward.press("Enter");
            assert.notEqual(await heading.textContent(), title);
            assert.ok(
              await forward.evaluate(element => element === document.activeElement),
            );
            await forward.press(endpoint === "first" ? "ArrowRight" : "ArrowLeft");
            assert.ok(
              await forward.evaluate(element => element === document.activeElement),
            );
            await forward.press(endpoint === "first" ? "ArrowLeft" : "ArrowRight");
            assert.ok(
              await forward.evaluate(element => element === document.activeElement),
            );
            await back.press("Enter");
            assert.equal(await heading.textContent(), title);
            assert.ok(!(await back.isEnabled()));
            assert.ok(
              await forward.evaluate(element => element === document.activeElement),
            );
            if (scope === "#reading-dialog") {
              await page.keyboard.press("Escape");
              await page.locator(scope).waitFor({ state: "hidden" });
            }
          }
        }
      }
    },
  );
  await check("Simulated news update uses Copper classes", async () => {
    await page.goto(base + "/projects/news");
    await page.waitForTimeout(20500);
    assert.ok(
      (await page
        .locator(".article-card")
        .filter({ hasText: "a new sample story" })
        .count()) > 0,
    );
    assert.equal(await page.locator(".article-card").count(), 9);
    await overflow(page);
  });
  await check(
    "Mobile filters, reading dialog, endpoints and focus return",
    async () => {
      await page.setViewportSize({ width: 375, height: 850 });
      await page.goto(base + "/projects/newsletterarchive");
      await page.locator("#filter-toggle").click();
      assert.ok(await page.locator("#archive-filters").isVisible());
      await page.locator("#search").fill("AI");
      await page.locator("#filter-toggle").click();
      const title = await page.locator(".newsletter-open").first().innerText();
      await page.locator(".newsletter-open").first().click();
      assert.ok(await page.locator("#reading-dialog").isVisible());
      await overflow(page);
      await dialogFocus(page, "#reading-dialog");
      await page.keyboard.press("Escape");
      assert.ok(
        await page
          .locator(".newsletter-open")
          .filter({ hasText: title.split("\n")[2] || title })
          .first()
          .evaluate((element) => element === document.activeElement),
      );
    },
  );
  await check(
    "Clean URLs, .html redirects, direct projects and real 404",
    async () => {
      for (const route of [
        "/projects/glacier",
        "/projects/news",
        "/projects/newsletterarchive",
      ]) {
        const response = await context.request.get(base + route + ".html", {
          maxRedirects: 0,
        });
        assert.equal(response.status(), 307);
        assert.equal(response.headers().location, route);
      }
      const response = await context.request.get(base + "/not-a-page");
      assert.equal(response.status(), 404);
    },
  );
  await check(
    "Malformed, wrong-shaped, orphaned and unavailable storage",
    async () => {
      for (const state of ["malformed", "shape", "orphan", "unavailable"]) {
        const ctx = await browser.newContext();
        await ctx.addInitScript((state) => {
          if (state === "unavailable") {
            Storage.prototype.getItem = Storage.prototype.setItem =
              function () {
                throw new Error("Storage disabled");
              };
          } else {
            localStorage.setItem(
              "savedArticles",
              state === "malformed"
                ? "{bad"
                : state === "shape"
                  ? "{}"
                  : '["missing-id"]',
            );
            localStorage.setItem(
              "savedNewsletterItems",
              state === "malformed"
                ? "{bad"
                : state === "shape"
                  ? '"bad"'
                  : "[999999]",
            );
          }
        }, state);
        const tab = await ctx.newPage();
        monitor(tab);
        await tab.goto(base + "/projects/news");
        assert.equal(await tab.locator("#saved-count").textContent(), "0");
        await tab.locator("#saved-articles-toggle").click();
        assert.ok(await tab.getByText("No saved articles yet").isVisible());
        await tab.keyboard.press("Escape");
        await tab.locator('[data-save="politics-1"]').click();
        assert.equal(await tab.locator("#saved-count").textContent(), "1");
        await tab.goto(base + "/projects/newsletterarchive");
        await tab.locator("#show-saved-btn").click();
        assert.ok(await tab.getByText("No saved newsletters yet").isVisible());
        await tab.locator("#show-saved-btn").click();
        await tab.locator("[data-save-newsletter]").first().click();
        await tab.locator("#show-saved-btn").click();
        assert.equal(await tab.locator(".newsletter-card").count(), 1);
        await ctx.close();
      }
    },
  );
  await check(
    "Failed remote imagery has a stable local placeholder",
    async () => {
      const ctx = await browser.newContext();
      await ctx.route("**/picsum.photos/**", (route) => route.abort());
      const tab = await ctx.newPage();
      monitor(tab);
      await tab.goto(base + "/projects/news");
      await tab.waitForFunction(() =>
        [...document.querySelectorAll(".article-card .media-frame img")].every(
          (image) =>
            image.src.endsWith("/branding/news-placeholder.svg") &&
            image.naturalWidth > 0,
        ),
      );
      await tab.locator('[data-breaking="science"]').click();
      await tab.waitForFunction(() =>
        document
          .getElementById("breaking-image")
          .src.endsWith("/branding/news-placeholder.svg"),
      );
      await ctx.close();
    },
  );
  await check(
    "No-JavaScript fallback links, and failed iframe launch link",
    async () => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const tab = await ctx.newPage();
      for (const project of projectData.filter(p => p.type === "imageGallery")) {
        await tab.goto(base + "/project/" + project.id + "/");
        assert.deepEqual(
          await tab.locator(".gallery-item[href]").evaluateAll(elements => elements.map(element => element.getAttribute("href"))),
          project.galleryImages.map(image => image.original ?? image.src),
        );
      }
      await tab.goto(base + "/project/html-news/");
      assert.ok(await tab.locator(".demo-preview").isVisible());
      assert.equal(await tab.locator("iframe").getAttribute("src"), null);
      await ctx.close();
      const ctx2 = await browser.newContext();
      await ctx2.route("**/projects/news?embedded=1", (route) => route.abort());
      const tab2 = await ctx2.newPage();
      await tab2.goto(base + "/project/html-news/");
      assert.ok(
        await tab2
          .getByRole("link", { name: "Open Full Demo" })
          .first()
          .isVisible(),
      );
      await ctx2.close();
    },
  );
  await check(
    "Effective 200% zoom reflow and reduced-motion layout",
    async () => {
      const ctx = await browser.newContext({
        viewport: { width: 720, height: 500 },
        deviceScaleFactor: 2,
        reducedMotion: "reduce",
      });
      const tab = await ctx.newPage();
      monitor(tab);
      for (const route of [
        "/",
        "/project/pharmacy-app/",
        "/projects/glacier",
        "/projects/news",
        "/projects/newsletterarchive",
      ]) {
        await tab.goto(base + route);
        await overflow(tab);
      }
      await ctx.close();
    },
  );
  await check(
    "Normal-motion glacier table animation reaches the selected year",
    async () => {
      const ctx = await browser.newContext({ reducedMotion: "no-preference" });
      const tab = await ctx.newPage();
      monitor(tab);
      await tab.goto(base + "/projects/glacier");
      await tab
        .getByRole("button", { name: "Select year 2024", exact: true })
        .click();
      await tab.waitForFunction(
        () => document.getElementById("year-display").textContent === "2024",
      );
      assert.equal(await tab.locator("#volume-value").textContent(), "500 Gt");
      await ctx.close();
    },
  );
  await check(
    "Tablet filters, collapsed groups, reading progress and mobile refresh",
    async () => {
      await page.setViewportSize({ width: 768, height: 850 });
      await page.goto(base + "/projects/newsletterarchive");
      await page.locator("#filter-toggle").click();
      assert.ok(await page.locator("#archive-filters").isVisible());
      await page.locator("summary").filter({ hasText: "Categories" }).click();
      assert.ok(!(await page.locator("#category-filter").isVisible()));
      await page.locator("summary").filter({ hasText: "Categories" }).click();
      await page.locator("summary").filter({ hasText: "Tags" }).click();
      assert.ok(!(await page.locator("#tag-filter").isVisible()));
      await page.locator("#filter-toggle").click();
      await page.locator(".newsletter-open").first().click();
      await page.locator("[data-fullscreen]").click();
      assert.ok(
        Number(
          await page.locator("#reading-progress").getAttribute("aria-valuenow"),
        ) >= 0,
      );
      await page
        .locator("#reading-body")
        .evaluate((element) => (element.scrollTop = element.scrollHeight));
      await page.waitForFunction(
        () =>
          document
            .getElementById("reading-progress")
            .getAttribute("aria-valuenow") === "100",
      );
      await page.keyboard.press("Escape");
      assert.ok(
        await page
          .locator("[data-fullscreen]")
          .evaluate((element) => element === document.activeElement),
      );
      await page.setViewportSize({ width: 375, height: 850 });
      await page.goto(base + "/projects/newsletterarchive");
      await page.evaluate(() => {
        document.dispatchEvent(
          new TouchEvent("touchstart", {
            touches: [
              new Touch({ identifier: 1, target: document.body, clientY: 80 }),
            ],
          }),
        );
        document.dispatchEvent(
          new TouchEvent("touchmove", {
            touches: [
              new Touch({ identifier: 1, target: document.body, clientY: 230 }),
            ],
          }),
        );
      });
      assert.equal(
        await page.locator("#pull-indicator").textContent(),
        "Release to refresh",
      );
      await page.evaluate(() =>
        document.dispatchEvent(new TouchEvent("touchend")),
      );
      assert.equal(
        await page.locator("#pull-indicator").textContent(),
        "Refreshing sample collection…",
      );
      await page.locator("#pull-indicator").waitFor({ state: "hidden" });
      assert.equal(await page.locator(".newsletter-card").count(), 26);
    },
  );
  await check(
    "Copper assets, font loading, and shared touch targets",
    async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.goto(base + "/");
      await page.evaluate(() => document.fonts.ready);
      assert.ok(
        await page.evaluate(
          () =>
            document.fonts.check('16px "DM Sans"') &&
            document.fonts.check('12px "Space Grotesk"'),
        ),
      );
      assert.equal(
        await page.evaluate(
          () => getComputedStyle(document.body).backgroundColor,
        ),
        "rgb(25, 25, 24)",
      );
      const targets = await page
        .locator(".brand,.experience-entry h3 a")
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height),
        );
      assert.ok(targets.every((height) => height >= 44));
      for (const asset of [
        "/app.css",
        "/portfolio-components.css",
        "/demo-components.css",
        "/branding/favicon.svg",
        "/branding/social-home.png",
        "/fonts/dm-sans-variable.ttf",
        "/fonts/space-grotesk-variable.ttf",
      ]) {
        assert.equal((await context.request.get(base + asset)).status(), 200);
      }
      await page.setViewportSize({ width: 320, height: 850 });
      await overflow(page);
    },
  );
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(base + "/");
  await page.screenshot({
    path: path.join(output, "copper-home.jpg"),
    type: "jpeg",
    quality: 90,
  });
  for (const project of projectData.filter((p) => p.demoPath)) {
    await page.goto(
      base + project.demoPath.replace(/\.html$/, "") + "?embedded=1",
    );
    await page.waitForFunction(() => document.fonts.status === "loaded");
    if (project.id === "html-newsletterarchive")
      await page.locator(".newsletter-open").first().click();
    await page.screenshot({ path: path.join(output, project.id + ".png") });
  }
  assert.deepEqual(errors, [], "JavaScript console errors");
  await fs.writeFile(
    path.join(output, "report.json"),
    JSON.stringify({ passed, errors, date: new Date().toISOString() }, null, 2),
  );
  console.log(
    "VERIFIED " + passed.length + " browser checks. Screenshots: " + output,
  );
}
run()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (browser) await browser.close();
  });
