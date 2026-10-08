# Extraction Plan

01 Decode: قراءة DWG بالكامل وحفظ أعداد Objects وEntities بدقة.
02 Normalize: handles وDXF names وlayers وcoordinates وstyles والخصائص.
03 Classify: المعدات الهندسية من النصوص والطبقات والبلوكات.
04 Network: بناء feeder → route → cable → joint → equipment.
05 Geography: الحفاظ على إحداثيات CAD وإنشاء تحويل منفصل إلى WGS84 عند توفر تحويل موثوق.
06 Products: GeoJSON والبحث والإحصائيات والخريطة.
07 QA: مقارنة كل مرحلة ورصد العناصر غير المصنفة وأي فقد.
