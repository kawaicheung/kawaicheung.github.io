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

// Any edit to the channel lineup invalidates whatever tabs the live session
// has open and whatever slot the dial was parked on. Rather than let a
// running session drift out of sync with the new list, force the TV off so
// the next "On" press does a full fresh launch against it. The side panel
// picks up the change and resets its own dial state via its
// chrome.storage.onChanged listener on "channels".
async function applyChannelsChange(updated) {
  const res = await send({ type: "getSession" });
  if (res.ok && res.session) await send({ type: "stop" });
  await setChannels(updated);
  renderSettings(updated);
}

async function renderSettings(channels) {
  const channelCount = channels.filter(Boolean).length;

  contentEl.innerHTML = `
    <div class="settings-body">
      <button class="add-btn" id="scrapeBtn" type="button">Find channels</button>
      <div class="scrape-results" id="scrapeResults"></div>
      <ul class="ch-list" id="chList"></ul>
      <p class="count">${channelCount} / ${MAX_CHANNELS} channels configured</p>
      <button class="done-btn" id="doneBtn" type="button">Done</button>
    </div>
  `;

  document.getElementById("doneBtn").addEventListener("click", () => {
    window.close();
  });

  const listEl = document.getElementById("chList");
  channels.forEach((ch, i) => {
    if (!ch) return; // skipped number — no channel assigned to this slot
    const li = document.createElement("li");
    li.innerHTML = `
      <span class="num">${CHANNEL_START + i}</span>
      <span class="label">${ch.label}</span>
      <button class="remove" data-index="${i}">Remove</button>
    `;
    listEl.appendChild(li);
  });

  listEl.addEventListener("click", async (e) => {
    if (!e.target.matches(".remove")) return;
    const index = Number(e.target.dataset.index);
    const updated = await getChannels();
    // Clear the slot rather than splicing, so other channels keep their number.
    updated[index] = null;
    while (updated.length && !updated[updated.length - 1]) updated.pop();
    await applyChannelsChange(updated);
  });

  const scrapeBtn = document.getElementById("scrapeBtn");
  const scrapeResultsEl = document.getElementById("scrapeResults");
  if (channelCount >= MAX_CHANNELS) scrapeBtn.disabled = true;

  scrapeBtn.addEventListener("click", async () => {
    scrapeBtn.disabled = true;
    scrapeBtn.textContent = "Scanning guide…";
    scrapeResultsEl.innerHTML = "";

    const res = await send({ type: "scrapeGuide" });

    scrapeBtn.disabled = false;
    scrapeBtn.textContent = "Find channels";

    if (!res.ok || !res.channels.length) {
      scrapeResultsEl.innerHTML = `<p class="form-error">Couldn't read the guide — make sure you're signed into tv.youtube.com and try again.</p>`;
      return;
    }

    const existingUrls = new Set(channels.filter(Boolean).map((ch) => ch.url));
    const found = res.channels.filter((ch) => !existingUrls.has(ch.url));

    if (!found.length) {
      scrapeResultsEl.innerHTML = `<p class="count">Every channel in the guide is already added.</p>`;
      return;
    }

    renderScrapeResults(found, scrapeResultsEl);
  });
}

// Renders the checklist of scraped-but-not-yet-added channels under the
// "Find channels" button, capped at however many dial slots are still free.
function renderScrapeResults(found, scrapeResultsEl) {
  getChannels().then((channels) => {
    const openSlots = MAX_CHANNELS - channels.filter(Boolean).length;

    if (openSlots <= 0) {
      scrapeResultsEl.innerHTML = `<p class="count">${MAX_CHANNELS} channel max reached — remove one first.</p>`;
      return;
    }

    scrapeResultsEl.innerHTML = `
      <p class="count">${found.length} found — pick up to ${openSlots} to add</p>
      <ul class="scrape-list" id="scrapeList">
        ${found.map((ch, i) => `
          <li>
            <label class="scrape-row">
              <input type="checkbox" data-index="${i}">
              <span class="label">${ch.label}</span>
            </label>
          </li>
        `).join("")}
      </ul>
      <button class="add-btn" id="addSelectedBtn" type="button">Add selected</button>
    `;

    const checkboxes = () => [...scrapeResultsEl.querySelectorAll('input[type="checkbox"]')];

    document.getElementById("scrapeList").addEventListener("change", () => {
      const checkedCount = checkboxes().filter((cb) => cb.checked).length;
      checkboxes().forEach((cb) => { if (!cb.checked) cb.disabled = checkedCount >= openSlots; });
    });

    document.getElementById("addSelectedBtn").addEventListener("click", async () => {
      const selected = checkboxes().filter((cb) => cb.checked).map((cb) => found[Number(cb.dataset.index)]);
      if (!selected.length) return;

      const updated = await getChannels();
      for (const ch of selected) {
        const newChannel = { label: ch.label.toUpperCase().slice(0, 12), url: ch.url };
        const emptyIndex = updated.findIndex((c) => !c);
        if (emptyIndex !== -1) updated[emptyIndex] = newChannel;
        else updated.push(newChannel);
      }
      await applyChannelsChange(updated);
    });
  });
}

(async () => {
  renderSettings(await getChannels());
})();
