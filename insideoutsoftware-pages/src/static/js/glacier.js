(() => {
  const slider = document.getElementById("timeline-slider"),
    rows = document.getElementById("data-rows"),
    reduced = matchMedia("(prefers-reduced-motion:reduce)");
  const melt = (year) => 50 + 450 * ((year - 1990) / 34) ** 2.8;
  const area = (year) =>
    Math.max(1500, 15000 - 15000 * 0.85 * ((year - 1990) / 34) ** 2.2);
  const cumulative = {};
  let total = 0,
    animation = 0;
  for (let year = 1990; year <= 2024; year++) {
    if (year > 1990)
      total += (melt(year) / 360) * 0.1 + 0.05 * ((year - 1990) / 34);
    cumulative[year] = total.toFixed(2);
  }
  rows.innerHTML = Array.from({ length: 35 }, (_, i) => {
    const year = 1990 + i;
    return `<tr data-year="${year}"><th scope="row"><button type="button" data-year="${year}" aria-label="Select year ${year}" aria-pressed="false">${year}</button></th><td>${area(year).toFixed(0)}</td><td>${melt(year).toFixed(1)}</td><td>${cumulative[year]}</td></tr>`;
  }).join("");
  function update(year) {
    slider.value = year;
    document.getElementById("year-display").textContent = year;
    const annualMelt = Number(melt(year).toFixed(1));
    const percentage =
        (Number(area(year).toFixed(0)) - area(2024)) /
        (area(1990) - area(2024)),
      size = 10 + 70 * percentage,
      shape = document.getElementById("glacier-shape");
    shape.style.width = shape.style.height = size + "%";
    shape.style.top = shape.style.left = 10 + (80 - size) / 2 + "%";
    document.getElementById("coverage-text").textContent =
      "Area covered by ice: " +
      (percentage > 0.75 ? "High" : percentage < 0.25 ? "Low" : "Moderate");
    document.getElementById("volume-value").textContent =
      annualMelt.toFixed(0) + " Gt";
    document.getElementById("impact-value").textContent =
      "+" + cumulative[year] + " mm";
    const temp = Number((0.2 + ((year - 1990) / 34) * 1.3).toFixed(1));
    const temperature = document.getElementById("temp-value");
    temperature.textContent = "+" + temp.toFixed(1) + "°C";
    temperature.classList.toggle("high-temperature", temp > 1);
    temperature.parentElement.querySelector("span").textContent =
      temp > 1 ? "Elevated temperature anomaly" : "Temperature anomaly";
    document.getElementById("flow-rate").textContent =
      ((annualMelt * 31709) / 1000).toFixed(0) + " K L/s";
    document.getElementById("flow-water").style.width =
      ((annualMelt - 50) / 450) * 100 + "%";
    rows.querySelectorAll("tr").forEach((row) => {
      const selected = Number(row.dataset.year) === year;
      row.classList.toggle("selected", selected);
      row
        .querySelector("button")
        .setAttribute("aria-pressed", String(selected));
    });
  }
  slider.addEventListener("input", () => {
    cancelAnimationFrame(animation);
    update(Number(slider.value));
  });
  rows.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-year]");
    if (!row) return;
    cancelAnimationFrame(animation);
    const year = Number(row.dataset.year),
      start = Number(slider.value);
    if (reduced.matches) {
      update(year);
      return;
    }
    const began = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - began) / 500);
      update(Math.round(start + (year - start) * (1 - (1 - progress) ** 3)));
      if (progress < 1) animation = requestAnimationFrame(step);
    };
    animation = requestAnimationFrame(step);
  });
  update(1990);
})();
