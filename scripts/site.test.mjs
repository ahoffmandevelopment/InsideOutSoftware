import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
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
const [site, projects] = await Promise.all(
  ["site", "projects"].map(json),
);
const output = async (route) =>
  readFile(new URL("../dist/" + route, import.meta.url), "utf8");

test("a gallery project can be added using only its data and images", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "portfolio-gallery-"));
  const run = promisify(execFile);
  try {
    await cp(new URL("../src/", import.meta.url), path.join(directory, "src"), { recursive: true });
    await mkdir(path.join(directory, "scripts"));
    const build = path.join(directory, "scripts/build.mjs");
    await cp(new URL("./build.mjs", import.meta.url), build);
    const project = {
      id: "new-app",
      type: "imageGallery",
      title: "New App",
      category: "Mobile",
      description: "A newly added gallery project.",
      technologies: [".NET MAUI"],
      galleryImages: [],
    };
    const projectFile = path.join(directory, "src/data/projects.json");
    const save = async (data) => writeFile(projectFile, JSON.stringify(data));
    const imageDirectory = path.join(directory, "src/static/Images/NewApp");
    await mkdir(imageDirectory, { recursive: true });
    const exampleImage = new URL("../src/static" + site.header.image.src, import.meta.url);
    const galleryImages = [];
    for (let index = 1; index <= 7; index++) {
      await cp(exampleImage, path.join(imageDirectory, `screen-${index}.webp`));
      await cp(exampleImage, path.join(imageDirectory, `original-${index}.webp`));
      galleryImages.push({
        src: `/Images/NewApp/screen-${index}.webp`,
        ...(index % 2 === 0 ? { original: `/Images/NewApp/original-${index}.webp` } : {}),
        alt: `New App screenshot ${index}`,
        width: site.header.image.width,
        height: site.header.image.height,
      });
    }
    for (const count of [1, 2, 7]) {
      project.galleryImages = galleryImages.slice(0, count);
      await save([...projects, project]);
      await run(process.execPath, [build]);
      const home = await readFile(path.join(directory, "dist/index.html"), "utf8");
      const detail = await readFile(path.join(directory, "dist/project/new-app/index.html"), "utf8");
      assert.match(home, /href="\/project\/new-app\/"/);
      const card = home.match(/<a class="project-card" href="\/project\/new-app\/".*?<\/a>/s)[0];
      assert.ok(card.includes('src="' + project.galleryImages[0].src + '"'));
      assert.ok(card.includes(project.description));
      assert.doesNotMatch(detail, /class="project-overview"|undefined|social-new-app/);
      assert.match(detail, /property="og:image" content="https:\/\/insideoutsoftware.com\/branding\/social-home.png"/);
      assert.deepEqual(
        [...detail.matchAll(/class="gallery-item" href="([^"]+)"/g)].map(match => match[1]),
        project.galleryImages.map(image => image.original ?? image.src),
      );
      assert.ok(detail.includes('/project/' + projects.at(-1).id + '/'));
      const previous = await readFile(path.join(directory, "dist/project", projects.at(-1).id, "index.html"), "utf8");
      assert.ok(previous.includes('/project/new-app/'));
    }
    const expectFailure = async (data, message) => {
      await save(data);
      await assert.rejects(run(process.execPath, [build]), error => {
        assert.match(error.stderr, message);
        return true;
      });
    };
    await expectFailure([...projects, { ...project, id: projects[0].id }], /Duplicate project id/);
    await expectFailure([...projects, { ...project, galleryImages: [] }], /Empty gallery/);
    await expectFailure([...projects, { ...project, galleryImages: [{ ...project.galleryImages[0], width: 0 }] }], /Invalid image dimensions/);
    await expectFailure([...projects, { ...project, galleryImages: [{ ...project.galleryImages[0], src: "/Images/missing.webp" }] }], /Missing local asset/);
    await expectFailure([...projects, { ...project, galleryImages: [{ ...project.galleryImages[0], original: "/Images/missing.png" }] }], /Missing local asset/);
    await expectFailure([...projects, { ...project, socialImage: "/branding/missing.png" }], /Missing local asset/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("all generated views retain their routes and page metadata", async () => {
  const routes = [
    "index.html",
    "404.html",
    ...projects.map((project) => "project/" + project.id + "/index.html"),
    ...projects
      .filter((project) => project.demoPath)
      .map((project) => project.demoPath.slice(1)),
  ];
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
test("homepage covers all project links, employment entries, and original anchors", () => {
  const html = renderHomePage(site, projects);
  for (const project of projects)
    assert.ok(html.includes('href="/project/' + project.id + '/"'));
  for (const id of ["projects", "about", "experience", "contact"])
    assert.ok(html.includes('id="' + id + '"'));
  assert.equal((html.match(/class="experience-entry"/g) || []).length, site.experience.length);
});
test("gallery covers fit their orientation and websites expose a live link", () => {
  const project = {
    ...projects[0],
    websiteUrl: "https://example.com/?a=1&b=2",
    galleryImages: [{ ...projects[0].galleryImages[0], width: 1440, height: 1000 }],
  };
  const card = (data) => renderHomePage(site, [data, ...projects.slice(1)])
    .match(/<a class="project-card".*?<\/a>/s)[0];
  assert.match(card(project), /project-stage web-stage/);
  assert.doesNotMatch(card(project), /class="phone"/);
  assert.match(card(projects[0]), /project-stage mobile-stage.*class="phone"/);
  const detail = renderProjectPage(site, project, [project]);
  assert.match(detail, /href="https:\/\/example.com\/\?a=1&amp;b=2" target="_blank" rel="noopener noreferrer">Visit website/);
  assert.doesNotMatch(renderProjectPage(site, projects[0], projects), /Visit website/);
});
test("each gallery keeps its images in order with fallback links", async () => {
  for (const project of projects.filter(
    (project) => project.type === "imageGallery",
  )) {
    const html = renderProjectPage(site, project, projects),
      references = [
        ...html.matchAll(/class="gallery-item" href="([^"]+)"/g),
      ].map((match) => match[1]);
    assert.deepEqual(references, project.galleryImages.map(image => image.original ?? image.src));
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
    const html = renderProjectPage(site, project, projects),
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
  const html = renderProjectPage(site, project, projects);
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
    const html = renderProjectPage(site, project, projects),
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
