const MAX_CHANNELS = 12; // dial runs 2 through 13, VHF-style
const CHANNEL_START = 2;
const SLOT_ANGLE = 30; // degrees between numbers on a 12-position dial
const NUMBER_RADIUS = 90;
const NEUTRAL_ANGLE = -15; // pointer parks between 13 and 2 when TV is off
const KEYPAD_COUNT = 9; // 90s remote keypad only covers 1-9 for now

const contentEl = document.getElementById("content");
const statusDot = document.getElementById("statusDot");
const gearBtn = document.getElementById("gearBtn");

let view = "remote"; // "remote" | "settings"
let lastRotorAngle = NEUTRAL_ANGLE; // carries over across re-renders so the dial has a "from" angle to turn from

gearBtn.addEventListener("click", () => {
  view = view === "settings" ? "remote" : "settings";
  gearBtn.classList.toggle("on", view === "settings");
  render();
});

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

async function getUiMode() {
  const { uiMode } = await chrome.storage.local.get("uiMode");
  return uiMode === "keypad" ? "keypad" : "dial";
}

async function setUiMode(mode) {
  await chrome.storage.local.set({ uiMode: mode });
}

const DEFAULT_FILTER = { color: 20, contrast: 100, brightness: 100, hue: 0 };

async function getFilterSettings() {
  const { filterSettings } = await chrome.storage.local.get("filterSettings");
  return { ...DEFAULT_FILTER, ...(filterSettings || {}) };
}

async function setFilterSettings(settings) {
  await chrome.storage.local.set({ filterSettings: settings });
}

// ---------- Shared pieces (used by both the dial and keypad views) ----------

function powerRowHtml() {
  return `
    <div class="power-row">
      <button class="power-btn off" id="offBtn">Off</button>
      <button class="power-btn on" id="onBtn">On</button>
    </div>
  `;
}

function wirePowerRow(channels, session) {
  const onBtn = document.getElementById("onBtn");
  const offBtn = document.getElementById("offBtn");
  const powerRow = onBtn.closest(".power-row");
  onBtn.classList.toggle("engaged", !!session);
  offBtn.classList.toggle("engaged", !session);
  // The switch's tilt/glow lives on the row itself, not the individual
  // buttons, so it reads as one rocker leaning toward whichever side is on.
  powerRow.classList.toggle("on", !!session);
  powerRow.classList.toggle("off", !session);

  onBtn.addEventListener("click", async () => {
    if (!channels.some(Boolean)) return;
    onBtn.disabled = true;
    const win = await chrome.windows.getCurrent();
    const res = await send({ type: "launch", windowId: win.id });
    onBtn.disabled = false;
    if (res.ok) render();
  });

  offBtn.addEventListener("click", async () => {
    await send({ type: "stop" });
    render();
  });
}

function pictureBoxHtml(filters) {
  return `
    <div class="picture-box">
      <div class="ctrl">
        <label>Color</label>
        <input type="range" id="colorRange" min="0" max="150" value="${filters.color}">
      </div>
      <div class="ctrl">
        <label>Contrast</label>
        <input type="range" id="contrastRange" min="50" max="150" value="${filters.contrast}">
      </div>
      <div class="ctrl">
        <label>Brightness</label>
        <input type="range" id="brightnessRange" min="50" max="150" value="${filters.brightness}">
      </div>
      <div class="ctrl">
        <label>Hue</label>
        <input type="range" id="hueRange" min="0" max="360" value="${filters.hue}">
      </div>
    </div>
  `;
}

function wirePictureBox() {
  const colorRange = document.getElementById("colorRange");
  const contrastRange = document.getElementById("contrastRange");
  const brightnessRange = document.getElementById("brightnessRange");
  const hueRange = document.getElementById("hueRange");

  function pushFilterSettings() {
    setFilterSettings({
      color: Number(colorRange.value),
      contrast: Number(contrastRange.value),
      brightness: Number(brightnessRange.value),
      hue: Number(hueRange.value)
    });
  }

  colorRange.addEventListener("input", pushFilterSettings);
  contrastRange.addEventListener("input", pushFilterSettings);
  brightnessRange.addEventListener("input", pushFilterSettings);
  hueRange.addEventListener("input", pushFilterSettings);
}

// Advances one channel slot at a time (delta = +1 or -1), wrapping around —
// same motion whether triggered by a dial tap or an arrow key. Always reads
// fresh state rather than trusting a stale closure from whichever render
// call happened to be active when the listener was attached.
async function changeChannel(delta) {
  const channels = await getChannels();
  if (!channels.some(Boolean)) return;

  const res = await send({ type: "getSession" });
  const session = res.ok ? res.session : null;
  if (!session) return; // TV has to be on to surf channels

  const currentIndex = channels.findIndex((ch) => ch && ch.url === session.activeUrl);
  const from = currentIndex === -1 ? 0 : currentIndex;

  // Skipped numbers aren't stops on the dial — keep stepping in the same
  // direction until landing on a slot that actually has a channel.
  let nextIndex = from;
  do {
    nextIndex = (nextIndex + delta + channels.length) % channels.length;
  } while (!channels[nextIndex] && nextIndex !== from);

  const nextChannel = channels[nextIndex];
  if (!nextChannel) return; // no other channel configured

  const switchRes = await send({ type: "switch", url: nextChannel.url });
  if (switchRes.ok && view === "remote") render();
}

