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
const [site, projects, news, newsletters] = await Promise.all(
  ["site", "projects", "demo-news", "demo-newsletters"].map(json),
);
const ids = new Set();
for (const project of projects) {
  if (typeof project.id !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id))
    throw new Error("Invalid project id: " + project.id);
  if (ids.has(project.id)) throw new Error("Duplicate project id: " + project.id);
  ids.add(project.id);
  for (const field of ["title", "category", "description"])
    if (typeof project[field] !== "string" || !project[field].trim())
      throw new Error(`Missing ${field} for project: ${project.id}`);
  if (!Array.isArray(project.technologies) || project.technologies.some(value => typeof value !== "string"))
    throw new Error("Invalid technologies for project: " + project.id);
  if (project.type === "imageGallery") {
    if (!Array.isArray(project.galleryImages) || !project.galleryImages.length)
      throw new Error("Empty gallery for project: " + project.id);
  } else if (project.type !== "htmlProject") {
    throw new Error("Unsupported project type: " + project.type);
  }
}
const images = [
  site.header.image,
  ...projects.flatMap(project => project.type === "imageGallery" ? project.galleryImages : [project.image]),
];
for (const image of images) {
  if (!image || typeof image.src !== "string" || !image.src.startsWith("/"))
    throw new Error("Expected a local image src: " + image?.src);
  if (typeof image.alt !== "string" || !image.alt.trim())
    throw new Error("Missing image alt text: " + image.src);
  if (![image.width, image.height].every(value => Number.isInteger(value) && value > 0))
    throw new Error("Invalid image dimensions: " + image.src);
}
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
  renderHomePage(site, projects),
);
await writeFile(path.join(output, "404.html"), renderNotFoundPage(site));
for (const project of projects) {
  const directory = path.join(output, "project", project.id);
  await mkdir(directory, { recursive: true });
  await writeFile(
    path.join(directory, "index.html"),
    renderProjectPage(site, project, projects),
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
for (const image of images) {
  await assertReference(image.src);
  if (image.original !== undefined) await assertReference(image.original);
}
for (const asset of [
  "/fonts/DM-Sans-OFL.txt",
  "/fonts/Space-Grotesk-OFL.txt",
  "/branding/social-home.png",
  "/branding/news-placeholder.svg",
  ...projects.map((project) => project.socialImage).filter(value => value !== undefined),
])
  await assertReference(asset);
console.log(
  `Built ${2 + projects.length + projects.filter(project => project.demoPath).length} views; validated ${files.length} local files and all referenced assets.`,
);
async function assertReference(reference) {
  if (typeof reference !== "string" || !reference.startsWith("/"))
    throw new Error("Expected a local path: " + reference);
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
