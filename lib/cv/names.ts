/**
 * Names people say in Arabic → the English form a CV needs:
 * well-known companies (their official English names), cities and job titles.
 * Anything not in the lists gets a phonetic transliteration that the person confirms.
 */

const fold = (s: string) =>
  String(s || '').trim().replace(/[أإآ]/g, 'ا').replace(/ة(?=\s|$|[،,])/g, 'ه').replace(/ى(?=\s|$|[،,])/g, 'ي').replace(/ـ/g, '')
    .replace(/^(?:شركه|شركة|مجموعه|مجموعة|مكتب)\s+/, '').replace(/\s+/g, ' ').toLowerCase();

/* ------------------------------------------------------------- companies */
// [official English name, Arabic / spoken variants...]
const COMPANIES: [string, ...string[]][] = [
  // Egypt — universities (graduation projects, training)
  ['Cairo University', 'جامعه القاهره', 'هندسه القاهره', 'كليه الهندسه جامعه القاهره'],
  ['Ain Shams University', 'جامعه عين شمس', 'عين شمس', 'هندسه عين شمس'],
  ['Alexandria University', 'جامعه الاسكندريه', 'هندسه اسكندريه', 'هندسه الاسكندريه'],
  ['Helwan University', 'جامعه حلوان', 'هندسه حلوان', 'هندسه المطريه', 'حلوان'],
  ['Al-Azhar University', 'جامعه الازهر', 'هندسه الازهر', 'الازهر'],
  ['Mansoura University', 'جامعه المنصوره', 'هندسه المنصوره'],
  ['Zagazig University', 'جامعه الزقازيق', 'هندسه الزقازيق'],
  ['Tanta University', 'جامعه طنطا', 'هندسه طنطا'],
  ['Assiut University', 'جامعه اسيوط', 'هندسه اسيوط'],
  ['Menoufia University', 'جامعه المنوفيه', 'هندسه شبين الكوم', 'هندسه المنوفيه'],
  ['Benha University', 'جامعه بنها', 'هندسه بنها', 'هندسه شبرا'],
  ['Suez Canal University', 'جامعه قناه السويس', 'هندسه الاسماعيليه'],
  ['Kafrelsheikh University', 'جامعه كفر الشيخ', 'هندسه كفر الشيخ'],
  ['Minia University', 'جامعه المنيا', 'هندسه المنيا'],
  ['Fayoum University', 'جامعه الفيوم', 'هندسه الفيوم'],
  ['Beni-Suef University', 'جامعه بني سويف', 'هندسه بني سويف'],
  ['Port Said University', 'جامعه بورسعيد', 'هندسه بورسعيد'],
  ['Sohag University', 'جامعه سوهاج', 'هندسه سوهاج'],
  ['South Valley University', 'جامعه جنوب الوادي', 'هندسه قنا'],
  ['Aswan University', 'جامعه اسوان', 'هندسه اسوان'],
  ['The American University in Cairo', 'الجامعه الامريكيه', 'الجامعه الامريكيه بالقاهره', 'auc'],
  ['The German University in Cairo', 'الجامعه الالمانيه', 'guc'],
  ['The British University in Egypt', 'الجامعه البريطانيه', 'bue'],
  ['Arab Academy for Science, Technology and Maritime Transport', 'الاكاديميه البحريه', 'الاكاديميه العربيه', 'aast', 'aastmt'],
  ['Misr University for Science and Technology', 'جامعه مصر للعلوم والتكنولوجيا', 'must'],
  ['October 6 University', 'جامعه 6 اكتوبر', 'جامعه سته اكتوبر'],
  ['MTI University', 'جامعه ام تي اي', 'جامعه مصر للتكنولوجيا الحديثه', 'mti'],
  ['Future University in Egypt', 'جامعه المستقبل', 'fue'],
  ['Nile University', 'جامعه النيل'],
  ['Higher Technological Institute', 'المعهد التكنولوجي العالي', 'hti'],
  ['Modern Academy for Engineering and Technology', 'اكاديميه المعادي', 'الاكاديميه الحديثه'],
  ['Shorouk Academy', 'اكاديميه الشروق', 'معهد الشروق'],
  ['Military Technical College', 'الفنيه العسكريه', 'الكليه الفنيه العسكريه'],
  // Egypt — contractors
  ['Zamil', 'الزامل', 'شركه الزامل', 'شركة الزامل', 'zamil'], ['Nesma & Partners', 'نسما', 'نسما وشركاه', 'nesma'], ['El Seif Engineering', 'السيف', 'شركه السيف', 'el seif'],
  ['Saudi Binladin Group', 'بن لادن', 'مجموعه بن لادن', 'binladin'], ['Al Habtoor', 'الحبتور', 'habtoor'], ['Arabtec', 'ارابتك', 'arabtec'],
  ['Orascom Construction', 'اوراسكوم', 'اوراسكوم للانشاءات', 'اوراسكوم كونستراكشن', 'orascom'],
  ['Hassan Allam Holding', 'حسن علام', 'حسن علام القابضه', 'hassan allam'],
  ['The Arab Contractors', 'المقاولون العرب', 'المقاولين العرب', 'عثمان احمد عثمان', 'arab contractors'],
  ['Elsewedy Electric', 'السويدي', 'السويدي اليكتريك', 'السويدي للكابلات', 'elsewedy', 'el sewedy'],
  ['Petrojet', 'بتروجت', 'petrojet'],
  ['Rowad Modern Engineering', 'رواد', 'رواد الهندسه الحديثه', 'rowad'],
  ['Redcon Construction', 'ريدكون', 'redcon'],
  ['Concord for Engineering & Contracting', 'كونكورد', 'concord'],
  ['Samcrete', 'سامكريت', 'samcrete'],
  // Egypt — developers & clients
  ['Talaat Moustafa Group', 'طلعت مصطفي', 'مجموعه طلعت مصطفي', 'tmg'],
  ['SODIC', 'سوديك', 'sodic'],
  ['Emaar Misr', 'اعمار مصر', 'اعمار', 'emaar'],
  ['Palm Hills Developments', 'بالم هيلز', 'palm hills'],
  ['Mountain View', 'ماونتن فيو', 'mountain view'],
  ['Madinet Masr', 'مدينه مصر للاسكان', 'مدينه نصر للاسكان', 'madinet masr'],
  ['Engineering Authority of the Armed Forces', 'الهيئه الهندسيه', 'الهيئه الهندسيه للقوات المسلحه'],
  ['Administrative Capital for Urban Development (ACUD)', 'العاصمه الاداريه للتنميه العمرانيه'],
  // Egypt — consultants
  ['Dar Al-Handasah', 'دار الهندسه', 'dar al handasah'],
  ['Engineering Consultants Group (ECG)', 'ecg', 'المجموعه الاستشاريه الهندسيه'],
  ['ACE Moharram Bakhoum', 'محرم باخوم', 'ace', 'ace moharram bakhoum'],
  ['Sabbour Consulting', 'صبور', 'sabbour'],
  ['Khatib & Alami', 'خطيب وعلمي', 'الخطيب والعلمي', 'khatib alami'],
  ['Hill International', 'هيل انترناشونال', 'hill international'],
  // KSA / Gulf
  ['Saudi Binladin Group', 'بن لادن', 'مجموعه بن لادن', 'binladin'],
  ['Nesma & Partners', 'نسما', 'نسما وشركاهم', 'nesma'],
  ['El Seif Engineering Contracting', 'السيف للمقاولات', 'السيف', 'el seif'],
  ['Al Bawani', 'البواني', 'al bawani'],
  ['Arabian Construction Company (ACC)', 'الشركه العربيه للانشاءات', 'acc'],
  ['China State Construction Engineering Corporation', 'الصينيه للانشاءات', 'سي اس سي اي سي', 'cscec'],
  ['Saudi Aramco', 'ارامكو', 'aramco'],
  ['NEOM', 'نيوم', 'neom'],
  ['Red Sea Global', 'البحر الاحمر الدوليه', 'red sea global'],
  ['ROSHN', 'روشن', 'roshn'],
  ['Diriyah Company', 'الدرعيه', 'شركه الدرعيه', 'diriyah'],
  ['KEO International Consultants', 'كيو', 'keo'],
  ['AECOM', 'ايكوم', 'aecom'],
  ['Atkins', 'اتكنز', 'atkins'],
  ['Parsons', 'بارسونز', 'parsons'],
  ['Jacobs', 'جاكوبس', 'jacobs'],
  ['Bechtel', 'بكتل', 'bechtel'],
  ['WSP', 'دبليو اس بي', 'wsp'],
  ['Arcadis', 'اركاديس', 'arcadis'],
  ['Shapoorji Pallonji', 'شابورجي', 'shapoorji'],
  ['Arabtec', 'ارابتك', 'arabtec'],
  ['Drake & Scull', 'دريك اند سكل', 'drake and scull']
];

