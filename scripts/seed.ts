/**
 * Idempotent seed: populates the demo restaurant with pre-analyzed reviews
 * and pre-drafted responses so portfolio visitors can click through the
 * inbox without burning Gemini quota. Re-running is safe (no duplicates).
 *
 * The 8 reviews + drafts are curated by hand from yesterday's successful
 * AI outputs so they reflect real model behavior. This file is the source
 * of truth for demo content — edit here, re-run, done.
 *
 * Run with: npm run db:seed
 */

import { eq, like } from 'drizzle-orm';
import { db, user, restaurants, voiceProfiles, reviews, drafts } from '../src/db';
import { DEMO_USER_EMAIL } from '../src/lib/auth-utils';

const DEMO_USER_ID = 'demo_user_001';

const REVIEWS_SEED = [
  {
    externalId: 'seed_gulf-rave',
    authorName: 'فهد',
    rating: 5,
    reviewText:
      'والله من أحسن المطاعم في الرياض، الكبسة عندهم خرافية والخدمة سريعة ما تنتظر كثير. زرتهم ثلاث مرات هذي الشهر صراحة.',
    language: 'ar' as const,
    sentiment: 2,
    topics: ['food_quality', 'food_taste', 'service_speed'],
    urgency: 'low' as const,
    daysAgo: 2,
    draftText:
      'يا هلا والله بفهد، كلامك عن الكبسة الخرافية والخدمة السريعة يسعدنا كثير. شهادتك وزياراتك المتكررة هالشهر شرف كبير لنا، والله يعافيك. ننتظرك دايماً.',
    // The owner shortened the AI draft, dropped "الخرافية" (the model's
    // word, not the restaurant's voice), and added a specific staff
    // mention. Pattern this seeds for learn-from-edits: more personal,
    // names staff, no AI superlatives.
    editedText:
      'يا هلا فهد، شهادتك تشرفنا. الكبسة عند الشيف عيسى تعرف كيف، والخدمة السريعة هدفنا الدائم. حجزنا لك طاولتك الثابتة. ننتظرك.',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [],
      overallScore: 92,
      language: 'ar' as const,
    },
  },
  {
    externalId: 'seed_gulf-complaint-mild',
    authorName: 'سارة',
    rating: 3,
    reviewText: 'الأكل طيب بس الانتظار طويل، جلسنا ٤٥ دقيقة قبل ما يجي الطلب. لو يحلون موضوع الوقت بيكون ممتاز.',
    language: 'ar' as const,
    sentiment: 0,
    topics: ['food_taste', 'wait_time', 'service_speed'],
    urgency: 'medium' as const,
    daysAgo: 5,
    draftText:
      'يا هلا سارة، يسعدنا إن الأكل أعجبك. وبخصوص انتظارك ٤٥ دقيقة، هذا وقت طويل فعلًا ونعتذر لك عليه. شغالين على تحسين سرعة الخدمة وإن شاء الله المرة الجاية تكون تجربتك أفضل بكثير. إدارة المطعم',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [
        { issue: 'الانتظار ٤٥ دقيقة قبل وصول الطلب', addressed: true },
      ],
      overallScore: 85,
      language: 'ar' as const,
    },
  },
  {
    externalId: 'seed_gulf-angry',
    authorName: 'محمد',
    rating: 1,
    reviewText:
      'تجربة سيئة جداً. الأكل وصل بارد والكاشير كان قليل أدب لما طلبت ارجاع. ما أنصح أحد يجي لهم. آخر مرة أزورهم.',
    language: 'ar' as const,
    sentiment: -2,
    topics: ['food_temperature', 'service_attitude'],
    urgency: 'high' as const,
    daysAgo: 8,
    draftText:
      'يا هلا بمحمد، نعتذر لك جداً على تجربة الأكل البارد وتعامل الكاشير اللي ما كان بالمستوى المطلوب. هذا الشيء ما يرضينا أبدًا ونحب نعتذر منك بشكل خاص ونعوضك. لو تتواصل معنا على واتساب 0500000000، نتشرف بخدمتك. إدارة المطعم',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [
        { issue: 'الأكل بارد', addressed: true },
        { issue: 'تعامل الكاشير قليل الأدب عند طلب الإرجاع', addressed: true },
      ],
      overallScore: 88,
      language: 'ar' as const,
    },
  },
  {
    externalId: 'seed_english-positive',
    authorName: 'Reem A',
    rating: 5,
    reviewText:
      'Hidden gem in Riyadh! Tried the mixed grill and it was perfectly seasoned. Service was attentive without being intrusive. Coming back with my family soon.',
    language: 'en' as const,
    sentiment: 2,
    topics: ['food_quality', 'food_taste', 'staff_friendliness'],
    urgency: 'low' as const,
    daysAgo: 12,
    draftText:
      "Thank you, Reem! We're delighted you enjoyed the mixed grill and found our service attentive. We can't wait to welcome you and your family back soon. Restaurant management.",
    // Owner signed by name (Khaled, the actual restaurant owner), named
    // the chef, and offered a concrete invite. Same edit pattern:
    // less generic, more specific, owner is identifiable.
    editedText:
      "Reem, our team will be so happy to hear this. The mixed grill is Chef Issa's signature — I'll let him know you loved it. Bring the family any night this week and ask for me at the door. — Khaled, owner",
    draftLanguage: 'en' as const,
    qualityCheck: {
      checks: [],
      overallScore: 90,
      language: 'en' as const,
    },
  },
  {
    externalId: 'seed_english-complaint',
    authorName: 'Ahmed K',
    rating: 2,
    reviewText:
      'Ordered delivery through their app. Food arrived 90 minutes late and the rice was undercooked. Tried calling the restaurant three times, no answer. Disappointing.',
    language: 'en' as const,
    sentiment: -1,
    topics: ['delivery', 'food_quality', 'wait_time', 'service_speed'],
    urgency: 'medium' as const,
    daysAgo: 16,
    draftText:
      "Ahmed, we're really sorry to hear about your recent order. A 90-minute delay, undercooked rice, and no answer when you called is definitely not the experience we want you to have. Please contact us directly so we can address this properly and make things right for you. Restaurant management.",
    draftLanguage: 'en' as const,
    qualityCheck: {
      checks: [
        { issue: 'Delivery 90 minutes late', addressed: true },
        { issue: 'Rice was undercooked', addressed: true },
        { issue: 'Restaurant did not answer 3 calls', addressed: true },
      ],
      overallScore: 92,
      language: 'en' as const,
    },
  },
  {
    externalId: 'seed_mixed-codeswitch',
    authorName: 'Nora S',
    rating: 4,
    reviewText:
      'Honestly the kebab was مره طيب and the vibes are great for date night. Bas الموقف صعب جداً، خذي وقت تلاقي parking. Otherwise highly recommend!',
    language: 'mixed' as const,
    sentiment: 1,
    topics: ['food_taste', 'ambiance', 'parking'],
    urgency: 'low' as const,
    daysAgo: 20,
    draftText:
      'Hello Nora! Glad you loved the kebab and the vibes for your date night. We know the parking can be a bit tricky sometimes, but we hope to see you again soon إن شاء الله. إدارة المطعم',
    draftLanguage: 'mixed' as const,
    qualityCheck: {
      checks: [
        {
          issue: 'Parking is difficult, takes a while to find a spot',
          addressed: true,
          note: 'Acknowledged but no concrete fix offered',
        },
      ],
      overallScore: 75,
      language: 'en' as const,
    },
  },
  {
    externalId: 'seed_urgent-hygiene',
    authorName: 'مستهلك',
    rating: 1,
    reviewText:
      'لقيت شعرة في الأكل والمدير ما اعتذر بل قال هذا طبيعي. هذا غير مقبول إطلاقاً. سأبلغ هيئة الغذاء والدواء.',
    language: 'ar' as const,
    sentiment: -2,
    topics: ['food_quality', 'hygiene', 'service_attitude'],
    urgency: 'high' as const,
    severity: 'urgent_action' as const,
    daysAgo: 1,
    draftText:
      'نعتذر منك بشدة على اللي صار بخصوص الشعر في الأكل، وهالشيء أبداً ما نقبله ولا يمثلنا. كلام المدير هذا غير مقبول إطلاقاً، وبنتصرف معه فوراً. نتمنى تتواصل معنا على واتساب 0500000000 عشان نعوضك ونوضح لك الموضوع. إدارة المطعم',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [
        { issue: 'شعرة في الأكل', addressed: true },
        { issue: 'المدير اعتبر هذا طبيعياً ولم يعتذر', addressed: true },
      ],
      overallScore: 90,
      language: 'ar' as const,
    },
  },
  {
    externalId: 'seed_short-positive',
    authorName: 'علي',
    rating: 5,
    reviewText: 'يعطيكم العافية، أكل ممتاز',
    language: 'ar' as const,
    sentiment: 2,
    topics: ['food_quality', 'food_taste'],
    urgency: 'low' as const,
    daysAgo: 28,
    draftText: 'الله يعافيك يا علي، كلامك عن الأكل الممتاز يسعدنا جداً. نتمنى نشوفك دايماً. إدارة المطعم',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [],
      overallScore: 88,
      language: 'ar' as const,
    },
  },

  // ===== Follow-ups: existing authors return with new reviews =====
  // محمد wrote an angry 1-star review 8 days ago. After we reached out, he
  // came back and posted a follow-up — drives the customer-timeline demo.
  {
    externalId: 'seed_followup-mohammed',
    authorName: 'محمد',
    rating: 4,
    reviewText:
      'رجعت لكم بعد ما تواصلت معي الإدارة واعتذرت عن تجربتي السابقة. هالمرة الأكل وصل ساخن والمعاملة كانت ممتازة. أقدّر إنكم اهتميتم بملاحظتي. أرجع تاني.',
    language: 'ar' as const,
    sentiment: 1,
    topics: ['food_temperature', 'service_attitude'],
    urgency: 'low' as const,
    daysAgo: 1,
    draftText:
      'يا هلا والله بمحمد، رجوعك يسعدنا أكثر من أول مرة. شكراً إنك أعطيتنا فرصة ثانية، ووعدك إنه ما يصير شي بعدها. ننتظرك دايماً. إدارة المطعم',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [],
      overallScore: 90,
      language: 'ar' as const,
    },
  },
  // فهد is a regular — second 5-star review 7 days after the first.
  {
    externalId: 'seed_repeat-fahad',
    authorName: 'فهد',
    rating: 5,
    reviewText:
      'زيارة رابعة هالشهر. الكبسة دايم بنفس المستوى والخدمة ما تغيرت. صار مطعمنا الثابت لما نطلع نتعشى عائلياً. تسلموا.',
    language: 'ar' as const,
    sentiment: 2,
    topics: ['food_quality', 'food_taste', 'staff_friendliness'],
    urgency: 'low' as const,
    daysAgo: 0,
    draftText:
      'يا هلا فهد، صرت من أهل البيت. كلامك إن مطعمنا صار خياركم الثابت العائلي شرف ما بعده شرف. حجزنا لك طاولة العيلة. ننتظركم. إدارة المطعم',
    draftLanguage: 'ar' as const,
    qualityCheck: {
      checks: [],
      overallScore: 94,
      language: 'ar' as const,
    },
  },
];

