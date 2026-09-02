// Renders a full-bleed slideshow into `container`.
// photos: [{ src, alt }]
// options: { startIndex, caption }
export function renderSlideshow(container, photos, options = {}) {
  let index = options.startIndex || 0;

  container.innerHTML = `
    <div class="slideshow">
      <div class="slideshow-frame"><img alt=""></div>
      <div class="slideshow-click-zone prev"></div>
      <div class="slideshow-click-zone next"></div>
      <button class="slideshow-arrow prev" aria-label="Previous photo">&#8249;</button>
      <button class="slideshow-arrow next" aria-label="Next photo">&#8250;</button>
      <div class="slideshow-counter"></div>
      ${options.caption ? `<div class="slideshow-caption">${options.caption}</div>` : ""}
    </div>
  `;

  const img = container.querySelector(".slideshow-frame img");
  const counter = container.querySelector(".slideshow-counter");

  function show(i) {
    index = (i + photos.length) % photos.length;
    const photo = photos[index];
    img.src = photo.src;
    img.alt = photo.alt || "";
    counter.textContent = `${index + 1} / ${photos.length}`;
  }

  function next() {
    show(index + 1);
  }

  function prev() {
    show(index - 1);
  }

  container.querySelector(".slideshow-click-zone.prev").addEventListener("click", prev);
  container.querySelector(".slideshow-click-zone.next").addEventListener("click", next);
  container.querySelector(".slideshow-arrow.prev").addEventListener("click", prev);
  container.querySelector(".slideshow-arrow.next").addEventListener("click", next);

  function onKeydown(e) {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  }
  document.addEventListener("keydown", onKeydown);

  show(index);

  return {
    destroy() {
      document.removeEventListener("keydown", onKeydown);
      container.innerHTML = "";
    },
  };
}
