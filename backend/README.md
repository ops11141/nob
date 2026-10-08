# NOB Backend Scanner

خدمة خادمية صغيرة لـ NOB لتجاوز قيود CORS الخاصة بالمتصفح في فحوصات HTTP الدفاعية.

## النطاق
- GET /health
- POST /scan
- HEAD / OPTIONS / GET فقط
- لا تسجيل دخول
- لا إرسال بيانات نماذج
- لا تنفيذ أوامر أو استغلال
- يمنع localhost والعناوين الخاصة والاعتمادات داخل URL
- لا يعيد Set-Cookie أو محتوى الصفحة
- يتعامل مع التحويلات العامة فقط
- حد بسيط للطلبات لكل عنوان عميل

## النشر
يتم النشر كـ Cloudflare Worker. يحتاج المستودع إلى:
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID

بعد النشر استخدم عنوان Worker في إعداد NOB Backend URL.
