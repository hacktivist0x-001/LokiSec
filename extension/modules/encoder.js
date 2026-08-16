// LokiSec - Encoders & Utilities

export function encodeBase64(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (e) {
    return btoa(str);
  }
}

export function decodeBase64(str) {
  try {
    return decodeURIComponent(escape(atob(str)));
  } catch (e) {
    return atob(str);
  }
}

export function encodeUrl(str) {
  return encodeURIComponent(str);
}

export function decodeUrl(str) {
  return decodeURIComponent(str);
}

export function toHex(str) {
  let hex = "";
  for (let i = 0; i < str.length; i++) {
    hex += str.charCodeAt(i).toString(16).padStart(2, "0") + " ";
  }
  return hex.trim();
}

export function fromHex(hexStr) {
  const clean = hexStr.replace(/\s+/g, "");
  let str = "";
  for (let i = 0; i < clean.length; i += 2) {
    str += String.fromCharCode(parseInt(clean.substr(i, 2), 16));
  }
  return str;
}

export function htmlEntities(str) {
  return str.replace(/[\u00A0-\u9999<>\&"']/g, (i) => {
    return "&#" + i.charCodeAt(0) + ";";
  });
}