/* ---------------------------------------------------------------- cities */
const CITIES: [string, ...string[]][] = [
  ['Cairo, Egypt', 'القاهره', 'cairo'], ['New Cairo, Egypt', 'القاهره الجديده', 'التجمع', 'التجمع الخامس'], ['Giza, Egypt', 'الجيزه', 'giza'],
  ['6th of October City, Egypt', 'اكتوبر', '6 اكتوبر', 'سته اكتوبر'], ['Sheikh Zayed, Egypt', 'الشيخ زايد', 'زايد'], ['Alexandria, Egypt', 'الاسكندريه', 'اسكندريه', 'alexandria'],
  ['New Administrative Capital, Egypt', 'العاصمه الاداريه', 'العاصمه'], ['New Alamein, Egypt', 'العلمين', 'العلمين الجديده'], ['Mansoura, Egypt', 'المنصوره'],
  ['Tanta, Egypt', 'طنطا'], ['Port Said, Egypt', 'بورسعيد'], ['Suez, Egypt', 'السويس'], ['Ismailia, Egypt', 'الاسماعيليه'], ['Hurghada, Egypt', 'الغردقه'],
  ['Sharm El Sheikh, Egypt', 'شرم الشيخ', 'شرم'], ['Assiut, Egypt', 'اسيوط'], ['Luxor, Egypt', 'الاقصر'], ['Aswan, Egypt', 'اسوان'],
  ['Beni Suef, Egypt', 'بني سويف'], ['Fayoum, Egypt', 'الفيوم'], ['Minya, Egypt', 'المنيا'], ['Sohag, Egypt', 'سوهاج'], ['Qena, Egypt', 'قنا'],
  ['Zagazig, Egypt', 'الزقازيق'], ['Damietta, Egypt', 'دمياط'], ['Banha, Egypt', 'بنها'], ['Kafr El Sheikh, Egypt', 'كفر الشيخ'], ['Damanhour, Egypt', 'دمنهور'],
  ['Shebin El Kom, Egypt', 'شبين الكوم'], ['Mahalla, Egypt', 'المحله', 'المحله الكبري'], ['Obour City, Egypt', 'العبور'], ['10th of Ramadan City, Egypt', 'العاشر من رمضان', 'العاشر'],
  ['Sadat City, Egypt', 'مدينه السادات', 'السادات'], ['Badr City, Egypt', 'مدينه بدر', 'بدر'], ['Shorouk City, Egypt', 'الشروق'], ['Ain Sokhna, Egypt', 'العين السخنه', 'السخنه'],
  ['Marsa Alam, Egypt', 'مرسي علم'], ['North Coast, Egypt', 'الساحل', 'الساحل الشمالي'], ['Egypt', 'مصر'],
  ['Riyadh, KSA', 'الرياض', 'riyadh'], ['Jeddah, KSA', 'جده', 'jeddah'], ['Dammam, KSA', 'الدمام'], ['Al Khobar, KSA', 'الخبر'], ['Makkah, KSA', 'مكه'],
  ['Madinah, KSA', 'المدينه', 'المدينه المنوره'], ['NEOM, KSA', 'نيوم'], ['Jubail, KSA', 'الجبيل'], ['Tabuk, KSA', 'تبوك'], ['Abha, KSA', 'ابها'], ['Ha\'il, KSA', 'حائل'],
  ['KSA', 'السعوديه', 'المملكه'], ['Dubai, UAE', 'دبي', 'dubai'], ['Abu Dhabi, UAE', 'ابوظبي', 'ابو ظبي'], ['Sharjah, UAE', 'الشارقه'], ['UAE', 'الامارات'],
  ['Doha, Qatar', 'الدوحه', 'قطر'], ['Kuwait City, Kuwait', 'الكويت'], ['Muscat, Oman', 'مسقط', 'عمان'], ['Manama, Bahrain', 'المنامه', 'البحرين']
];

