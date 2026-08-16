// LokiSec Content Script - Passive DOM & Resource Harvester

(() => {
  // Extract all script tags (both inline and src)
  function getScripts() {
    const scripts = Array.from(document.querySelectorAll("script"));
    return scripts.map((s, index) => ({
      index,
      src: s.src || null,
      inline: !s.src ? (s.textContent ? s.textContent.trim().substring(0, 3000) : "") : null,
      type: s.type || "text/javascript"
    }));
  }

  // Extract all input elements, forms, and hidden parameters
  function getFormElements() {
    const inputs = Array.from(document.querySelectorAll("input, textarea, select"));
    return inputs.map((el) => ({
      tagName: el.tagName.toLowerCase(),
      type: el.getAttribute("type") || (el.tagName.toLowerCase() === "textarea" ? "textarea" : "text"),
      name: el.getAttribute("name") || "",
      id: el.getAttribute("id") || "",
      placeholder: el.getAttribute("placeholder") || "",
      value: el.value ? (el.value.length > 50 ? el.value.substring(0, 50) + "..." : el.value) : "",
      formAction: el.form ? el.form.action : null,
      formMethod: el.form ? (el.form.method || "GET").toUpperCase() : null,
      isHidden: el.type === "hidden" || window.getComputedStyle(el).display === "none"
    }));
  }

  // Extract HTML comments (useful for developer notes, keys, deprecated routes)
  function getComments() {
    const comments = [];
    const iterator = document.createNodeIterator(
      document.documentElement,
      NodeFilter.SHOW_COMMENT,
      () => NodeFilter.FILTER_ACCEPT
    );
    let curNode;
    while ((curNode = iterator.nextNode()) && comments.length < 50) {
      const text = curNode.nodeValue.trim();
      if (text.length > 2) {
        comments.push(text.substring(0, 300));
      }
    }
    return comments;
  }

  // Regex based passive endpoint extraction from inline scripts and HTML text
  function getInlineEndpoints() {
    const html = document.documentElement.innerHTML;
    const regex = /(?:['"`])(\/(?:api|v[0-9]|v[0-9]\.[0-9]|auth|users|admin|rest|graphql|oauth|account|user|webhook)[^'"`\s<>{}|\^~\[\]]+)(?:['"`])/gi;
    const endpoints = new Set();
    let match;
    while ((match = regex.exec(html)) !== null && endpoints.size < 100) {
      endpoints.add(match[1]);
    }
    return Array.from(endpoints);
  }

  // Detect Frontend Tech Stack from DOM
  function detectClientTech() {
    const techs = [];
    if (window.React || document.querySelector("[data-reactroot], [data-react-helmet]")) techs.push("React.js");
    if (window.Vue || document.querySelector("[data-v-]")) techs.push("Vue.js");
    if (window.angular || document.querySelector("[ng-app], [ng-controller], [ng-version]")) techs.push("Angular");
    if (window.next || document.querySelector("#__next")) techs.push("Next.js");
    if (window.__NUXT__) techs.push("Nuxt.js");
    if (window.jQuery || window.$) techs.push("jQuery");
    if (document.querySelector('meta[name="generator"]')) {
      techs.push("Generator: " + document.querySelector('meta[name="generator"]').content);
    }
    return techs;
  }

  // Message Listener
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "LOKI_HARVEST_PAGE") {
      try {
        const data = {
          url: window.location.href,
          title: document.title,
          origin: window.location.origin,
          scripts: getScripts(),
          elements: getFormElements(),
          comments: getComments(),
          endpoints: getInlineEndpoints(),
          techStack: detectClientTech(),
          cookies: document.cookie,
          localStorageKeys: Object.keys(localStorage || {}),
          sessionStorageKeys: Object.keys(sessionStorage || {})
        };
        sendResponse({ success: true, data });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
      return true;
    }
  });
})();
