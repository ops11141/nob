# خطة NOB

1. Extraction
محرك الاستخراج يعمل داخل Web Worker حتى لا تتجمد الواجهة.
النواتج: entities.jsonl, layers.json, texts.json, blocks.json, statistics.json

2. Classification
معدات، مغذيات، كابلات، وصلات، خطوط هوائية، محطات، رموز، نصوص، حدود ومناطق.

3. Geometry
الحفاظ على إحداثيات CAD الأصلية، ثم إنشاء GeoJSON منفصل للنقاط والخطوط والمناطق.

4. Relationships
Feeder -> Route -> Cable -> Joint -> Equipment
كل علاقة تشير إلى معرفات عناصر المصدر.

5. Map
MapLibre لعرض البيانات حسب الطبقة، بدون إنشاء آلاف طبقات منفردة.

6. Search
البحث عن رقم المعدة، RMU، EOS، Feeder، Cable، Joint، Layer، نص CAD، أو معرف العنصر.

7. QA
مقارنة عدد عناصر DWG المقروءة مع عدد العناصر المستخرجة والمصنفة والمحولة إلى GeoJSON.
