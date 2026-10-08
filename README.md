# NOB — GEO Data Platform

مشروع يبدأ من الصفر لتحويل GEO.dwg من رسم CAD إلى منصة بيانات هندسية قابلة للتحليل والبحث والعرض.

## ما تم بناؤه
- واجهة عربية حديثة.
- رفع وسحب ملف DWG.
- تحليل محلي داخل المتصفح باستخدام LibreDWG-Web.
- عد Objects وEntities وModel Space وLayers وLinetypes وClasses.
- تصنيف عناصر Model Space حسب DXF type.
- لا يتم تعديل ملف DWG الأصلي ولا إرساله إلى خادم.

## خط البناء
DWG → Decode → Raw Entities → Normalize → Classification → Relationships → GeoJSON → Search → Dashboard → Map.

## المرحلة التالية
1. قاعدة بيانات العناصر الخام.
2. الطبقات والأنماط والبلوكات.
3. النصوص وMTEXT والـ attributes.
4. RMU / EOS / Recloser / Substation / Pole.
5. المغذيات ومساراتها.
6. الكابلات والوصلات.
7. العلاقات بين المعدات والمغذيات.
8. GeoJSON.
9. البحث والفلاتر ولوحة الإحصائيات.
10. QA يطابق أعداد المصدر مع أعداد البيانات المصدرة.

ضع GEO.dwg في source/GEO.dwg عند تجهيز النسخة المستودعية. المصدر للقراءة فقط.

المحرك: @mlightcad/libredwg-web.
