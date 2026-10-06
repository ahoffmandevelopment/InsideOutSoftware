(() => {
  const { escape: e, read, write, open } = CopperDemo,
    data = JSON.parse(document.getElementById("demo-data").textContent),
    all = new Map(),
    expanded = new Set(),
    collapsed = new Set();
  const sections = document.getElementById("news-sections"),
    savedDialog = document.getElementById("saved-dialog");
  Object.values(data)
    .flat()
    .forEach((article) => {
      article.date = new Date(Date.now() - article.ageHours * 3600000);
      all.set(article.id, article);
    });
  const stored = read("savedArticles", []),
    saved = new Set(
      Array.isArray(stored)
        ? stored.filter((id) => typeof id === "string" && all.has(id))
        : [],
    );
  const names = { politics: "Politics", tech: "Tech", sports: "Sports" };
  function card(article, context) {
    const id = e(article.id),
      key = context + "-" + id,
      isExpanded = expanded.has(key);
    return `<article class="article-card" data-article="${id}"><div class="media-frame"><img src="${e(article.image)}" width="800" height="500" alt="Decorative sample story image" loading="lazy"></div><div class="article-copy"><p class="eyebrow">Sample / ${e(article.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }))}</p><h3>${e(article.title)}</h3><p class="article-summary">${e(article.summary)}</p><div class="article-body" id="${key}"${isExpanded ? "" : " hidden"}><p>${e(article.content)}</p></div><div class="article-actions"><button class="button subtle" type="button" data-expand="${key}" aria-expanded="${isExpanded}" aria-controls="${key}">${isExpanded ? "Close preview" : "Read preview"}</button><button class="button subtle save-article" type="button" data-save="${id}" aria-pressed="${saved.has(article.id)}">${saved.has(article.id) ? "Saved ✓" : "Save article"}</button></div></div></article>`;
  }
  function render() {
    sections.innerHTML = Object.entries(data)
      .map(
        ([category, articles]) =>
          `<section class="news-section"><h2 class="category-heading"><button class="category-toggle" type="button" data-category="${category}" aria-expanded="${!collapsed.has(category)}" aria-controls="section-${category}"><span class="category-name">${names[category]}</span><span data-category-label>${collapsed.has(category) ? "Expand ＋" : "Collapse −"}</span></button></h2><div class="articles-grid" id="section-${category}"${collapsed.has(category) ? " hidden" : ""}>${articles.map((article) => card(article, "main")).join("")}</div></section>`,
      )
      .join("");
  }
  function updateSaved() {
    document.getElementById("saved-count").textContent = saved.size;
    document.querySelectorAll("[data-save]").forEach((button) => {
      const isSaved = saved.has(button.dataset.save);
      button.setAttribute("aria-pressed", String(isSaved));
      button.textContent = isSaved ? "Saved ✓" : "Save article";
    });
    write("savedArticles", [...saved]);
  }
  function renderSaved() {
    document.getElementById("saved-articles-container").innerHTML = saved.size
      ? [...saved].map((id) => card(all.get(id), "saved")).join("")
      : '<div class="empty-state"><h3>No saved articles yet</h3><p>Save a sample story to keep it here.</p></div>';
  }
  document.addEventListener("click", (event) => {
    const category = event.target.closest("[data-category]");
    if (category) {
      const key = category.dataset.category;
      collapsed.has(key) ? collapsed.delete(key) : collapsed.add(key);
      category.setAttribute("aria-expanded", String(!collapsed.has(key)));
      category.querySelector("[data-category-label]").textContent =
        collapsed.has(key) ? "Expand ＋" : "Collapse −";
      document.getElementById("section-" + key).hidden = collapsed.has(key);
      return;
    }
    const preview = event.target.closest("[data-expand]");
    if (preview) {
      const key = preview.dataset.expand;
      expanded.has(key) ? expanded.delete(key) : expanded.add(key);
      const showing = expanded.has(key);
      document.getElementById(key).hidden = !showing;
      preview.setAttribute("aria-expanded", String(showing));
      preview.textContent = showing ? "Close preview" : "Read preview";
      return;
    }
    const save = event.target.closest("[data-save]");
    if (save) {
      const id = save.dataset.save;
      saved.has(id) ? saved.delete(id) : saved.add(id);
      updateSaved();
      if (savedDialog.open && !saved.size) {
        renderSaved();
        savedDialog.querySelector("[data-dialog-close]").focus();
      }
    }
  });
  document
    .getElementById("saved-articles-toggle")
    .addEventListener("click", (event) => {
      renderSaved();
      open(savedDialog, event.currentTarget);
    });
  const headlines = {
    economics: [
      "Global markets react to new economic data",
      "This fictional headline illustrates how a ticker can open a focused article dialog. Sample economic indicators and market reactions are used only to demonstrate the interface.",
      901,
    ],
    health: [
      "AI-powered medical diagnostics",
      "This fictional story describes a sample medical technology announcement. It demonstrates the article detail view using local sample content.",
      902,
    ],
    science: [
      "A new mission to Mars",
      "This fictional headline explores a sample space mission announcement. It demonstrates an enlarged story preview without fetching live news.",
      903,
    ],
  };
  document.querySelectorAll("[data-breaking]").forEach((button) =>
    button.addEventListener("click", () => {
      const [title, content, image] = headlines[button.dataset.breaking];
      document.getElementById("breaking-title").textContent = title;
      document.getElementById("breaking-content").textContent = content;
      document.getElementById("breaking-image").src =
        "https://picsum.photos/800/500?random=" + image;
      open(document.getElementById("breaking-dialog"), button);
    }),
  );
  let sequence = 0;
  setInterval(() => {
    const category = Object.keys(data)[Math.floor(Math.random() * 3)],
      id = "sample-" + ++sequence,
      article = {
        id,
        title: names[category] + " update: a new sample story",
        summary:
          "A simulated update has been added to demonstrate how new stories appear in this interface.",
        content:
          "This is locally generated sample content. No news service or external reporting feed is connected to this demonstration.",
        image: "https://picsum.photos/800/500?random=" + (1000 + sequence),
        date: new Date(),
      };
    all.set(id, article);
    data[category].unshift(article);
    data[category] = data[category].slice(0, 3);
    const grid = document.getElementById("section-" + category);
    if (
      grid.contains(document.activeElement) ||
      grid.querySelector("[data-expand][aria-expanded=true]")
    )
      return;
    grid.innerHTML = data[category].map((item) => card(item, "main")).join("");
  }, 20000);
  render();
  updateSaved();
})();
