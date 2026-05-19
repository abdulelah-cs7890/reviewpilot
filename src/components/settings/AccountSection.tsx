'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { AlertTriangle, Download, Mail, Trash2, Building2 } from 'lucide-react';
import {
  changeEmailAction,
  deleteAccountAction,
  renameRestaurantAction,
} from '@/app/(app)/settings/account-actions';

interface Labels {
  restaurantHeading: string;
  restaurantSub: string;
  nameLabel: string;
  nameEnLabel: string;
  renameBtn: string;
  renaming: string;
  renamedToast: string;
  renameError: string;
  emailHeading: string;
  emailSub: string;
  newEmailLabel: string;
  changeEmailBtn: string;
  changing: string;
  emailChangedToast: (e: string) => string;
  invalidEmail: string;
  alreadyTakenEmail: string;
  emailError: string;
  exportHeading: string;
  exportSub: string;
  exportBtn: string;
  dangerHeading: string;
  dangerSub: string;
  deleteBtn: string;
  deleting: string;
  confirmTitle: string;
  confirmBody: string;
  confirmInput: string;
  confirmYes: string;
  confirmNo: string;
  deletedToast: string;
  demoBlocked: string;
  deleteError: string;
}

const LABELS: Record<'ar' | 'en', Labels> = {
  ar: {
    restaurantHeading: 'بيانات المطعم',
    restaurantSub: 'غيّر اسم المطعم اللي يظهر في الواجهة.',
    nameLabel: 'اسم المطعم (عربي)',
    nameEnLabel: 'الاسم بالإنجليزي (اختياري)',
    renameBtn: 'حفظ الاسم',
    renaming: 'جارٍ الحفظ...',
    renamedToast: 'تم تحديث الاسم',
    renameError: 'تعذّر تحديث الاسم',
    emailHeading: 'البريد الإلكتروني',
    emailSub: 'تسجيلات الدخول القادمة ستستخدم البريد الجديد.',
    newEmailLabel: 'البريد الجديد',
    changeEmailBtn: 'تغيير البريد',
    changing: 'جارٍ التغيير...',
    emailChangedToast: (e) => `تم تغيير البريد إلى ${e}`,
    invalidEmail: 'بريد إلكتروني غير صالح',
    alreadyTakenEmail: 'البريد مستخدم بحساب آخر',
    emailError: 'تعذّر تغيير البريد',
    exportHeading: 'تصدير بياناتك',
    exportSub: 'تحميل كل تقييماتك ومسوداتك بصيغة CSV.',
    exportBtn: '↓ تحميل CSV',
    dangerHeading: 'منطقة الخطر',
    dangerSub: 'حذف الحساب نهائياً يحذف كل التقييمات والمسودات. لا يمكن التراجع.',
    deleteBtn: 'حذف حسابي',
    deleting: 'جارٍ الحذف...',
    confirmTitle: 'تأكيد الحذف',
    confirmBody: 'اكتب "حذف" في الخانة لتأكيد إنك متأكد.',
    confirmInput: 'حذف',
    confirmYes: 'احذف حسابي نهائياً',
    confirmNo: 'إلغاء',
    deletedToast: 'تم حذف الحساب',
    demoBlocked: 'العرض التجريبي لا يدعم هذا الإجراء',
    deleteError: 'تعذّر حذف الحساب',
  },
  en: {
    restaurantHeading: 'Restaurant details',
    restaurantSub: 'Change the restaurant name shown in the app.',
    nameLabel: 'Restaurant name (Arabic)',
    nameEnLabel: 'English name (optional)',
    renameBtn: 'Save name',
    renaming: 'Saving…',
    renamedToast: 'Name updated',
    renameError: "Couldn't update name",
    emailHeading: 'Email address',
    emailSub: 'Future magic-link sign-ins will use the new email.',
    newEmailLabel: 'New email',
    changeEmailBtn: 'Change email',
    changing: 'Changing…',
    emailChangedToast: (e) => `Email changed to ${e}`,
    invalidEmail: 'Invalid email address',
    alreadyTakenEmail: 'That email is used by another account',
    emailError: "Couldn't change email",
    exportHeading: 'Export your data',
    exportSub: 'Download all your reviews + latest drafts as CSV.',
    exportBtn: '↓ Download CSV',
    dangerHeading: 'Danger zone',
    dangerSub:
      'Deleting your account permanently removes every review and draft. This cannot be undone.',
    deleteBtn: 'Delete my account',
    deleting: 'Deleting…',
    confirmTitle: 'Confirm deletion',
    confirmBody: 'Type DELETE in the field below to confirm you are sure.',
    confirmInput: 'DELETE',
    confirmYes: 'Permanently delete my account',
    confirmNo: 'Cancel',
    deletedToast: 'Account deleted',
    demoBlocked: 'The demo session does not allow this action',
    deleteError: "Couldn't delete account",
  },
};

