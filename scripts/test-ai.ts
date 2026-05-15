/**
 * Test the AI engine end-to-end with realistic Saudi restaurant reviews.
 *
 * Usage:
 *   npm run ai:test
 *   npm run ai:test -- --id=gulf-angry
 *   npm run ai:test -- --profile=warm
 *
 * This is the loop you'll use to tune prompts. Run it, read the outputs,
 * adjust analyzer.ts or drafter.ts, run it again.
 */

import { analyzeReview } from '../src/ai/analyzer';
import { draftResponse, type VoiceProfileInput } from '../src/ai/drafter';
import { sampleReviews } from '../samples/reviews';

// Three voice profile presets to test against the same reviews.
const profiles: Record<string, VoiceProfileInput> = {
  warm: {
    formality: 'warm',
    useReligiousPhrases: true,
    arabicDialect: 'gulf',
    customInstructions: 'Family restaurant, owner replies personally. Friendly but not over-the-top.',
    signoff: 'إدارة المطعم',
    sampleResponses: [
      {
        reviewText: 'الكبسة عندكم حلوة، الله يعطيكم العافية',
        rating: 5,
        responseText: 'الله يعافيك يا فهد، وجودك معنا يشرفنا. ننتظرك دايماً.',
        language: 'ar',
      },
      {
        reviewText: 'الخدمة بطيئة',
        rating: 2,
        responseText: 'يا هلا فيك، نعتذر منك على التأخير، هذا ما يمثلنا. لو تواصل معنا واتساب 0500000000 نحب نعوضك.',
        language: 'ar',
      },
    ],
  },
  formal: {
    formality: 'formal',
    useReligiousPhrases: false,
    arabicDialect: 'msa',
    signoff: 'إدارة المطعم',
    sampleResponses: null,
  },
  casual: {
    formality: 'casual',
    useReligiousPhrases: true,
    arabicDialect: 'gulf',
    customInstructions: 'Young trendy spot in Boulevard, owner is hands-on, casual vibe.',
    signoff: null,
    sampleResponses: null,
  },
};

function parseArgs() {
  const args = process.argv.slice(2);
  const id = args.find((a) => a.startsWith('--id='))?.split('=')[1];
  const profileName = args.find((a) => a.startsWith('--profile='))?.split('=')[1] ?? 'warm';
  return { id, profileName };
}

async function runOne(review: (typeof sampleReviews)[number], voiceProfile: VoiceProfileInput) {
  console.log('\n' + '═'.repeat(80));
  console.log(`📝 [${review.id}] ${review.rating}★ — ${review.authorName}`);
  console.log(`   notes: ${review.notes}`);
  console.log('─'.repeat(80));
  console.log(review.reviewText);
  console.log('─'.repeat(80));

  const t0 = Date.now();
  const analysis = await analyzeReview({
    reviewText: review.reviewText,
    rating: review.rating,
    authorName: review.authorName,
  });
  const tAnalysis = Date.now() - t0;

  console.log('🔎 Analysis:');
  console.log(`   language: ${analysis.language}${analysis.dialect ? ` (${analysis.dialect})` : ''}`);
  console.log(`   sentiment: ${analysis.sentiment}  urgency: ${analysis.urgency}`);
  console.log(`   topics: ${analysis.topics.join(', ')}`);
  if (analysis.mentions.dishes?.length) console.log(`   dishes: ${analysis.mentions.dishes.join(', ')}`);
  if (analysis.mentions.issues?.length) console.log(`   issues: ${analysis.mentions.issues.join(', ')}`);
  if (analysis.mentions.praise?.length) console.log(`   praise: ${analysis.mentions.praise.join(', ')}`);
  console.log(`   owner summary: ${analysis.ownerSummary}`);
  console.log(`   (analyzed in ${tAnalysis}ms)`);

  const t1 = Date.now();
  const draft = await draftResponse({
    reviewText: review.reviewText,
    rating: review.rating,
    authorName: review.authorName,
    analysis,
    voiceProfile,
    restaurantName: 'مطعم تجريبي',
  });
  const tDraft = Date.now() - t1;

  console.log('─'.repeat(80));
  console.log('✉️  Draft response:');
  console.log(`   ${draft.draftText}`);
  if (draft.rationale) console.log(`   rationale: ${draft.rationale}`);
  console.log(`   (drafted in ${tDraft}ms, total ${tAnalysis + tDraft}ms)`);
}

async function main() {
  const { id, profileName } = parseArgs();
  const profile = profiles[profileName];
  if (!profile) {
    console.error(`Unknown profile "${profileName}". Available: ${Object.keys(profiles).join(', ')}`);
    process.exit(1);
  }

  console.log(`Voice profile: ${profileName}`);
  console.log(`  formality=${profile.formality}, religious=${profile.useReligiousPhrases}, dialect=${profile.arabicDialect}`);

  const toRun = id ? sampleReviews.filter((r) => r.id === id) : sampleReviews;
  if (toRun.length === 0) {
    console.error(`No review found with id "${id}"`);
    console.error(`Available ids: ${sampleReviews.map((r) => r.id).join(', ')}`);
    process.exit(1);
  }

  for (const review of toRun) {
    try {
      await runOne(review, profile);
    } catch (err) {
      console.error(`\n❌ Failed on ${review.id}:`, err);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
