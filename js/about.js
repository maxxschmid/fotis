const res = await fetch("data/about.json");
const about = await res.json();

const socialsHtml = about.socials
  .map((s) => `<a href="${s.url}" target="_blank" rel="noopener">${s.label}</a>`)
  .join(" · ");

document.getElementById("about-content").innerHTML = `
  <img class="about-portrait" src="${about.portrait}" alt="">
  <p class="about-bio">${about.bio}</p>
  <p class="about-contact">
    <a href="mailto:${about.email}">${about.email}</a>${about.phone ? ` · ${about.phone}` : ""}
  </p>
  ${socialsHtml ? `<p class="about-socials">${socialsHtml}</p>` : ""}
`;
