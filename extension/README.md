# ⚡ LokiSec - Web Security Audit & Developer Toolkit (Chrome Extension)

Loki seriali uslubidagi to'q qora-yashil (obsidian emerald + vintage TVA gold) dizaynga ega Chrome Extension (Manifest V3 Side Panel).

---

## 🛠️ Modullar va Xususiyatlar:

1. **🛰️ Live Browse & Security Headers Audit:**
   - Real vaqtda ochiq sahifaning HTTP Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, CORS) holatini tahlil qiladi va xavfsizlik bahosini beradi.
   - Sahifadagi Cookie, LocalStorage va SessionStorage kalitlarini ko'rsatadi.

2. **🕵️ Discovery & Endpoints Extractor:**
   - HTML va JavaScript kodlari orasidan ehtimoliy API marshrutlarini (`/api/...`, `/v1/...`, `/auth/...`, `/admin/...`) avtomatik ajratib oladi.
   - Barcha input maydonlari, yashirin (hidden) form elementlarini ro'yxatlaydi.
   - Yuklangan barcha tashqi va inline JS skriptlar ro'yxatini chiqaradi.

3. **🤖 AI Security Reviewer (Gemini AI One-Click Audit):**
   - Foydalanuvchi o'zining Gemini API kalitini kiritadi va saqlaydi.
   - Tugmani bosish bilan sahifaning barcha topilgan JS fayllari, endpointlari va tuzilishi AI ga yuboriladi va audit xulosasi (Attack surface tahlili va tavsiyalar) ko'rsatiladi.

4. **🔑 JWT Debugger & Inspector:**
   - JWT tokenni Header, Payload va Signature qismlariga ajratadi.
   - Token muddati (exp), alg konfiguratsiyasi kabi xususiyatlarni tekshiradi.

5. **🎯 Scope & Audit Notes:**
   - Pentest va bug bounty davomida qaydlarni saqlash va `.txt` fayl sifatida yuklab olish.

6. **🔧 Utilities:**
   - Base64 Encode / Decode
   - URL Encode / Decode
   - Hex Encode / Decode

---

## 🚀 Brauzerga O'rnatish Qo'llanmasi (Chrome / Brave / Edge):

1. `/extension` papkasini yuklab oling yoki arxivdan chiqaring.
2. Brauzeringizda manzil satriga `chrome://extensions/` yozib kiring.
3. O'ng yuqori burchakdagi **"Developer mode" (Tuzuvchi rejimi)** tugmasini yoqing.
4. Chap tomondagi **"Load unpacked" (Arxivlanmagan paketni yuklash)** tugmasini bosing.
5. `/extension` papkasini tanlang.
6. Har qanday veb-saytga kirib, kengaytmalar ro'yxatidan **LokiSec** belgisini bosing — o'ng/chap tomonda qora-yashil Loki paneli ochiladi!
