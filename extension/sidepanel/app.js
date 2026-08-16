// LokiSec - Sidepanel Controller & Event Handlers

import { auditSecurityHeaders } from "../modules/headers_audit.js";
import { decodeJWT, encodeJWT } from "../modules/jwt_tool.js";
import { runAISecurityReview } from "../modules/ai_analyzer.js";
import {
  encodeBase64,
  decodeBase64,
  encodeUrl,
  decodeUrl,
  toHex,
  fromHex
} from "../modules/encoder.js";

// Cached page data
let activeTabId = null;
let currentUrl = "";
let harvestedPageData = null;
let savedApiKey = "";

document.addEventListener("DOMContentLoaded", async () => {
  setupAccordion();
  setupSearchFilter();
  setupApiKeyStorage();
  setupNotesPersistence();
  setupTabMonitoring();
  bindActionButtons();
});

// 1. Accordion Toggle
function setupAccordion() {
  const categories = document.querySelectorAll(".tool-category");
  categories.forEach((cat) => {
    const header = cat.querySelector(".category-header");
    header.addEventListener("click", () => {
      cat.classList.toggle("open");
    });
  });
}

// 2. Search filter for categories and tools
function setupSearchFilter() {
  const searchInput = document.getElementById("tool-search");
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    const categories = document.querySelectorAll(".tool-category");
    categories.forEach((cat) => {
      const text = cat.textContent.toLowerCase();
      if (text.includes(query)) {
        cat.style.display = "block";
        if (query.length > 2) cat.classList.add("open");
      } else {
        cat.style.display = "none";
      }
    });
  });
}

// 3. API Key Storage
async function setupApiKeyStorage() {
  const input = document.getElementById("gemini-api-key");
  const badge = document.getElementById("api-status-badge");
  const saveBtn = document.getElementById("btn-save-key");

  const stored = await chrome.storage.local.get(["gemini_api_key"]);
  if (stored.gemini_api_key) {
    savedApiKey = stored.gemini_api_key;
    input.value = savedApiKey;
    badge.textContent = "Faol (Saqlangan)";
    badge.className = "badge badge-good";
  }

  saveBtn.addEventListener("click", async () => {
    const val = input.value.trim();
    if (val) {
      await chrome.storage.local.set({ gemini_api_key: val });
      savedApiKey = val;
      badge.textContent = "Faol (Saqlangan)";
      badge.className = "badge badge-good";
      alert("API Key muvaffaqiyatli saqlandi!");
    } else {
      await chrome.storage.local.remove(["gemini_api_key"]);
      savedApiKey = "";
      badge.textContent = "O'rnatilmagan";
      badge.className = "badge badge-warn";
    }
  });
}

