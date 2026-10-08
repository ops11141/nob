export const KALI_TOOL_GROUPS = [
  {id:'information',name:'جمع المعلومات والاستطلاع',icon:'◎',tools:[
    ['nmap','استكشاف الشبكات والخدمات','Network / Discovery','safe'],
    ['masscan','اكتشاف المنافذ على نطاق واسع','Network / Discovery','active'],
    ['autorecon','أتمتة الاستطلاع وتعداد الخدمات','Recon / Automation','active'],
    ['amass','اكتشاف الأصول والنطاقات الفرعية','OSINT / Recon','safe'],
    ['subfinder','اكتشاف النطاقات الفرعية','OSINT / Recon','safe'],
    ['sublist3r','جمع النطاقات الفرعية من مصادر عامة','OSINT / Recon','safe'],
    ['dnsrecon','استطلاع DNS','DNS / Recon','safe'],
    ['theHarvester','جمع البريد والنطاقات من المصادر العامة','OSINT','safe'],
    ['recon-ng','إطار عمل للاستطلاع','OSINT Framework','safe'],
    ['whois','استعلام WHOIS','OSINT','safe'],
    ['whatweb','بصمة تقنيات الويب','Web Fingerprinting','safe'],
    ['wafw00f','التعرف على جدار حماية تطبيقات الويب','Web Fingerprinting','safe'],
    ['spiderfoot','أتمتة OSINT','OSINT','safe'],
    ['netdiscover','اكتشاف الأجهزة على الشبكات المحلية','Network Discovery','active'],
    ['nbtscan','استطلاع NetBIOS','Network Discovery','active'],
    ['enum4linux-ng','تعداد خدمات Windows/SMB','Network Enumeration','active']
  ]},
  {id:'web',name:'أمن تطبيقات الويب',icon:'⌁',tools:[
    ['burpsuite','تحليل واعتراض HTTP/HTTPS','Web Security','active'],
    ['owasp-zap','فحص تطبيقات الويب','Web Security','active'],
    ['nikto','فحص خادم الويب والإعدادات المعروفة','Web Scanner','active'],
    ['gobuster','اكتشاف المسارات والموارد العامة','Content Discovery','active'],
    ['ffuf','اختبار واكتشاف المسارات والمعلمات','Fuzzing','active'],
    ['feroxbuster','اكتشاف المحتوى والمسارات','Content Discovery','active'],
    ['dirsearch','اكتشاف المجلدات والملفات','Content Discovery','active'],
    ['wpscan','تقييم WordPress','Web Scanner','active'],
    ['sqlmap','اختبار SQL Injection المصرح به','Web Security','active'],
    ['joomscan','تقييم Joomla','Web Scanner','active'],
    ['davtest','اختبار WebDAV','Web Security','active'],
    ['whatweb','التعرف على تقنيات المواقع','Fingerprinting','safe'],
    ['wapiti','فحص ثغرات تطبيقات الويب','Web Scanner','active'],
    ['skipfish','فحص أمني لتطبيقات الويب','Web Scanner','active'],
    ['sslyze','تحليل إعدادات TLS/SSL','TLS Audit','safe'],
    ['sslscan','فحص خدمات SSL/TLS','TLS Audit','safe']
  ]},
  {id:'vuln',name:'تحليل الثغرات',icon:'⚠',tools:[
    ['lynis','تدقيق أمني للأنظمة','Security Audit','safe'],
    ['gvm','إدارة وفحص الثغرات','Vulnerability Management','active'],
    ['legion','منصة استطلاع وفحص شبكات','Network Scanner','active'],
    ['nuclei','فحص مؤشرات الثغرات بقوالب','Template Scanner','active'],
    ['nikto','تحليل خوادم الويب','Web Vulnerability','active'],
    ['searchsploit','البحث في Exploit Database','Vulnerability Research','safe'],
    ['exploitdb','قاعدة بيانات أبحاث الثغرات','Vulnerability Research','safe'],
    ['unix-privesc-check','تدقيق مؤشرات رفع الصلاحيات','Host Audit','safe'],
    ['peass','أدوات تدقيق رفع الصلاحيات','Host Audit','active']
  ]},
  {id:'passwords',name:'كلمات المرور والهاش',icon:'#',tools:[
    ['john','اختبار قوة كلمات المرور والهاش','Password Audit','active'],
    ['hashcat','تدقيق الهاشات وكلمات المرور','Password Audit','active'],
    ['hydra','اختبار مصادقة الخدمات المصرح بها','Credential Audit','active'],
    ['medusa','اختبار مصادقة الخدمات','Credential Audit','active'],
    ['cewl','إنشاء قوائم كلمات من مواقع عامة','Wordlist','safe'],
    ['hashid','تحديد نوع الهاش','Hash Analysis','safe'],
    ['crunch','إنشاء wordlists','Wordlist','safe'],
    ['ophcrack','استعادة كلمات مرور Windows من الهاشات','Password Audit','active'],
    ['seclists','مجموعات قوائم أمنية واختبارية','Security Lists','safe']
  ]},
  {id:'wireless',name:'الشبكات اللاسلكية وRF',icon:'◌',tools:[
    ['aircrack-ng','تقييم أمن شبكات Wi-Fi','Wireless Audit','active'],
    ['airmon-ng','إدارة وضع المراقبة لواجهات Wi-Fi','Wireless','active'],
    ['airodump-ng','التقاط وتحليل إطارات Wi-Fi','Wireless','active'],
    ['aireplay-ng','اختبارات Wi-Fi نشطة','Wireless','active'],
    ['kismet','مراقبة واكتشاف الشبكات اللاسلكية','Wireless Monitoring','active'],
    ['wifite','أتمتة اختبارات Wi-Fi المصرح بها','Wireless Audit','active'],
    ['reaver','اختبار WPS','Wireless Audit','active'],
    ['bully','اختبار WPS','Wireless Audit','active'],
    ['bettercap','تحليل شبكات وMITM في بيئة مصرح بها','Network Security','active'],
    ['pixiewps','اختبارات WPS','Wireless Research','active']
  ]},
  {id:'sniffing',name:'تحليل الشبكات والمرور',icon:'◈',tools:[
    ['wireshark','تحليل حزم الشبكة','Packet Analysis','safe'],
    ['tshark','نسخة سطر أوامر من Wireshark','Packet Analysis','safe'],
    ['tcpdump','التقاط وتحليل حزم الشبكة','Packet Capture','safe'],
    ['ettercap','تحليل شبكات واختبارات MITM','Network Security','active'],
    ['responder','اختبارات بروتوكولات المصادقة المحلية','Network Security','active'],
    ['mitmproxy','اعتراض وتحليل HTTP/HTTPS','Proxy','active'],
    ['socat','اتصالات وتحويلات شبكية','Networking','active'],
    ['ncat','اتصالات شبكية واختبارات خدمات','Networking','active'],
    ['proxychains','تمرير اتصالات عبر proxy','Networking','active'],
    ['scapy','إنشاء وتحليل حزم الشبكة','Packet Crafting','active']
  ]},
  {id:'forensics',name:'الأدلة الرقمية والطب الشرعي',icon:'◫',tools:[
    ['autopsy','تحليل الأدلة الرقمية','Forensics','safe'],
    ['sleuthkit','أدوات تحليل أنظمة الملفات والأدلة','Forensics','safe'],
    ['binwalk','تحليل واستخراج محتويات الملفات الثنائية','Firmware Analysis','safe'],
    ['foremost','استعادة الملفات من البيانات الخام','File Carving','safe'],
    ['exiftool','قراءة metadata للملفات','Metadata','safe'],
    ['volatility','تحليل الذاكرة الجنائي','Memory Forensics','safe'],
    ['bulk-extractor','استخراج مؤشرات من صور الأقراص','Forensics','safe'],
    ['dc3dd','نسخ جنائي للأقراص','Forensics','safe'],
    ['guymager','تصوير وسائط التخزين جنائيًا','Forensics','safe']
  ]},
  {id:'reverse',name:'الهندسة العكسية وتحليل البرمجيات',icon:'⌘',tools:[
    ['ghidra','تحليل وهندسة عكسية للبرمجيات','Reverse Engineering','safe'],
    ['radare2','تحليل ثنائيات وهندسة عكسية','Reverse Engineering','safe'],
    ['rizin','تحليل ثنائيات وهندسة عكسية','Reverse Engineering','safe'],
    ['gdb','تصحيح وتحليل البرامج','Debugging','safe'],
    ['strace','تتبع استدعاءات النظام','Runtime Analysis','safe'],
    ['ltrace','تتبع استدعاءات المكتبات','Runtime Analysis','safe'],
    ['apktool','تحليل تطبيقات Android','Mobile / RE','safe'],
    ['jadx','تحويل وتحليل تطبيقات Android','Mobile / RE','safe'],
    ['dex2jar','تحليل ملفات Android DEX','Mobile / RE','safe'],
    ['strings','استخراج النصوص من الملفات الثنائية','Binary Analysis','safe']
  ]},
  {id:'database',name:'أمن قواعد البيانات',icon:'▤',tools:[
    ['sqlmap','اختبار SQL Injection المصرح به','Database Security','active'],
    ['sqldict','اختبارات كلمات مرور قواعد البيانات','Database Audit','active'],
    ['oscanner','استطلاع Oracle','Database Audit','active'],
    ['mdbtools','قراءة وتحليل Microsoft Access','Database Analysis','safe'],
    ['redis-tools','أدوات Redis للإدارة والاختبار','Database','active'],
    ['sqlite3','تحليل قواعد SQLite','Database','safe']
  ]},
  {id:'bluetooth',name:'Bluetooth وRFID وSDR',icon:'⌁',tools:[
    ['bluez','أدوات Bluetooth في Linux','Bluetooth','active'],
    ['bluesnarfer','اختبارات Bluetooth المصرح بها','Bluetooth Security','active'],
    ['ubertooth','منصة تحليل Bluetooth/RF','RF Analysis','active'],
    ['rfcat','أبحاث وتحليل RF','RF Research','active'],
    ['proxmark3','تحليل RFID/NFC','RFID/NFC','active'],
    ['gnuradio','معالجة إشارات SDR','SDR','safe']
  ]},
  {id:'windows',name:'Windows / Active Directory',icon:'▣',tools:[
    ['impacket','مجموعة أدوات بروتوكولات Windows','Windows Security','active'],
    ['netexec','تقييم خدمات Windows والشبكات','Windows Enumeration','active'],
    ['crackmapexec','تعداد وإدارة اختبارات Windows','Windows Security','active'],
    ['evil-winrm','اتصال WinRM في بيئات مصرح بها','Windows Security','active'],
    ['enum4linux-ng','تعداد SMB/Windows','Windows Enumeration','active'],
    ['smbclient','التعامل مع SMB','Windows / SMB','active'],
    ['bloodhound','تحليل علاقات Active Directory','Active Directory','safe'],
    ['kerbrute','تقييم Kerberos في بيئة مصرح بها','Active Directory','active'],
    ['ldapsearch','استعلام LDAP','Directory Services','active'],
    ['responder','اختبارات خدمات المصادقة المحلية','Windows Security','active']
  ]},
  {id:'mobile',name:'أمن تطبيقات الجوال',icon:'▱',tools:[
    ['apktool','تحليل ملفات APK','Android','safe'],
    ['jadx','تحليل تطبيقات Android','Android','safe'],
    ['mobsf','تحليل أمان تطبيقات الجوال','Mobile Security','active'],
    ['drozer','اختبار مكونات Android','Android Security','active'],
    ['objection','اختبار تطبيقات الجوال ديناميكيًا','Mobile Security','active'],
    ['frida','Instrumentation وتحليل وقت التشغيل','Mobile Security','active']
  ]},
  {id:'social',name:'الهندسة الاجتماعية',icon:'◎',tools:[
    ['setoolkit','إطار اختبارات الهندسة الاجتماعية المصرح بها','Social Engineering','active'],
    ['gophish','محاكاة حملات توعوية مصرح بها','Awareness','active'],
    ['maltego','تحليل العلاقات وOSINT','OSINT','safe']
  ]},
  {id:'exploit',name:'أبحاث الاستغلال والاختبار',icon:'⚡',tools:[
    ['metasploit-framework','إطار اختبار الاختراق','Exploit Research','active'],
    ['msfvenom','إنشاء payloads للاختبارات المصرح بها','Exploit Research','active'],
    ['searchsploit','البحث في أبحاث الاستغلال','Research','safe'],
    ['beef-xss','اختبارات أمان المتصفح المصرح بها','Web Security','active'],
    ['armitage','واجهة لإدارة Metasploit','Exploit Research','active']
  ]},
  {id:'reporting',name:'التقارير والمراقبة',icon:'▥',tools:[
    ['dradis','إدارة نتائج اختبارات الأمن','Reporting','safe'],
    ['faraday','منصة إدارة عمليات اختبار الاختراق','Reporting','safe'],
    ['eyewitness','توثيق واجهات الويب والخدمات','Reporting','safe'],
    ['recordmydesktop','تسجيل جلسات الاختبار','Documentation','safe'],
    ['cutycapt','التقاط صفحات الويب','Documentation','safe']
  ]}
];
export const KALI_TOOL_COUNT = KALI_TOOL_GROUPS.reduce((n,g)=>n+g.tools.length,0);
