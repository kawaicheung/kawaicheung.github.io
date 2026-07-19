const MAX_CHANNELS = 12; // dial runs 2 through 13, VHF-style
const CHANNEL_START = 2;
const NUMBER_RADIUS = 90;

// Any dial slot without a configured channel still tunes somewhere: a
// shared "dead air" page, same one for every empty slot.
const STATIC_URL = chrome.runtime.getURL("static.html");

// The dial face has 13 equally-spaced positions: the 12 channels plus the
// decorative "U" slot right after 13 — so every gap on the face is the
// same width, including the one the pointer parks in when the TV is off.
const TOTAL_DIAL_SLOTS = 13;
const SLOT_ANGLE = 360 / TOTAL_DIAL_SLOTS; // degrees between adjacent slots
const VANITY_SLOT_INDEX = MAX_CHANNELS; // 12 — right after channel 13
const NEUTRAL_ANGLE = -(VANITY_SLOT_INDEX * SLOT_ANGLE); // pointer parks right on U when TV is off

// Picture-control knobs: 0% parks straight down (180deg clockwise from
// noon), 100% parks at 3 o'clock (450deg, i.e. 90deg — a 270deg sweep
// the long way around through 9 o'clock and noon), leaving the bottom-right
// quadrant (3 o'clock to straight down) as the dead zone.
const MINI_DIAL_START_ANGLE = 180;
const MINI_DIAL_SWEEP = 270;

const contentEl = document.getElementById("content");
const gearBtn = document.getElementById("gearBtn");
const SETTINGS_URL = chrome.runtime.getURL("settings.html");

let lastRotorAngle = NEUTRAL_ANGLE; // carries over across re-renders so the dial has a "from" angle to turn from

// Set by changeChannel right before it triggers a render, so that render
// can keep spinning the rotor the same physical direction as the click/key
// that caused it, instead of recomputing a bounded angle from scratch (which
// snaps the short way and reverses direction at the 13-to-2 wrap). Null
// means "no pending click" — fall back to the plain formula.
let pendingRotorSteps = null;

// Which physical dial slot (0..MAX_CHANNELS-1) we're parked on. Needed
// because empty slots all share the same STATIC_URL tab — session.activeUrl
// alone can't tell two different empty slots apart, so this is the source
// of truth for "where on the dial are we" whenever we're sitting on static.
let currentDialIndex = null;

// True whenever the tab the user is actually looking at isn't part of the
// TV (not a channel tab, not settings, not static) — background.js tracks
// this globally and pushes it here. Purely a rendering concern: it parks
// the rotor at the vanity "U" slot without touching the real session or
// currentDialIndex, so glancing back at a channel tab (no dial tap needed)
// snaps the rotor straight back to whatever's actually playing.
let awayFromTV = false;

// Urls whose tab has actually finished loading — populated live from
// background.js's per-channel "channelLoaded" broadcasts during launch()'s
// warm-up loop, so each dial number can light up the moment its own tab is
// ready instead of all at once when the whole session finally goes live.
let loadedChannelUrls = new Set();

// Clears remembered dial position/rotation state. Needed on power-off and
// whenever the channel lineup changes — a stale "parked on slot 3" index
// can end up pointing at a totally different channel once slots are
// added/removed/refilled, which is what reads as the dial "glitching."
function resetDialState() {
  currentDialIndex = null;
  lastRotorAngle = NEUTRAL_ANGLE;
  pendingRotorSteps = null;
  awayFromTV = false;
  loadedChannelUrls = new Set();
}

// Settings now lives in its own tab (checklist scraping + the channel list
// don't need the side panel's cramped width). Reuse an already-open
// settings tab instead of stacking up duplicates on repeat gear clicks.
async function openSettingsTab() {
  const [existing] = await chrome.tabs.query({ url: SETTINGS_URL });
  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    await chrome.tabs.create({ url: SETTINGS_URL });
  }
}

gearBtn.addEventListener("click", openSettingsTab);

function send(msg) {
  return chrome.runtime.sendMessage(msg);
}

async function getChannels() {
  const { channels } = await chrome.storage.local.get("channels");
  return channels || [];
}

const DEFAULT_FILTER = { color: 100, contrast: 100, brightness: 100, hue: 0, lines: 30 };

