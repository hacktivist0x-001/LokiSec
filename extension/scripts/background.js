// LokiSec Background Service Worker

// Open side panel on action icon click
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error("Side panel behavior error:", error));

// Store recent requests headers in memory for active tabs
const tabHeadersMap = new Map();

chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    if (details.tabId >= 0 && details.type === "main_frame") {
      tabHeadersMap.set(details.tabId, {
        url: details.url,
        statusCode: details.statusCode,
        statusLine: details.statusLine,
        responseHeaders: details.responseHeaders || [],
        timestamp: Date.now()
      });

      // Broadcast to sidepanel if listening
      chrome.runtime.sendMessage({
        type: "HEADERS_UPDATED",
        tabId: details.tabId,
        data: tabHeadersMap.get(details.tabId)
      }).catch(() => {});
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Handle messaging from popup / sidepanel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "GET_TAB_HEADERS") {
    const headers = tabHeadersMap.get(request.tabId) || null;
    sendResponse({ headers });
    return true;
  }
});
