import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  renderHomePage,
  renderNotFoundPage,
  renderProjectPage,
} from "../src/templates/render.mjs";
import {
  renderGlacier,
  renderNews,
  renderArchive,
} from "../src/templates/demos.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "src"),
  output = path.join(root, "dist");
const json = async (name) =>
  JSON.parse(await readFile(path.join(source, "data", name + ".json"), "utf8"));
const [site, projects, images, news, newsletters] = await Promise.all(
  ["site", "projects", "images", "demo-news", "demo-newsletters"].map(json),
);
await mkdir(output, { recursive: true });
const expected = new Set(
  (await walk(path.join(source, "static")))
    .filter((file) => !path.basename(file).startsWith("."))
    .map((file) =>
      path.join(output, path.relative(path.join(source, "static"), file)),
    ),
);
for (const route of [
  "index.html",
  "404.html",
  ...projects.map((project) => "project/" + project.id + "/index.html"),
  ...projects
    .filter((project) => project.demoPath)
    .map((project) => project.demoPath.slice(1)),
])
  expected.add(path.join(output, route));
await cp(path.join(source, "static"), output, { recursive: true });
await writeFile(
  path.join(output, "index.html"),
  renderHomePage(site, projects, images),
);
await writeFile(path.join(output, "404.html"), renderNotFoundPage(site));
for (const project of projects) {
  const directory = path.join(output, "project", project.id);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "index.html"),
    renderProjectPage(site, project, images, projects),
  );
  if (project.type === "htmlProject") {
    const renderer = {
      "html-glacier": () => renderGlacier(site, project),
      "html-news": () => renderNews(site, project, news),
      "html-newsletterarchive": () => renderArchive(site, project, newsletters),
    }[project.id];
    if (!renderer) throw new Error("Missing demo renderer: " + project.id);
    await mkdir(path.dirname(path.join(output, project.demoPath)), {
      recursive: true,
    });
    await writeFile(path.join(output, project.demoPath), renderer());
  }
}
// Keep the served directory stable during local rebuilds, and remove only obsolete files.
for (const file of await walk(output)) if (!expected.has(file)) await rm(file);
const files = await walk(output);
for (const file of files.filter((file) => /\.(html|css)$/.test(file))) {
  const contents = await readFile(file, "utf8");
  const references = file.endsWith(".html")
    ? [
        ...contents.matchAll(
          /(?:src|href|data-demo-src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g,
        ),
      ].map((match) => match[1])
    : [...contents.matchAll(/url\(['"]?(\/[^)'"?#]+)/g)].map(
        (match) => match[1],
      );
  for (const reference of references) await assertReference(reference);
}
for (const [reference, image] of Object.entries(images)) {
  await assertReference(reference);
  await assertReference(image.preview);
  if (!image.width || !image.height)
    throw new Error("Missing image dimensions: " + reference);
}
for (const asset of [
  "/fonts/DM-Sans-OFL.txt",
  "/fonts/Space-Grotesk-OFL.txt",
  "/branding/social-home.png",
  "/branding/news-placeholder.svg",
  ...projects.map((project) => "/branding/social-" + project.id + ".png"),
])
  await assertReference(asset);
console.log(
  `Built 11 Copper Studio views; validated ${files.length} local files and all referenced assets.`,
);
async function assertReference(reference) {
  const absolute = path.resolve(output, "." + reference);
  if (absolute !== output && !absolute.startsWith(output + path.sep))
    throw new Error("Invalid local path: " + reference);
  const candidates = [
    absolute,
    path.join(absolute, "index.html"),
    absolute + ".html",
  ];
  for (const candidate of candidates) {
    try {
      if ((await stat(candidate)).isFile()) return;
    } catch (error) {
      if (error.code !== "ENOENT" && error.code !== "ENOTDIR") throw error;
    }
  }
  throw new Error("Missing local asset or route: " + reference);
}
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? walk(path.join(directory, entry.name))
          : path.join(directory, entry.name),
      ),
    )
  ).flat();
}
