import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import vm from "node:vm";
import {
  renderHomePage,
  renderProjectPage,
  escapeHtml,
} from "../src/templates/render.mjs";
import { renderNews } from "../src/templates/demos.mjs";
const json = async (name) =>
  JSON.parse(
    await readFile(
      new URL("../src/data/" + name + ".json", import.meta.url),
      "utf8",
    ),
  );
const [site, projects, images] = await Promise.all(
  ["site", "projects", "images"].map(json),
);
const output = async (route) =>
  readFile(new URL("../dist/" + route, import.meta.url), "utf8");

test("all eleven generated views retain their routes and page metadata", async () => {
  const routes = [
    "index.html",
    "404.html",
    ...projects.map((project) => "project/" + project.id + "/index.html"),
    ...projects
      .filter((project) => project.demoPath)
      .map((project) => project.demoPath.slice(1)),
  ];
  assert.equal(routes.length, 11);
  for (const route of routes) {
    const html = await output(route);
    assert.match(html, /<title>[^<]+<\/title>/);
    assert.match(
      html,
      /<link rel="canonical" href="https:\/\/insideoutsoftware.com/,
    );
    assert.match(html, /name="description"/);
    assert.match(html, /Skip to content/);
    assert.doesNotMatch(
      html,
      /cdn\.tailwindcss|bootstrap\.min|material-symbols|\[b-[a-z0-9]+\]/i,
    );
  }
  assert.match(await output("404.html"), /name="robots" content="noindex"/);
});
test("homepage covers all project links, four roles, and original anchors", () => {
  const html = renderHomePage(site, projects, images);
  for (const project of projects)
    assert.ok(html.includes('href="/project/' + project.id + '/"'));
  for (const id of ["projects", "about", "experience", "contact"])
    assert.ok(html.includes('id="' + id + '"'));
  assert.equal((html.match(/class="experience-entry"/g) || []).length, 4);
  assert.equal(projects.length, 6);
});
test("each gallery keeps all five original images in order with fallback links", async () => {
  for (const project of projects.filter(
    (project) => project.type === "imageGallery",
  )) {
    const html = renderProjectPage(site, project, images, projects),
      references = [
        ...html.matchAll(/class="gallery-item" href="([^"]+)"/g),
      ].map((match) => match[1]);
    assert.equal(references.length, 5);
    assert.deepEqual(references, project.galleryImages);
    for (const reference of references)
      assert.ok(
        (await stat(new URL("../dist" + reference, import.meta.url))).isFile(),
      );
    assert.match(html, /<dialog class="image-viewer"/);
    assert.match(html, /data-viewer-count aria-live="polite"/);
  }
});
test("demo wrappers expose full links and deferred embedded sources", () => {
  for (const project of projects.filter(
    (project) => project.type === "htmlProject",
  )) {
    const html = renderProjectPage(site, project, images, projects),
      url = project.demoPath.replace(/\.html$/, "");
    assert.ok(html.includes('href="' + url + '"'));
    assert.ok(html.includes('data-demo-src="' + url + '?embedded=1"'));
    assert.doesNotMatch(html, /<iframe[^>]*\ssrc=/);
  }
});
test("page content and JSON script data cannot inject markup", () => {
  const attack = '<script>alert("x")</script>&\'"';
  assert.equal(
    escapeHtml(attack),
    "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;&quot;",
  );
  const project = {
    ...projects[0],
    title: attack,
    description: attack,
    overview: attack,
  };
  const html = renderProjectPage(site, project, images, projects);
  assert.ok(html.includes(escapeHtml(attack)));
  assert.ok(!html.includes(attack));
  const news = renderNews(
    site,
    projects.find((project) => project.id === "html-news"),
    { politics: [{ content: "</script><script>bad</script>" }] },
  );
  const payload = news.match(/id="demo-data">(.*?)<\/script>/s)[1];
  assert.deepEqual(JSON.parse(payload), {
    politics: [{ content: "</script><script>bad</script>" }],
  });
  assert.ok(!payload.includes("<"));
});
test("project navigation follows the homepage order", () => {
  projects.forEach((project, index) => {
    const html = renderProjectPage(site, project, images, projects),
      navigation = html.match(/<nav class="project-pagination".*?<\/nav>/s)[0];
    for (const adjacent of [projects[index - 1], projects[index + 1]].filter(
      Boolean,
    ))
      assert.ok(navigation.includes("/project/" + adjacent.id + "/"));
  });
});
test("storage failures and malformed data keep the demo helpers usable", async () => {
  const script = await readFile(
    new URL("../src/static/js/demo-common.js", import.meta.url),
    "utf8",
  );
  for (const storage of [
    {
      getItem: () => "{broken",
      setItem: () => {
        throw new Error("quota");
      },
    },
    {
      getItem: () => {
        throw new Error("disabled");
      },
      setItem: () => {
        throw new Error("disabled");
      },
    },
  ]) {
    const window = {},
      context = {
        window,
        location: { search: "?embedded=1" },
        URLSearchParams,
        localStorage: storage,
        document: {
          documentElement: { classList: { toggle() {} } },
          querySelectorAll: () => [],
          addEventListener() {},
        },
        HTMLImageElement: class {},
      };
    vm.runInNewContext(script, context);
    assert.deepEqual(window.CopperDemo.read("savedArticles", []), []);
    assert.doesNotThrow(() =>
      window.CopperDemo.write("savedArticles", ["politics-1"]),
    );
  }
});
