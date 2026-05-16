// Locale-keyed copy for the landing page. Keeping it in one file so it's easy
// to scan and edit without hunting through components. When this grows past
// ~150 lines, split per-section.

export type Locale = 'ar' | 'en';

export const copy = {
  ar: {
    nav: { switchLang: 'English', login: 'تسجيل الدخول' },
    hero: {
      eyebrow: 'لمطاعم المملكة العربية السعودية',
      title: 'ردود ذكية على تقييمات Google، بلغة مطعمك.',
      sub: 'ReviewPilot يحلّل تقييمات عملائك ويصيغ ردوداً جاهزة بنغمة مطعمك السعودية — خلال ثوانٍ بدلاً من ساعات.',
      demoCta: '← جرّب العرض التجريبي الآن',
      demoCtaSub: 'مطعم تجريبي محمّل بـ ٨ تقييمات حقيقية وردود جاهزة. بدون تسجيل.',
      cta: 'أو انضم لقائمة الانتظار',
    },
    sample: {
      heading: 'هكذا تبدو النتيجة',
      reviewLabel: 'تقييم العميل · ٥ نجوم',
      reviewText:
        'والله من أحسن المطاعم في الرياض، الكبسة عندهم خرافية والخدمة سريعة ما تنتظر كثير. زرتهم ثلاث مرات هذي الشهر صراحة.',
      analysisLabel: 'تحليل ReviewPilot',
      tags: ['طعام', 'سرعة الخدمة', 'مشاعر إيجابية جداً'],
      draftLabel: 'مسودة الرد (جاهزة للنسخ)',
      draftText:
        'يا هلا والله بفهد، كلامك عن الكبسة الخرافية والخدمة السريعة يسعدنا كثير. شهادتك وزياراتك المتكررة هالشهر شرف كبير لنا، والله يعافيك. ننتظرك دايماً.',
    },
    how: {
      heading: 'كيف يشتغل؟',
      steps: [
        {
          title: 'اربط حساب Google Business Profile',
          desc: 'ربط بسيط في دقيقة. مطعمك يبقى كما هو، نحن نقرأ التقييمات فقط.',
        },
        {
          title: 'كل تقييم جديد يُحلّل تلقائياً',
          desc: 'نستخرج المشاعر، المواضيع، ومستوى الإلحاح. نُنبّهك على الأمور العاجلة.',
        },
        {
          title: 'تستلم مسودة جاهزة',
          desc: 'بنغمة مطعمك، بلهجتك. وافق، عدّل، وانسخ. أنت دائماً في التحكم.',
        },
      ],
    },
    waitlist: {
      heading: 'كن من أوائل المطاعم اللي تجربها',
      sub: 'أول ٥ مطاعم في الرياض — مجاناً لثلاثة أشهر. فقط نحتاج ملاحظاتك.',
      emailLabel: 'البريد الإلكتروني',
      emailPlaceholder: 'you@restaurant.com',
      restaurantLabel: 'اسم المطعم',
      restaurantPlaceholder: 'مطعم...',
      cityLabel: 'المدينة',
      cityPlaceholder: 'الرياض',
      submit: 'انضم',
      submitting: 'جارٍ الإضافة...',
      success: 'تم! نتواصل معك قريباً.',
      errorEmail: 'البريد الإلكتروني غير صحيح',
      errorGeneric: 'حدث خطأ، حاول مرة ثانية',
    },
    footer: {
      tagline: 'ReviewPilot · ردود تقييمات بالذكاء الاصطناعي للمطاعم السعودية',
    },
  },
  en: {
    nav: { switchLang: 'العربية', login: 'Log in' },
    hero: {
      eyebrow: 'For restaurants in Saudi Arabia',
      title: "Smart Google review replies, in your restaurant's voice.",
      sub: 'ReviewPilot analyzes your reviews and drafts ready-to-post responses in your Saudi voice — seconds instead of hours.',
      demoCta: 'Try the live demo →',
      demoCtaSub: 'A pre-loaded demo restaurant with 8 real reviews and AI-drafted replies. No signup.',
      cta: 'Or join the waitlist',
    },
    sample: {
      heading: 'What the output looks like',
      reviewLabel: 'Customer review · 5 stars',
      reviewText:
        'والله من أحسن المطاعم في الرياض، الكبسة عندهم خرافية والخدمة سريعة ما تنتظر كثير. زرتهم ثلاث مرات هذي الشهر صراحة.',
      analysisLabel: 'ReviewPilot analysis',
      tags: ['Food quality', 'Service speed', 'Very positive sentiment'],
      draftLabel: 'Reply draft (ready to copy)',
      draftText:
        'يا هلا والله بفهد، كلامك عن الكبسة الخرافية والخدمة السريعة يسعدنا كثير. شهادتك وزياراتك المتكررة هالشهر شرف كبير لنا، والله يعافيك. ننتظرك دايماً.',
    },
    how: {
      heading: 'How it works',
      steps: [
        {
          title: 'Connect your Google Business Profile',
          desc: 'One-minute connect. Your restaurant stays exactly as it is — we just read the reviews.',
        },
        {
          title: 'Every new review is analyzed automatically',
          desc: 'Sentiment, topics, urgency. We flag the ones that need you right now.',
        },
        {
          title: 'You get a ready-to-post draft',
          desc: "In your restaurant's voice and dialect. Approve, edit, copy. You're always in control.",
        },
      ],
    },
    waitlist: {
      heading: 'Be one of the first restaurants to try it',
      sub: 'First 5 restaurants in Riyadh — free for 3 months. All we ask is your feedback.',
      emailLabel: 'Email',
      emailPlaceholder: 'you@restaurant.com',
      restaurantLabel: 'Restaurant name',
      restaurantPlaceholder: 'Restaurant…',
      cityLabel: 'City',
      cityPlaceholder: 'Riyadh',
      submit: 'Join',
      submitting: 'Adding…',
      success: "You're on the list — we'll be in touch soon.",
      errorEmail: 'Please enter a valid email',
      errorGeneric: 'Something went wrong — please try again',
    },
    footer: {
      tagline: 'ReviewPilot · AI review replies for Saudi restaurants',
    },
  },
} satisfies Record<Locale, unknown>;