document.addEventListener("keydown", (e) => {
  if (view !== "remote") return;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    changeChannel(1);
  } else if (e.key === "ArrowLeft") {
    e.preventDefault();
    changeChannel(-1);
  }
});

// ---------- Remote view (dial) ----------

async function renderDialView(channels, session) {
  const filters = await getFilterSettings();

  contentEl.innerHTML = `
    ${powerRowHtml()}
    <div class="dial-stage">
      <div class="channel-readout" id="channelReadout"></div>
      <div class="dial">
        <div class="dial-metal"></div>
        <div class="dial-arrow" id="dialArrow"></div>
        <div class="dial-rotor" id="dialRotor">
          <div class="dial-knob">
            <div class="dial-knob-face"></div>
            <div class="dial-knob-handle"></div>
          </div>
        </div>
      </div>
    </div>
    ${pictureBoxHtml(filters)}
  `;

  const dialEl = document.querySelector(".dial");
  const rotorEl = document.getElementById("dialRotor");
  const arrowEl = document.getElementById("dialArrow");
  const readoutEl = document.getElementById("channelReadout");

  let activeIndex = -1;
  let activeLabel = null;

  for (let i = 0; i < MAX_CHANNELS; i++) {
    const channel = channels[i];
    const angle = i * SLOT_ANGLE;
    const num = document.createElement("span");
    num.className = "dial-num" + (channel ? " lit" : "");
    num.textContent = String(CHANNEL_START + i);
    // No counter-rotation: the number keeps the `angle` rotation, so it
    // radiates — upright only once the rotor below brings it to the top,
    // tilted everywhere else, following the circle like a clock face.
    num.style.transform = `rotate(${angle}deg) translateY(-${NUMBER_RADIUS}px)`;

    if (channel && session && session.activeUrl === channel.url) {
      num.classList.add("active");
      activeIndex = i;
      activeLabel = channel.label;
    }
    rotorEl.appendChild(num);
  }

  // Tapping the dial (numbers included, since clicks bubble up from the
  // decorative spans) surfs one channel at a time — no picking a specific
  // number directly, same as turning a real tuner knob. Which way depends
  // on which half of the dial got tapped: left half winds it forward
  // (clockwise), right half winds it back (counterclockwise).
  dialEl.addEventListener("click", (e) => {
    const rect = dialEl.getBoundingClientRect();
    const clickedLeftHalf = e.clientX - rect.left < rect.width / 2;
    changeChannel(clickedLeftHalf ? 1 : -1);
  });

  // The rotor (numbers + knob) turns as one rigid dial face. Rotating it by
  // -(index * slot angle) cancels out that number's own local rotation,
  // landing it upright under the fixed arrow — same math that makes the
  // rest of the ring radiate, run in reverse for whichever channel is on.
  const rotorAngle = activeIndex === -1 ? NEUTRAL_ANGLE : -(activeIndex * SLOT_ANGLE);

  // The rotor is a brand-new DOM node every render (full innerHTML rebuild),
  // so there's normally no "previous" transform for the CSS transition to
  // animate from — it would just snap. Park it at the last angle first with
  // transitions off, force a reflow, then re-enable and set the real target
  // so it visibly turns from where it was.
  rotorEl.style.transition = "none";
  rotorEl.style.transform = `rotate(${lastRotorAngle}deg)`;
  void rotorEl.offsetHeight;
  rotorEl.style.transition = "";
  rotorEl.style.transform = `rotate(${rotorAngle}deg)`;
  lastRotorAngle = rotorAngle;

  arrowEl.classList.toggle("live", !!session);

  if (activeLabel) {
    readoutEl.textContent = activeLabel;
    readoutEl.classList.add("shown");
  } else {
    readoutEl.classList.remove("shown");
  }

  wirePowerRow(channels, session);
  wirePictureBox();

  statusDot.classList.toggle("live", !!session);
}

// ---------- Remote view (90s keypad) ----------

