import { cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { renderHomePage, renderNotFoundPage, renderProjectPage } from "../src/templates/render.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const srcDir = path.join(repoRoot, "src");
const distDir = path.join(repoRoot, "dist");

const site = await readJson(path.join(srcDir, "data", "site.json"));
const projects = await readJson(path.join(srcDir, "data", "projects.json"));

await rm(distDir, { force: true, recursive: true });
await mkdir(distDir, { recursive: true });
await cp(path.join(srcDir, "static"), distDir, { recursive: true });

await buildStyles();
await writeFile(path.join(distDir, "index.html"), renderHomePage(site, projects));
await writeFile(path.join(distDir, "404.html"), renderNotFoundPage(site));

for (const project of projects) {
  const projectDir = path.join(distDir, "project", project.id);
  await mkdir(projectDir, { recursive: true });
  await writeFile(path.join(projectDir, "index.html"), renderProjectPage(site, project));
}

await validateLocalReferences(site, projects);

async function buildStyles() {
  const scopedCss = await readFile(path.join(srcDir, "static", "portfolio-components.css"), "utf8");
  const staticOverrides = await readFile(path.join(srcDir, "templates", "static-overrides.css"), "utf8");
  const sanitizedCss = scopedCss.replaceAll(/\[b-[a-z0-9]+\]/g, "");
  const finalCss = `${sanitizedCss.trim()}\n\n${staticOverrides.trim()}\n`;

  await writeFile(path.join(distDir, "portfolio-components.css"), finalCss);
}

async function validateLocalReferences(siteData, projectData) {
  const references = [
    siteData.header.imageSrc,
    "/favicon.ico",
    ...projectData.flatMap((project) => {
      const files = [project.imgSrc];

      if (project.type === "imageGallery") {
        files.push(...project.galleryImages);
      }

      if (project.type === "htmlProject") {
        files.push(project.demoPath);
      }

      return files;
    })
  ];

  for (const reference of references) {
    await assertPathExists(reference);
  }
}

async function assertPathExists(reference) {
  if (!reference.startsWith("/")) {
    throw new Error(`Expected a root-relative path but received: ${reference}`);
  }

  const filePath = path.join(distDir, reference.slice(1));
  await stat(filePath);
}

async function readJson(filePath) {
  const content = await readFile(filePath, "utf8");
  return JSON.parse(content);
}
