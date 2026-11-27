import type { Locale } from "@/lib/i18n";

type Page = { title: string; description: string };

/** Search-engine texts for the main pages (what Google shows in its results). */
export const SEO: Record<"home" | "search" | "help" | "contact" | "terms" | "privacy" | "register" | "login", Record<Locale, Page>> = {
  home: {
    fr: { title: "Al-Diyafa — Logement à Makkah et Médine près du Haram", description: "Appartements, chambres, lits pas chers et locations longue durée à Makkah (La Mecque) et Médine, près du Haram. Idéal pour la Omra et le Hajj. Réservation simple, hôtes vérifiés." },
    en: { title: "Al-Diyafa — Stays in Makkah & Madinah near the Haram", description: "Apartments, rooms, affordable beds and long-term rentals in Makkah and Madinah, close to the Haram. Ideal for Umrah and Hajj. Easy booking, verified hosts." },
    ar: { title: "الضيافة — سكن في مكة والمدينة قرب الحرم", description: "شقق وغرف وأسرّة بأسعار مناسبة وإيجار طويل الأمد في مكة المكرمة والمدينة المنورة قرب الحرم. مثالي للعمرة والحج. حجز سهل ومضيفون موثّقون." },
  },
  search: {
    fr: { title: "Rechercher un logement à Makkah ou Médine", description: "Comparez les logements près du Haram à Makkah et Médine : prix, distance à pied, appartements, lits pour hommes ou pour femmes." },
    en: { title: "Find a stay in Makkah or Madinah", description: "Compare stays near the Haram in Makkah and Madinah: prices, walking distance, apartments, beds for men or for women." },
    ar: { title: "ابحث عن سكن في مكة أو المدينة", description: "قارن أماكن الإقامة قرب الحرم في مكة والمدينة: الأسعار، المسافة سيرًا، الشقق، أسرّة للرجال أو للنساء." },
  },
  help: {
    fr: { title: "Aide et questions fréquentes", description: "Comment réserver, payer, annuler ou devenir hôte sur Al-Diyafa. Toutes les réponses à vos questions." },
    en: { title: "Help and FAQ", description: "How to book, pay, cancel or become a host on Al-Diyafa. All the answers to your questions." },
    ar: { title: "المساعدة والأسئلة الشائعة", description: "كيف تحجز أو تدفع أو تلغي أو تصبح مضيفًا على الضيافة. كل الإجابات على أسئلتك." },
  },
  contact: {
    fr: { title: "Nous contacter", description: "Une question sur un logement à Makkah ou Médine ? Contactez l'équipe Al-Diyafa." },
    en: { title: "Contact us", description: "A question about a stay in Makkah or Madinah? Contact the Al-Diyafa team." },
    ar: { title: "اتصل بنا", description: "لديك سؤال عن سكن في مكة أو المدينة؟ تواصل مع فريق الضيافة." },
  },
  terms: {
    fr: { title: "Conditions d'utilisation", description: "Les conditions d'utilisation de la plateforme Al-Diyafa." },
    en: { title: "Terms of use", description: "The terms of use of the Al-Diyafa platform." },
    ar: { title: "شروط الاستخدام", description: "شروط استخدام منصة الضيافة." },
  },
  privacy: {
    fr: { title: "Confidentialité", description: "Comment Al-Diyafa protège vos données personnelles." },
    en: { title: "Privacy", description: "How Al-Diyafa protects your personal data." },
    ar: { title: "الخصوصية", description: "كيف تحمي الضيافة بياناتك الشخصية." },
  },
  register: {
    fr: { title: "Créer un compte — voyageur ou hôte", description: "Inscrivez-vous gratuitement pour réserver un logement à Makkah ou Médine, ou pour louer votre appartement aux pèlerins." },
    en: { title: "Create an account — traveller or host", description: "Sign up for free to book a stay in Makkah or Madinah, or to rent out your apartment to pilgrims." },
    ar: { title: "إنشاء حساب — مسافر أو مضيف", description: "سجّل مجانًا لحجز سكن في مكة أو المدينة، أو لتأجير شقتك للحجاج والمعتمرين." },
  },
  login: {
    fr: { title: "Connexion", description: "Connectez-vous à votre compte Al-Diyafa." },
    en: { title: "Log in", description: "Log in to your Al-Diyafa account." },
    ar: { title: "تسجيل الدخول", description: "سجّل الدخول إلى حسابك في الضيافة." },
  },
};

