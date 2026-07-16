// Owns the live TV session: which window, which tabs, which channel is active.
// The side panel re-fetches this on load/re-render (it has no state of its own).
//
// Session shape: { windowId, tabsByUrl: { [channelUrl]: tabId }, activeUrl }

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error(err));

const CHANNEL_START = 2; // dial runs 2..13, matches sidepanel.js
const MAX_CHANNELS = 12; // dial has 12 slots (numbers 2..13), matches sidepanel.js

// `number` is the dial position (2..13) each channel lands on. Numbers don't
// need to be contiguous — leave gaps for channels you haven't assigned yet.
const DEFAULT_CHANNELS = [
  { number: 2, label: "CBS", url: "https://tv.youtube.com/watch/EhVGqawST0Q?vp=0gEEEgIwAQ%3D%3D" },
  { number: 4, label: "ESPN U", url: "https://tv.youtube.com/watch/KS2p4dNUF5w?vp=0gEEEgIwAQ%3D%3D" },
  { number: 5, label: "NBC", url: "https://tv.youtube.com/watch/gkF2WDFbP18?vp=0gEEEgIwAQ%3D%3D" },
  { number: 6, label: "NBA TV", url: "https://tv.youtube.com/watch/lmchYrC6la0?vp=0gEEEgIwAQ%3D%3D" },
  { number: 7, label: "ABC", url: "https://tv.youtube.com/watch/zqsbGdIBNsM?vp=0gEEEgIwAQ%3D%3D" },
  { number: 11, label: "PBS", url: "https://tv.youtube.com/watch/76hRBy0Z6IU?vp=0gEEEgIwAQ%3D%3D" },
  { number: 12, label: "FOX", url: "https://tv.youtube.com/watch/6dvEBPxhFwk?vp=0gEEEgIwAQ%3D%3D" },
  { number: 13, label: "TEL", url: "https://tv.youtube.com/watch/BoeJ8WY9dIY?vp=0gEEEgIwAQ%3D%3D" }
];

// Places each default at the dial slot its `number` maps to, leaving null
// gaps in between for any numbers that were skipped.
function buildDefaultChannels(entries) {
  const maxIndex = Math.max(...entries.map(({ number }) => number - CHANNEL_START));
  const channels = new Array(maxIndex + 1).fill(null);
  for (const { number, label, url } of entries) {
    const index = number - CHANNEL_START;
    if (index < 0 || index >= MAX_CHANNELS) {
      console.error(`channel number ${number} is out of dial range, skipping`, label);
      continue;
    }
    channels[index] = { label, url };
  }
  return channels;
}

chrome.runtime.onInstalled.addListener(async () => {
  const { channels } = await chrome.storage.local.get("channels");
  if (!channels) {
    await chrome.storage.local.set({ channels: buildDefaultChannels(DEFAULT_CHANNELS) });
  }
});

const SESSION_KEY = "session";

async function getSession() {
  const { session } = await chrome.storage.session.get(SESSION_KEY);
  return session || null;
}

async function setSession(session) {
  await chrome.storage.session.set({ [SESSION_KEY]: session });
}

async function clearSession() {
  await chrome.storage.session.remove(SESSION_KEY);
}

async function getChannels() {
  const { channels } = await chrome.storage.local.get("channels");
  return channels || [];
}

// Tells the tab that just became the active channel to flash its OSD banner.
// Best-effort: if the content script isn't listening yet (tab still loading
// right after creation), the message silently fails and no banner shows —
// acceptable for that one edge case rather than adding retry complexity.
async function announceChannel(tabId, url) {
  const channels = await getChannels();
  const index = channels.findIndex((ch) => ch && ch.url === url);
  if (index === -1) return;
  chrome.tabs.sendMessage(tabId, {
    type: "channelOSD",
    label: channels[index].label,
    number: index + CHANNEL_START
  }).catch(() => {});
}

async function launch(windowId) {
  const channels = (await getChannels()).filter(Boolean);
  if (channels.length === 0) return { ok: false, error: "no-channels" };

  const existingTabs = await chrome.tabs.query({ windowId });
  const tabsByUrl = {};

  for (const channel of channels) {
    const match = existingTabs.find((t) => t.url === channel.url);
    if (match) {
      tabsByUrl[channel.url] = match.id;
    } else {
      const tab = await chrome.tabs.create({ windowId, url: channel.url, active: false });
      tabsByUrl[channel.url] = tab.id;
    }
  }

  const activeUrl = channels[0].url;
  const entries = Object.entries(tabsByUrl);
  await Promise.all(entries.map(([url, tabId]) =>
    chrome.tabs.update(tabId, { muted: url !== activeUrl, active: url === activeUrl })
  ));

  const groupId = await groupChannelTabs(windowId, Object.values(tabsByUrl));

  const session = { windowId, tabsByUrl, activeUrl, groupId };
  await setSession(session);

  // The tab was just created — give its content script a moment to load
  // before trying to message it.
  setTimeout(() => announceChannel(tabsByUrl[activeUrl], activeUrl), 800);

  return { ok: true, session };
}

