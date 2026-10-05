const NAV_ITEMS = [
  { href: "/#about", label: "About" },
  { href: "/#experience", label: "Experience" },
  { href: "/#projects", label: "Projects" },
  { href: "/#contact", label: "Contact" }
];

export function renderHomePage(site, projects) {
  const body = `
    <div class="main-container">
      ${renderNav(site)}
      <main>
        ${renderHeader(site)}
        ${renderAbout(site)}
        ${renderExperience(site)}
        ${renderProjects(projects)}
        ${renderContact(site)}
      </main>
      ${renderFooter(site)}
    </div>
  `;

  return renderDocument({
    site,
    title: site.defaultTitle,
    description: site.defaultDescription,
    canonicalPath: "/",
    openGraphType: "website",
    openGraphImagePath: site.header.imageSrc,
    body
  });
}

export function renderProjectPage(site, project) {
  const body = `
    <div class="main-container">
      ${renderNav(site)}
      <main>
        <div class="container mt-4">
          <div class="project-details">
            <div class="mb-3">
              <a href="/#projects" class="btn btn-primary">
                <i class="bi bi-arrow-left"></i> Back to Projects
              </a>
            </div>

            <div class="project-details-header">
              <h1>${escapeHtml(project.title)}</h1>
              <p>${escapeHtml(project.description)}</p>
              ${renderProjectLink(project)}
            </div>

            ${renderProjectBody(project)}
          </div>
        </div>
      </main>
      ${renderFooter(site)}
    </div>
  `;

  return renderDocument({
    site,
    title: `${project.title} | Inside Out Software`,
    description: project.description,
    canonicalPath: `/project/${project.id}/`,
    openGraphType: "article",
    openGraphImagePath: project.galleryImages?.[0] ?? project.imgSrc,
    body
  });
}

export function renderNotFoundPage(site) {
  const body = `
    <div class="main-container">
      ${renderNav(site)}
      <main>
        <div class="container mt-4">
          <div class="project-not-found" role="status">
            <h1>Page not found</h1>
            <p>The requested page could not be found. Return to the portfolio home page to browse the current work.</p>
            <a href="/" class="btn btn-primary not-found-link">Back to Home</a>
          </div>
        </div>
      </main>
      ${renderFooter(site)}
    </div>
  `;

  return renderDocument({
    site,
    title: "Not Found | Inside Out Software",
    description: "The requested Inside Out Software page could not be found.",
    canonicalPath: "/404.html",
    openGraphType: "website",
    openGraphImagePath: site.header.imageSrc,
    body
  });
}

function renderDocument({
  site,
  title,
  description,
  canonicalPath,
  openGraphType,
  openGraphImagePath,
  body
}) {
  const siteUrl = site.siteUrl.replace(/\/$/, "");
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const openGraphImageUrl = `${siteUrl}${openGraphImagePath}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <link rel="canonical" href="${escapeHtml(canonicalUrl)}">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:site_name" content="${escapeHtml(site.siteName)}">
  <meta property="og:type" content="${escapeHtml(openGraphType)}">
  <meta property="og:url" content="${escapeHtml(canonicalUrl)}">
  <meta property="og:image" content="${escapeHtml(openGraphImageUrl)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(openGraphImageUrl)}">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
  <link rel="stylesheet" href="/app.css">
  <link rel="stylesheet" href="/portfolio-components.css">
  <link rel="stylesheet" href="/webfonts/font-face.css">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
</head>
<body>
${body}
</body>
</html>`;
}

function renderNav(site) {
  return `
    <div class="nav-container">
      <div class="nav-logo">
        <a href="/">${escapeHtml(site.siteName)}</a>
      </div>
      <div class="nav-links">
        ${NAV_ITEMS.map((item) => `<a href="${item.href}" class="nav-link">${escapeHtml(item.label)}</a>`).join("")}
      </div>
    </div>
  `;
}

