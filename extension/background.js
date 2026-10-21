/**
 * One click saves the page and returns immediately. All the model work happens
 * back on the grain server, because a capture that takes three seconds is a
 * capture you stop making.
 */

const DEFAULT_SERVER = "http://localhost:4610";

async function serverUrl() {
  const { server } = await chrome.storage.sync.get("server");
  return (server || DEFAULT_SERVER).replace(/\/$/, "");
}

function badge(text, color) {
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color });
  if (text !== "..") {
    setTimeout(() => chrome.action.setBadgeText({ text: "" }), 2500);
  }
}

async function readTokens(tabId) {
  // Same tokens.js the CLI injects via Playwright, so both paths agree.
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ["tokens.js"] });
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => window.__grainExtractTokens(),
    });
    return result?.result;
  } catch (error) {
    // Some pages block injection (strict CSP, chrome:// URLs, the web store).
    // The screenshot on its own is still worth saving.
    console.warn("grain: could not read tokens,   saving the screenshot only", error);
    return undefined;
  }
}

async function capture(tab) {
  if (!tab?.id || !/^https?:/i.test(tab.url || "")) {
    badge("no", "#b4472a");
    return;
  }

  badge("..", "#6b675f");

  try {
    const image = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
    const tokens = await readTokens(tab.id);

    const response = await fetch(`${await serverUrl()}/capture`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: tab.url, image, tokens }),
    });

    if (!response.ok) throw new Error(`server said ${response.status}`);

    const data = await response.json();
    badge(data.duplicate ? "dup" : "ok", data.duplicate ? "#6b675f" : "#2f7d4f");
  } catch (error) {
    badge("err", "#b4472a");
    console.error("grain: capture failed. Is `bun run serve` running?", error);
  }
}

chrome.action.onClicked.addListener(capture);

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== "capture") return;
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await capture(tab);
});
