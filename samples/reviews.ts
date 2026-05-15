/**
 * Realistic sample reviews from the kind of Saudi restaurant ReviewPilot targets.
 * These cover the dimensions we care about:
 * - Language: Arabic (Gulf), Arabic (MSA), English, mixed
 * - Sentiment: from very negative to very positive
 * - Specificity: vague vs. mentions specific dishes/issues
 * - Urgency: routine vs. needs immediate attention
 *
 * Use these to iterate on prompts. If a draft looks bad against any of these,
 * the prompt isn't ready.
 */

export interface SampleReview {
  id: string;
  authorName: string;
  rating: number;
  reviewText: string;
  notes: string; // what makes this case interesting
}

export const sampleReviews: SampleReview[] = [
  {
    id: 'gulf-rave-1',
    authorName: 'فهد',
    rating: 5,
    reviewText: 'والله من أحسن المطاعم في الرياض، الكبسة عندهم خرافية والخدمة سريعة ما تنتظر كثير. زرتهم ثلاث مرات هذي الشهر صراحة.',
    notes: 'Gulf casual, enthusiastic, mentions specific dish (كبسة) and specific praise (speed)',
  },
  {
    id: 'gulf-complaint-mild',
    authorName: 'سارة',
    rating: 3,
    reviewText: 'الأكل طيب بس الانتظار طويل، جلسنا ٤٥ دقيقة قبل ما يجي الطلب. لو يحلون موضوع الوقت بيكون ممتاز.',
    notes: 'Gulf casual, 3-star with specific issue (wait time 45 min), constructive',
  },
  {
    id: 'gulf-angry',
    authorName: 'محمد',
    rating: 1,
    reviewText: 'تجربة سيئة جداً. الأكل وصل بارد والكاشير كان قليل أدب لما طلبت ارجاع. ما أنصح أحد يجي لهم. آخر مرة أزورهم.',
    notes: 'Gulf casual, 1-star, specific complaints (cold food, rude cashier), threatens not to return',
  },
  {
    id: 'msa-formal',
    authorName: 'د. عبدالعزيز',
    rating: 4,
    reviewText: 'مطعم محترم بأجواء راقية وطعام جيد. نقطة الملاحظة الوحيدة هي أن الأسعار مرتفعة نسبياً مقارنة بالكمية المقدمة. سأعود لتجربة أصناف أخرى.',
    notes: 'Formal MSA, 4-star, mentions price-value issue, will return',
  },
  {
    id: 'english-positive',
    authorName: 'Reem A',
    rating: 5,
    reviewText: 'Hidden gem in Riyadh! Tried the mixed grill and it was perfectly seasoned. Service was attentive without being intrusive. Coming back with my family soon.',
    notes: 'English, enthusiastic, mentions mixed grill specifically',
  },
  {
    id: 'english-complaint',
    authorName: 'Ahmed K',
    rating: 2,
    reviewText: 'Ordered delivery through their app. Food arrived 90 minutes late and the rice was undercooked. Tried calling the restaurant three times, no answer. Disappointing.',
    notes: 'English, 2-star, specific issues (delivery late, undercooked, no phone answer)',
  },
  {
    id: 'mixed-codeswitch',
    authorName: 'Nora S',
    rating: 4,
    reviewText: 'Honestly the kebab was مره طيب and the vibes are great for date night. Bas الموقف صعب جداً، خذي وقت تلاقي parking. Otherwise highly recommend!',
    notes: 'Mixed Arabic-English code-switching (common in young urban Saudi), 4-star with parking complaint',
  },
  {
    id: 'urgent-hygiene',
    authorName: 'مستهلك',
    rating: 1,
    reviewText: 'لقيت شعرة في الأكل والمدير ما اعتذر بل قال هذا طبيعي. هذا غير مقبول إطلاقاً. سأبلغ هيئة الغذاء والدواء.',
    notes: 'URGENT: hygiene complaint + threat to escalate to regulator. Needs careful, non-defensive response',
  },
  {
    id: 'short-positive',
    authorName: 'علي',
    rating: 5,
    reviewText: 'يعطيكم العافية، أكل ممتاز',
    notes: 'Very short Gulf positive with religious phrase. Response should be equally brief and warm',
  },
  {
    id: 'vague-negative',
    authorName: 'Anonymous',
    rating: 2,
    reviewText: 'Not good',
    notes: 'Vague 2-star with no specifics. Response should acknowledge without inventing details, and invite specifics',
  },
];
