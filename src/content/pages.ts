import type { Locale } from "@/lib/i18n";

type Page = { title: string; sections: { h: string; p: string }[] };
type Pages = Record<"terms" | "privacy" | "help", Record<Locale, Page>>;

// NOTE: draft texts — to be reviewed by a lawyer in Saudi Arabia before launch.
export const PAGES: Pages = {
  terms: {
    fr: {
      title: "Conditions d'utilisation",
      sections: [
        { h: "1. Le service", p: "Dar Diyafa est une plateforme qui met en relation des voyageurs et des hôtes proposant des logements à Makkah et Madinah. Dar Diyafa n'est pas propriétaire des logements." },
        { h: "2. Comptes", p: "Vous devez fournir des informations exactes. Chaque compte est personnel. Dar Diyafa peut suspendre un compte en cas d'abus, de fraude ou de non-respect de ces conditions." },
        { h: "3. Hôtes", p: "Les hôtes fournissent une pièce d'identité et sont vérifiés par Dar Diyafa. Ils sont responsables de l'exactitude de leurs annonces et de leurs prix, et du respect de la réglementation saoudienne applicable à leur logement (y compris toute autorisation éventuellement requise)." },
        { h: "4. Réservations et paiements", p: "Lors de la réservation, le voyageur paie en ligne uniquement la part de Dar Diyafa (frais de service et commission). Le reste du prix est payé directement à l'hôte à l'arrivée. Les montants à payer en ligne et sur place sont affichés avant la réservation." },
        { h: "5. Annulations", p: "Les remboursements de la part payée en ligne suivent la politique d'annulation choisie par l'hôte (flexible, modérée ou stricte). Si l'hôte annule ou refuse, cette part est remboursée intégralement. En cas d'annulation, rien n'est dû à l'hôte sur place." },
        { h: "6. Avis et messages", p: "Les avis doivent être honnêtes et respectueux. Dar Diyafa peut masquer un avis ou un message contraire à la loi ou à ces conditions." },
        { h: "7. Litiges", p: "En cas de problème, utilisez « Signaler un problème » dans votre réservation. Dar Diyafa examinera la situation et pourra décider d'un remboursement total ou partiel. Ces conditions sont régies par le droit du Royaume d'Arabie saoudite." },
      ],
    },
    en: {
      title: "Terms of use",
      sections: [
        { h: "1. The service", p: "Dar Diyafa is a platform connecting travellers with hosts offering accommodation in Makkah and Madinah. Dar Diyafa does not own the properties." },
        { h: "2. Accounts", p: "You must provide accurate information. Each account is personal. Dar Diyafa may suspend an account in case of abuse, fraud or breach of these terms." },
        { h: "3. Hosts", p: "Hosts provide an ID and are verified by Dar Diyafa. They are responsible for the accuracy of their listings and prices, and for complying with the Saudi regulations that apply to their property (including any permit that may be required)." },
        { h: "4. Bookings and payments", p: "When booking, the traveller pays online only Dar Diyafa's share (service fee and commission). The rest of the price is paid directly to the host on arrival. The amounts to pay online and on site are shown before booking." },
        { h: "5. Cancellations", p: "Refunds of the online part follow the cancellation policy chosen by the host (flexible, moderate or strict). If the host cancels or declines, that part is refunded in full. If a booking is cancelled, nothing is owed to the host on site." },
        { h: "6. Reviews and messages", p: "Reviews must be honest and respectful. Dar Diyafa may hide any review or message that breaks the law or these terms." },
        { h: "7. Disputes", p: "If something goes wrong, use 'Report a problem' in your booking. Dar Diyafa will review the case and may decide on a full or partial refund. These terms are governed by the laws of the Kingdom of Saudi Arabia." },
      ],
    },
    ar: {
      title: "شروط الاستخدام",
      sections: [
        { h: "1. الخدمة", p: "دار ضيافة منصة تربط المسافرين بمضيفين يعرضون أماكن إقامة في مكة المكرمة والمدينة المنورة. دار ضيافة ليست مالكة للعقارات." },
        { h: "2. الحسابات", p: "يجب تقديم معلومات صحيحة. كل حساب شخصي. يحق لدار ضيافة إيقاف أي حساب في حال إساءة الاستخدام أو الاحتيال أو مخالفة هذه الشروط." },
        { h: "3. المضيفون", p: "يقدّم المضيف هويته ويتم التحقق منه من قبل دار ضيافة. المضيف مسؤول عن صحة إعلاناته وأسعاره والالتزام بالأنظمة السعودية المطبقة على عقاره (بما في ذلك أي تصريح قد يكون مطلوبًا)." },
        { h: "4. الحجوزات والمدفوعات", p: "عند الحجز يدفع المسافر عبر الإنترنت حصة دار ضيافة فقط (رسوم الخدمة والعمولة)، ويدفع باقي السعر مباشرة للمضيف عند الوصول. يظهر المبلغان قبل الحجز." },
        { h: "5. الإلغاء", p: "يُسترد الجزء المدفوع عبر الإنترنت حسب سياسة الإلغاء التي يختارها المضيف (مرنة أو متوسطة أو صارمة). إذا ألغى المضيف أو رفض الحجز يُعاد هذا الجزء كاملًا. وعند الإلغاء لا يُستحق للمضيف أي مبلغ عند الوصول." },
        { h: "6. التقييمات والرسائل", p: "يجب أن تكون التقييمات صادقة ومحترمة. يحق لدار ضيافة إخفاء أي تقييم أو رسالة مخالفة للنظام أو لهذه الشروط." },
        { h: "7. النزاعات", p: "عند حدوث مشكلة استخدم «الإبلاغ عن مشكلة» في حجزك. ستراجع دار ضيافة الحالة وقد تقرر استردادًا كاملًا أو جزئيًا. تخضع هذه الشروط لأنظمة المملكة العربية السعودية." },
      ],
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      sections: [
        { h: "Données collectées", p: "Nom, e-mail, téléphone, sexe (pour les lits en chambres séparées), réservations, messages. Pour les hôtes : pièce d'identité." },
        { h: "Utilisation", p: "Ces données servent uniquement à faire fonctionner le service : réservations, paiements, sécurité et support. Elles ne sont jamais vendues." },
        { h: "Documents d'identité", p: "Les pièces d'identité sont stockées de façon privée et ne sont visibles que par l'hôte concerné et l'équipe Dar Diyafa." },
        { h: "Paiements", p: "Les données de carte sont traitées directement par notre prestataire de paiement agréé ; Dar Diyafa ne les voit ni ne les stocke." },
        { h: "Vos droits", p: "Conformément à la loi saoudienne sur la protection des données personnelles (PDPL), vous pouvez demander l'accès, la correction ou la suppression de vos données via la page Contact." },
      ],
    },
    en: {
      title: "Privacy policy",
      sections: [
        { h: "Data we collect", p: "Name, e-mail, phone, gender (for beds in separate rooms), bookings, messages. For hosts: ID document." },
        { h: "How we use it", p: "Only to run the service: bookings, payments, security and support. We never sell your data." },
        { h: "Identity documents", p: "IDs are stored privately and are only visible to the host concerned and the Dar Diyafa team." },
        { h: "Payments", p: "Card data is processed directly by our licensed payment provider; Dar Diyafa never sees or stores it." },
        { h: "Your rights", p: "Under the Saudi Personal Data Protection Law (PDPL), you may request access to, correction or deletion of your data through the Contact page." },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      sections: [
        { h: "البيانات التي نجمعها", p: "الاسم والبريد الإلكتروني والجوال والجنس (لحجز الأسرّة في الغرف المنفصلة) والحجوزات والرسائل. وللمضيفين: الهوية." },
        { h: "استخدام البيانات", p: "تُستخدم فقط لتشغيل الخدمة: الحجوزات والمدفوعات والأمان والدعم. لا نبيع بياناتك أبدًا." },
        { h: "مستندات الهوية", p: "تُحفظ الهويات بشكل خاص ولا يطّلع عليها إلا المضيف المعني وفريق دار ضيافة." },
        { h: "المدفوعات", p: "تعالج بيانات البطاقة مباشرةً لدى مزوّد الدفع المرخّص، ولا تطّلع عليها دار ضيافة ولا تحفظها." },
        { h: "حقوقك", p: "وفقًا لنظام حماية البيانات الشخصية في المملكة، يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذفها عبر صفحة تواصل معنا." },
      ],
    },
  },
  help: {
    fr: {
      title: "Aide / FAQ",
      sections: [
        { h: "Comment réserver ?", p: "Choisissez la ville, vos dates et le nombre de personnes, ouvrez une annonce, vérifiez le détail du prix puis cliquez sur « Réserver ». Vous êtes redirigé vers la page de paiement." },
        { h: "Réservation instantanée ou sur demande ?", p: "Avec la réservation instantanée, c'est confirmé dès le paiement. Sur demande, l'hôte doit accepter ; s'il refuse, vous êtes remboursé intégralement." },
        { h: "Comment fonctionnent les lits en appartement partagé ?", p: "Chaque chambre est réservée aux hommes ou aux femmes. Indiquez votre sexe dans « Mon compte », puis choisissez un lit libre dans une chambre correspondante." },
        { h: "Que comprend le prix ?", p: "Vous payez en ligne uniquement l'acompte (la part Dar Diyafa). Le reste est payé directement à l'hôte à votre arrivée. Les deux montants sont affichés avant la réservation." },
        { h: "Comment annuler ?", p: "Dans « Mes réservations », ouvrez la réservation et cliquez sur « Annuler ». Le montant remboursé selon la politique de l'hôte s'affiche avant confirmation." },
        { h: "Comment devenir hôte ?", p: "Créez un compte, choisissez « Accueillir des voyageurs », envoyez votre pièce d'identité. Après validation, vos annonces sont vérifiées puis publiées." },
        { h: "Comment l'hôte est-il payé ?", p: "Le voyageur paie l'hôte directement à son arrivée : le prix du séjour moins la commission Dar Diyafa, déjà réglée en ligne. Le montant exact est indiqué dans chaque réservation." },
      ],
    },
    en: {
      title: "Help / FAQ",
      sections: [
        { h: "How do I book?", p: "Choose the city, your dates and the number of guests, open a listing, check the price breakdown and tap 'Reserve'. You are taken to the payment page." },
        { h: "Instant booking or on request?", p: "With instant booking, it is confirmed as soon as you pay. On request, the host must accept; if they decline you are refunded in full." },
        { h: "How do beds in shared apartments work?", p: "Each room is reserved for men or for women. Add your gender in 'My account', then pick a free bed in a matching room." },
        { h: "What does the price include?", p: "You pay online only the deposit (Dar Diyafa's share). The rest is paid directly to the host when you arrive. Both amounts are shown before you book." },
        { h: "How do I cancel?", p: "In 'My bookings', open the booking and tap 'Cancel'. The amount refunded under the host's policy is shown before you confirm." },
        { h: "How do I become a host?", p: "Create an account, choose 'Host guests', send your ID. Once approved, your listings are reviewed and published." },
        { h: "How is the host paid?", p: "The traveller pays the host directly on arrival: the price of the stay minus Dar Diyafa's commission, already paid online. The exact amount is shown in each booking." },
      ],
    },
    ar: {
      title: "المساعدة / الأسئلة الشائعة",
      sections: [
        { h: "كيف أحجز؟", p: "اختر المدينة والتواريخ وعدد الضيوف، افتح الإعلان، راجع تفاصيل السعر ثم اضغط «احجز». ستنتقل إلى صفحة الدفع." },
        { h: "حجز فوري أم بعد موافقة المضيف؟", p: "في الحجز الفوري يتأكد الحجز فور الدفع. وفي الحجز بعد الموافقة يجب أن يقبل المضيف، وإن رفض يُعاد إليك المبلغ كاملًا." },
        { h: "كيف تعمل الأسرّة في الشقق المشتركة؟", p: "كل غرفة مخصصة للرجال أو للنساء. أضف جنسك في «حسابي» ثم اختر سريرًا متاحًا في غرفة مناسبة." },
        { h: "ماذا يشمل السعر؟", p: "تدفع عبر الإنترنت العربون فقط (حصة دار ضيافة)، والباقي تدفعه مباشرة للمضيف عند وصولك. يظهر المبلغان قبل الحجز." },
        { h: "كيف ألغي الحجز؟", p: "من «حجوزاتي» افتح الحجز واضغط «إلغاء». يظهر المبلغ المسترد حسب سياسة المضيف قبل التأكيد." },
        { h: "كيف أصبح مضيفًا؟", p: "أنشئ حسابًا واختر «أستضيف الضيوف»، ثم أرسل هويتك. بعد الاعتماد تتم مراجعة إعلاناتك ونشرها." },
        { h: "كيف يستلم المضيف مستحقاته؟", p: "يدفع المسافر للمضيف مباشرة عند وصوله: سعر الإقامة ناقص عمولة دار ضيافة المدفوعة مسبقًا عبر الإنترنت. يظهر المبلغ الدقيق في كل حجز." },
      ],
    },
  },
};
