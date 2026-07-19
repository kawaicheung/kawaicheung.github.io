const MAX_CHANNELS = 12; // dial runs 2 through 13, VHF-style
const CHANNEL_START = 2;

const contentEl = document.getElementById("content");

function send(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function getChannels() {
  const { channels } = await chrome.storage.local.get("channels");
  return channels || [];
}

async function setChannels(channels) {
  await chrome.storage.local.set({ channels });
}

// Nothing here touches storage until Done is pressed. `draft` mirrors the
// 12 dial slots (index 0 = channel 2 ... index 11 = channel 13);
// `available` holds scraped-but-unplaced channels shown in the grid.
let draft = new Array(MAX_CHANNELS).fill(null);
let available = [];

async function loadDraft() {
  const saved = await getChannels();
  draft = Array.from({ length: MAX_CHANNELS }, (_, i) => saved[i] || null);
  available = [];
}

function renderAll() {
  renderAvailable();
  renderSlots();
  renderCount();
}

function renderCount() {
  const count = draft.filter(Boolean).length;
  document.getElementById("channelCount").textContent = `${count} / ${MAX_CHANNELS} channels configured`;
}

function renderAvailable() {
  const grid = document.getElementById("availableGrid");

  if (!available.length) {
    grid.innerHTML = `<p class="available-empty">No unplaced channels — click "Find channels" to scan the guide.</p>`;
    return;
  }

  available.sort((a, b) => a.label.localeCompare(b.label));

  grid.innerHTML = available.map((ch, i) => `
    <div class="available-tile" draggable="true" data-index="${i}" title="${ch.label}">${ch.label}</div>
  `).join("");

  grid.querySelectorAll(".available-tile").forEach((tile) => {
    tile.addEventListener("dragstart", (e) => {
      const index = Number(tile.dataset.index);
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/json", JSON.stringify({ source: "available", index }));
    });
  });
}

function renderSlots() {
  const slotsEl = document.getElementById("slots");

  slotsEl.innerHTML = draft.map((ch, i) => `
    <div class="slot${ch ? " filled" : ""}" data-index="${i}" draggable="${ch ? "true" : "false"}">
      <span class="slot-number">${CHANNEL_START + i}</span>
      ${ch ? `<button class="slot-remove" data-index="${i}" type="button" aria-label="Remove">&times;</button><span class="slot-label">${ch.label}</span>` : ""}
    </div>
  `).join("");

  slotsEl.querySelectorAll(".slot").forEach((slotEl) => {
    const index = Number(slotEl.dataset.index);

    slotEl.addEventListener("dragstart", (e) => {
      if (!draft[index]) { e.preventDefault(); return; }
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("application/json", JSON.stringify({ source: "slot", index }));
    });

    slotEl.addEventListener("dragover", (e) => {
      e.preventDefault();
      slotEl.classList.add("drag-over");
    });
    slotEl.addEventListener("dragleave", () => slotEl.classList.remove("drag-over"));
    slotEl.addEventListener("drop", (e) => {
      e.preventDefault();
      slotEl.classList.remove("drag-over");
      let data;
      try {
        data = JSON.parse(e.dataTransfer.getData("application/json"));
      } catch {
        return;
      }
      placeInSlot(data, index);
    });
  });

  slotsEl.querySelectorAll(".slot-remove").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const index = Number(btn.dataset.index);
      const ch = draft[index];
      if (!ch) return;
      draft[index] = null;
      available.push(ch);
      renderAll();
    });
  });
}

// Drops a channel (from the available grid or another slot) into
// `targetIndex`, bumping whatever's already there back into the available
// grid rather than just overwriting it.
function placeInSlot(data, targetIndex) {
  let channel;
  if (data.source === "available") {
    channel = available[data.index];
    if (!channel) return;
    available.splice(data.index, 1);
  } else if (data.source === "slot") {
    if (data.index === targetIndex) return;
    channel = draft[data.index];
    if (!channel) return;
    draft[data.index] = null;
  } else {
    return;
  }

  const evicted = draft[targetIndex];
  draft[targetIndex] = channel;
  if (evicted) available.push(evicted);

  renderAll();
}

async function init() {
  await loadDraft();

  contentEl.innerHTML = `
    <div class="settings-body">
      <div class="settings-columns">
        <div class="settings-col settings-col-available">
          <p class="section-label">Available channels</p>
          <button class="plain-btn" id="scrapeBtn" type="button">Find channels</button>
          <div class="available-grid" id="availableGrid"></div>
          <p class="form-error" id="scrapeError"></p>
        </div>

        <div class="settings-col settings-col-channels">
          <p class="section-label">Channels (2&ndash;13)</p>
          <div class="slots" id="slots"></div>
        </div>
      </div>

      <p class="count" id="channelCount"></p>
      <button class="plain-btn" id="doneBtn" type="button">Done</button>
    </div>
  `;

  renderAll();

  const scrapeBtn = document.getElementById("scrapeBtn");
  const scrapeError = document.getElementById("scrapeError");

  async function scrapeChannels() {
    scrapeBtn.disabled = true;
    scrapeBtn.textContent = "Scanning guide…";
    scrapeError.textContent = "";

    const res = await send({ type: "scrapeGuide" });

    scrapeBtn.disabled = false;
    scrapeBtn.textContent = "Find channels";

    if (!res.ok || !res.channels.length) {
      scrapeError.textContent = "Couldn't read the guide — make sure you're signed into tv.youtube.com and try again.";
      return;
    }

    const knownUrls = new Set([
      ...draft.filter(Boolean).map((ch) => ch.url),
      ...available.map((ch) => ch.url)
    ]);
    const found = res.channels.filter((ch) => !knownUrls.has(ch.url));

    if (!found.length) {
      scrapeError.textContent = "Every channel in the guide is already placed or available.";
      return;
    }

    available = available.concat(found);
    renderAll();
  }

  scrapeBtn.addEventListener("click", scrapeChannels);

  // Scan automatically on open so the available grid is populated without
  // requiring the user to click "Find channels" first; the button stays for
  // re-scanning after the guide changes.
  scrapeChannels();

  document.getElementById("doneBtn").addEventListener("click", async () => {
    const doneBtn = document.getElementById("doneBtn");
    doneBtn.disabled = true;

    const updated = draft.slice();
    while (updated.length && !updated[updated.length - 1]) updated.pop();

    const res = await send({ type: "getSession" });
    const session = res.ok ? res.session : null;
    if (session) await send({ type: "stop" });
    await setChannels(updated);
    // Relaunch into the same window so edited channels take effect
    // immediately — a fresh set of tabs built off the just-saved list,
    // rather than leaving the old ones (or none) sitting there stale.
    if (session) await send({ type: "launch", windowId: session.windowId });

    window.close();
  });
}

init();
