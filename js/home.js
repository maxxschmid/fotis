import { renderSlideshow } from "./slideshow.js";

const res = await fetch("data/favorites.json");
const photos = await res.json();
renderSlideshow(document.getElementById("home-slideshow"), photos);
