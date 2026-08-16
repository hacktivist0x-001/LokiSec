// LokiSec - JWT Debugger, Encoder & Inspector

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

function base64UrlEncode(str) {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeJWT(jwtString) {
  const trimmed = (jwtString || "").trim();
  if (!trimmed) {
    throw new Error("JWT token kiritilmadi.");
  }

  const parts = trimmed.split(".");
  if (parts.length < 2) {
    throw new Error("Noto'g'ri JWT formati. Kamida Header va Payload (nuqta bilan ajratilgan) bo'lishi kerak.");
  }

  try {
    const headerStr = base64UrlDecode(parts[0]);
    const payloadStr = base64UrlDecode(parts[1]);
    const signature = parts[2] || "";

    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);

    const issues = [];
    if (header.alg && header.alg.toLowerCase() === "none") {
      issues.push("Ogohlantirish: 'alg: none' xavfsizliksiz token konfiguratsiyasi.");
    }
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      const isExpired = Date.now() > expDate.getTime();
      if (isExpired) {
        issues.push(`Token muddati o'tgan: ${expDate.toLocaleString()}`);
      } else {
        issues.push(`Amal qilish muddati: ${expDate.toLocaleString()}`);
      }
    } else {
      issues.push("Token muddati (exp claim) ko'rsatilmagan.");
    }

    return {
      success: true,
      header,
      payload,
      signature,
      issues,
      rawHeader: headerStr,
      rawPayload: payloadStr
    };
  } catch (err) {
    throw new Error("JWT dekodlashda xatolik: " + err.message);
  }
}

export function encodeJWT(headerObj, payloadObj, secretKey = "") {
  try {
    const hStr = typeof headerObj === "string" ? headerObj : JSON.stringify(headerObj);
    const pStr = typeof payloadObj === "string" ? payloadObj : JSON.stringify(payloadObj);

    const encodedHeader = base64UrlEncode(hStr);
    const encodedPayload = base64UrlEncode(pStr);

    // Dummy or unsigned signature representation for client-side assembly
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    return unsignedToken;
  } catch (err) {
    throw new Error("JWT kodlashda xatolik: " + err.message);
  }
}
