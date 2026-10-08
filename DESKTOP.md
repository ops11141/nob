# NOB Desktop — Windows

هذه النسخة تشغّل واجهة NOB ومحرك الفحص المحلي معًا عبر Docker Desktop.

## المتطلبات

- Windows 10/11 مدعوم.
- Docker Desktop.
- WSL 2 أو backend مدعوم من Docker Desktop.

## التشغيل

1. نزّل ZIP من GitHub وافتح الضغط.
2. شغّل Docker Desktop وانتظر حتى يعمل Docker Engine.
3. افتح المجلد.
4. اضغط مرتين على:
   `start-nob.bat`
5. ستفتح الواجهة تلقائيًا على:
   `http://127.0.0.1:4173/`

في أول تشغيل سيبني Docker محرك NOB وصورة الواجهة، وقد يستغرق ذلك وقتًا أطول من التشغيلات التالية.

## الإيقاف

اضغط:
`stop-nob.bat`

## البنية

- NOB Web: المنفذ المحلي 4173.
- NOB Runner: المنفذ المحلي 8787.
- Runner يعمل داخل حاوية Kali Linux.
- الوصول إلى Runner مربوط على localhost فقط.

الفحص مخصص للمواقع التي يملك المستخدم تصريحًا صريحًا لفحصها.