// Puts every channel tab into one named, colored group. Reuses the previous
// group if it still exists (so relaunching/adding channels doesn't fragment
// into multiple groups); otherwise creates a fresh one.
async function groupChannelTabs(windowId, tabIds) {
  const prevSession = await getSession();
  let groupId = prevSession && prevSession.windowId === windowId ? prevSession.groupId : undefined;

  if (groupId != null) {
    try {
      await chrome.tabGroups.get(groupId);
    } catch {
      groupId = undefined; // group no longer exists
    }
  }

  try {
    groupId = await chrome.tabs.group({ tabIds, groupId });
    await chrome.tabGroups.update(groupId, {
      title: "Retro TV",
      color: "orange",
      collapsed: false
    });
  } catch (err) {
    console.error("tab grouping failed:", err);
    return null;
  }

  return groupId;
}

async function switchChannel(url) {
  const session = await getSession();
  if (!session) return { ok: false, error: "no-session" };
  if (!(url in session.tabsByUrl)) return { ok: false, error: "unknown-channel" };

  // Persist the new activeUrl *before* activating the tab. Activation fires
  // tabs.onActivated below, which re-reads the session to detect manual tab
  // clicks — if that read still saw the old activeUrl, it would think this
  // was a manual click, re-save, and broadcast a redundant sessionChanged
  // that made the side panel re-render mid-animation.
  session.activeUrl = url;
  await setSession(session);

  const entries = Object.entries(session.tabsByUrl);
  await Promise.all(entries.map(([chUrl, tabId]) =>
    chrome.tabs.update(tabId, { muted: chUrl !== url, active: chUrl === url })
  ));
  await chrome.windows.update(session.windowId, { focused: true });

  announceChannel(session.tabsByUrl[url], url);
  return { ok: true, session };
}

async function stop() {
  const session = await getSession();
  if (session) {
    const tabIds = Object.values(session.tabsByUrl);
    try { await chrome.tabs.remove(tabIds); } catch {}
    await clearSession();
  }
  return { ok: true };
}

// If the user clicks a channel tab directly instead of using the remote,
// keep the session's notion of "active channel" honest and tell the panel.
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  const session = await getSession();
  if (!session || session.windowId !== windowId) return;

  const entry = Object.entries(session.tabsByUrl).find(([, id]) => id === tabId);
  if (!entry) return; // activated tab isn't one of our channels — leave it alone
  const [url] = entry;
  if (url === session.activeUrl) return;

  await Promise.all(Object.entries(session.tabsByUrl).map(([chUrl, id]) =>
    chUrl === url ? Promise.resolve() : chrome.tabs.update(id, { muted: true })
  ));
  await chrome.tabs.update(tabId, { muted: false });

  session.activeUrl = url;
  await setSession(session);
  announceChannel(tabId, url);
  chrome.runtime.sendMessage({ type: "sessionChanged", session }).catch(() => {});
});

// If a channel tab gets closed manually, drop it from the session so dedupe
// and the remote's "active" state don't point at a dead tab.
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const session = await getSession();
  if (!session) return;
  const entry = Object.entries(session.tabsByUrl).find(([, id]) => id === tabId);
  if (!entry) return;

  const [url] = entry;
  delete session.tabsByUrl[url];
  if (session.activeUrl === url) {
    const remaining = Object.keys(session.tabsByUrl);
    session.activeUrl = remaining[0] || null;
  }
  await setSession(session);
  chrome.runtime.sendMessage({ type: "sessionChanged", session }).catch(() => {});
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    if (msg.type === "launch") sendResponse(await launch(msg.windowId));
    else if (msg.type === "switch") sendResponse(await switchChannel(msg.url));
    else if (msg.type === "stop") sendResponse(await stop());
    else if (msg.type === "getSession") sendResponse({ ok: true, session: await getSession() });
    else sendResponse({ ok: false, error: "unknown-message" });
  })();
  return true; // async response
});
