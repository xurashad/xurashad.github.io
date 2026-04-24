import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    /* ── Validate ── */
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    /* ── Transporter — Gmail SMTP ── */
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      // Force IPv4 – avoids ECONNREFUSED on IPv6 addresses
      dnsOptions: { family: 4 },
      tls: {
        // Allow self-signed certs injected by local proxies / antivirus
        rejectUnauthorized: false,
      },
    } as any);

    /* ── Send ── */
    await transporter.sendMail({
      from: `"${name}" <${process.env.GMAIL_USER}>`,
      replyTo: email,
      to: "xurashad@gmail.com",
      subject: `[Contact Form] ${subject}`,
      text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <div style="background: linear-gradient(135deg, #0a0e1a, #111827); border-radius: 16px; padding: 32px; color: #e2e8f0; border: 1px solid rgba(255,255,255,0.1);">
            <h2 style="margin: 0 0 24px; color: #00c3f5; font-size: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px;">
              📬 New Contact Form Message
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 12px; color: #94a3b8; font-size: 13px; width: 80px; vertical-align: top;">From</td>
                <td style="padding: 8px 12px; font-size: 14px; font-weight: 600;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; color: #94a3b8; font-size: 13px; vertical-align: top;">Email</td>
                <td style="padding: 8px 12px; font-size: 14px;"><a href="mailto:${email}" style="color: #00c3f5; text-decoration: none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 8px 12px; color: #94a3b8; font-size: 13px; vertical-align: top;">Subject</td>
                <td style="padding: 8px 12px; font-size: 14px;">${subject}</td>
              </tr>
            </table>
            <div style="margin-top: 20px; padding: 20px; background: rgba(0,0,0,0.3); border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);">
              <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 10px;">Message</div>
              <div style="font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
            </div>
            <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 11px; color: #475569; text-align: center;">
              Sent via Rashad Hamidi contact form
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}