async function main() {
  // 1. Demo user
  let demoUser = await db.query.user.findFirst({ where: eq(user.email, DEMO_USER_EMAIL) });
  if (!demoUser) {
    [demoUser] = await db
      .insert(user)
      .values({
        id: DEMO_USER_ID,
        email: DEMO_USER_EMAIL,
        name: 'Demo Owner',
        emailVerified: true,
        locale: 'ar',
      })
      .returning();
    console.log('Created demo user');
  } else {
    console.log('Demo user already exists');
  }

  // 2. Demo restaurant
  let demoRestaurant = await db.query.restaurants.findFirst({
    where: eq(restaurants.userId, demoUser.id),
  });
  if (!demoRestaurant) {
    [demoRestaurant] = await db
      .insert(restaurants)
      .values({
        userId: demoUser.id,
        name: 'مطعم البيت السعودي',
        nameEn: 'The Saudi House',
        defaultLanguage: 'ar',
        timezone: 'Asia/Riyadh',
      })
      .returning();
    console.log('Created demo restaurant');
  } else {
    console.log('Demo restaurant already exists');
  }

  // 3. Voice profile
  const existingProfile = await db.query.voiceProfiles.findFirst({
    where: eq(voiceProfiles.restaurantId, demoRestaurant.id),
  });
  if (!existingProfile) {
    await db.insert(voiceProfiles).values({
      restaurantId: demoRestaurant.id,
      formality: 'warm',
      useReligiousPhrases: true,
      arabicDialect: 'gulf',
      customInstructions:
        'Family restaurant, owner replies personally. Friendly but not over-the-top.',
      signoff: 'إدارة المطعم',
    });
    console.log('Created voice profile');
  } else {
    console.log('Voice profile already exists');
  }

  // 4. Reviews + drafts.
  // Seed reviews use the 'seed_*' externalId prefix so we can safely
  // delete + re-insert them to refresh postedAt staggering and edits
  // to draft text. Non-seed reviews (real manual paste) are not touched.
  await db.delete(reviews).where(like(reviews.externalId, 'seed_%'));

  let inserted = 0;
  for (const r of REVIEWS_SEED) {
    const [review] = await db
      .insert(reviews)
      .values({
        restaurantId: demoRestaurant.id,
        externalId: r.externalId,
        source: 'manual',
        authorName: r.authorName,
        rating: r.rating,
        reviewText: r.reviewText,
        language: r.language,
        postedAt: new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000),
        sentiment: r.sentiment,
        topics: r.topics,
        urgency: r.urgency,
        // Default to direct_reply; entries that want a different severity
        // (urgent_action / monitor / spam) override via the explicit field.
        severity: 'severity' in r ? r.severity : 'direct_reply',
        status: 'drafted',
      })
      .returning();

    await db.insert(drafts).values({
      reviewId: review.id,
      draftText: r.draftText,
      // Seeded edits (where present) become the learn-from-edits source —
      // see src/ai/owner-edits.ts. Two entries (gulf-rave + english-positive)
      // have edits showing the owner's preferred style (more personal,
      // names staff, less AI-generic).
      editedText: 'editedText' in r ? r.editedText : null,
      language: r.draftLanguage,
      model: 'seed-curated',
      promptVersion: 'seed-v1',
      qualityCheck: r.qualityCheck,
    });
    inserted += 1;
  }
  console.log(`Seeded ${inserted} new review(s). Demo restaurant has ${REVIEWS_SEED.length} total.`);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
