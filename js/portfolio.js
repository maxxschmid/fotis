import { openOverlayGrid } from "./overlay-grid.js";

const indexRes = await fetch("data/portfolio-index.json");
const categories = await indexRes.json();

const grid = document.getElementById("portfolio-grid");
grid.innerHTML = categories
  .map(
    (cat) => `
    <div class="grid-block" data-slug="${cat.slug}">
      <img src="${cat.cover}" alt="">
      <div class="grid-block-title">${cat.title}</div>
    </div>
  `
  )
  .join("");

grid.querySelectorAll(".grid-block").forEach((block) => {
  block.addEventListener("click", async () => {
    const slug = block.dataset.slug;
    const res = await fetch(`data/portfolio/${slug}.json`);
    const category = await res.json();
    openOverlayGrid({
      title: category.title,
      photos: category.photos,
    });
  });
});
