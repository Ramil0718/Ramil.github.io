// Shared interactions for the single-page site.
// Text and AMV content live in zh.js and en.js.

let currentLang = localStorage.getItem("site-language") || "zh";

// DOM references used by the interactive parts of the page.
const language = document.querySelector(".language");
const languageButton = document.querySelector("#languageButton");
const currentLanguage = document.querySelector("#currentLanguage");
const languageOptions = document.querySelectorAll("[data-lang]");
const amvList = document.querySelector("#amvList");
const dialog = document.querySelector("#workDialog");
const dialogMedia = document.querySelector("#dialogMedia");
const dialogTitle = document.querySelector("#dialogTitle");
const dialogDescription = document.querySelector("#dialogDescription");
const dialogMeta = document.querySelector("#dialogMeta");
const dialogClose = document.querySelector(".dialog-close");
const educationButtons = document.querySelectorAll("[data-education-stage]");
const educationMeta = document.querySelector("#educationMeta");
const educationTitle = document.querySelector("#educationTitle");
const educationText = document.querySelector("#educationText");

let currentEducationStage = "undergrad";

function getLocale(lang) {
  return window.siteLocales[lang] || window.siteLocales.zh;
}

// Fill all data-i18n elements with text from zh.js or en.js.
function applyLanguage(lang) {
  const locale = getLocale(lang);
  currentLang = lang;
  localStorage.setItem("site-language", lang);

  document.documentElement.lang = locale.htmlLang;
  document.title = locale.pageTitle;
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", locale.metaDescription);

  currentLanguage.textContent = locale.languageLabel;

  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.dataset.i18n;
    if (locale.text[key]) {
      node.textContent = locale.text[key];
    }
  });

  languageOptions.forEach((option) => {
    option.setAttribute("aria-current", String(option.dataset.lang === lang));
  });

  renderEducation(locale);
  renderAmvWorks(locale);
}

// Render the selected education stage in the about section.
function renderEducation(locale) {
  const education = locale.education || {};
  const stage = education[currentEducationStage] ? currentEducationStage : "undergrad";
  const content = education[stage];

  if (!content) {
    return;
  }

  educationButtons.forEach((button) => {
    const isActive = button.dataset.educationStage === stage;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.textContent =
      button.dataset.educationStage === "master"
        ? locale.text.educationMasterTab
        : locale.text.educationUndergradTab;
  });

  currentEducationStage = stage;
  educationMeta.textContent = content.meta;
  educationTitle.textContent = content.title;
  educationText.textContent = content.text;
}

// Build AMV cards from the current language file.
function renderAmvWorks(locale) {
  amvList.innerHTML = "";

  locale.amvWorks.forEach((work, index) => {
    const card = document.createElement("article");
    card.className = "amv-card";
    card.innerHTML = `
      <div class="amv-thumb" style="--thumb-bg: ${work.palette}">
        <span class="play-mark" aria-hidden="true"></span>
      </div>
      <div>
        <p class="work-meta">${work.cardMeta}</p>
        <h3>${work.title}</h3>
        <p>${work.description}</p>
      </div>
      <button
        type="button"
        data-work-index="${index}"
        data-video="${work.video || ""}"
      >
        ${locale.text.preview}
      </button>
    `;
    amvList.appendChild(card);
  });
}

// Convert regular Bilibili video links into embeddable player links.
function getEmbedUrl(url) {
  if (url.includes("player.bilibili.com")) {
    return url;
  }

  const bilibiliMatch = url.match(/bilibili\.com\/video\/(BV[a-zA-Z0-9]+)/);
  if (bilibiliMatch) {
    return `https://player.bilibili.com/player.html?bvid=${bilibiliMatch[1]}&page=1`;
  }

  return url;
}

// Open the preview dialog.
function openWork(index) {
  const locale = getLocale(currentLang);
  const work = locale.amvWorks[index];

  dialogTitle.textContent = work.title;
  dialogDescription.textContent = work.description;
  dialogMeta.textContent = work.meta;

  if (work.video) {
    const videoUrl = getEmbedUrl(work.video);
    const isEmbed = videoUrl.includes("youtube.com") || videoUrl.includes("player.bilibili.com");
    dialogMedia.innerHTML = isEmbed
      ? `<iframe src="${videoUrl}" title="${work.title}" allowfullscreen></iframe>`
      : `<video src="${videoUrl}" controls></video>`;
  } else {
    dialogMedia.innerHTML = `<div class="amv-thumb" style="height: 100%; border-radius: 0; --thumb-bg: ${work.palette}">
      <span class="play-mark" aria-hidden="true"></span>
    </div>`;
  }

  if (typeof dialog.showModal === "function") {
    dialog.showModal();
  }
}

// Close the dialog and remove the player so video/audio stops immediately.
function closeWorkDialog() {
  dialog.close();
  dialogMedia.innerHTML = "";
}

// Toggle the language dropdown.
languageButton.addEventListener("click", () => {
  const isOpen = language.classList.toggle("open");
  languageButton.setAttribute("aria-expanded", String(isOpen));
});

// Close the language dropdown when clicking outside it.
document.addEventListener("click", (event) => {
  if (!language.contains(event.target)) {
    language.classList.remove("open");
    languageButton.setAttribute("aria-expanded", "false");
  }
});

// Change language when a language menu item is clicked.
languageOptions.forEach((option) => {
  option.addEventListener("click", () => {
    applyLanguage(option.dataset.lang);
    language.classList.remove("open");
    languageButton.setAttribute("aria-expanded", "false");
  });
});

// Switch the about section between undergraduate and master's content.
educationButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentEducationStage = button.dataset.educationStage;
    renderEducation(getLocale(currentLang));
  });
});

// Open AMV previews when a preview button is clicked.
amvList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-work-index]");
  if (button) {
    openWork(Number(button.dataset.workIndex));
  }
});

// Dialog close controls.
dialogClose.addEventListener("click", closeWorkDialog);

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    closeWorkDialog();
  }
});

dialog.addEventListener("close", () => {
  dialogMedia.innerHTML = "";
});

// Initial render.
applyLanguage(currentLang);