/* ------------------------------------------------------------ job titles */
const TITLE_WORDS: [string, string][] = [
  ['مهندس', 'Engineer'], ['مدير', 'Manager'], ['منسق', 'Coordinator'], ['مشرف', 'Supervisor'], ['رئيس قسم', 'Head of'], ['رسام', 'Draftsman'], ['فني', 'Technician'],
  ['موقع', 'Site'], ['تصميم', 'Design'], ['مكتب فني', 'Technical Office'], ['تنفيذ', 'Site'], ['مشروع', 'Project'], ['مشاريع', 'Projects'], ['صيانه', 'Maintenance'],
  ['ميكانيكا', 'Mechanical'], ['ميكانيكي', 'Mechanical'], ['تكييف', 'HVAC'], ['حريق', 'Fire Protection'], ['مكافحه حريق', 'Fire Protection'], ['صحي', 'Plumbing'],
  ['كهرباء', 'Electrical'], ['مدني', 'Civil'], ['انشائي', 'Structural'], ['معماري', 'Architect'], ['حصر', 'Quantity Surveyor'], ['تسعير', 'Estimation'],
  ['اوتوكاد', 'AutoCAD'], ['ريفيت', 'Revit'], ['بيم', 'BIM'], ['bim', 'BIM'], ['جوده', 'QA/QC'], ['سلامه', 'HSE'], ['تخطيط', 'Planning'], ['مبيعات', 'Sales'], ['مساعد', 'Assistant'], ['اول', 'Senior'], ['سينيور', 'Senior'], ['جونيور', 'Junior'], ['مبتدئ', 'Junior']
];

