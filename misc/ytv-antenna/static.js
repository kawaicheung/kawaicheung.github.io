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
