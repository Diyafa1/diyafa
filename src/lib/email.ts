import "server-only";
import { db } from "./db";

/** Sends an e-mail. In development it is printed in the terminal and saved in EmailLog. */
export async function sendEmail(to: string, subject: string, body: string) {
  let status = "logged";
  try {
    if (process.env.EMAIL_PROVIDER === "resend" && !process.env.RESEND_API_KEY) console.error("[email] EMAIL_PROVIDER=resend but RESEND_API_KEY is missing");
    if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, text: body }),
      });
      if (res.ok) status = "sent";
      else {
        const detail = (await res.text().catch(() => "")).slice(0, 300);
        status = `error ${res.status}: ${detail}`;
        console.error(`[email] Resend refused (${res.status}) to=${to}: ${detail}`);
      }
    } else if (process.env.EMAIL_PROVIDER !== "none") {
      console.log(`\n📧 E-mail → ${to}\n   ${subject}\n   ${body.replace(/\n/g, "\n   ")}\n`);
    }
  } catch (e) {
    status = "error";
    console.error("email error", e);
  }
  await db.emailLog.create({ data: { to, subject, body, status } }).catch(() => {});
}