async function renderKeypadView(channels, session) {
  const filters = await getFilterSettings();

  const keys = [];
  for (let n = 1; n <= KEYPAD_COUNT; n++) {
    const channel = channels[n - 1];
    keys.push(`<button class="keypad-btn${channel ? " lit" : ""}" data-n="${n}" ${channel ? "" : "disabled"}>${n}</button>`);
  }

  contentEl.innerHTML = `
    <div class="keypad-view">
      <div class="keypad-readout" id="keypadReadout"></div>
      <div class="keypad-grid">${keys.join("")}</div>
      <div class="chan-updown">
        <button class="updown-btn" id="chUpBtn">CH ▲</button>
        <button class="updown-btn" id="chDownBtn">CH ▼</button>
      </div>
      ${powerRowHtml()}
      ${pictureBoxHtml(filters)}
    </div>
  `;

  const readoutEl = document.getElementById("keypadReadout");
  const activeChannel = channels.find((ch) => session && ch.url === session.activeUrl);
  if (activeChannel) {
    readoutEl.textContent = activeChannel.label;
    readoutEl.classList.add("shown");
  } else {
    readoutEl.classList.remove("shown");
  }

  contentEl.querySelectorAll(".keypad-btn.lit").forEach((btn) => {
    const n = Number(btn.dataset.n);
    const channel = channels[n - 1];
    if (session && session.activeUrl === channel.url) btn.classList.add("active");
    btn.addEventListener("click", async () => {
      const res = await send({ type: "switch", url: channel.url });
      if (res.ok) render();
    });
  });

  document.getElementById("chUpBtn").addEventListener("click", () => changeChannel(1));
  document.getElementById("chDownBtn").addEventListener("click", () => changeChannel(-1));

  wirePowerRow(channels, session);
  wirePictureBox();

  statusDot.classList.toggle("live", !!session);
}

function renderEmptyRemote() {
  contentEl.innerHTML = `
    <p class="empty">No channels yet. Hit Settings to add up to ${MAX_CHANNELS}.</p>
  `;
  statusDot.classList.remove("live");
}

// ---------- Settings view ----------

async function renderSettings(channels) {
  const uiMode = await getUiMode();
  const channelCount = channels.filter(Boolean).length;

  contentEl.innerHTML = `
    <div class="settings-body">
      <div class="mode-toggle">
        <button class="mode-btn${uiMode === "dial" ? " active" : ""}" data-mode="dial">Dial</button>
        <button class="mode-btn${uiMode === "keypad" ? " active" : ""}" data-mode="keypad">90s Remote</button>
      </div>
      <label class="field-label">Label</label>
      <input id="labelInput" type="text" maxlength="12" placeholder="e.g. ESPN">
      <label class="field-label">Channel URL</label>
      <input id="urlInput" type="text" placeholder="https://tv.youtube.com/watch/...">
      <div class="form-error" id="formError"></div>
      <button class="add-btn" id="addBtn">Add channel</button>
      <ul class="ch-list" id="chList"></ul>
      <p class="count">${channelCount} / ${MAX_CHANNELS} channels configured</p>
    </div>
  `;

  contentEl.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      await setUiMode(btn.dataset.mode);
      contentEl.querySelectorAll(".mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
    });
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
    await setChannels(updated);
    renderSettings(updated);
  });

  const addBtn = document.getElementById("addBtn");
  const labelInput = document.getElementById("labelInput");
  const urlInput = document.getElementById("urlInput");
  const errorEl = document.getElementById("formError");

  if (channelCount >= MAX_CHANNELS) addBtn.disabled = true;

  addBtn.addEventListener("click", async () => {
    errorEl.textContent = "";
    const label = labelInput.value.trim() || "CH";
    const rawUrl = urlInput.value.trim();

    if (!rawUrl) {
      errorEl.textContent = "Paste a tv.youtube.com URL first.";
      return;
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(rawUrl);
    } catch {
      errorEl.textContent = "That's not a valid URL.";
      return;
    }

    if (parsedUrl.hostname !== "tv.youtube.com") {
      errorEl.textContent = "Must be a tv.youtube.com URL — copy it from your own logged-in session.";
      return;
    }

    const updated = await getChannels();
    if (updated.filter(Boolean).length >= MAX_CHANNELS) {
      errorEl.textContent = `${MAX_CHANNELS} channel max reached.`;
      return;
    }

    // Fill the first skipped number if there is one, otherwise land on the next one.
    const emptyIndex = updated.findIndex((ch) => !ch);
    const newChannel = { label: label.toUpperCase(), url: rawUrl };
    if (emptyIndex !== -1) {
      updated[emptyIndex] = newChannel;
    } else {
      updated.push(newChannel);
    }
    await setChannels(updated);
    renderSettings(updated);
  });

  statusDot.classList.remove("live");
}

// ---------- Router ----------

async function render() {
  const channels = await getChannels();

  if (view === "settings") {
    renderSettings(channels);
    return;
  }

  if (!channels.some(Boolean)) {
    renderEmptyRemote();
    return;
  }

  const res = await send({ type: "getSession" });
  const session = res.ok ? res.session : null;
  const fullyLaunched = session && channels.every((ch) => !ch || ch.url in session.tabsByUrl);
  const activeSession = fullyLaunched ? session : null;

  const uiMode = await getUiMode();
  if (uiMode === "keypad") {
    renderKeypadView(channels, activeSession);
  } else {
    renderDialView(channels, activeSession);
  }
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "sessionChanged" && view === "remote") render();
});

// Land on settings first run if nothing's configured yet.
(async () => {
  const channels = await getChannels();
  if (!channels.some(Boolean)) {
    view = "settings";
    gearBtn.classList.add("on");
  }
  render();
})();
