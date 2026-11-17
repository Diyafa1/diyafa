import type { Locale } from "@/lib/i18n";

type Page = { title: string; sections: { h: string; p: string }[] };
type Pages = Record<"terms" | "privacy" | "help", Record<Locale, Page>>;

// NOTE: draft texts — to be reviewed by a lawyer in Saudi Arabia before launch.
export const PAGES: Pages = {
  terms: {
    fr: {
      title: "Conditions d'utilisation",
      sections: [
        { h: "1. Le service", p: "Diyafa est une plateforme qui met en relation des voyageurs et des hôtes proposant des logements à Makkah et Madinah. Diyafa n'est pas propriétaire des logements." },
        { h: "2. Comptes", p: "Vous devez fournir des informations exactes. Chaque compte est personnel. Diyafa peut suspendre un compte en cas d'abus, de fraude ou de non-respect de ces conditions." },
        { h: "3. Hôtes", p: "Les hôtes doivent détenir une licence valide du ministère du Tourisme pour chaque logement et fournir une pièce d'identité. Ils sont responsables de l'exactitude de leurs annonces, de leurs prix et du respect de la réglementation saoudienne." },
        { h: "4. Réservations et paiements", p: "Le prix affiché comprend le prix du logement, les frais de service Diyafa et la TVA. Diyafa encaisse le paiement et reverse à l'hôte sa part, après déduction de la commission Diyafa." },
        { h: "5. Annulations", p: "Les remboursements suivent la politique d'annulation choisie par l'hôte et affichée sur l'annonce (flexible, modérée ou stricte). Si l'hôte annule ou refuse, le voyageur est remboursé intégralement." },
        { h: "6. Avis et messages", p: "Les avis doivent être honnêtes et respectueux. Diyafa peut masquer un avis ou un message contraire à la loi ou à ces conditions." },
        { h: "7. Litiges", p: "En cas de problème, utilisez « Signaler un problème » dans votre réservation. Diyafa examinera la situation et pourra décider d'un remboursement total ou partiel. Ces conditions sont régies par le droit du Royaume d'Arabie saoudite." },
      ],
    },
    en: {
      title: "Terms of use",
      sections: [
        { h: "1. The service", p: "Diyafa is a platform connecting travellers with hosts offering accommodation in Makkah and Madinah. Diyafa does not own the properties." },
        { h: "2. Accounts", p: "You must provide accurate information. Each account is personal. Diyafa may suspend an account in case of abuse, fraud or breach of these terms." },
        { h: "3. Hosts", p: "Hosts must hold a valid Ministry of Tourism licence for each property and provide an ID. They are responsible for the accuracy of their listings and prices and for complying with Saudi regulations." },
        { h: "4. Bookings and payments", p: "The displayed price includes the accommodation price, the Diyafa service fee and VAT. Diyafa collects the payment and pays the host their share, minus the Diyafa commission." },
        { h: "5. Cancellations", p: "Refunds follow the cancellation policy chosen by the host and shown on the listing (flexible, moderate or strict). If the host cancels or declines, the traveller is refunded in full." },
        { h: "6. Reviews and messages", p: "Reviews must be honest and respectful. Diyafa may hide any review or message that breaks the law or these terms." },
        { h: "7. Disputes", p: "If something goes wrong, use 'Report a problem' in your booking. Diyafa will review the case and may decide on a full or partial refund. These terms are governed by the laws of the Kingdom of Saudi Arabia." },
      ],
    },
    ar: {
      title: "شروط الاستخدام",
      sections: [
        { h: "1. الخدمة", p: "ضيافة منصة تربط المسافرين بمضيفين يعرضون أماكن إقامة في مكة المكرمة والمدينة المنورة. ضيافة ليست مالكة للعقارات." },
        { h: "2. الحسابات", p: "يجب تقديم معلومات صحيحة. كل حساب شخصي. يحق لضيافة إيقاف أي حساب في حال إساءة الاستخدام أو الاحتيال أو مخالفة هذه الشروط." },
        { h: "3. المضيفون", p: "يجب أن يحمل المضيف ترخيصًا ساريًا من وزارة السياحة لكل عقار وأن يقدّم هويته. المضيف مسؤول عن صحة إعلاناته وأسعاره والالتزام بالأنظمة السعودية." },
        { h: "4. الحجوزات والمدفوعات", p: "يشمل السعر المعروض سعر السكن ورسوم خدمة ضيافة وضريبة القيمة المضافة. تحصّل ضيافة المبلغ وتحوّل للمضيف حصته بعد خصم عمولة ضيافة." },
        { h: "5. الإلغاء", p: "يتم الاسترداد حسب سياسة الإلغاء التي يختارها المضيف والمعروضة في الإعلان (مرنة أو متوسطة أو صارمة). إذا ألغى المضيف أو رفض الحجز يُعاد المبلغ كاملًا للمسافر." },
        { h: "6. التقييمات والرسائل", p: "يجب أن تكون التقييمات صادقة ومحترمة. يحق لضيافة إخفاء أي تقييم أو رسالة مخالفة للنظام أو لهذه الشروط." },
        { h: "7. النزاعات", p: "عند حدوث مشكلة استخدم «الإبلاغ عن مشكلة» في حجزك. ستراجع ضيافة الحالة وقد تقرر استردادًا كاملًا أو جزئيًا. تخضع هذه الشروط لأنظمة المملكة العربية السعودية." },
      ],
    },
  },
  privacy: {
    fr: {
      title: "Politique de confidentialité",
      sections: [
        { h: "Données collectées", p: "Nom, e-mail, téléphone, sexe (pour les lits en chambres séparées), réservations, messages. Pour les hôtes : licence, pièce d'identité et IBAN." },
        { h: "Utilisation", p: "Ces données servent uniquement à faire fonctionner le service : réservations, paiements, versements, sécurité et support. Elles ne sont jamais vendues." },
        { h: "Documents d'identité", p: "Les licences et pièces d'identité sont stockées de façon privée et ne sont visibles que par l'hôte concerné et l'équipe Diyafa." },
        { h: "Paiements", p: "Les données de carte sont traitées directement par notre prestataire de paiement agréé ; Diyafa ne les voit ni ne les stocke." },
        { h: "Vos droits", p: "Conformément à la loi saoudienne sur la protection des données personnelles (PDPL), vous pouvez demander l'accès, la correction ou la suppression de vos données via la page Contact." },
      ],
    },
    en: {
      title: "Privacy policy",
      sections: [
        { h: "Data we collect", p: "Name, e-mail, phone, gender (for beds in separate rooms), bookings, messages. For hosts: licence, ID document and IBAN." },
        { h: "How we use it", p: "Only to run the service: bookings, payments, payouts, security and support. We never sell your data." },
        { h: "Identity documents", p: "Licences and IDs are stored privately and are only visible to the host concerned and the Diyafa team." },
        { h: "Payments", p: "Card data is processed directly by our licensed payment provider; Diyafa never sees or stores it." },
        { h: "Your rights", p: "Under the Saudi Personal Data Protection Law (PDPL), you may request access to, correction or deletion of your data through the Contact page." },
      ],
    },
    ar: {
      title: "سياسة الخصوصية",
      sections: [
        { h: "البيانات التي نجمعها", p: "الاسم والبريد الإلكتروني والجوال والجنس (لحجز الأسرّة في الغرف المنفصلة) والحجوزات والرسائل. وللمضيفين: الترخيص والهوية ورقم الآيبان." },
        { h: "استخدام البيانات", p: "تُستخدم فقط لتشغيل الخدمة: الحجوزات والمدفوعات والتحويلات والأمان والدعم. لا نبيع بياناتك أبدًا." },
        { h: "مستندات الهوية", p: "تُحفظ التراخيص والهويات بشكل خاص ولا يطّلع عليها إلا المضيف المعني وفريق ضيافة." },
        { h: "المدفوعات", p: "تعالج بيانات البطاقة مباشرةً لدى مزوّد الدفع المرخّص، ولا تطّلع عليها ضيافة ولا تحفظها." },
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
        { h: "Que comprend le prix ?", p: "Le prix du logement, les frais de service Diyafa et la TVA de 15 %. Tout est affiché avant le paiement." },
        { h: "Comment annuler ?", p: "Dans « Mes réservations », ouvrez la réservation et cliquez sur « Annuler ». Le montant remboursé selon la politique de l'hôte s'affiche avant confirmation." },
        { h: "Comment devenir hôte ?", p: "Créez un compte, choisissez « Accueillir des voyageurs », envoyez votre licence du ministère du Tourisme et votre pièce d'identité. Après validation, vos annonces sont vérifiées puis publiées." },
        { h: "Quand l'hôte est-il payé ?", p: "Diyafa verse à l'hôte sa part (prix moins commission) après le début du séjour, sur l'IBAN indiqué." },
      ],
    },
    en: {
      title: "Help / FAQ",
      sections: [
        { h: "How do I book?", p: "Choose the city, your dates and the number of guests, open a listing, check the price breakdown and tap 'Reserve'. You are taken to the payment page." },
        { h: "Instant booking or on request?", p: "With instant booking, it is confirmed as soon as you pay. On request, the host must accept; if they decline you are refunded in full." },
        { h: "How do beds in shared apartments work?", p: "Each room is reserved for men or for women. Add your gender in 'My account', then pick a free bed in a matching room." },
        { h: "What does the price include?", p: "The accommodation price, the Diyafa service fee and 15% VAT. Everything is shown before you pay." },
        { h: "How do I cancel?", p: "In 'My bookings', open the booking and tap 'Cancel'. The amount refunded under the host's policy is shown before you confirm." },
        { h: "How do I become a host?", p: "Create an account, choose 'Host guests', send your Ministry of Tourism licence and your ID. Once approved, your listings are reviewed and published." },
        { h: "When is the host paid?", p: "Diyafa pays the host their share (price minus commission) after check-in, to the IBAN provided." },
      ],
    },
    ar: {
      title: "المساعدة / الأسئلة الشائعة",
      sections: [
        { h: "كيف أحجز؟", p: "اختر المدينة والتواريخ وعدد الضيوف، افتح الإعلان، راجع تفاصيل السعر ثم اضغط «احجز». ستنتقل إلى صفحة الدفع." },
        { h: "حجز فوري أم بعد موافقة المضيف؟", p: "في الحجز الفوري يتأكد الحجز فور الدفع. وفي الحجز بعد الموافقة يجب أن يقبل المضيف، وإن رفض يُعاد إليك المبلغ كاملًا." },
        { h: "كيف تعمل الأسرّة في الشقق المشتركة؟", p: "كل غرفة مخصصة للرجال أو للنساء. أضف جنسك في «حسابي» ثم اختر سريرًا متاحًا في غرفة مناسبة." },
        { h: "ماذا يشمل السعر؟", p: "سعر السكن ورسوم خدمة ضيافة وضريبة القيمة المضافة 15٪. يظهر كل شيء قبل الدفع." },
        { h: "كيف ألغي الحجز؟", p: "من «حجوزاتي» افتح الحجز واضغط «إلغاء». يظهر المبلغ المسترد حسب سياسة المضيف قبل التأكيد." },
        { h: "كيف أصبح مضيفًا؟", p: "أنشئ حسابًا واختر «أستضيف الضيوف»، ثم أرسل ترخيص وزارة السياحة وهويتك. بعد الاعتماد تتم مراجعة إعلاناتك ونشرها." },
        { h: "متى يستلم المضيف مستحقاته؟", p: "تحوّل ضيافة للمضيف حصته (السعر ناقص العمولة) بعد بدء الإقامة إلى رقم الآيبان المسجّل." },
      ],
    },
  },
};