function renderHeader(site) {
  return `
    <div class="header-container">
      <div class="header-content">
        <div class="header-img-container">
          <img class="header-img" src="${site.header.imageSrc}" alt="${escapeHtml(site.header.imageAlt)}">
        </div>

        <div class="header-txt-container">
          <h1>${escapeHtml(site.ownerName)}</h1>
          <p class="header-subtitle">${escapeHtml(site.header.tagline)}</p>
          <div class="header-cta">
            <a href="#projects" class="btn btn-primary">View Projects</a>
            <a href="#contact" class="btn btn-outline">Contact Me</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAbout(site) {
  return `
    <section id="about" class="about-section">
      <h2>About</h2>

      <div class="about-content">
        <p>${escapeHtml(site.about.intro)}</p>

        <div class="skills-container">
          <h3>${escapeHtml(site.about.skillsTitle)}</h3>
          <div class="skills-grid">
            ${site.about.skills.map((skill) => `
              <div class="skill-item">
                <i class="${escapeHtml(skill.iconClass)}"></i>
                <span>${escapeHtml(skill.label)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderExperience(site) {
  return `
    <section id="experience" class="work-section">
      <h2>Experience</h2>

      <div class="timeline">
        ${site.experience.map((entry) => `
          <div class="work-entry">
            <div class="work-date">
              <span>${escapeHtml(entry.dates)}</span>
            </div>

            <div class="work-details">
              ${entry.webLink ? `
                <a href="${entry.webLink}" target="_blank" rel="noopener noreferrer" class="work-title-link">
                  <h3 class="work-title">
                    ${escapeHtml(entry.jobTitle)}
                    <span class="material-symbols-outlined title-span">arrow_outward</span>
                  </h3>
                </a>
              ` : `<h3 class="work-title">${escapeHtml(entry.jobTitle)}</h3>`}

              <p class="work-description">${escapeHtml(entry.description)}</p>

              <ul class="tech-list">
                ${entry.techs.map((tech) => `<li class="tech-item">${escapeHtml(tech)}</li>`).join("")}
              </ul>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderProjects(projects) {
  return `
    <section id="projects" class="projects-section">
      <h2>Projects</h2>

      <div class="projects-grid">
        ${projects.map((project) => `
          <a class="project-card" href="/project/${project.id}/" aria-label="View details for ${escapeHtml(project.title)}">
            <div class="project-image-container">
              <img class="project-image" src="${project.imgSrc}" alt="${escapeHtml(project.imgAlt)}">
            </div>

            <div class="project-content">
              <h3 class="project-title">${escapeHtml(project.title)}</h3>
              <p class="project-description">${escapeHtml(createDescriptionPreview(project.description))}</p>
              <div class="project-view">
                <span>View Details</span>
                <i class="bi bi-arrow-right"></i>
              </div>
            </div>
          </a>
        `).join("")}
      </div>
    </section>
  `;
}

function renderContact(site) {
  return `
    <section id="contact" class="contact-section">
      <h2>Contact</h2>

      <div class="contact-content">
        <p>${escapeHtml(site.contact.intro)}</p>

        <div class="contact-methods">
          ${site.contact.methods.map((method) => `
            <a href="${method.href}"${method.external ? ' target="_blank" rel="noopener noreferrer"' : ""} class="contact-method">
              <i class="${escapeHtml(method.iconClass)}"></i>
              <span>${escapeHtml(method.label)}</span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `;
}

function renderFooter(site) {
  return `
    <footer>
      <div class="footer-content">
        <p>&copy; ${new Date().getFullYear()} ${escapeHtml(site.siteName)}. All rights reserved.</p>
      </div>
    </footer>
  `;
}

function renderProjectLink(project) {
  if (!project.link) {
    return "";
  }

  return `
    <a href="${project.link}" target="_blank" rel="noopener noreferrer" class="project-link">
      <span>Visit Project</span>
      <i class="bi bi-box-arrow-up-right"></i>
    </a>
  `;
}

function renderProjectBody(project) {
  if (project.type === "imageGallery") {
    return `
      <div class="project-gallery">
        <div class="gallery-grid">
          ${project.galleryImages.map((image, index) => `
            <div class="gallery-item">
              <img class="gallery-image${project.border ? " img-border" : ""}" src="${image}" alt="${escapeHtml(`${project.title} screenshot ${index + 1}`)}">
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  if (project.type === "htmlProject") {
    return `
      <div class="web-project-container">
        <div class="html-project-container">
          <iframe src="${project.demoPath}" class="html-project-frame" title="${escapeHtml(project.title)}" scrolling="yes"></iframe>
        </div>
      </div>
    `;
  }

  throw new Error(`Unsupported project type: ${project.type}`);
}

function createDescriptionPreview(description) {
  return description.length > 100 ? `${description.slice(0, 100)}...` : description;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
