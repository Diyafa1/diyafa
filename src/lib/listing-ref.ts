/** Short, stable reference shown to travellers and in WhatsApp messages (e.g. "DY-7K3F9Q"). */
export const listingRef = (id: string) => "DY-" + id.slice(-6).toUpperCase();

/** Diyafa's WhatsApp for long-term rentals (visits are arranged by Diyafa). Can be changed with LONG_TERM_WHATSAPP. */
export const longTermWhatsApp = () => (process.env.LONG_TERM_WHATSAPP || "+32465994502").replace(/[^\d]/g, "");

export function longTermMessage(o: { ref: string; title: string; url: string; twoPayments?: boolean }) {
  return [
    "السلام عليكم ورحمة الله وبركاته",
    "Salam aleykoum wa rahmatoullah wa barakatouh,",
    "",
    "أنا مهتم بهذا العقار وأرغب في زيارته.",
    "Je suis intéressé(e) par ce bien et j'aimerais le visiter.",
    ...(o.twoPayments ? ["", "(Paiement en 2 fois possible / الدفع على دفعتين ممكن)"] : []),
    "",
    `Réf. / المرجع : ${o.ref}`,
    o.title,
    o.url,
  ].join("\n");
}
