// LokiSec - Gemini AI Security Reviewer & Code Auditor

export async function runAISecurityReview(apiKey, targetUrl, collectedData) {
  if (!apiKey || apiKey.trim().length < 5) {
    throw new Error("Iltimos, avval sozlamalarda Gemini API kalitini kiriting!");
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`;

  const promptText = `
Sen tajribali Web Application Security Auditor va Pentest bo'yicha mutaxassissan.
Quyida tahlil qilingan sayt ma'lumotlari keltirilgan:

- URL: ${targetUrl}
- Texnologiyalar (Tech Stack): ${JSON.stringify(collectedData.techStack || [])}
- Aniqlangan API Endpointlar (${(collectedData.endpoints || []).length} ta): ${JSON.stringify((collectedData.endpoints || []).slice(0, 30))}
- JS Fayllari soni: ${(collectedData.scripts || []).length} ta
- Form/Input elementlari: ${(collectedData.elements || []).length} ta
- Topilgan HTML Izohlar (Comments): ${JSON.stringify((collectedData.comments || []).slice(0, 10))}

VAZIFA:
1. Topilgan API endpointlar strukturasini baholash (ehtimoliy xavfli marshrutlar: admin, auth, internal, v1/v2).
2. Xavfsizlik sirtqi maydoni (Attack Surface) va zaiflik ehtimoli bo'lgan sohalarni (Recon summary) ko'rsatish.
3. Pentester va Auditor uchun tavsiya qilinadigan keyingi tahlil qadamlari (Checklist).
4. Himoyalanish (Defensive Recommendations & Remediations) choralari.

Javobni o'zbek tilida, aniq, chiroyli Markdown formatida va tushunarli bandlarda taqdim et.
`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048
    }
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`AI API xatosi (${response.status}): ${errorBody}`);
  }

  const result = await response.json();
  const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("AI dan bo'sh javob qaytdi.");
  }
  return text;
}