export function AccountSection({
  locale = 'ar',
  isDemo,
  currentEmail,
  currentName,
  currentNameEn,
}: {
  locale?: 'ar' | 'en';
  isDemo: boolean;
  currentEmail: string;
  currentName: string;
  currentNameEn: string | null;
}) {
  const t = LABELS[locale];
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [pendingDelete, startDelete] = useTransition();
  const [pendingRename, startRename] = useTransition();
  const [pendingEmail, startEmail] = useTransition();

  function onRename(formData: FormData) {
    if (isDemo) {
      toast.warning(t.demoBlocked);
      return;
    }
    startRename(async () => {
      const result = await renameRestaurantAction(formData);
      if (result.ok) toast.success(t.renamedToast);
      else if (result.reason === 'demo') toast.warning(t.demoBlocked);
      else toast.error(t.renameError);
    });
  }

  function onChangeEmail(formData: FormData) {
    if (isDemo) {
      toast.warning(t.demoBlocked);
      return;
    }
    startEmail(async () => {
      const result = await changeEmailAction(formData);
      if (result.ok) toast.success(t.emailChangedToast(result.newEmail));
      else if (result.reason === 'demo') toast.warning(t.demoBlocked);
      else if (result.reason === 'invalid-email') toast.error(t.invalidEmail);
      else if (result.reason === 'already-taken') toast.error(t.alreadyTakenEmail);
      else toast.error(t.emailError);
    });
  }

  function onDelete() {
    if (isDemo) {
      toast.warning(t.demoBlocked);
      return;
    }
    if (confirmText !== t.confirmInput) return;
    startDelete(async () => {
      const result = await deleteAccountAction();
      if (result.ok) {
        toast.success(t.deletedToast);
        router.push('/');
      } else if (result.reason === 'demo') {
        toast.warning(t.demoBlocked);
        setConfirmOpen(false);
      } else {
        toast.error(t.deleteError);
      }
    });
  }

  return (
    <div className="mt-6 space-y-6">
      {/* Restaurant rename */}
      <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{t.restaurantHeading}</h2>
        </div>
        <p className="mb-4 text-sm text-ink-600">{t.restaurantSub}</p>
        <form
          action={onRename}
          className="space-y-3"
        >
          <div>
            <label htmlFor="name" className="mb-1 block text-xs text-ink-500">
              {t.nameLabel}
            </label>
            <input
              id="name"
              name="name"
              required
              defaultValue={currentName}
              maxLength={120}
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <div>
            <label htmlFor="nameEn" className="mb-1 block text-xs text-ink-500">
              {t.nameEnLabel}
            </label>
            <input
              id="nameEn"
              name="nameEn"
              defaultValue={currentNameEn ?? ''}
              dir="ltr"
              maxLength={120}
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            disabled={pendingRename}
            className="rounded-xl bg-ink-900 px-5 py-2 text-sm font-medium text-ink-50 hover:bg-ink-800 disabled:opacity-50"
          >
            {pendingRename ? t.renaming : t.renameBtn}
          </button>
        </form>
      </section>

      {/* Email change */}
      <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{t.emailHeading}</h2>
        </div>
        <p className="mb-3 text-sm text-ink-600">{t.emailSub}</p>
        <p className="mb-4 text-xs text-ink-500" dir="ltr">
          {currentEmail}
        </p>
        <form action={onChangeEmail} className="space-y-3">
          <div>
            <label htmlFor="newEmail" className="mb-1 block text-xs text-ink-500">
              {t.newEmailLabel}
            </label>
            <input
              id="newEmail"
              name="newEmail"
              type="email"
              required
              dir="ltr"
              maxLength={254}
              className="w-full rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm text-ink-900 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </div>
          <button
            type="submit"
            disabled={pendingEmail}
            className="rounded-xl border border-ink-200 bg-white px-5 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
          >
            {pendingEmail ? t.changing : t.changeEmailBtn}
          </button>
        </form>
      </section>

      {/* Export */}
      <section className="rounded-3xl border border-ink-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <Download className="h-4 w-4 text-accent-dark" />
          <h2 className="text-sm font-medium text-ink-900">{t.exportHeading}</h2>
        </div>
        <p className="mb-4 text-sm text-ink-600">{t.exportSub}</p>
        <a
          href="/api/export/reviews.csv"
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100"
        >
          {t.exportBtn}
        </a>
      </section>

      {/* Danger zone */}
      <section className="rounded-3xl border border-red-200 bg-red-50/40 p-6 shadow-sm sm:p-8">
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <h2 className="text-sm font-medium text-red-900">{t.dangerHeading}</h2>
        </div>
        <p className="mb-4 text-sm text-red-800">{t.dangerSub}</p>
        {!confirmOpen ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={isDemo}
            className="inline-flex items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
            title={isDemo ? t.demoBlocked : undefined}
          >
            <Trash2 className="h-4 w-4" />
            {t.deleteBtn}
          </button>
        ) : (
          <div className="space-y-3 rounded-2xl border border-red-200 bg-white p-4">
            <p className="text-sm font-medium text-red-900">{t.confirmTitle}</p>
            <p className="text-sm text-red-700">{t.confirmBody}</p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t.confirmInput}
              className="w-full rounded-xl border border-red-200 bg-white px-4 py-2 text-sm text-ink-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onDelete}
                disabled={pendingDelete || confirmText !== t.confirmInput}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                {pendingDelete ? t.deleting : t.confirmYes}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setConfirmText('');
                }}
                disabled={pendingDelete}
                className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-700 hover:bg-ink-100 disabled:opacity-50"
              >
                {t.confirmNo}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
