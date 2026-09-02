import { renderSlideshow } from "./slideshow.js";

let overlayEl = null;
let slideshowOverlayEl = null;
let activeSlideshow = null;

function ensureElements() {
  if (overlayEl) return;

  overlayEl = document.createElement("div");
  overlayEl.className = "overlay-grid";
  overlayEl.innerHTML = `
    <div class="overlay-grid-backdrop"></div>
    <div class="overlay-grid-panel">
      <button class="overlay-grid-close" aria-label="Close">&times;</button>
      <h2 class="overlay-grid-title"></h2>
      <p class="overlay-grid-comment"></p>
      <div class="overlay-grid-photos"></div>
    </div>
  `;
  document.body.appendChild(overlayEl);

  slideshowOverlayEl = document.createElement("div");
  slideshowOverlayEl.className = "slideshow-overlay";
  slideshowOverlayEl.innerHTML = `
    <button class="slideshow-overlay-close" aria-label="Back to grid">&times;</button>
    <div class="slideshow-overlay-mount"></div>
  `;
  document.body.appendChild(slideshowOverlayEl);

  overlayEl.querySelector(".overlay-grid-close").addEventListener("click", closeOverlayGrid);
  overlayEl.querySelector(".overlay-grid-backdrop").addEventListener("click", closeOverlayGrid);
  slideshowOverlayEl.querySelector(".slideshow-overlay-close").addEventListener("click", closeSlideshowOverlay);

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (slideshowOverlayEl.classList.contains("is-open")) {
      closeSlideshowOverlay();
    } else if (overlayEl.classList.contains("is-open")) {
      closeOverlayGrid();
    }
  });
}

export function openOverlayGrid({ title, comment, photos }) {
  ensureElements();

  overlayEl.querySelector(".overlay-grid-title").textContent = title || "";
  const commentEl = overlayEl.querySelector(".overlay-grid-comment");
  commentEl.textContent = comment || "";
  commentEl.style.display = comment ? "" : "none";

  const photosEl = overlayEl.querySelector(".overlay-grid-photos");
  photosEl.innerHTML = "";
  photos.forEach((photo, i) => {
    const img = document.createElement("img");
    img.src = photo.thumb || photo.src;
    img.alt = photo.alt || "";
    img.addEventListener("click", () => openSlideshowOverlay(photos, i, comment));
    photosEl.appendChild(img);
  });

  overlayEl.classList.add("is-open");
}

function closeOverlayGrid() {
  overlayEl.classList.remove("is-open");
}

function openSlideshowOverlay(photos, startIndex) {
  const mount = slideshowOverlayEl.querySelector(".slideshow-overlay-mount");
  activeSlideshow = renderSlideshow(mount, photos, { startIndex });
  slideshowOverlayEl.classList.add("is-open");
}

function closeSlideshowOverlay() {
  slideshowOverlayEl.classList.remove("is-open");
  if (activeSlideshow) {
    activeSlideshow.destroy();
    activeSlideshow = null;
  }
}
