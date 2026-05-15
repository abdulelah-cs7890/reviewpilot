/**
 * Realistic sample reviews from the kind of Saudi restaurant ReviewPilot targets.
 * These cover the dimensions we care about:
 * - Language: Arabic (Gulf), Arabic (MSA), English, mixed
 * - Sentiment: from very negative to very positive
 * - Specificity: vague vs. mentions specific dishes/issues/staff
 * - Urgency: routine vs. needs immediate attention
 * - Length: one-liner to multi-paragraph
 * - Context: dine-in vs. delivery-app, prayer time / family section, etc.
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
  // ===== Original 10 (Gulf casual, MSA, English, mixed, urgent) =====
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

  // ===== Staff named explicitly =====
  {
    id: 'staff-praise-named',
    authorName: 'منيرة',
    rating: 5,
    reviewText: 'الأكل لذيذ والخدمة ممتازة، خاصة الأخ أحمد كان متعاون جداً ومبتسم طول الوقت. شكراً لكم وللطاقم.',
    notes: 'Gulf casual, names a specific staff member (Ahmad). Response should acknowledge him by name without over-promising',
  },
  {
    id: 'staff-complaint-described',
    authorName: 'Hessa M',
    rating: 2,
    reviewText: 'The food was decent but the cashier — the one with glasses, short hair — was incredibly rude when I asked about an ingredient. Made me feel stupid for asking about my own dietary restrictions.',
    notes: 'English, identifies staff by physical description rather than name. Response must address without confirming identity publicly',
  },

  // ===== Allergy / dietary safety =====
  {
    id: 'allergy-reaction',
    authorName: 'Layla H',
    rating: 1,
    reviewText: 'Explicitly told the waiter my son has a nut allergy. He confirmed the dish was nut-free. My son had a mild reaction within 20 minutes. We had to leave to get him medicine. This is dangerous — please train your staff properly on allergens.',
    notes: 'URGENT: child safety + allergen mislabeling. Cannot be dismissed. Response must take this very seriously, never minimize, offer direct private contact, no legal admissions in writing',
  },
  {
    id: 'dietary-confusion-ar',
    authorName: 'أم سلطان',
    rating: 2,
    reviewText: 'سألت الجرسون لو الأكل يحتوي ثوم لأن عندي حساسية، قال لا. طلعت السلطة فيها ثوم واضح. خاطر صحي ولازم يكون عندكم معلومات دقيقة عن المكونات.',
    notes: 'Gulf Arabic, food allergy issue (garlic). Less life-threatening than nut but still serious. Should respond with same seriousness, not dismiss',
  },

  // ===== Delivery-app context =====
  {
    id: 'jahez-delivery-bad',
    authorName: 'خالد ع.',
    rating: 1,
    reviewText: 'طلبت عبر جاهز، الطلب وصل بعد ساعتين وكان ناقص قطعة الدجاج وعصير الليمون. كلمت المطعم قالوا تواصل مع جاهز. وش الفايدة من رقمكم إذا ما تتحملون مسؤولية الطلب؟',
    notes: 'Gulf Arabic, delivery via Jahez, missing items + restaurant blames the platform. Restaurant SHOULD take ownership even when delivery partner failed',
  },
  {
    id: 'hungerstation-positive',
    authorName: 'Rakan',
    rating: 5,
    reviewText: 'Ordered through HungerStation, food came hot and packaging was solid — nothing leaked, sauces packed separately. The chicken was crispy even after delivery. Best mandi delivery in Riyadh.',
    notes: 'English, delivery app praise — packaging quality. References specific dish (mandi). Response should reinforce delivery quality as a strength',
  },
  {
    id: 'mrsool-driver',
    authorName: 'Fatima',
    rating: 3,
    reviewText: 'Food itself was good (5 stars for the مشاوي) but my Mrsool driver Marwan was super impatient and almost left before I came down. Not the restaurant\'s fault but maybe partner with better couriers?',
    notes: 'English with Arabic, 3-star, names courier (Marwan) from Mrsool app. Restaurant does not control couriers — response should sympathize without blaming app',
  },

  // ===== Competitor comparison =====
  {
    id: 'competitor-better',
    authorName: 'سعد',
    rating: 4,
    reviewText: 'كبستكم طيبة بس صراحة كبسة نجد فيلج أحسن وأرخص. الجو عندكم أرقى لكن الطعم نفسه يحتاج شغل أكثر على البهارات.',
    notes: 'Gulf Arabic, 4-star, names competitor (Najd Village) as better on food. Tricky — response must not bash competitor but also not concede',
  },

  // ===== Prayer time / family section / women-only =====
  {
    id: 'prayer-time-closed',
    authorName: 'أبو يوسف',
    rating: 2,
    reviewText: 'وصلنا قبل المغرب بشوي، قالوا الكاشير مقفل للصلاة ولازم ننتظر. بس الموضوع طول نص ساعة بعد الأذان والمحل ضل مقفل. ليش ما يكون عندكم نظام يخلي زبون يدفع بعد الصلاة بدل ما نطلع جوعانين؟',
    notes: 'Gulf Arabic, prayer time operational issue, common in KSA. Response should explain politely and not be defensive about religious observance',
  },
  {
    id: 'family-section-issue',
    authorName: 'أم ريم',
    rating: 2,
    reviewText: 'القسم العائلي صغير ومزدحم بشكل غير مريح، طاولات قريبة من بعضها وما فيه خصوصية. مع احترامي القسم المفرد أوسع بكثير. لما نجي عوايل لازم يكون عندنا راحة.',
    notes: 'Gulf Arabic, complaint about family section being smaller than singles section — culturally sensitive issue. Response must respect family priorities',
  },

  // ===== 4-star with buried complaint =====
  {
    id: 'buried-complaint',
    authorName: 'Yara T',
    rating: 4,
    reviewText: 'Really enjoyed our dinner — the lamb ouzi was excellent and the dessert platter was generous. Service was friendly. One small thing: the bathrooms were not as clean as the rest of the place, my friend mentioned the soap dispenser was empty. Otherwise great evening!',
    notes: 'English, 4-star (positive overall) but buried hygiene/maintenance issue. Response should address the bathroom comment specifically without being defensive — easy to gloss over but matters',
  },

  // ===== Multi-paragraph long review =====
  {
    id: 'long-detailed',
    authorName: 'Tariq B',
    rating: 4,
    reviewText: `Visited last Friday with my wife for our anniversary, sat in the outdoor area around 8pm.

Starters: The hummus was incredibly smooth, possibly the best I've had outside of Lebanon. The fattoush was fresh but the dressing was a bit too tangy for my taste — minor preference issue.

Mains: My wife had the mansaf which she said was the best she's had in Riyadh. I had the mixed grill — the kofta and shish tawook were perfect, but the lamb chop was slightly overcooked. Asked the waiter (didn't catch his name, young guy with a beard) and he immediately offered to replace it — appreciated that, very professional.

Desserts: Mahalabia was good but the kunafa was lukewarm. Probably been sitting.

Overall: Great place for a special occasion, will return, but the kitchen needs to watch consistency. 4 stars because the service recovery was excellent.`,
    notes: 'English, long multi-paragraph review with mixed feedback across multiple courses and specific staff recognition. Response must be substantial but not match length — acknowledge multiple things specifically without writing an essay',
  },

  // ===== Mixed sentiment with concrete tradeoff =====
  {
    id: 'food-good-service-bad',
    authorName: 'وليد',
    rating: 3,
    reviewText: 'الأكل ١٠/١٠ صدق، البرياني والمكبوس درجة عالية. بس الخدمة سيئة جداً، انتظرنا ٢٠ دقيقة عشان نطلب وما حد التفت لنا. الأكل وحده ما يكفي.',
    notes: 'Gulf Arabic, explicit tradeoff — food excellent, service bad. Response must acknowledge BOTH genuinely (do not bury the bad in praise of the good)',
  },

  // ===== Author with formal religious title =====
  {
    id: 'sheikh-formal',
    authorName: 'الشيخ عبدالرحمن',
    rating: 5,
    reviewText: 'بارك الله فيكم على هذا الإتقان في الطعام والخدمة. زرنا المطعم مع الأهل بعد صلاة العشاء وكان كل شيء على أكمل وجه. جزاكم الله خيراً.',
    notes: 'Author has religious title (الشيخ), uses heavy religious phrasing. Response should respect the register — formal warm Arabic with appropriate religious acknowledgment, do not switch to Gulf casual',
  },

  // ===== Expat author writing English =====
  {
    id: 'expat-english',
    authorName: 'Imran M',
    rating: 5,
    reviewText: 'I have been working in Riyadh for 8 years and this is the closest thing to my mother\'s kitchen back in Karachi. The biryani is properly spiced — not too mild like most places try to do for the local palate. My family from Pakistan visited last month and they were impressed. Thank you for keeping it authentic.',
    notes: 'English from South-Asian-expat reviewer (Pakistani), references Karachi/Pakistan, praises authenticity not adapting to local palate. Response should appreciate the specific praise about authenticity without making the customer feel othered',
  },

  // ===== Reference to a photo =====
  {
    id: 'photo-reference',
    authorName: 'Mariam',
    rating: 2,
    reviewText: 'As you can see in the photo I attached, the kibbeh I received was half the size of what\'s shown on your menu. For the price (35 SAR each) this is ridiculous. Either fix your menu photos or fix your portion sizes.',
    notes: 'English, references a photo we cannot see. Response must NOT pretend to know what the photo shows, must address the portion-size-vs-menu-photo concern directly',
  },

  // ===== Arabic dish names in English review =====
  {
    id: 'arabic-dish-in-english',
    authorName: 'Sophia L',
    rating: 5,
    reviewText: 'Tried the mutabbaq and the jareesh for the first time and I am in love. The mutabbaq stuffing was so rich, and the jareesh had the perfect texture — not too dry. The lady at the counter was kind enough to explain each dish to me since I\'m new to Saudi cuisine. Wonderful introduction!',
    notes: 'English from a non-Saudi/non-Arab newcomer, names dishes in transliterated Arabic (mutabbaq, jareesh). Response should be in English, warmly welcome them to Saudi cuisine, optionally include the Arabic spelling for the dishes',
  },
];
