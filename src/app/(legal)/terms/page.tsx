import Link from 'next/link';
import { getUiLocale } from '@/lib/locale';

export const metadata = {
  title: 'Terms of Service · ReviewPilot',
  description: 'The honest terms for using ReviewPilot.',
};

export default async function TermsPage() {
  const locale = await getUiLocale();
  const ar = locale === 'ar';

  return (
    <main
      dir={ar ? 'rtl' : 'ltr'}
      lang={locale}
      className="min-h-screen bg-ink-50 text-ink-800"
    >
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-ink-900">
          ReviewPilot
        </Link>
        <Link href="/login" className="text-sm text-ink-600 hover:text-ink-900">
          {ar ? 'تسجيل الدخول' : 'Sign in'}
        </Link>
      </header>

      <article className="mx-auto max-w-3xl px-6 pb-24 prose prose-ink">
        <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
          {ar ? 'شروط الاستخدام' : 'Terms of Service'}
        </h1>
        <p className="text-sm text-ink-500">
          {ar ? 'آخر تحديث: ٢٠٢٦-٠٥-١٩' : 'Last updated: 2026-05-19'}
        </p>

        {ar ? <BodyAr /> : <BodyEn />}
      </article>
    </main>
  );
}

function BodyEn() {
  return (
    <div className="mt-6 space-y-6 text-ink-700">
      <p>
        ReviewPilot is a single-developer portfolio project, provided <strong>as-is</strong>{' '}
        with no warranty. Using it means you accept the following:
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">What ReviewPilot does</h2>
      <p>
        It generates draft text suggestions for Google review responses using
        third-party AI providers (Groq, Google Gemini, Anthropic Claude). The
        drafts are <strong>suggestions</strong>. You are responsible for
        reviewing, editing, and publishing them on Google. ReviewPilot does not
        post anything to Google on your behalf.
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">AI limitations</h2>
      <ul className="list-disc ps-6 space-y-1">
        <li>The AI can be wrong, biased, or culturally off.</li>
        <li>The AI may produce text in a different language or register than expected.</li>
        <li>Quality varies between providers; choose the one that fits your needs.</li>
        <li>
          Always review drafts before posting. Treat the AI as a fast first
          draft, not the final word.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-ink-900">Your responsibilities</h2>
      <ul className="list-disc ps-6 space-y-1">
        <li>
          Only paste or import reviews you have a legitimate right to see (your
          own restaurant&apos;s public reviews).
        </li>
        <li>
          Comply with Google&apos;s review-response policies when publishing the
          AI-generated drafts.
        </li>
        <li>
          Do not use ReviewPilot to generate fake reviews or impersonate other
          businesses.
        </li>
        <li>Keep your sign-in email secure.</li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-ink-900">Availability + changes</h2>
      <p>
        This is a portfolio project on free-tier infrastructure. Downtime,
        rate-limit errors, and feature changes can happen without notice.
        Critical: if a paid AI provider&apos;s key runs out of credit, the app
        falls back to whichever provider is still funded.
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">Liability</h2>
      <p>
        To the extent allowed by law, ReviewPilot and its developer are not
        liable for any business loss, missed reviews, embarrassing AI output,
        or other damages from using the app. The app is provided <strong>as-is</strong>.
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">Termination</h2>
      <p>
        You can delete your account at any time from{' '}
        <Link href="/settings" className="text-accent-dark underline">
          /settings
        </Link>
        . The developer may also discontinue the project entirely (it&apos;s a
        portfolio project, not a real business).
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">Privacy</h2>
      <p>
        See the{' '}
        <Link href="/privacy" className="text-accent-dark underline">
          Privacy Policy
        </Link>{' '}
        for what we collect, store, and share.
      </p>
    </div>
  );
}

function BodyAr() {
  return (
    <div className="mt-6 space-y-6 text-ink-700">
      <p>
        ReviewPilot مشروع شخصي من مطور واحد، يُقدَّم <strong>كما هو</strong> بدون
        أي ضمانات. استخدامك للتطبيق يعني موافقتك على التالي:
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">وش يسوي ReviewPilot</h2>
      <p>
        يولّد اقتراحات ردود على تقييمات Google باستخدام مزودي ذكاء اصطناعي خارجيين
        (Groq أو Gemini أو Claude). المسودات <strong>اقتراحات</strong>. مسؤوليتك
        مراجعتها وتعديلها ونشرها على Google. التطبيق لا ينشر شي نيابة عنك.
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">حدود الذكاء الاصطناعي</h2>
      <ul className="list-disc pe-6 space-y-1">
        <li>قد يخطئ الذكاء الاصطناعي أو يكون منحازاً أو غير مناسب ثقافياً.</li>
        <li>قد ينتج نص بلغة أو نغمة غير اللي تتوقعها.</li>
        <li>الجودة تختلف بين المزودين؛ اختر اللي يناسبك.</li>
        <li>
          راجع المسودات قبل النشر دائماً. اعتبر الذكاء الاصطناعي مساعد صياغة
          أولية، مو الكلمة الأخيرة.
        </li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-ink-900">مسؤولياتك</h2>
      <ul className="list-disc pe-6 space-y-1">
        <li>لا تنسخ ولا تستورد إلا التقييمات اللي لك حق رؤيتها (تقييمات مطعمك العامة).</li>
        <li>التزم بسياسات Google للرد على التقييمات عند نشر المسودات.</li>
        <li>ممنوع استخدام التطبيق لتوليد تقييمات مزيفة أو انتحال هوية مطاعم ثانية.</li>
        <li>احرص على أمان بريدك المستخدم في تسجيل الدخول.</li>
      </ul>

      <h2 className="mt-8 text-lg font-medium text-ink-900">التوافر والتغييرات</h2>
      <p>
        المشروع على بنية تحتية مجانية. الانقطاعات وأخطاء الحصة وتغيير المزايا
        ممكن تصير بدون إشعار.
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">المسؤولية</h2>
      <p>
        إلى الحد المسموح به قانوناً، ReviewPilot ومطوّره غير مسؤولين عن أي خسارة
        عمل أو تقييمات فائتة أو مخرجات ذكاء اصطناعي محرجة أو أي أضرار من استخدام
        التطبيق. التطبيق <strong>كما هو</strong>.
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">إنهاء الخدمة</h2>
      <p>
        تقدر تحذف حسابك في أي وقت من{' '}
        <Link href="/settings" className="text-accent-dark underline">
          /settings
        </Link>
        . المطور أيضاً ممكن يوقف المشروع كلياً (هذا مشروع شخصي، مو شغل تجاري حقيقي).
      </p>

      <h2 className="mt-8 text-lg font-medium text-ink-900">الخصوصية</h2>
      <p>
        راجع{' '}
        <Link href="/privacy" className="text-accent-dark underline">
          سياسة الخصوصية
        </Link>{' '}
        لمعرفة ما نجمعه ونخزنه ونشاركه.
      </p>
    </div>
  );
}
