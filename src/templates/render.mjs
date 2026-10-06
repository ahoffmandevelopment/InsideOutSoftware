const navItems = [
  ["projects", "Projects"],
  ["about", "About"],
  ["experience", "Experience"],
  ["contact", "Contact"],
];
export const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
const e = escapeHtml;
export const demoUrl = (project) => project.demoPath.replace(/\.html$/, "");
export function brand() {
  return '<a class="brand" href="/" aria-label="Inside Out Software home"><span class="brand-mark" aria-hidden="true">io</span><span>Inside Out<br>Software</span></a>';
}
export function renderDocument({
  site,
  title,
  description,
  path = "/",
  image = "/branding/social-home.png",
  body,
  noindex = false,
  demo = false,
}) {
  const origin = site.siteUrl.replace(/\/$/, "");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${e(title)}</title><meta name="description" content="${e(description)}">${noindex ? '<meta name="robots" content="noindex">' : ""}<link rel="canonical" href="${e(origin + path)}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:site_name" content="${e(site.siteName)}"><meta property="og:type" content="${path.startsWith("/project/") ? "article" : "website"}"><meta property="og:url" content="${e(origin + path)}"><meta property="og:image" content="${e(origin + image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${e(title)}"><meta name="twitter:description" content="${e(description)}"><meta name="twitter:image" content="${e(origin + image)}"><link rel="icon" href="/branding/favicon.svg" type="image/svg+xml"><link rel="alternate icon" href="/favicon.ico"><link rel="preload" href="/fonts/dm-sans-variable.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="/app.css"><link rel="stylesheet" href="/${demo ? "demo" : "portfolio"}-components.css"><script src="/js/site.js" defer></script>${demo ? '<script src="/js/demo-common.js" defer></script>' : ""}</head><body${demo ? ' class="demo-page"' : ""}>${body}</body></html>`;
}
function header() {
  return `<a class="skip-link" href="#main">Skip to content</a><header class="site-header shell">${brand()}<button class="menu-toggle button subtle" type="button" aria-expanded="false" aria-controls="site-navigation" hidden>Menu <span aria-hidden="true">＋</span></button><nav id="site-navigation" aria-label="Main navigation">${navItems.map(([id, label]) => `<a href="/#${id}">${label}</a>`).join("")}</nav></header>`;
}
function footer(site) {
  return `<footer class="site-footer shell"><span>© ${new Date().getFullYear()} ${e(site.siteName)} · ${e(site.ownerName)}</span><div>${site.contact.methods
    .filter((m) => m.external)
    .map(
      (m) =>
        `<a href="${e(m.href)}" target="_blank" rel="noopener noreferrer">${m.label.includes("LinkedIn") ? "LinkedIn" : "GitHub"} <span aria-hidden="true">↗</span></a>`,
    )
    .join(
      "",
    )}<a href="${e(site.contact.methods[0].href)}">Get in touch <span aria-hidden="true">↗</span></a></div></footer>`;
}
export function imageTag(
  image,
  { className = "", eager = false } = {},
) {
  return `<img src="${e(image.src)}" width="${image.width}" height="${image.height}" alt="${e(image.alt)}"${className ? ` class="${e(className)}"` : ""} loading="${eager ? "eager" : "lazy"}" decoding="async">`;
}
function phone(image, eager = false) {
  return `<div class="phone">${imageTag(image, { eager })}</div>`;
}
function tags(items) {
  return `<ul class="tags" aria-label="Technologies">${items.map((t) => `<li>${e(t)}</li>`).join("")}</ul>`;
}
function contact(site, compact = false) {
  return `<section id="${compact ? "project-contact" : "contact"}" class="contact-section${compact ? " compact" : ""}"><div><p class="eyebrow">Let’s talk</p><h2>Have something<br>in mind?</h2></div><div><p>${e(site.contact.intro)}</p><div class="contact-links">${site.contact.methods.map((m, i) => `<a class="${i === 0 ? "button" : "text-link"}" href="${e(m.href)}"${m.external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${e(m.label)} <span aria-hidden="true">↗</span></a>`).join("")}</div></div></section>`;
}
function projectCard(project) {
  const cover = project.type === "imageGallery" ? project.galleryImages[0] : project.image;
  const portrait = project.type === "imageGallery" && cover.height > cover.width;
  return `<a class="project-card" href="/project/${e(project.id)}/"><div class="project-stage ${portrait ? "mobile-stage" : "web-stage"}">${portrait ? phone(cover) : imageTag(cover)}</div><div class="card-copy"><p class="eyebrow">${e(project.category)}</p><div class="project-heading"><h3>${e(project.title)}</h3><span class="accent" aria-hidden="true">↗</span></div><p>${e(project.summary ?? project.description)}</p><span class="text-link">View project <span aria-hidden="true">→</span></span></div></a>`;
}
export function renderHomePage(site, projects) {
  const featured = projects.find((p) => p.id === site.header.featuredProjectId);
  if (!featured) throw new Error("Featured project not found");
  const body = `${header()}<main id="main" class="shell"><section class="hero"><div><p class="eyebrow">${e(site.ownerName)} / .NET developer</p><h1>${e(site.header.headline)}<span class="accent">${e(site.header.accentHeadline)}</span></h1><p class="hero-intro">${e(site.header.intro)}</p><a class="button" href="#projects">Explore the work <span aria-hidden="true">↘</span></a></div><a class="hero-feature" href="/project/${e(featured.id)}/" aria-label="Explore ${e(featured.title)}"><div class="feature-label"><span>${e(featured.title)}</span><span>.NET MAUI</span></div><div class="feature-phones">${[featured.galleryImages[0], featured.galleryImages[2]].filter(Boolean).map(image => phone(image, true)).join("")}</div><div class="feature-caption"><span>Prescription history & refills</span><span aria-hidden="true">↗</span></div></a></section><div class="tech-strip" aria-label="Areas of work"><span>Cross-platform mobile</span><span>.NET MAUI / C#</span><span>REST APIs / SQL</span></div><section id="projects"><div class="section-heading"><h2>Selected work</h2><p class="eyebrow">Built to be useful</p></div><div class="projects-grid">${projects.map((p) => projectCard(p)).join("")}</div></section><section id="about" class="about-section"><div><p class="eyebrow">The person behind the work</p><h2>Andrew Hoffman.</h2>${imageTag(site.header.image, { className: "headshot" })}</div><div><p>${e(site.about.intro)}</p><h3>${e(site.about.skillsTitle)}</h3>${tags(site.about.skills.map((s) => s.label))}</div></section><section id="experience"><div class="section-heading"><h2>Experience</h2><p class="eyebrow">Mobile, APIs & delivery</p></div><div class="experience-list">${site.experience.map((entry) => `<article class="experience-entry"><p class="experience-date">${e(entry.dates)}</p><div><h3>${entry.webLink ? `<a href="${e(entry.webLink)}" target="_blank" rel="noopener noreferrer">${e(entry.jobTitle)} <span class="accent" aria-hidden="true">↗</span></a>` : e(entry.jobTitle)}</h3><ul class="contributions">${entry.contributions.map((text) => `<li>${e(text)}</li>`).join("")}</ul>${tags(entry.techs)}</div></article>`).join("")}</div></section>${contact(site)}</main>${footer(site)}`;
  return renderDocument({
    site,
    title: site.defaultTitle,
    description: site.defaultDescription,
    body,
  });
}
function gallery(project) {
  return `<section class="project-gallery" aria-labelledby="screenshots-title"><div class="section-heading"><h2 id="screenshots-title">A closer look</h2><p class="eyebrow">${project.galleryImages.length} screenshots</p></div><div class="gallery-grid">${project.galleryImages.map((image, i) => `<a class="gallery-item" href="${e(image.original ?? image.src)}" data-gallery="${e(project.id)}" data-caption="${e(project.title)} — screen ${i + 1}" aria-label="Enlarge ${e(project.title)} screen ${i + 1}">${imageTag(image)}<span>Screen ${String(i + 1).padStart(2, "0")} <span aria-hidden="true">＋</span></span></a>`).join("")}</div></section><dialog class="image-viewer" aria-labelledby="viewer-caption"><div class="viewer-header"><p id="viewer-caption"></p><button class="button subtle" type="button" data-viewer-close>Close <span aria-hidden="true">×</span></button></div><div class="viewer-image" role="region" aria-label="Full-size screenshot" tabindex="0"><img alt="" width="1" height="1"></div><div class="viewer-controls"><button class="button subtle" type="button" data-viewer-previous>← Previous</button><span data-viewer-count aria-live="polite"></span><button class="button subtle" type="button" data-viewer-next>Next →</button></div></dialog>`;
}
function interactiveDemo(project) {
  return `<section class="demo-section" aria-labelledby="demo-title"><div class="section-heading"><h2 id="demo-title">Try the demo</h2><a class="text-link" href="${e(demoUrl(project))}" target="_blank" rel="noopener noreferrer">Open Full Demo <span aria-hidden="true">↗</span></a></div><p class="demo-note">${project.id === "html-glacier" ? "Illustrative calculations." : "Local sample content."} Explore the interface, or open the full demo in its own tab.</p><div class="demo-preview">${imageTag(project.image)}<a class="button" href="${e(demoUrl(project))}" target="_blank" rel="noopener noreferrer">Open Full Demo <span aria-hidden="true">↗</span></a></div><iframe class="demo-frame" data-demo-src="${e(demoUrl(project))}?embedded=1" title="${e(project.title)} interactive demo" hidden></iframe><noscript><p><a class="text-link" href="${e(demoUrl(project))}">Open the standalone demo →</a></p></noscript></section>`;
}
export function renderProjectPage(site, project, projects) {
  const index = projects.findIndex((p) => p.id === project.id),
    previous = projects[index - 1],
    next = projects[index + 1];
  const body = `${header()}<main id="main" class="shell"><a class="back-link text-link" href="/#projects">← Back to Projects</a><section class="project-intro"><p class="eyebrow">${e(project.category)}</p><h1>${e(project.title)}</h1><p class="project-description">${e(project.description)}</p>${tags(project.technologies)}${project.websiteUrl ? `<a class="text-link" href="${e(project.websiteUrl)}" target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span></a>` : ""}</section>${project.overview ? `<section class="project-overview"><h2>What it does</h2><p>${e(project.overview)}</p></section>` : ""}${project.type === "imageGallery" ? gallery(project) : interactiveDemo(project)}<nav class="project-pagination" aria-label="Browse projects">${previous ? `<a href="/project/${e(previous.id)}/"><span class="eyebrow">← Previous project</span><span>${e(previous.title)}</span></a>` : "<span></span>"}${next ? `<a href="/project/${e(next.id)}/"><span class="eyebrow">Next project →</span><span>${e(next.title)}</span></a>` : "<span></span>"}</nav>${contact(site, true)}</main>${footer(site)}`;
  return renderDocument({
    site,
    title: `${project.title} | Inside Out Software`,
    description: project.description,
    path: `/project/${project.id}/`,
    image: project.socialImage,
    body,
  });
}
export function renderNotFoundPage(site) {
  return renderDocument({
    site,
    title: "Page not found | Inside Out Software",
    description:
      "Return to the Inside Out Software portfolio to browse Andrew Hoffman’s work.",
    path: "/404.html",
    noindex: true,
    body: `${header()}<main id="main" class="shell not-found"><p class="eyebrow">404 / Page not found</p><h1>This page took<br>a wrong turn.</h1><p>The page you’re looking for isn’t here. You can return home or take a look at the current projects.</p><div class="not-found-actions"><a class="button" href="/">Back to Home →</a><a class="text-link" href="/#projects">Browse Projects →</a></div></main>${footer(site)}`,
  });
}