/* ----------------------------------------------------- transliteration */
// how common Arabic names and business words are normally written in English (Egyptian conventions)
const WORDS: Record<string, string> = {
  محمد: 'Mohamed', احمد: 'Ahmed', محمود: 'Mahmoud', مصطفي: 'Mostafa', علي: 'Ali', حسن: 'Hassan', حسين: 'Hussein', ابراهيم: 'Ibrahim', يوسف: 'Youssef',
  خالد: 'Khaled', عمر: 'Omar', طارق: 'Tarek', اسامه: 'Osama', عادل: 'Adel', عماد: 'Emad', هشام: 'Hesham', شريف: 'Sherif', كريم: 'Karim', وليد: 'Waleed',
  سعيد: 'Saeed', فتحي: 'Fathy', عبدالله: 'Abdallah', صلاح: 'Salah', مجدي: 'Magdy', فاروق: 'Farouk', منصور: 'Mansour', رضا: 'Reda', سامي: 'Samy', ياسر: 'Yasser',
  ايمن: 'Ayman', اشرف: 'Ashraf', السيد: 'El Sayed', عثمان: 'Osman', زكي: 'Zaky', نبيل: 'Nabil', فؤاد: 'Fouad', جمال: 'Gamal', سمير: 'Samir', عاطف: 'Atef',
  مجدى: 'Magdy', رامي: 'Ramy', تامر: 'Tamer', هاني: 'Hany', ماهر: 'Maher', مدحت: 'Medhat', ممدوح: 'Mamdouh', جلال: 'Galal', كمال: 'Kamal', نصر: 'Nasr',
  عبد: 'Abdel', الحميد: 'Hamid', الرحمن: 'Rahman', العزيز: 'Aziz', الله: 'Allah', الفتاح: 'Fattah', المنعم: 'Moneim', الرحيم: 'Rahim', الحليم: 'Halim', اللطيف: 'Latif',
  المهندس: 'Eng.', مهندس: 'Eng.', مصر: 'Misr', المصريه: 'Egyptian', مصريه: 'Egyptian', العربيه: 'Arabia', الدوليه: 'International', المتحده: 'United', الحديثه: 'Modern',
  الوطنيه: 'National', السعوديه: 'Saudi', الخليج: 'Gulf', الشرق: 'El Sharq', الغرب: 'El Gharb', النصر: 'El Nasr', الامل: 'El Amal', الهدي: 'El Hoda', السلام: 'El Salam',
  الفجر: 'El Fagr', النجمه: 'El Negma', المستقبل: 'El Mostakbal', الرياده: 'El Reyada', التقدم: 'El Takadom', النيل: 'El Nile', الاهرام: 'El Ahram', الفتح: 'El Fath',
  القمه: 'El Qemma', النور: 'El Nour', الشروق: 'El Shorouk', الريان: 'El Rayan', الفرسان: 'El Forsan', الصفوه: 'El Safwa', النخبه: 'El Nokhba', الاتحاد: 'El Ittihad',
  دلتا: 'Delta', جروب: 'Group', تك: 'Tech', انجينيرنج: 'Engineering', كونستراكشن: 'Construction', للمقاولات: 'Contracting', والتجاره: 'Trading', ابناء: 'Sons', اخوان: 'Brothers'
};

