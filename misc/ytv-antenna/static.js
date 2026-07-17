const osdEl = document.getElementById("osd");
function showNumber(number) {
  osdEl.textContent = String(number).padStart(2, "0");
}

// Driven entirely by storage rather than chrome.tabs.sendMessage —
// this page is an extension page, not a content script, and tabs
// messaging targets content scripts specifically. Read the current
// value on load, then react to changes for as long as this tab stays
// open, same pattern content.js already uses for filterSettings.
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.session) {
  chrome.storage.session.get("staticChannel").then(({ staticChannel }) => {
    if (staticChannel) showNumber(staticChannel.number);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "session" || !changes.staticChannel) return;
    showNumber(changes.staticChannel.newValue.number);
  });
}

// ---------- Picture controls ----------
// Same filter formula as content.js's wrapPlayer, applied to <body> (which
// holds both the bars and the OSD number, mirroring how content.js's
// wrapper holds both the player and its OSD) so this page tracks the mini
// dials instead of always rendering at defaults.
const DEFAULT_FILTER = { color: 20, contrast: 100, brightness: 100, hue: 0 };

function buildFilterString(f) {
  return `sepia(0.25) saturate(${f.color}%) contrast(${f.contrast}%) brightness(${f.brightness}%) hue-rotate(${f.hue}deg)`;
}

function applyFilter(filterSettings) {
  document.body.style.filter = buildFilterString({ ...DEFAULT_FILTER, ...(filterSettings || {}) });
}

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get("filterSettings").then(({ filterSettings }) => applyFilter(filterSettings));

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local" || !changes.filterSettings) return;
    applyFilter(changes.filterSettings.newValue);
  });
}
