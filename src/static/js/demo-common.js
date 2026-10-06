(() => {
  document.documentElement.classList.toggle(
    "embedded",
    new URLSearchParams(location.search).get("embedded") === "1",
  );
  const openers = new WeakMap();
  window.CopperDemo = {
    escape: (value) =>
      String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;"),
    read: (key, fallback) => {
      try {
        return JSON.parse(localStorage.getItem(key)) ?? fallback;
      } catch {
        return fallback;
      }
    },
    write: (key, value) => {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* In-memory state remains usable. */
      }
    },
    open: (dialog, opener = document.activeElement) => {
      openers.set(dialog, opener);
      if (!dialog.open) dialog.showModal();
    },
    date: (value) =>
      new Date(value + "T12:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
  };
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelectorAll("[data-dialog-close]")
      .forEach((button) =>
        button.addEventListener("click", () => dialog.close()),
      );
    dialog.addEventListener("close", () => {
      const opener = openers.get(dialog);
      if (opener?.isConnected) opener.focus();
    });
  });
  document.addEventListener(
    "error",
    (event) => {
      const image = event.target;
      if (
        image instanceof HTMLImageElement &&
        image.closest(".media-frame") &&
        !image.src.endsWith("/branding/news-placeholder.svg")
      )
        image.src = "/branding/news-placeholder.svg";
    },
    true,
  );
})();