const TR: Record<string, string> = {
  ا: 'a', أ: 'a', إ: 'e', آ: 'a', ب: 'b', ت: 't', ث: 's', ج: 'g', ح: 'h', خ: 'kh', د: 'd', ذ: 'z', ر: 'r', ز: 'z', س: 's', ش: 'sh', ص: 's', ض: 'd',
  ط: 't', ظ: 'z', ع: 'a', غ: 'gh', ف: 'f', ق: 'k', ك: 'k', ل: 'l', م: 'm', ن: 'n', ه: 'h', ة: 'a', و: 'o', ي: 'y', ى: 'a', ئ: 'e', ؤ: 'o', ء: '', 'ّ': '', 'َ': '', 'ُ': '', 'ِ': '', 'ْ': ''
};
export function transliterate(s: string) {
  return String(s || '')
    .split(/\s+/)
    .map((w0) => {
      const w = fold(w0);
      if (WORDS[w]) return WORDS[w];
      if (/^ال/.test(w) && WORDS[w.slice(2)]) return 'El ' + WORDS[w.slice(2)];
      let x = w.replace(/^ال/, 'El ').replace(/^وال/, 'w El ');
      x = [...x].map((c, i, a) => (c === 'ي' && i > 0 && !/[اوي]/.test(a[i - 1]) ? 'i' : c === 'و' && i > 0 && /[^\sاوي]/.test(a[i - 1]) ? 'ou' : TR[c] ?? c)).join('');
      x = x.replace(/aa+/g, 'a').replace(/ii+/g, 'i').replace(/\s+/g, ' ');
      // Arabic omits short vowels: give vowel-less words one, so "Fth" reads "Fath"
      x = x.split(' ').map((p) => (p.length >= 3 && !/[aeiou]/i.test(p) ? p[0] + 'a' + p.slice(1) : p)).join(' ');
      return x.split(' ').map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join(' ');
    })
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const hasAr = (s: string) => /[؀-ۿ]/.test(s);

function lookup(list: [string, ...string[]][], raw: string) {
  const f = fold(raw);
  if (!f) return null;
  for (const [en, ...alts] of list) {
    if (fold(en) === f || alts.some((a) => fold(a) === f)) return en;
  }
  // contained match for longer phrases ("شركة حسن علام للمقاولات")
  for (const [en, ...alts] of list) {
    if (alts.some((a) => a.length >= 4 && f.includes(fold(a)))) return en;
  }
  return null;
}

export type NameHint = { value: string; known: boolean } | null;

/** A better English form for what was typed or said, or null when nothing to suggest. */
const CO_WORDS: [RegExp, string][] = [
  [/(?:^|\s)للمقاولات(?:\s+العامه)?(?=\s|$)/, ' Contracting'], [/(?:^|\s)للانشاءات(?=\s|$)/, ' Construction'], [/(?:^|\s)للهندسه(?=\s|$)/, ' Engineering'],
  [/(?:^|\s)للاستشارات(?:\s+الهندسيه)?(?=\s|$)/, ' Consultants'], [/(?:^|\s)للتجاره(?=\s|$)/, ' Trading'], [/(?:^|\s)للتطوير العقاري(?=\s|$)/, ' Real Estate Development'],
  [/(?:^|\s)للصناعات(?=\s|$)/, ' Industries'], [/(?:^|\s)للتكييف(?=\s|$)/, ' Air Conditioning'], [/(?:^|\s)العامه(?=\s|$)/, ' General'], [/(?:^|\s)القابضه(?=\s|$)/, ' Holding'],
  [/(?:^|\s)للخدمات(?=\s|$)/, ' Services'], [/(?:^|\s)للاعمال الكهروميكانيكيه(?=\s|$)/, ' Electromechanical']
];
export function suggestCompany(raw: string): NameHint {
  const known = lookup(COMPANIES, raw);
  if (known && known !== raw.trim()) return { value: known, known: true };
  if (!known && hasAr(raw)) {
    let f = fold(raw);
    const tail: string[] = [];
    for (const [re, en] of CO_WORDS) if (re.test(f)) { f = f.replace(re, ' '); tail.push(en.trim()); }
    return { value: `${transliterate(f.trim())}${tail.length ? ' ' + tail.join(' ') : ''}`.trim(), known: false };
  }
  return null;
}

export function suggestCity(raw: string): NameHint {
  const parts = raw.split(/[,،]\s*/).filter(Boolean);
  const mapped = parts.map((p) => lookup(CITIES, p));
  if (mapped.every(Boolean)) {
    const v = [...new Set((mapped as string[]).join(', ').split(/,\s*/))].join(', ');
    return v !== raw.trim() ? { value: v, known: true } : null;
  }
  if (hasAr(raw)) return { value: [...new Set(parts.map((p, i) => mapped[i] || transliterate(p)).join(', ').split(/,\s*/))].join(', '), known: false };
  return null;
}

export function suggestTitle(raw: string): NameHint {
  if (!hasAr(raw)) return null;
  let f = fold(raw);
  const words: string[] = [];
  let role = '';
  // longest phrases first
  for (const [ar, en] of [...TITLE_WORDS].sort((a, b) => b[0].length - a[0].length)) {
    const k = fold(ar);
    if (f.includes(k)) {
      f = f.replace(k, ' ');
      if (/^(Engineer|Manager|Coordinator|Supervisor|Draftsman|Technician|Architect|Quantity Surveyor)$/.test(en)) role = !role || (role === 'Engineer' && en !== 'Engineer') ? en : role;
      else words.push(en);
    }
  }
  if (!role && !words.length) return { value: transliterate(raw), known: false };
  const order = ['Senior', 'Junior', 'Assistant', 'Head of', 'AutoCAD', 'Revit', 'BIM', 'Mechanical', 'HVAC', 'Fire Protection', 'Plumbing', 'Electrical', 'Civil', 'Structural', 'Site', 'Design', 'Technical Office', 'Project', 'Projects', 'Maintenance', 'Planning', 'Estimation', 'QA/QC', 'HSE', 'Sales'];
  const sorted = [...new Set(words)].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const value = [...sorted, role || 'Engineer'].join(' ').replace(/Architect Engineer/, 'Architect').replace(/Quantity Surveyor Engineer/, 'Quantity Surveyor');
  return { value, known: true };
}

/** Company names inside spoken sentences ("في شركة اوراسكوم") → official English names. */
export function replaceCompanies(s: string) {
  let out = s;
  for (const [en, ...alts] of COMPANIES) {
    for (const a of alts.filter((x) => /[؀-ۿ]/.test(x) && x.length >= 4)) {
      const re = new RegExp(`(^|\\s)(?:في\\s+|مع\\s+|ل|ب)?(?:شركه\\s+|شركة\\s+)?${a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[\\s،,.])`, 'g');
      out = out.replace(re, (m, pre) => `${pre}${/^\s*(?:في)/.test(m.trim()) ? 'at ' : /^\s*مع/.test(m.trim()) ? 'with ' : ''}${en}`);
    }
  }
  return out;
}
