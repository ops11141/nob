# NOB — Cyber Defense Platform

NOB أصبح منصة دفاعية لتقييم المواقع من الخارج.

## الهدف
إدخال رابط موقع تملكه أو لديك تصريح بفحصه، ثم تحليل المؤشرات العامة التي يمكن قياسها بأمان، وإظهار:
- Security Score
- HTTP Security Headers
- HTTPS/TLS indicators
- Public DNS visibility
- Technology disclosure
- Information exposure indicators
- Risk findings with remediation guidance

## حدود الأمان
الإصدار الحالي **Passive / Safe**:
- لا يحاول تسجيل الدخول.
- لا يتجاوز المصادقة.
- لا يستغل الثغرات.
- لا يبحث عن كلمات مرور أو Tokens خاصة.
- لا يعتبر فشل CORS ثغرة.
- يستخدم فقط الفحوصات العامة منخفضة المخاطر.

## ملاحظة الاستضافة
GitHub Pages يعمل في المتصفح، ولذلك قد تمنع CORS بعض اختبارات HTTP. عندها تسجل المنصة أن القياس غير متاح بدل اختلاق نتيجة.

## المرحلة التالية
إضافة Backend Scanner مصرح به مع حدود معدل واضحة وسجل تدقيق، ثم تقارير PDF/JSON ومقارنة نتائج الفحوصات عبر الزمن.
