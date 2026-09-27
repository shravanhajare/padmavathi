/**
 * Starting reviews for the home page. `npm run db:setup` copies them into the
 * `reviews` table once; after that they are edited, hidden or replaced in
 * /admin/reviews and this file is no longer read by the site.
 */
export interface ReviewText {
  city: string;
  product: string;
  quote: string;
}

export interface ReviewSeed {
  name: string;
  rating: 1 | 2 | 3 | 4 | 5;
  i18n: { en: ReviewText; kn: ReviewText; hi: ReviewText };
}

export const reviewSeeds: ReviewSeed[] = [
  {
    name: 'Lakshmi R.',
    rating: 5,
    i18n: {
      en: { city: 'Bengaluru', product: 'Teak Chakla-Belan Set × 40', quote: 'We stock these in our store and they sell out every month. Heavy, smooth chaklas, and every set is packed well.' },
      kn: { city: 'ಬೆಂಗಳೂರು', product: 'ತೇಗದ ಮಣೆ-ಲಟ್ಟಣಿಗೆ ಸೆಟ್ × 40', quote: 'ನಮ್ಮ ಅಂಗಡಿಯಲ್ಲಿ ಇವನ್ನು ಇಡುತ್ತೇವೆ, ಪ್ರತಿ ತಿಂಗಳೂ ಖಾಲಿಯಾಗುತ್ತವೆ. ಭಾರವಾದ, ನುಣುಪಾದ ಮಣೆಗಳು, ಪ್ರತಿ ಸೆಟ್ ಚೆನ್ನಾಗಿ ಪ್ಯಾಕ್ ಆಗಿರುತ್ತದೆ.' },
      hi: { city: 'बेंगलुरु', product: 'सागौन चकला-बेलन सेट × 40', quote: 'हम इन्हें अपनी दुकान में रखते हैं और हर महीने ख़त्म हो जाते हैं। भारी, चिकने चकले, और हर सेट अच्छी तरह पैक।' },
    },
  },
  {
    name: 'Meera S.',
    rating: 5,
    i18n: {
      en: { city: 'Kochi', product: 'Bench Coconut Scraper × 25', quote: 'Exactly like the thuruvani my grandmother had. The teeth grate fine and fluffy coconut, and every piece arrived perfect.' },
      kn: { city: 'ಕೊಚ್ಚಿ', product: 'ಬೆಂಚ್ ತುರಿಮಣೆ × 25', quote: 'ನನ್ನ ಅಜ್ಜಿಯ ತುರಿಮಣೆಯಂತೆಯೇ. ಹಲ್ಲುಗಳು ನುಣ್ಣಗೆ ತುರಿಯುತ್ತವೆ, ಪ್ರತಿ ತುಂಡೂ ಸರಿಯಾಗಿ ತಲುಪಿತು.' },
      hi: { city: 'कोच्चि', product: 'बेंच नारियल कसनी × 25', quote: 'बिल्कुल मेरी दादी की थुरुवनी जैसी। दाँतियाँ बारीक, फूला नारियल कसती हैं, और हर नग सही सलामत पहुँचा।' },
    },
  },
  {
    name: 'Anand K.',
    rating: 5,
    i18n: {
      en: { city: 'Pune', product: 'Kitchen Essentials Crate × 20', quote: 'We ordered housewarming crates for the whole family. Everyone at the pooja wanted to know where they were from.' },
      kn: { city: 'ಪುಣೆ', product: 'ಅಡುಗೆಮನೆ ಅಗತ್ಯ ಪೆಟ್ಟಿಗೆ × 20', quote: 'ಇಡೀ ಕುಟುಂಬಕ್ಕೆ ಗೃಹಪ್ರವೇಶದ ಪೆಟ್ಟಿಗೆಗಳನ್ನು ಆರ್ಡರ್ ಮಾಡಿದೆವು. ಪೂಜೆಯಲ್ಲಿ ಎಲ್ಲರೂ ಎಲ್ಲಿಂದ ಎಂದು ಕೇಳಿದರು.' },
      hi: { city: 'पुणे', product: 'किचन एसेंशियल्स क्रेट × 20', quote: 'पूरे परिवार के लिए गृहप्रवेश क्रेट मँगवाए। पूजा में सब पूछ रहे थे कि कहाँ से लिए।' },
    },
  },
  {
    name: 'Divya P.',
    rating: 4,
    i18n: {
      en: { city: 'Hyderabad', product: 'Neem Mathani × 60', quote: 'Our restaurant uses these for buttermilk every day. Light, well finished and easy to wash.' },
      kn: { city: 'ಹೈದರಾಬಾದ್', product: 'ಬೇವಿನ ಕಡೆಗೋಲು × 60', quote: 'ನಮ್ಮ ರೆಸ್ಟೋರೆಂಟ್‌ನಲ್ಲಿ ಪ್ರತಿದಿನ ಮಜ್ಜಿಗೆಗೆ ಬಳಸುತ್ತೇವೆ. ಹಗುರ, ಚೆನ್ನಾಗಿ ಮುಗಿಸಿದ್ದು, ತೊಳೆಯಲು ಸುಲಭ.' },
      hi: { city: 'हैदराबाद', product: 'नीम मथानी × 60', quote: 'हमारे रेस्टोरेंट में रोज़ छाछ के लिए इस्तेमाल होती हैं। हल्की, अच्छी बनी और धोने में आसान।' },
    },
  },
  {
    name: 'Rafiq M.',
    rating: 5,
    i18n: {
      en: { city: 'Chennai', product: 'Spoon & Spatula Gift Set × 120', quote: 'Ordered spoon and spatula sets as return gifts for a wedding. Every set was tied and tagged, and delivered two days early.' },
      kn: { city: 'ಚೆನ್ನೈ', product: 'ಚಮಚ ಮತ್ತು ಸೌಟು ಉಡುಗೊರೆ ಸೆಟ್ × 120', quote: 'ಮದುವೆಗೆ ತಾಂಬೂಲ ಉಡುಗೊರೆಯಾಗಿ ಆರ್ಡರ್ ಮಾಡಿದೆವು. ಪ್ರತಿ ಸೆಟ್ ಕಟ್ಟಿ ಟ್ಯಾಗ್ ಮಾಡಲಾಗಿತ್ತು, ಎರಡು ದಿನ ಮುಂಚೆಯೇ ತಲುಪಿತು.' },
      hi: { city: 'चेन्नई', product: 'चम्मच और पलटा गिफ़्ट सेट × 120', quote: 'शादी के रिटर्न गिफ़्ट के लिए मँगवाए। हर सेट बँधा और टैग लगा था, और दो दिन पहले पहुँच गया।' },
    },
  },
];
