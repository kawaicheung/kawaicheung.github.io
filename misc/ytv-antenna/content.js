// Runs on tv.youtube.com. Wraps <ytu-player-controller> in a div so we can
// apply a filter (and later, scanlines/vignette overlays) without touching
// YouTube's own DOM structure. The wrapper's filter affects the element's
// full rendered output, shadow DOM included, since CSS filter composites the
// whole box regardless of what's inside it.

const TARGET_SELECTOR = "ytu-player-controller";
const WRAPPER_CLASS = "retro-tv-wrapper";
const OSD_CLASS = "retro-tv-osd";
const DEFAULT_FILTER = { color: 20, contrast: 100, brightness: 100, hue: 0 };

let currentFilter = DEFAULT_FILTER;
let osdEl = null;
let osdTimeout = null;

function ensureFontLoaded() {
  if (document.getElementById("retro-tv-font")) return;
  const link = document.createElement("link");
  link.id = "retro-tv-font";
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=VT323&display=swap";
  document.head.appendChild(link);
}
ensureFontLoaded();

function ensureOsdElement(wrapper) {
  if (osdEl && wrapper.contains(osdEl)) return osdEl;
  osdEl = document.createElement("div");
  osdEl.className = OSD_CLASS;
  wrapper.appendChild(osdEl);
  return osdEl;
}

function showChannelOSD(label, number) {
  const wrapper = document.querySelector("." + WRAPPER_CLASS);
  if (!wrapper) return;
  const el = ensureOsdElement(wrapper);
  el.textContent = `${String(number).padStart(2, "0")}-${label}`;
  el.classList.add("show");
  clearTimeout(osdTimeout);
  osdTimeout = setTimeout(() => el.classList.remove("show"), 5000);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "channelOSD") showChannelOSD(msg.label, msg.number);
});

function buildFilterString(f) {
  // Fixed low sepia = constant warm tube cast. saturate() is the real "color
  // knob": 0% is true black-and-white, 100% is normal color, past that is
  // punchy. Everything else (contrast/brightness/hue) layers on top.
  return `sepia(0.25) saturate(${f.color}%) contrast(${f.contrast}%) brightness(${f.brightness}%) hue-rotate(${f.hue}deg)`;
}

function wrapPlayer() {
  const target = document.querySelector(TARGET_SELECTOR);
  if (!target) return;

  let wrapper = target.parentElement;
  if (!wrapper || !wrapper.classList.contains(WRAPPER_CLASS)) {
    wrapper = document.createElement("div");
    wrapper.className = WRAPPER_CLASS;
    target.parentNode.insertBefore(wrapper, target);
    wrapper.appendChild(target);
  }
  wrapper.style.filter = buildFilterString(currentFilter);
}

async function loadFilterSettings() {
  const { filterSettings } = await chrome.storage.local.get("filterSettings");
  currentFilter = { ...DEFAULT_FILTER, ...(filterSettings || {}) };
  wrapPlayer();
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.filterSettings) return;
  currentFilter = { ...DEFAULT_FILTER, ...changes.filterSettings.newValue };
  wrapPlayer();
});

loadFilterSettings();
wrapPlayer();

const observer = new MutationObserver(() => wrapPlayer());
observer.observe(document.documentElement, { childList: true, subtree: true });
