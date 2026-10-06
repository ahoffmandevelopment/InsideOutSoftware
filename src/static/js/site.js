(() => {
  document.documentElement.classList.add("js");
  const menu = document.querySelector(".menu-toggle"),
    nav = document.getElementById("site-navigation");
  if (menu && nav) {
    menu.hidden = false;
    const setOpen = (open) => {
      menu.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
    };
    menu.addEventListener("click", () =>
      setOpen(menu.getAttribute("aria-expanded") !== "true"),
    );
    nav.addEventListener("click", (event) => {
      if (event.target.closest("a")) setOpen(false);
    });
    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        menu.getAttribute("aria-expanded") === "true"
      ) {
        setOpen(false);
        menu.focus();
      }
    });
  }
  const viewer = document.querySelector(".image-viewer");
  if (viewer && typeof viewer.showModal === "function") {
    const links = [...document.querySelectorAll("[data-gallery]")],
      image = viewer.querySelector("img"),
      caption = viewer.querySelector("#viewer-caption"),
      count = viewer.querySelector("[data-viewer-count]"),
      previous = viewer.querySelector("[data-viewer-previous]"),
      next = viewer.querySelector("[data-viewer-next]");
    let index = 0,
      opener;
    const render = () => {
      const focused = document.activeElement;
      const link = links[index];
      image.src = link.href;
      image.alt = link.querySelector("img").alt;
      image.removeAttribute("width");
      image.removeAttribute("height");
      caption.textContent = link.dataset.caption;
      count.textContent = `${index + 1} of ${links.length}`;
      previous.disabled = index === 0;
      next.disabled = index === links.length - 1;
      if ((focused === previous && previous.disabled) || (focused === next && next.disabled)) {
        const enabled = previous.disabled ? next : previous;
        (enabled.disabled ? viewer.querySelector("[data-viewer-close]") : enabled).focus();
      }
    };
    const move = (delta) => {
      index = Math.max(0, Math.min(links.length - 1, index + delta));
      render();
      viewer.querySelector(".viewer-image").scrollTop = 0;
    };
    links.forEach((link, i) =>
      link.addEventListener("click", (event) => {
        event.preventDefault();
        index = i;
        opener = link;
        render();
        viewer.showModal();
      }),
    );
    previous.addEventListener("click", () => move(-1));
    next.addEventListener("click", () => move(1));
    viewer
      .querySelector("[data-viewer-close]")
      .addEventListener("click", () => viewer.close());
    viewer.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
      }
    });
    viewer.addEventListener("close", () => opener?.focus());
  }
  document.querySelectorAll("[data-demo-src]").forEach((frame) => {
    const media = matchMedia("(min-width:768px)");
    const update = () => {
      frame.hidden = !media.matches;
      if (media.matches && !frame.hasAttribute("src"))
        frame.src = frame.dataset.demoSrc;
      if (!media.matches) frame.removeAttribute("src");
    };
    media.addEventListener("change", update);
    update();
  });
})();

// Keep keyboard focus inside the active native dialog, including Tab at its edges.
document.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const dialog = [...document.querySelectorAll("dialog[open]")].at(-1);
  if (!dialog) return;
  const controls = [
    ...dialog.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    ),
  ].filter(
    (element) =>
      element.getClientRects().length && !element.closest("[hidden]"),
  );
  if (!controls.length) {
    event.preventDefault();
    return;
  }
  const first = controls[0],
    last = controls.at(-1),
    active = document.activeElement;
  if (
    !controls.includes(active) ||
    (event.shiftKey && active === first) ||
    (!event.shiftKey && active === last)
  ) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
});