// Renamed from "filterSettings" to leave any stale saved values behind and
// start clean on the new 5-control (incl. lines) shape and rotation math.
const FILTER_STORAGE_KEY = "filterSettingsV2";

async function getFilterSettings() {
  const { [FILTER_STORAGE_KEY]: filterSettings } = await chrome.storage.local.get(FILTER_STORAGE_KEY);
  return { ...DEFAULT_FILTER, ...(filterSettings || {}) };
}

async function setFilterSettings(settings) {
  await chrome.storage.local.set({ [FILTER_STORAGE_KEY]: settings });
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

function wirePowerRow(session) {
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
    onBtn.disabled = true;
    const win = await chrome.windows.getCurrent();
    const res = await send({ type: "launch", windowId: win.id });
    onBtn.disabled = false;
    if (res.ok) render();
  });

  offBtn.addEventListener("click", async () => {
    await send({ type: "stop" });
    resetDialState();
    render();
  });
}

// `default` is each dial's neutral filter value (matches DEFAULT_FILTER) —
// carried here too so miniDialAngle can anchor it to a fixed visual
// position, since the four controls span very different min/max widths.
const MINI_DIALS = [
  { key: "color", label: "Color", min: 0, max: 150, step: 5, default: 100 },
  { key: "contrast", label: "Contrast", min: 50, max: 150, step: 5, default: 100 },
  { key: "brightness", label: "Bright", min: 50, max: 150, step: 5, default: 100 },
  { key: "hue", label: "Hue", min: -180, max: 180, step: 10, default: 0 }
];

// Fifth picture control — not a rotary knob like the others, a vertical
// slider (matches a real TV's separate "lines"/sharpness pull-slider).
const MINI_SLIDER = { key: "lines", label: "TRK", min: 0, max: 100, step: 5 };

// Piecewise rather than one flat (value-min)/(max-min): each dial's own
// `default` sits at a different fraction of its min/max span (e.g. Color's
// neutral 100 is 67% of 0-150, Hue's is 28% of 0-360), so a flat mapping
// makes four knobs at their defaults point four different ways. Splitting
// the sweep at the default and scaling each half independently pins every
// dial's default to the same middle angle while still landing min on 6
// o'clock and max on 3 o'clock.
function miniDialAngle(value, min, max, defaultValue) {
  const pct = value <= defaultValue
    ? 0.5 * (value - min) / (defaultValue - min)
    : 0.5 + 0.5 * (value - defaultValue) / (max - defaultValue);
  return MINI_DIAL_START_ANGLE + pct * MINI_DIAL_SWEEP;
}

function miniDialHtml({ key, label, min, max, step, default: defaultValue }, value) {
  const angle = miniDialAngle(value, min, max, defaultValue);
  return `
    <div class="mini-dial-cell">
      <span class="mini-dial-label">${label}</span>
      <div class="mini-dial" data-key="${key}" data-min="${min}" data-max="${max}" data-step="${step}" data-default="${defaultValue}" data-value="${value}">
        <div class="mini-dial-rotor" style="transform: rotate(${angle}deg)">
          <div class="mini-dial-face"></div>
          <div class="mini-dial-tick"></div>
        </div>
      </div>
    </div>
  `;
}

// Vertical slider, not a dial: 0% (min) parks the knob at the bottom of
// the track, 100% (max) at the top.
function miniSliderHtml({ key, label, min, max, step }, value) {
  const pct = ((value - min) / (max - min)) * 100;
  return `
    <div class="mini-slider-cell">
      <span class="mini-dial-label">${label}</span>
      <div class="mini-slider" data-key="${key}" data-min="${min}" data-max="${max}" data-step="${step}" data-value="${value}">
        <div class="mini-slider-track">
          <div class="mini-slider-knob" style="bottom: ${pct}%"></div>
        </div>
      </div>
    </div>
  `;
}

function pictureBoxHtml(filters) {
  return `
    <div class="dial-grid">
      ${MINI_DIALS.map((d) => miniDialHtml(d, filters[d.key])).join("")}
      ${miniSliderHtml(MINI_SLIDER, filters[MINI_SLIDER.key])}
    </div>
  `;
}

