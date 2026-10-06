(() => {
  const { escape: e, read, write, open, date } = CopperDemo,
    items = JSON.parse(document.getElementById("demo-data").textContent),
    byId = new Map(items.map((item) => [item.id, item]));
  const categories = [...new Set(items.map((item) => item.category))].sort(),
    tags = [...new Set(items.flatMap((item) => item.tags))].sort(),
    selectedCategories = new Set(categories),
    selectedTags = new Set(tags);
  const stored = read("savedNewsletterItems", []),
    saved = new Set(
      Array.isArray(stored)
        ? stored.filter((id) => typeof id === "number" && byId.has(id))
        : [],
    );
  const grid = document.getElementById("newsletter-grid"),
    dialog = document.getElementById("reading-dialog"),
    reader = document.getElementById("preview-content"),
    filters = document.getElementById("archive-filters"),
    mobile = matchMedia("(max-width:767px)"),
    wide = matchMedia("(min-width:1024px)");
  let filtered = [],
    selectedId = null,
    savedOnly = false;
  const sort = document.getElementById("sort-order");
  try {
    const storedSort = localStorage.getItem("newsletterSortPreference");
    if (storedSort === "oldest" || storedSort === "newest")
      sort.value = storedSort;
  } catch {
    /* Keep the default when storage is unavailable. */
  }
  function makeChecks(container, values, selection) {
    document.getElementById(container).innerHTML =
      `<label><input type="checkbox" value="__all" checked>All ${container === "category-filter" ? "categories" : "tags"}</label>` +
      values
        .map(
          (value) =>
            `<label><input type="checkbox" value="${e(value)}" checked>${e(value)}</label>`,
        )
        .join("");
    document.getElementById(container).addEventListener("change", (event) => {
      const checkbox = event.target;
      if (checkbox.value === "__all") {
        selection.clear();
        if (checkbox.checked) values.forEach((value) => selection.add(value));
      } else {
        checkbox.checked
          ? selection.add(checkbox.value)
          : selection.delete(checkbox.value);
      }
      document.querySelectorAll("#" + container + " input").forEach((input) => {
        if (input.value === "__all") {
          input.checked = selection.size === values.length;
          input.indeterminate =
            selection.size > 0 && selection.size < values.length;
        } else input.checked = selection.has(input.value);
      });
      refresh();
    });
  }
  makeChecks("category-filter", categories, selectedCategories);
  makeChecks("tag-filter", tags, selectedTags);
  function range() {
    const preset = document.getElementById("date-filter").value,
      from = document.getElementById("date-from").value,
      to = document.getElementById("date-to").value;
    document.getElementById("custom-date-range").hidden = preset !== "custom";
    const invalid = preset === "custom" && from && to && from > to;
    document.getElementById("date-error").hidden = !invalid;
    for (const id of ["date-from", "date-to"])
      document
        .getElementById(id)
        .setAttribute("aria-invalid", String(Boolean(invalid)));
    if (invalid) return null;
    if (preset === "custom") return [from || "0000-01-01", to || "9999-12-31"];
    if (preset === "all") return ["0000-01-01", "9999-12-31"];
    const start = new Date();
    start.setMonth(
      start.getMonth() -
        { "last-month": 1, "last-quarter": 3, "last-year": 12 }[preset],
    );
    const iso = (d) =>
      [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0"),
      ].join("-");
    return [iso(start), iso(new Date())];
  }
  function card(item) {
    return `<article class="newsletter-card${selectedId === item.id ? " selected" : ""}" data-item="${item.id}"><span class="newsletter-meta"><span>${e(item.category)}</span><time datetime="${e(item.date)}">${e(date(item.date))}</time></span><h2><button class="newsletter-open" type="button" data-open="${item.id}" aria-pressed="${selectedId === item.id}">${e(item.title)}</button></h2><p class="newsletter-excerpt">${e(item.content)}</p><div class="newsletter-bottom"><ul class="tags" aria-label="Tags">${item.tags.map((tag) => `<li>${e(tag)}</li>`).join("")}</ul><button class="save-newsletter" type="button" data-save-newsletter="${item.id}" aria-label="${saved.has(item.id) ? "Unsave" : "Save"} ${e(item.title)}" aria-pressed="${saved.has(item.id)}">${saved.has(item.id) ? "Saved ✓" : "Save"}</button></div></article>`;
  }
  function paragraphs(item) {
    return item.content
      .split(/\n\n/)
      .map((paragraph) => `<p>${e(paragraph)}</p>`)
      .join("");
  }
  function navigation() {
    const index = filtered.findIndex((item) => item.id === selectedId);
    return `<div class="reader-navigation"><button class="button subtle" type="button" data-reader-prev${index <= 0 ? " disabled" : ""}>← Previous</button><button class="button subtle" type="button" data-reader-next${index < 0 || index >= filtered.length - 1 ? " disabled" : ""}>Next →</button></div>`;
  }
  function renderReader() {
    const control = document.activeElement.closest(
      "[data-reader-prev], [data-reader-next]",
    );
    const scope = control?.closest("dialog") || reader;
    const selector = control?.hasAttribute("data-reader-prev")
      ? "[data-reader-prev]"
      : "[data-reader-next]";
    const item = byId.get(selectedId);
    document.getElementById("preview-placeholder").hidden = Boolean(item);
    reader.hidden = !item;
    if (!item) {
      reader.innerHTML = "";
      if (dialog.open) dialog.close();
      return;
    }
    reader.innerHTML = `<div class="reader-toolbar"><span class="eyebrow">Sample newsletter</span><button class="button subtle" type="button" data-fullscreen>Full screen ↗</button></div><h2>${e(item.title)}</h2><p class="eyebrow">${e(date(item.date))} / ${e(item.category)}</p><div class="reader-text">${paragraphs(item)}</div>${navigation()}`;
    document.getElementById("reading-title").textContent = item.title;
    document.getElementById("reading-date").textContent =
      date(item.date) + " / " + item.category + " / Sample newsletter";
    document.getElementById("reading-body").innerHTML = paragraphs(item);
    document.getElementById("reading-body").scrollTop = 0;
    document
      .querySelectorAll("#reading-dialog [data-reader-prev]")
      .forEach(
        (button) =>
          (button.disabled =
            filtered.findIndex((entry) => entry.id === selectedId) <= 0),
      );
    document
      .querySelectorAll("#reading-dialog [data-reader-next]")
      .forEach(
        (button) =>
          (button.disabled =
            filtered.findIndex((entry) => entry.id === selectedId) >=
            filtered.length - 1),
      );
    progress();
    if (control) {
      (scope.querySelector(selector + ":not([disabled])") ||
        scope.querySelector(".reader-navigation button:not([disabled])"))?.focus();
    }
  }
  function refresh() {
    const query = document.getElementById("search").value.trim().toLowerCase(),
      limits = range();
    filtered = limits
      ? items.filter(
          (item) =>
            selectedCategories.has(item.category) &&
            item.tags.some((tag) => selectedTags.has(tag)) &&
            (!savedOnly || saved.has(item.id)) &&
            item.date >= limits[0] &&
            item.date <= limits[1] &&
            [item.title, item.content, item.category, ...item.tags]
              .join(" ")
              .toLowerCase()
              .includes(query),
        )
      : [];
    filtered.sort((a, b) =>
      sort.value === "oldest"
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date),
    );
    grid.innerHTML = filtered.map(card).join("");
    const empty = document.getElementById("no-results");
    empty.hidden = filtered.length > 0;
    empty.querySelector("h2").textContent =
      savedOnly && !saved.size
        ? "No saved newsletters yet"
        : "No matching newsletters";
    document.getElementById("empty-message").textContent =
      savedOnly && !saved.size
        ? "Save a newsletter to start your collection."
        : limits
          ? "Try another search or adjust your filters."
          : "Correct the date range to show results.";
    document.getElementById("results-count").textContent =
      filtered.length + " newsletter" + (filtered.length === 1 ? "" : "s");
    if (
      selectedId !== null &&
      !filtered.some((item) => item.id === selectedId)
    ) {
      selectedId = null;
    }
    renderReader();
  }
  function select(id, opener) {
    selectedId = id;
    grid.querySelectorAll(".newsletter-card").forEach((card) => {
      const active = Number(card.dataset.item) === id;
      card.classList.toggle("selected", active);
      card
        .querySelector("[data-open]")
        .setAttribute("aria-pressed", String(active));
    });
    renderReader();
    if (mobile.matches)
      open(dialog, opener || grid.querySelector(`[data-open="${id}"]`));
  }
  document.addEventListener("click", (event) => {
    const card = event.target.closest("[data-open]");
    if (card) {
      select(Number(card.dataset.open), card);
      return;
    }
    const save = event.target.closest("[data-save-newsletter]");
    if (save) {
      const id = Number(save.dataset.saveNewsletter);
      saved.has(id) ? saved.delete(id) : saved.add(id);
      write("savedNewsletterItems", [...saved]);
      if (savedOnly) {
        refresh();
        document.getElementById("show-saved-btn").focus();
      } else {
        const item = byId.get(id);
        save.textContent = saved.has(id) ? "Saved ✓" : "Save";
        save.setAttribute("aria-pressed", String(saved.has(id)));
        save.setAttribute(
          "aria-label",
          (saved.has(id) ? "Unsave " : "Save ") + item.title,
        );
      }
      return;
    }
    if (event.target.closest("[data-fullscreen]"))
      open(dialog, event.target.closest("button"));
    const previous = event.target.closest("[data-reader-prev]"),
      next = event.target.closest("[data-reader-next]");
    if (previous || next) {
      const index =
        filtered.findIndex((item) => item.id === selectedId) +
        (previous ? -1 : 1);
      if (filtered[index]) {
        select(filtered[index].id);
      }
    }
  });
  document
    .getElementById("show-saved-btn")
    .addEventListener("click", (event) => {
      savedOnly = !savedOnly;
      event.currentTarget.setAttribute("aria-pressed", String(savedOnly));
      event.currentTarget.textContent = savedOnly ? "Show All" : "Show Saved";
      refresh();
    });
  document
    .getElementById("filter-toggle")
    .addEventListener("click", (event) => {
      const expanded = filters.classList.toggle("is-open");
      event.currentTarget.setAttribute("aria-expanded", String(expanded));
      event.currentTarget.textContent = expanded ? "Filters −" : "Filters ＋";
    });
  ["search", "date-filter", "date-from", "date-to"].forEach((id) =>
    document
      .getElementById(id)
      .addEventListener(id === "search" ? "input" : "change", refresh),
  );
  sort.addEventListener("change", () => {
    try {
      localStorage.setItem("newsletterSortPreference", sort.value);
    } catch {
      /* Sorting works without storage. */
    }
    refresh();
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      /INPUT|SELECT|TEXTAREA/.test(event.target.tagName) ||
      event.target.isContentEditable
    )
      return;
    if (!selectedId || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    const index =
      filtered.findIndex((item) => item.id === selectedId) +
      (event.key === "ArrowLeft" ? -1 : 1);
    if (filtered[index]) {
      event.preventDefault();
      select(filtered[index].id);
    }
  });
  function progress() {
    const body = document.getElementById("reading-body"),
      maximum = body.scrollHeight - body.clientHeight,
      value =
        maximum > 0
          ? Math.min(100, Math.round((body.scrollTop / maximum) * 100))
          : 100,
      bar = document.getElementById("reading-progress");
    bar.style.width = value + "%";
    bar.setAttribute("aria-valuenow", String(value));
  }
  document
    .getElementById("reading-body")
    .addEventListener("scroll", progress, { passive: true });
  dialog.addEventListener("close", () => {
    const card = grid.querySelector(`[data-open="${selectedId}"]`);
    if (mobile.matches && card) card.focus();
    else reader.querySelector("[data-fullscreen]")?.focus();
  });
  new ResizeObserver(progress).observe(document.getElementById("reading-body"));
  mobile.addEventListener("change", () => {
    if (dialog.open) dialog.close();
  });
  wide.addEventListener("change", () => {
    filters.classList.remove("is-open");
    document
      .getElementById("filter-toggle")
      .setAttribute("aria-expanded", "false");
    document.getElementById("filter-toggle").textContent = "Filters ＋";
  });
  let startY = null,
    pulling = false;
  const indicator = document.getElementById("pull-indicator");
  document.addEventListener(
    "touchstart",
    (event) => {
      if (mobile.matches && scrollY === 0 && !dialog.open) {
        startY = event.touches[0].clientY;
      }
    },
    { passive: true },
  );
  document.addEventListener(
    "touchmove",
    (event) => {
      if (startY !== null && scrollY === 0) {
        const distance = event.touches[0].clientY - startY;
        indicator.hidden = distance < 30;
        pulling = distance > 100;
        indicator.textContent = pulling
          ? "Release to refresh"
          : "Pull down to refresh";
      }
    },
    { passive: true },
  );
  document.addEventListener(
    "touchend",
    () => {
      startY = null;
      if (pulling) {
        indicator.textContent = "Refreshing sample collection…";
        setTimeout(() => {
          refresh();
          indicator.hidden = true;
          pulling = false;
        }, 1000);
      } else indicator.hidden = true;
    },
    { passive: true },
  );
  refresh();
})();