// 4. Notes persistence
async function setupNotesPersistence() {
  const textarea = document.getElementById("audit-notes");
  const stored = await chrome.storage.local.get(["loki_audit_notes"]);
  if (stored.loki_audit_notes) {
    textarea.value = stored.loki_audit_notes;
  }

  textarea.addEventListener("input", () => {
    chrome.storage.local.set({ loki_audit_notes: textarea.value });
  });

  document.getElementById("btn-clear-notes").addEventListener("click", () => {
    textarea.value = "";
    chrome.storage.local.remove(["loki_audit_notes"]);
  });

  document.getElementById("btn-export-notes").addEventListener("click", () => {
    const blob = new Blob([textarea.value], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lokisec_notes_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

// 5. Tab & Active URL Monitoring
async function setupTabMonitoring() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab) {
    activeTabId = tab.id;
    currentUrl = tab.url || "";
    document.getElementById("target-url-input").value = currentUrl;
    fetchContentData();
  }

  document.getElementById("btn-refresh-tab").addEventListener("click", () => {
    fetchContentData();
  });

  document.getElementById("btn-copy-target").addEventListener("click", () => {
    navigator.clipboard.writeText(currentUrl);
    alert("Nishon URL nusxalandi: " + currentUrl);
  });

  document.getElementById("btn-clear-logs").addEventListener("click", () => {
    document.querySelectorAll(".output-panel").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
  });
}

// Harvest page via content script
function fetchContentData() {
  if (!activeTabId) return;
  chrome.tabs.sendMessage(
    activeTabId,
    { action: "LOKI_HARVEST_PAGE" },
    (response) => {
      if (chrome.runtime.lastError || !response || !response.success) {
        console.warn("Content script unreachable, injecting or page restricted.");
        return;
      }
      harvestedPageData = response.data;
      console.log("LokiSec Page Harvested:", harvestedPageData);
    }
  );
}

// 6. Action Buttons Binding
function bindActionButtons() {
  // A. Security Headers Audit
  document.getElementById("btn-audit-headers").addEventListener("click", async () => {
    const panel = document.getElementById("headers-output");
    panel.classList.remove("hidden");
    panel.textContent = "Tarmoq sarlavhalari o'qilmoqda...";

    chrome.runtime.sendMessage(
      { type: "GET_TAB_HEADERS", tabId: activeTabId },
      (res) => {
        const headers = res?.headers?.responseHeaders || [];
        const result = auditSecurityHeaders(headers);

        let report = `=== SECURITY HEADERS AUDIT ===\nTarget: ${currentUrl}\nServer: ${result.serverInfo.server}\n\n`;
        result.checks.forEach((c) => {
          const status = c.present ? "✅ [PASS]" : "❌ [MISSING]";
          report += `${status} ${c.name} (${c.severity})\n  Tavsif: ${c.description}\n  Qiymat: ${c.value || "Mavjud emas"}\n  Tavsiya: ${c.remediation}\n\n`;
        });
        panel.textContent = report;
      }
    );
  });

  // B. Cookies & Storage
  document.getElementById("btn-view-cookies").addEventListener("click", () => {
    const panel = document.getElementById("headers-output");
    panel.classList.remove("hidden");
    let report = `=== COOKIES & STORAGE ===\n`;
    report += `LocalStorage Kalitlari (${harvestedPageData?.localStorageKeys?.length || 0}):\n`;
    (harvestedPageData?.localStorageKeys || []).forEach((k) => (report += `  - ${k}\n`));
    report += `\nSessionStorage Kalitlari (${harvestedPageData?.sessionStorageKeys?.length || 0}):\n`;
    (harvestedPageData?.sessionStorageKeys || []).forEach((k) => (report += `  - ${k}\n`));
    report += `\nDocument Cookies:\n${harvestedPageData?.cookies || "Hech qanday ochiq cookie topilmadi."}`;
    panel.textContent = report;
  });

  // C. Tech Stack
  document.getElementById("btn-detect-tech").addEventListener("click", () => {
    const panel = document.getElementById("recon-output");
    panel.classList.remove("hidden");
    const techs = harvestedPageData?.techStack || [];
    panel.textContent = `=== DETECTED CLIENT TECH STACK ===\n${techs.length > 0 ? techs.map((t) => `• ${t}`).join("\n") : "Aniq framework belgilari aniqlanmadi (Vanilla yoki server-rendered)."}`;
  });

  // D. HTML Comments
  document.getElementById("btn-view-comments").addEventListener("click", () => {
    const panel = document.getElementById("recon-output");
    panel.classList.remove("hidden");
    const comments = harvestedPageData?.comments || [];
    panel.textContent = `=== HTML COMMENTS (${comments.length} ta) ===\n\n${comments.length > 0 ? comments.map((c, i) => `[#${i + 1}] ${c}`).join("\n\n") : "HTML izohlar topilmadi."}`;
  });

  // E. Extract Endpoints
  document.getElementById("btn-extract-endpoints").addEventListener("click", () => {
    const panel = document.getElementById("discovery-output");
    panel.classList.remove("hidden");
    const eps = harvestedPageData?.endpoints || [];
    panel.textContent = `=== HARVESTED API ENDPOINTS (${eps.length} ta) ===\n\n${eps.length > 0 ? eps.join("\n") : "Inline skriptlardan aniq API endpointlar topilmadi."}`;
  });

  // F. Form & Hidden Elements
  document.getElementById("btn-extract-forms").addEventListener("click", () => {
    const panel = document.getElementById("discovery-output");
    panel.classList.remove("hidden");
    const elements = harvestedPageData?.elements || [];
    let report = `=== FORM & INPUT ELEMENTS (${elements.length} ta) ===\n\n`;
    elements.forEach((el, idx) => {
      report += `[#${idx + 1}] <${el.tagName}> type="${el.type}" name="${el.name}" id="${el.id}" ${el.isHidden ? "[YASHIRIN]" : ""}\n`;
      if (el.formAction) report += `     Form Action: ${el.formMethod} ${el.formAction}\n`;
    });
    panel.textContent = report;
  });

  // G. JS Files List
  document.getElementById("btn-list-scripts").addEventListener("click", () => {
    const panel = document.getElementById("discovery-output");
    panel.classList.remove("hidden");
    const scripts = harvestedPageData?.scripts || [];
    let report = `=== LOADED JAVASCRIPT SOURCES (${scripts.length} ta) ===\n\n`;
    scripts.forEach((s, idx) => {
      report += `[#${idx + 1}] ${s.src || "(Inline Script - " + (s.inline?.length || 0) + " chars)"}\n`;
    });
    panel.textContent = report;
  });

  // H. AI Security Reviewer (One Click)
  document.getElementById("btn-run-ai-audit").addEventListener("click", async () => {
    const panel = document.getElementById("ai-output");
    const spinner = document.getElementById("ai-loading");

    if (!savedApiKey) {
      alert("Iltimos, avval yuqoridagi 'Gemini AI API Key' bo'limiga API kalitingizni kiriting va saqlang!");
      return;
    }

    panel.classList.add("hidden");
    spinner.classList.remove("hidden");

    try {
      const review = await runAISecurityReview(
        savedApiKey,
        currentUrl,
        harvestedPageData || {}
      );
      panel.textContent = review;
      panel.classList.remove("hidden");
    } catch (err) {
      panel.textContent = `AI Audit Xatoligi: ${err.message}`;
      panel.classList.remove("hidden");
    } finally {
      spinner.classList.add("hidden");
    }
  });

  // I. JWT Tool
  document.getElementById("btn-decode-jwt").addEventListener("click", () => {
    const input = document.getElementById("jwt-input").value;
    const panel = document.getElementById("jwt-output");
    panel.classList.remove("hidden");
    try {
      const res = decodeJWT(input);
      let report = `=== JWT DECODE & AUDIT ===\n\n`;
      report += `[HEADER]:\n${JSON.stringify(res.header, null, 2)}\n\n`;
      report += `[PAYLOAD]:\n${JSON.stringify(res.payload, null, 2)}\n\n`;
      report += `[ISSUES & WARNINGS]:\n${res.issues.map((i) => `• ${i}`).join("\n")}`;
      panel.textContent = report;
    } catch (err) {
      panel.textContent = "Xatolik: " + err.message;
    }
  });

  document.getElementById("btn-sample-jwt").addEventListener("click", () => {
    document.getElementById("jwt-input").value =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikxva2kgTGF1ZmV5c29uIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";
  });

  // J. Utilities (Encoder / Decoder)
  const utilInput = document.getElementById("util-input");
  const utilPanel = document.getElementById("util-output");

  document.getElementById("btn-b64-enc").addEventListener("click", () => {
    utilPanel.classList.remove("hidden");
    utilPanel.textContent = encodeBase64(utilInput.value);
  });
  document.getElementById("btn-b64-dec").addEventListener("click", () => {
    utilPanel.classList.remove("hidden");
    utilPanel.textContent = decodeBase64(utilInput.value);
  });
  document.getElementById("btn-url-enc").addEventListener("click", () => {
    utilPanel.classList.remove("hidden");
    utilPanel.textContent = encodeUrl(utilInput.value);
  });
  document.getElementById("btn-url-dec").addEventListener("click", () => {
    utilPanel.classList.remove("hidden");
    utilPanel.textContent = decodeUrl(utilInput.value);
  });
  document.getElementById("btn-hex-enc").addEventListener("click", () => {
    utilPanel.classList.remove("hidden");
    utilPanel.textContent = toHex(utilInput.value);
  });
  document.getElementById("btn-hex-dec").addEventListener("click", () => {
    utilPanel.classList.remove("hidden");
    utilPanel.textContent = fromHex(utilInput.value);
  });
}
