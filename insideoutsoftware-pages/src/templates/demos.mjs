import { brand, renderDocument, escapeHtml, demoUrl } from "./render.mjs";
const e = escapeHtml;
const closeButton =
  '<button class="button subtle" type="button" data-dialog-close>Close ×</button>';
function demoPage(site, project, body, script, data) {
  const content = `<a class="skip-link" href="#main">Skip to content</a><header class="demo-chrome shell">${brand()}<a class="text-link" href="/project/${e(project.id)}/">← Back to ${e(project.title)}</a></header><main id="main" class="shell demo-content">${body}</main><footer class="demo-footer shell"><span>Inside Out Software · ${e(project.title)}</span><a href="/project/${e(project.id)}/">Back to project →</a></footer>${data ? `<script type="application/json" id="demo-data">${JSON.stringify(data).replaceAll("<", "\\u003c")}</script>` : ""}<script src="/js/${script}.js" defer></script>`;
  return renderDocument({
    site,
    title: `${project.title} demo | Inside Out Software`,
    description: project.description,
    path: demoUrl(project),
    image: `/branding/social-${project.id}.png`,
    body: content,
    demo: true,
  });
}
export function renderGlacier(site, project) {
  return demoPage(
    site,
    project,
    `<header class="demo-heading"><p class="eyebrow">Data visualization / Illustrative data</p><h1>Glacier Melt</h1><p>Explore illustrative glacier retreat and meltwater calculations from 1990 to 2024.</p></header><div class="glacier-layout"><section class="demo-panel glacier-timeline"><div class="panel-heading"><h2>Glacier illustration</h2><span class="data-label" id="year-display">1990</span></div><div class="glacier-landscape" aria-label="Illustration of ice coverage"><div class="glacier-shape" id="glacier-shape"></div><span class="landscape-label">Illustrative ice coverage</span></div><p id="coverage-text" aria-live="polite">Area covered by ice: High</p><label class="field-label" for="timeline-slider">Select a year</label><input id="timeline-slider" type="range" min="1990" max="2024" step="1" value="1990"><div class="year-markers"><span>1990</span><span>2000</span><span>2010</span><span>2020</span><span>2024</span></div></section><section class="demo-panel glacier-runoff"><h2>Meltwater runoff</h2><div class="runoff-stats"><div><strong id="temp-value">+0.2°C</strong><span>Temperature anomaly</span></div><div><strong id="volume-value">50 Gt</strong><span>Annual melt volume</span></div><div><strong id="impact-value">+0.00 mm</strong><span>Cumulative sea-level rise</span></div></div><div class="flow-track" role="img" aria-label="Relative annual melt volume"><div id="flow-water" class="flow-water"></div></div><p class="flow-output">Estimated flow <strong id="flow-rate">1585 K L/s</strong></p><p class="demo-note">The shapes and calculations demonstrate an interactive dashboard. They are not observations or a live monitoring feed.</p></section></div><section class="demo-panel glacier-table"><div class="panel-heading"><h2>Glacier data overview</h2><p class="eyebrow">Select a row to explore a year</p></div><div class="table-scroll"><table><caption class="visually-hidden">Illustrative glacier data, 1990 through 2024</caption><thead><tr><th scope="col">Year</th><th scope="col">Est. ice area (km²)</th><th scope="col">Annual melt (Gt)</th><th scope="col">Sea-level rise (mm)</th></tr></thead><tbody id="data-rows"></tbody></table></div></section>`,
    "glacier",
  );
}
export function renderNews(site, project, data) {
  return demoPage(
    site,
    project,
    `<header class="demo-heading news-heading"><div><p class="eyebrow">Interactive interface / Sample content</p><h1>News Explorer</h1><p>Sample stories, saved articles, and simulated updates every 20 seconds.</p></div><button id="saved-articles-toggle" class="button subtle" type="button">Saved articles <span id="saved-count">0</span></button></header><section class="news-ticker" aria-label="Sample headlines"><span class="eyebrow">Sample headlines</span><div class="ticker-viewport"><div class="ticker-items"><button type="button" data-breaking="economics">Global markets react to new economic data ↗</button><button type="button" data-breaking="health">AI-powered medical diagnostics ↗</button><button type="button" data-breaking="science">A new mission to Mars ↗</button></div></div></section><div id="news-sections"></div><dialog id="breaking-dialog" class="article-dialog" aria-labelledby="breaking-title"><div class="dialog-heading"><h2 id="breaking-title"></h2>${closeButton}</div><p class="eyebrow">Fictional sample headline</p><div class="media-frame"><img id="breaking-image" alt="Sample story illustration" width="800" height="500"></div><p id="breaking-content"></p></dialog><dialog id="saved-dialog" class="saved-dialog" aria-labelledby="saved-title"><div class="dialog-heading"><h2 id="saved-title">Saved articles</h2>${closeButton}</div><p class="demo-note">Saved in this browser. This collection contains sample content.</p><div id="saved-articles-container" class="articles-grid"></div></dialog>`,
    "news",
    data,
  );
}
export function renderArchive(site, project, data) {
  return demoPage(
    site,
    project,
    `<div id="pull-indicator" class="pull-indicator" role="status" hidden>Pull down to refresh</div><header class="demo-heading"><p class="eyebrow">Search & reading / Sample collection</p><h1>Newsletter Archive</h1><p>Find, filter, and read a local collection of sample corporate newsletters.</p></header><div class="archive-toolbar"><button id="filter-toggle" class="button subtle" aria-expanded="false" aria-controls="archive-filters" type="button">Filters ＋</button><button id="show-saved-btn" class="button subtle" aria-pressed="false" type="button">Show Saved</button><p id="results-count" aria-live="polite"></p></div><div class="archive-layout"><aside id="archive-filters" class="archive-filters" aria-label="Newsletter filters"><div class="field"><label for="search">Search newsletters</label><input id="search" type="search" placeholder="Search title or content…"></div><details open><summary>Categories</summary><div id="category-filter" class="check-list"></div></details><details open><summary>Tags</summary><div id="tag-filter" class="check-list"></div></details><div class="field"><label for="date-filter">Date range</label><select id="date-filter"><option value="all">All Time</option><option value="last-month">Last Month</option><option value="last-quarter">Last Quarter</option><option value="last-year">Last Year</option><option value="custom">Custom Range</option></select></div><div id="custom-date-range" hidden><div class="field"><label for="date-from">From</label><input type="date" id="date-from" aria-describedby="date-error"></div><div class="field"><label for="date-to">To</label><input type="date" id="date-to" aria-describedby="date-error"></div></div><p id="date-error" class="status-message" role="alert" hidden>The start date must be on or before the end date.</p><div class="field"><label for="sort-order">Sort by</label><select id="sort-order"><option value="newest">Newest First</option><option value="oldest">Oldest First</option></select></div></aside><section aria-label="Newsletter results"><div id="newsletter-grid" class="newsletter-grid"></div><div id="no-results" class="empty-state" hidden><h2>No matching newsletters</h2><p id="empty-message">Try another search or adjust your filters.</p></div></section><aside id="preview-pane" class="reader-pane" aria-label="Newsletter preview"><div id="preview-placeholder" class="reader-placeholder"><span class="eyebrow">Reading desk</span><h2>Take a closer look.</h2><p>Select a newsletter to preview it here.</p></div><div id="preview-content" hidden></div></aside></div><dialog id="reading-dialog" class="reading-dialog" aria-labelledby="reading-title"><div class="dialog-heading"><h2 id="reading-title"></h2>${closeButton}</div><p id="reading-date" class="eyebrow"></p><div class="reading-track"><div id="reading-progress" role="progressbar" aria-label="Reading progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"></div></div><div id="reading-body" class="reading-body"></div><div class="reader-navigation"><button class="button subtle" type="button" data-reader-prev>← Previous</button><button class="button subtle" type="button" data-reader-next>Next →</button></div></dialog>`,
    "archive",
    data,
  );
}
