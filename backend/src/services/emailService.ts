import nodemailer from "nodemailer";

function createTransporter() {
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST  ?? "smtp.gmail.com",
    port:   Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = process.env.SMTP_FROM ?? "Kadaba Construction Ltd <noreply@kadabaconstruction.com>";

export async function sendAllocationEmail(
  recipientEmail: string,
  recipientName: string,
  pdfPath: string,
  ref: string
): Promise<void> {
  const transporter = createTransporter();
  const filename = `AllocationLetter_${ref.replace(/\//g, "_")}.pdf`;

  await transporter.sendMail({
    from: FROM,
    to: recipientEmail,
    subject: `Your Property Allocation Letter — ${ref}`,
    text: `Dear ${recipientName},\n\nPlease find attached your Allocation Letter (Ref: ${ref}) from Kadaba Construction Ltd.\n\nKind regards,\nKadaba Construction Ltd`,
    html: `<p>Dear <strong>${recipientName}</strong>,</p><p>Please find attached your <strong>Allocation Letter</strong> (Ref: <strong>${ref}</strong>).</p><p>Kind regards,<br><strong>Kadaba Construction Ltd</strong></p>`,
    attachments: [{ filename, path: pdfPath }],
  });
}

export async function sendReceiptEmail(
  recipientEmail: string,
  recipientName: string,
  pdfPath: string,
  receiptNo: string
): Promise<void> {
  const transporter = createTransporter();
  const filename = `Receipt_${receiptNo}.pdf`;

  await transporter.sendMail({
    from: FROM,
    to: recipientEmail,
    subject: `Payment Receipt No. ${receiptNo} — Kadaba Construction Ltd`,
    text: `Dear ${recipientName},\n\nPlease find your Payment Receipt (No. ${receiptNo}) attached.\n\nThank you.\nKadaba Construction Ltd`,
    html: `<p>Dear <strong>${recipientName}</strong>,</p><p>Please find attached your <strong>Payment Receipt</strong> (No. <strong>${receiptNo}</strong>).</p><p>Thank you for your payment.<br><strong>Kadaba Construction Ltd</strong></p>`,
    attachments: [{ filename, path: pdfPath }],
  });
}