const HOLD_DELAY = 250; // ms before a held-down press starts repeating
const HOLD_INTERVAL = 40; // ms between repeats while held

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
      const defaultValue = Number(dialEl.dataset.default);

      let value = Number(dialEl.dataset.value) + direction * step;
      value = Math.min(max, Math.max(min, value));
      dialEl.dataset.value = value;

      const rotorEl = dialEl.querySelector(".mini-dial-rotor");
      rotorEl.style.transform = `rotate(${miniDialAngle(value, min, max, defaultValue)}deg)`;

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

// Unlike the mini-dials (relative nudges per tap), a slider's whole point is
// landing wherever you grab it — so this maps pointer Y straight to a value
// rather than stepping from the current one.
function wireMiniSlider() {
  const sliderEl = document.querySelector(".mini-slider");
  if (!sliderEl) return;
  const trackEl = sliderEl.querySelector(".mini-slider-track");
  const knobEl = sliderEl.querySelector(".mini-slider-knob");

  async function setFromClientY(clientY) {
    const min = Number(sliderEl.dataset.min);
    const max = Number(sliderEl.dataset.max);
    const step = Number(sliderEl.dataset.step);

    const rect = trackEl.getBoundingClientRect();
    const pct = 1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    let value = min + pct * (max - min);
    value = Math.round(value / step) * step;
    value = Math.min(max, Math.max(min, value));
    if (value === Number(sliderEl.dataset.value)) return;
    sliderEl.dataset.value = value;

    knobEl.style.bottom = `${((value - min) / (max - min)) * 100}%`;

    const filters = await getFilterSettings();
    filters[sliderEl.dataset.key] = value;
    await setFilterSettings(filters);
  }

  sliderEl.addEventListener("pointerdown", (e) => {
    sliderEl.setPointerCapture(e.pointerId);
    setFromClientY(e.clientY);
  });
  sliderEl.addEventListener("pointermove", (e) => {
    if (!sliderEl.hasPointerCapture(e.pointerId)) return;
    setFromClientY(e.clientY);
  });
}

// Advances one channel slot at a time (delta = +1 or -1), wrapping around —
// same motion whether triggered by a dial tap or an arrow key. Always reads
// fresh state rather than trusting a stale closure from whichever render
// call happened to be active when the listener was attached.
async function changeChannel(delta) {
  const channels = await getChannels();

  const res = await send({ type: "getSession" });
  const session = res.ok ? res.session : null;
  if (!session) return; // TV has to be on to surf channels

  // Having wandered off to some other tab, the dial's been sitting parked
  // on the vanity U slot — first tap back treats that as the actual
  // position, landing on 2 (forward) or 13 (back) same as coming off the
  // real U gap between 13 and 2, rather than resuming wherever playback
  // silently was.
  let from;
  if (awayFromTV) {
    from = VANITY_SLOT_INDEX;
  } else {
    // Prefer the remembered dial position over deriving it from
    // session.activeUrl — that lookup can't tell empty slots apart, since
    // they all resolve to the same shared STATIC_URL.
    from = currentDialIndex;
    if (from === null) {
      const currentIndex = channels.findIndex((ch) => ch && ch.url === session.activeUrl);
      from = currentIndex === -1 ? 0 : currentIndex;
    }
  }

  // Every one of the 12 physical slots is a valid stop now — an empty one
  // just tunes to static instead of being skipped.
  const nextIndex = awayFromTV
    ? (delta > 0 ? 0 : MAX_CHANNELS - 1)
    : (from + delta + MAX_CHANNELS) % MAX_CHANNELS;
  const nextChannel = channels[nextIndex] || { label: "STATIC", url: STATIC_URL };

  // Passed straight through rather than left for background.js to look
  // up — every empty slot shares the same STATIC_URL, so a url-based
  // lookup there can't tell which physical slot this particular switch
  // landed on the way it can for a real channel.
  const switchRes = await send({
    type: "switch",
    url: nextChannel.url,
    number: CHANNEL_START + nextIndex,
    label: nextChannel.label
  });
  if (switchRes.ok) {
    currentDialIndex = nextIndex;
    awayFromTV = false;
    // Physical slots on the dial face are fixed at TOTAL_DIAL_SLOTS (the 12
    // channels plus U), independent of MAX_CHANNELS — so figure out the
    // signed number of PHYSICAL slots between `from` and `nextIndex` that
    // matches the direction just clicked, wrapping through U's slot rather
    // than however few positions happen to separate them. E.g. 13->2
    // forward is 2 physical slots (through U), not 1.
    pendingRotorSteps = delta > 0
      ? (((nextIndex - from) % TOTAL_DIAL_SLOTS) + TOTAL_DIAL_SLOTS) % TOTAL_DIAL_SLOTS
      : -((((from - nextIndex) % TOTAL_DIAL_SLOTS) + TOTAL_DIAL_SLOTS) % TOTAL_DIAL_SLOTS);
    render();
  }
}

