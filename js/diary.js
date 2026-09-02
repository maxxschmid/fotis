import { openOverlayGrid } from "./overlay-grid.js";

const indexRes = await fetch("data/diary-index.json");
const entries = await indexRes.json();

const grid = document.getElementById("diary-grid");
grid.innerHTML = entries
  .map(
    (entry) => `
    <div class="grid-block" data-slug="${entry.slug}">
      <img src="${entry.cover}" alt="">
      <div class="grid-block-title">${entry.title}</div>
    </div>
  `
  )
  .join("");

grid.querySelectorAll(".grid-block").forEach((block) => {
  block.addEventListener("click", async () => {
    const slug = block.dataset.slug;
    const res = await fetch(`data/diary/${slug}.json`);
    const entry = await res.json();
    openOverlayGrid({
      title: entry.title,
      comment: entry.comment,
      photos: entry.photos,
    });
  });
});
