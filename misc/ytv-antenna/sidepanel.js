const MAX_CHANNELS = 12; // dial runs 2 through 13, VHF-style
const CHANNEL_START = 2;
const NUMBER_RADIUS = 90;

// The dial face has 13 equally-spaced positions: the 12 channels plus the
// decorative "U" slot right after 13 — so every gap on the face is the
// same width, including the one the pointer parks in when the TV is off.
const TOTAL_DIAL_SLOTS = 13;
const SLOT_ANGLE = 360 / TOTAL_DIAL_SLOTS; // degrees between adjacent slots
const VANITY_SLOT_INDEX = MAX_CHANNELS; // 12 — right after channel 13
const NEUTRAL_ANGLE = -(VANITY_SLOT_INDEX * SLOT_ANGLE); // pointer parks right on U when TV is off

// Picture-control knobs: 0% parks at 7 o'clock (210deg clockwise from
// noon), 100% parks at 5 o'clock (150deg, i.e. 510deg — a 300deg sweep
// the long way around through noon).
const MINI_DIAL_START_ANGLE = 210;
const MINI_DIAL_SWEEP = 300;

const contentEl = document.getElementById("content");
const statusDot = document.getElementById("statusDot");
const gearBtn = document.getElementById("gearBtn");

let view = "remote"; // "remote" | "settings"
let lastRotorAngle = NEUTRAL_ANGLE; // carries over across re-renders so the dial has a "from" angle to turn from

// Set by changeChannel right before it triggers a render, so that render
// can keep spinning the rotor the same physical direction as the click/key
// that caused it, instead of recomputing a bounded angle from scratch (which
// snaps the short way and reverses direction at the 13-to-2 wrap). Null
// means "no pending click" — fall back to the plain formula.
let pendingRotorSteps = null;

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

const MINI_DIALS = [
  { key: "color", label: "Color", min: 0, max: 150, step: 5 },
  { key: "contrast", label: "Contrast", min: 50, max: 150, step: 5 },
  { key: "brightness", label: "Bright", min: 50, max: 150, step: 5 },
  { key: "hue", label: "Hue", min: 0, max: 360, step: 10 }
];

function miniDialAngle(value, min, max) {
  const pct = (value - min) / (max - min);
  return MINI_DIAL_START_ANGLE + pct * MINI_DIAL_SWEEP;
}

function miniDialHtml({ key, label, min, max, step }, value) {
  const angle = miniDialAngle(value, min, max);
  return `
    <div class="mini-dial-cell">
      <span class="mini-dial-label">${label}</span>
      <div class="mini-dial" data-key="${key}" data-min="${min}" data-max="${max}" data-step="${step}" data-value="${value}">
        <div class="mini-dial-face"></div>
        <div class="mini-dial-rotor" style="transform: rotate(${angle}deg)">
          <div class="mini-dial-tick"></div>
        </div>
      </div>
    </div>
  `;
}

function pictureBoxHtml(filters) {
  return `
    <div class="dial-grid">
      ${MINI_DIALS.map((d) => miniDialHtml(d, filters[d.key])).join("")}
    </div>
  `;
}

const HOLD_DELAY = 350; // ms before a held-down press starts repeating
const HOLD_INTERVAL = 90; // ms between repeats while held