document.addEventListener("keydown", (e) => {
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

  // First render after turning on with nothing configured yet: land on
  // slot 0 instead of leaving the dial parked in the decorative U gap —
  // there's no channel history yet to prefer any other slot.
  if (currentDialIndex === null && session && session.activeUrl === STATIC_URL) {
    currentDialIndex = 0;
  }

  // Away from the TV, the numbers ring/rotor render exactly as if nothing
  // were active (parking on U) — the power switch below still reflects the
  // real session, since playback itself hasn't stopped, only where the
  // user's looking has wandered.
  const displaySession = awayFromTV ? null : session;

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
    // Lit tracks the tab actually being loaded/ready — live via
    // loadedChannelUrls while launch() is still warming up, and (after a
    // panel reload mid-session) straight off session.tabsByUrl once it's
    // already there — not just "this slot has a channel configured", which
    // said nothing about whether its tab was really up yet.
    const isLoaded = !!channel && (
      loadedChannelUrls.has(channel.url) ||
      (session && channel.url in session.tabsByUrl)
    );
    num.className = "dial-num" + (isLoaded ? " lit" : "");
    num.textContent = String(CHANNEL_START + i);
    // No counter-rotation: the number keeps the `angle` rotation, so it
    // radiates — upright only once the rotor below brings it to the top,
    // tilted everywhere else, following the circle like a clock face.
    num.style.transform = `rotate(${angle}deg) translateY(-${NUMBER_RADIUS}px)`;

    // An empty slot showing static has no `channel` of its own to match
    // against session.activeUrl (every empty slot shares STATIC_URL) — so
    // it's only "this" slot's turn to glow when currentDialIndex agrees.
    const isActive = channel
      ? displaySession && displaySession.activeUrl === channel.url
      : displaySession && displaySession.activeUrl === STATIC_URL && currentDialIndex === i;

    if (isActive) {
      num.classList.add("active");
      activeIndex = i;
      activeLabel = channel ? channel.label : "STATIC";
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
  // on which half of the dial got tapped: right half winds it forward
  // (clockwise), left half winds it back (counterclockwise).
  dialEl.addEventListener("click", (e) => {
    const rect = dialEl.getBoundingClientRect();
    const clickedLeftHalf = e.clientX - rect.left < rect.width / 2;
    changeChannel(clickedLeftHalf ? -1 : 1);
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

  wirePowerRow(session);
  wirePictureBox();
  wireMiniSlider();
}

// ---------- Router ----------

async function render() {
  const channels = await getChannels();

  const res = await send({ type: "getSession" });
  const session = res.ok ? res.session : null;
  const fullyLaunched = session && channels.every((ch) => !ch || ch.url in session.tabsByUrl);
  const activeSession = fullyLaunched ? session : null;

  renderDialView(channels, activeSession);
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "sessionChanged") render();
  else if (msg.type === "tvFocusChanged") {
    awayFromTV = msg.away;
    render();
  } else if (msg.type === "channelLoaded") {
    loadedChannelUrls.add(msg.url);
    render();
  }
});

// The channel list only ever changes from the settings tab now — pick up
// edits made there (which also force the session off) by reacting to
// storage directly, and clear out any now-stale dial position/rotation so
// it doesn't end up pointing at a slot that moved or disappeared.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local" || !changes.channels) return;
  resetDialState();
  render();
});

// Open settings first run if nothing's configured yet.
(async () => {
  const channels = await getChannels();
  if (!channels.some(Boolean)) openSettingsTab();

  // Pick up whatever tab already has focus — the panel may be loading
  // fresh (e.g. browser restart) with some unrelated tab already active,
  // and there's no focus-change event to catch that after the fact.
  const focusRes = await send({ type: "getTvFocus" });
  if (focusRes.ok) awayFromTV = focusRes.away;

  render();
})();
