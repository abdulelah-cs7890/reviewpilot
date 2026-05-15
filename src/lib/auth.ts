import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { magicLink } from 'better-auth/plugins';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: false },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        if (resend) {
          await resend.emails.send({
            from: 'ReviewPilot <onboarding@resend.dev>',
            to: email,
            subject: 'تسجيل الدخول إلى ReviewPilot',
            html: `<div style="font-family:system-ui;direction:rtl;max-width:480px;margin:0 auto;padding:24px">
              <h1 style="font-size:20px;margin:0 0 16px">تسجيل الدخول إلى ReviewPilot</h1>
              <p style="color:#54513f">اضغط على الرابط التالي لتسجيل الدخول. ينتهي خلال ٥ دقائق.</p>
              <p style="margin:24px 0"><a href="${url}" style="background:#0e0d0a;color:#f7f7f5;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block">تسجيل الدخول</a></p>
              <p style="color:#a8a597;font-size:13px">إذا لم تطلب هذا الرابط، تجاهل هذه الرسالة.</p>
            </div>`,
          });
        } else {
          // No Resend key — print the link to the server console so the
          // dev can copy-paste it. Documented in README.
          console.log('\n=================================================');
          console.log('🔗 [magic-link] sign-in URL for', email + ':');
          console.log('   ' + url);
          console.log('=================================================\n');
        }
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