type CityPage = Page & { h1: string; intro: string[]; faq: { q: string; a: string }[]; cta: string; all: string };

/** Landing pages /makkah and /madinah: real, useful text so Google understands what we offer in each city. */
export const CITY_PAGES: Record<"MAKKAH" | "MADINAH", Record<Locale, CityPage>> = {
  MAKKAH: {
    fr: {
      title: "Logement à Makkah (La Mecque) près du Haram — Omra et Hajj",
      description: "Appartements, chambres et lits pas chers à Makkah, à quelques minutes à pied de la Grande Mosquée. Distance au Haram indiquée, hôtes vérifiés, réservation simple.",
      h1: "Logement à Makkah près du Haram",
      intro: [
        "Vous préparez votre Omra ou votre Hajj ? Al-Diyafa vous aide à trouver un logement à Makkah (La Mecque), au plus près de Masjid al-Haram.",
        "Chaque annonce indique la distance jusqu'au Haram et le temps à pied ou en voiture. Vous choisissez entre un appartement entier pour la famille, une chambre, ou un lit dans un logement réservé aux hommes ou réservé aux femmes, pour voyager petit budget.",
        "Les hôtes sont vérifiés par notre équipe. Vous ne payez en ligne que les frais de réservation, le reste est réglé à l'hôte à votre arrivée.",
      ],
      faq: [
        { q: "Comment trouver un logement pas cher à Makkah ?", a: "Choisissez « Lit en appartement partagé » dans la recherche : vous partagez un appartement réservé aux hommes ou réservé aux femmes, à prix réduit, souvent proche du Haram." },
        { q: "À quelle distance du Haram sont les logements ?", a: "Chaque annonce affiche la distance jusqu'à Masjid al-Haram et le temps à pied ou en voiture indiqué par l'hôte." },
        { q: "Comment se passe le paiement ?", a: "Vous payez en ligne uniquement les frais de réservation. Le prix du séjour est payé directement à l'hôte à votre arrivée." },
        { q: "Puis-je louer un appartement à l'année à Makkah ?", a: "Oui, la catégorie « Location longue durée » propose des locations à l'année. Vous nous contactez sur WhatsApp et nous organisons la visite." },
      ],
      cta: "Voir les logements à Makkah",
      all: "Tous les logements à Makkah",
    },
    en: {
      title: "Stays in Makkah near the Haram — Umrah & Hajj accommodation",
      description: "Apartments, rooms and affordable beds in Makkah, a few minutes' walk from the Grand Mosque. Distance to the Haram shown, verified hosts, easy booking.",
      h1: "Stays in Makkah near the Haram",
      intro: [
        "Planning your Umrah or Hajj? Al-Diyafa helps you find a place to stay in Makkah, as close as possible to Masjid al-Haram.",
        "Every listing shows the distance to the Haram and the time on foot or by car. Choose a whole apartment for your family, a room, or a bed in a men-only or women-only home for a smaller budget.",
        "Hosts are verified by our team. You only pay the booking fee online; the rest is paid to the host when you arrive.",
      ],
      faq: [
        { q: "How can I find cheap accommodation in Makkah?", a: "Choose “Bed in shared apartment” in the search: you share a men-only or women-only apartment at a lower price, often close to the Haram." },
        { q: "How far are the stays from the Haram?", a: "Each listing shows the distance to Masjid al-Haram and the time on foot or by car given by the host." },
        { q: "How does payment work?", a: "You only pay the booking fee online. The price of the stay is paid directly to the host when you arrive." },
        { q: "Can I rent an apartment for a year in Makkah?", a: "Yes, the “Long-term rental” category offers yearly rentals. Contact us on WhatsApp and we arrange the visit." },
      ],
      cta: "See stays in Makkah",
      all: "All stays in Makkah",
    },
    ar: {
      title: "سكن في مكة المكرمة قرب الحرم — للعمرة والحج",
      description: "شقق وغرف وأسرّة بأسعار مناسبة في مكة المكرمة على بُعد دقائق سيرًا من المسجد الحرام. المسافة إلى الحرم واضحة، مضيفون موثّقون، وحجز سهل.",
      h1: "سكن في مكة المكرمة قرب الحرم",
      intro: [
        "تستعد للعمرة أو الحج؟ تساعدك الضيافة على إيجاد سكن في مكة المكرمة في أقرب مكان ممكن من المسجد الحرام.",
        "كل إعلان يوضح المسافة إلى الحرم والوقت سيرًا أو بالسيارة. اختر شقة كاملة للعائلة، أو غرفة، أو سريرًا في سكن مخصص للرجال أو مخصص للنساء بميزانية أقل.",
        "يتحقق فريقنا من المضيفين. تدفع عبر الإنترنت رسوم الحجز فقط، والباقي تدفعه للمضيف عند وصولك.",
      ],
      faq: [
        { q: "كيف أجد سكنًا رخيصًا في مكة؟", a: "اختر «سرير في شقة مشتركة» في البحث: تشارك شقة مخصصة للرجال أو للنساء بسعر أقل، وغالبًا قريبة من الحرم." },
        { q: "كم تبعد أماكن السكن عن الحرم؟", a: "يعرض كل إعلان المسافة إلى المسجد الحرام والوقت سيرًا أو بالسيارة كما حدده المضيف." },
        { q: "كيف يتم الدفع؟", a: "تدفع عبر الإنترنت رسوم الحجز فقط، وتدفع سعر الإقامة للمضيف مباشرة عند وصولك." },
        { q: "هل يمكنني استئجار شقة سنويًا في مكة؟", a: "نعم، فئة «إيجار طويل الأمد» تعرض إيجارات سنوية. تواصل معنا عبر واتساب وننظم لك المعاينة." },
      ],
      cta: "عرض أماكن السكن في مكة",
      all: "كل أماكن السكن في مكة",
    },
  },
  MADINAH: {
    fr: {
      title: "Logement à Médine près de la Mosquée du Prophète ﷺ",
      description: "Appartements, chambres et lits pas chers à Médine, près de Masjid an-Nabawi. Distance indiquée, hôtes vérifiés, idéal pour la visite pendant la Omra ou le Hajj.",
      h1: "Logement à Médine près du Haram",
      intro: [
        "Vous allez visiter Médine ? Al-Diyafa vous aide à trouver un logement près de Masjid an-Nabawi, la Mosquée du Prophète ﷺ.",
        "Chaque annonce indique la distance jusqu'au Haram et le temps à pied ou en voiture. Appartement pour la famille, chambre, ou lit dans un logement réservé aux hommes ou réservé aux femmes : il y en a pour tous les budgets.",
        "Les hôtes sont vérifiés par notre équipe. Vous ne payez en ligne que les frais de réservation, le reste est réglé à l'hôte à votre arrivée.",
      ],
      faq: [
        { q: "Comment trouver un logement pas cher à Médine ?", a: "Choisissez « Lit en appartement partagé » dans la recherche : vous partagez un appartement réservé aux hommes ou réservé aux femmes, à prix réduit." },
        { q: "Les logements sont-ils proches de la Mosquée du Prophète ﷺ ?", a: "Chaque annonce affiche la distance jusqu'à Masjid an-Nabawi et le temps à pied ou en voiture." },
        { q: "Comment se passe le paiement ?", a: "Vous payez en ligne uniquement les frais de réservation. Le prix du séjour est payé directement à l'hôte à votre arrivée." },
        { q: "Puis-je louer un appartement à l'année à Médine ?", a: "Oui, la catégorie « Location longue durée » propose des locations à l'année. Vous nous contactez sur WhatsApp et nous organisons la visite." },
      ],
      cta: "Voir les logements à Médine",
      all: "Tous les logements à Médine",
    },
    en: {
      title: "Stays in Madinah near the Prophet's Mosque ﷺ",
      description: "Apartments, rooms and affordable beds in Madinah, close to Masjid an-Nabawi. Distance shown, verified hosts, ideal for your visit during Umrah or Hajj.",
      h1: "Stays in Madinah near the Haram",
      intro: [
        "Visiting Madinah? Al-Diyafa helps you find a place to stay near Masjid an-Nabawi, the Prophet's Mosque ﷺ.",
        "Every listing shows the distance to the Haram and the time on foot or by car. A family apartment, a room, or a bed in a men-only or women-only home: there is something for every budget.",
        "Hosts are verified by our team. You only pay the booking fee online; the rest is paid to the host when you arrive.",
      ],
      faq: [
        { q: "How can I find cheap accommodation in Madinah?", a: "Choose “Bed in shared apartment” in the search: you share a men-only or women-only apartment at a lower price." },
        { q: "Are the stays close to the Prophet's Mosque ﷺ?", a: "Each listing shows the distance to Masjid an-Nabawi and the time on foot or by car." },
        { q: "How does payment work?", a: "You only pay the booking fee online. The price of the stay is paid directly to the host when you arrive." },
        { q: "Can I rent an apartment for a year in Madinah?", a: "Yes, the “Long-term rental” category offers yearly rentals. Contact us on WhatsApp and we arrange the visit." },
      ],
      cta: "See stays in Madinah",
      all: "All stays in Madinah",
    },
    ar: {
      title: "سكن في المدينة المنورة قرب المسجد النبوي ﷺ",
      description: "شقق وغرف وأسرّة بأسعار مناسبة في المدينة المنورة قرب المسجد النبوي. المسافة واضحة، مضيفون موثّقون، مثالي لزيارتك أثناء العمرة أو الحج.",
      h1: "سكن في المدينة المنورة قرب الحرم",
      intro: [
        "ستزور المدينة المنورة؟ تساعدك الضيافة على إيجاد سكن قرب المسجد النبوي الشريف ﷺ.",
        "كل إعلان يوضح المسافة إلى الحرم والوقت سيرًا أو بالسيارة. شقة للعائلة، أو غرفة، أو سرير في سكن مخصص للرجال أو مخصص للنساء: هناك ما يناسب كل ميزانية.",
        "يتحقق فريقنا من المضيفين. تدفع عبر الإنترنت رسوم الحجز فقط، والباقي تدفعه للمضيف عند وصولك.",
      ],
      faq: [
        { q: "كيف أجد سكنًا رخيصًا في المدينة؟", a: "اختر «سرير في شقة مشتركة» في البحث: تشارك شقة مخصصة للرجال أو للنساء بسعر أقل." },
        { q: "هل أماكن السكن قريبة من المسجد النبوي ﷺ؟", a: "يعرض كل إعلان المسافة إلى المسجد النبوي والوقت سيرًا أو بالسيارة." },
        { q: "كيف يتم الدفع؟", a: "تدفع عبر الإنترنت رسوم الحجز فقط، وتدفع سعر الإقامة للمضيف مباشرة عند وصولك." },
        { q: "هل يمكنني استئجار شقة سنويًا في المدينة؟", a: "نعم، فئة «إيجار طويل الأمد» تعرض إيجارات سنوية. تواصل معنا عبر واتساب وننظم لك المعاينة." },
      ],
      cta: "عرض أماكن السكن في المدينة",
      all: "كل أماكن السكن في المدينة",
    },
  },
};