// Same press-a-half gesture as the channel dial: right side winds the
// knob forward (clockwise, up), left side winds it back (down). Holding
// a side down keeps stepping until release, instead of one nudge per press.
function wirePictureBox() {
  document.querySelectorAll(".mini-dial").forEach((dialEl) => {
    let holdTimeout = null;
    let holdInterval = null;

    async function stepDial(direction) {
      const min = Number(dialEl.dataset.min);
      const max = Number(dialEl.dataset.max);
      const step = Number(dialEl.dataset.step);

      let value = Number(dialEl.dataset.value) + direction * step;
      value = Math.min(max, Math.max(min, value));
      dialEl.dataset.value = value;

      const rotorEl = dialEl.querySelector(".mini-dial-rotor");
      rotorEl.style.transform = `rotate(${miniDialAngle(value, min, max)}deg)`;

      const filters = await getFilterSettings();
      filters[dialEl.dataset.key] = value;
      await setFilterSettings(filters);
    }

    function stopHold() {
      clearTimeout(holdTimeout);
      clearInterval(holdInterval);
      holdTimeout = null;
      holdInterval = null;
    }

    // Pointer capture (rather than a document-level mouseup) keeps the
    // release tied to this element even if the cursor drifts off the knob
    // while held, and needs no cleanup on the next full re-render.
    dialEl.addEventListener("pointerdown", (e) => {
      dialEl.setPointerCapture(e.pointerId);
      const rect = dialEl.getBoundingClientRect();
      const direction = e.clientX - rect.left >= rect.width / 2 ? 1 : -1;

      stepDial(direction);
      holdTimeout = setTimeout(() => {
        holdInterval = setInterval(() => stepDial(direction), HOLD_INTERVAL);
      }, HOLD_DELAY);
    });

    dialEl.addEventListener("pointerup", stopHold);
    dialEl.addEventListener("pointercancel", stopHold);
  });
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
  if (switchRes.ok && view === "remote") {
    // Physical slots on the dial face are fixed at TOTAL_DIAL_SLOTS (the 12
    // channels plus U), independent of channels.length — so figure out the
    // signed number of PHYSICAL slots between `from` and `nextIndex` that
    // matches the direction just clicked, wrapping through U's slot rather
    // than however few array entries happen to separate them. E.g. 13->2
    // forward is 2 physical slots (through U), not 1.
    pendingRotorSteps = delta > 0
      ? (((nextIndex - from) % TOTAL_DIAL_SLOTS) + TOTAL_DIAL_SLOTS) % TOTAL_DIAL_SLOTS
      : -((((from - nextIndex) % TOTAL_DIAL_SLOTS) + TOTAL_DIAL_SLOTS) % TOTAL_DIAL_SLOTS);
    render();
  }
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
    <div class="dial-stage">
      <div class="dial">
        <div class="dial-metal"></div>
        <div class="dial-arrow" id="dialArrow"></div>
        <div class="dial-rotor" id="dialRotor">
          <div class="dial-knob">
            <div class="dial-knob-face"></div>
            <div class="dial-knob-handle" style="transform: translate(-50%, -50%) rotate(${VANITY_SLOT_INDEX * SLOT_ANGLE}deg)"></div>
          </div>
        </div>
      </div>
    </div>
    ${pictureBoxHtml(filters)}
    ${powerRowHtml()}
  `;

  const dialEl = document.querySelector(".dial");
  const rotorEl = document.getElementById("dialRotor");
  const arrowEl = document.getElementById("dialArrow");

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

  // Decorative only — not a real channel slot, doesn't factor into
  // changeChannel's indexing. Takes the dedicated slot right after 13, one
  // of the 13 equally-spaced positions on the face.
  const vanityNum = document.createElement("span");
  vanityNum.className = "dial-num vanity";
  vanityNum.textContent = "U";
  vanityNum.style.transform = `rotate(${VANITY_SLOT_INDEX * SLOT_ANGLE}deg) translateY(-${NUMBER_RADIUS}px)`;
  rotorEl.appendChild(vanityNum);

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
  // When this render was triggered by a click/key (pendingRotorSteps set),
  // keep turning from lastRotorAngle by that many physical slots instead —
  // otherwise recomputing the bounded formula fresh snaps to whichever way
  // is numerically shorter and can spin backward at the 13-to-2 wrap.
  let rotorAngle;
  if (activeIndex === -1) {
    rotorAngle = NEUTRAL_ANGLE;
  } else if (pendingRotorSteps !== null) {
    rotorAngle = lastRotorAngle - pendingRotorSteps * SLOT_ANGLE;
  } else {
    rotorAngle = -(activeIndex * SLOT_ANGLE);
  }
  pendingRotorSteps = null;

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

  wirePowerRow(channels, session);
  wirePictureBox();

  statusDot.classList.toggle("live", !!session);
}

// ---------- Remote view (90s keypad) ----------

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
  renderDialView(channels, activeSession);
 
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
