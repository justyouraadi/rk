import { transporter, defaultSender, verifySmtpConnection } from "../config/email.config.js";

/**
 * Base email layout wrapper with RK Printers branding
 */
function wrapHtmlTemplate({ title, content, previewText = "" }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title || "RK Printers"}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #18181b;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      max-width: 600px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #e4e4e7;
    }
    .header {
      background-color: #09090b;
      padding: 24px 30px;
      text-align: center;
      border-bottom: 3px solid #e11d48;
    }
    .logo-badge {
      display: inline-block;
      background-color: #e11d48;
      color: #ffffff;
      font-weight: 800;
      font-size: 16px;
      padding: 6px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
    }
    .brand-title {
      color: #ffffff;
      font-size: 20px;
      font-weight: 800;
      margin-top: 10px;
      margin-bottom: 2px;
      letter-spacing: 0.5px;
    }
    .brand-subtitle {
      color: #a1a1aa;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 2.5px;
      text-transform: uppercase;
      margin: 0;
    }
    .body-content {
      padding: 32px 30px;
    }
    .footer {
      background-color: #fafafa;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid #f4f4f5;
      font-size: 12px;
      color: #71717a;
      line-height: 1.6;
    }
    .footer a {
      color: #e11d48;
      text-decoration: none;
    }
    .otp-box {
      margin: 25px 0;
      padding: 20px;
      background-color: #fff1f2;
      border: 2px dashed #e11d48;
      border-radius: 8px;
      text-align: center;
    }
    .otp-code {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: 6px;
      color: #e11d48;
      font-family: monospace;
    }
    .btn {
      display: inline-block;
      background-color: #e11d48;
      color: #ffffff !important;
      padding: 12px 28px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      border-radius: 6px;
      margin: 20px 0;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .info-table td {
      padding: 10px 12px;
      border-bottom: 1px solid #f4f4f5;
      font-size: 14px;
    }
    .info-table td.label {
      color: #71717a;
      font-weight: 500;
      width: 35%;
    }
    .info-table td.val {
      color: #09090b;
      font-weight: 600;
    }
  </style>
</head>
<body>
  ${previewText ? `<span style="display:none;font-size:0;max-height:0;line-height:0;mso-hide:all;">${previewText}</span>` : ""}
  <div class="wrapper">
    <div class="header">
      <div class="logo-badge">RK</div>
      <h1 class="brand-title">RK PRINTERS</h1>
      <p class="brand-subtitle">PRINT | BRAND | CREATE</p>
    </div>
    <div class="body-content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;"><strong>RK PRINTERS</strong> — Your Complete Printing & Branding Partner</p>
      <p style="margin: 0 0 6px 0;">N.H. 8, Flyover, Near Bank of Baroda, Kotputli, Rajasthan – 303108</p>
      <p style="margin: 0;">Phone: 7426919797, 7877227753 | Email: <a href="mailto:rkprinters.kotputli@gmail.com">rkprinters.kotputli@gmail.com</a></p>
    </div>
  </div>
</body>
</html>`;
}

class EmailService {
  /**
   * Verify SMTP connection status
   */
  async verifyConnection() {
    return await verifySmtpConnection();
  }

  /**
   * Base sender method
   */
  async sendMail({ to, subject, html, text, from = defaultSender }) {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ""),
      });
      console.log(`[EmailService] Email sent successfully to: ${to} | MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(`[EmailService] Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Send 6-digit OTP Email (for verification, password reset, login)
   */
  async sendOtpEmail({ to, name = "Valued Customer", otp, purpose = "Verification" }) {
    const title = `${purpose} Code - RK Printers`;
    const previewText = `Your ${purpose} OTP code is ${otp}. Valid for 10 minutes.`;

    const content = `
      <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0;">Hello ${name},</h2>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        We received a request for <strong>${purpose}</strong> associated with your RK Printers account.
      </p>
      <div class="otp-box">
        <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #71717a; margin-bottom: 8px;">Your One-Time Password</div>
        <div class="otp-code">${otp}</div>
        <div style="font-size: 12px; color: #e11d48; margin-top: 8px;">⏱ Valid for the next 10 minutes</div>
      </div>
      <p style="font-size: 14px; color: #71717a; line-height: 1.6;">
        Please enter this code on the screen to complete your request. If you did not initiate this request, please ignore this email or contact support immediately.
      </p>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to,
      subject: `[RK Printers] ${otp} is your ${purpose} OTP`,
      html,
    });
  }

  /**
   * Send Password Reset Email with Token & Link
   */
  async sendPasswordResetEmail({ to, name = "Customer", resetToken, otp, resetLink }) {
    const title = "Password Reset Request - RK Printers";
    const previewText = "Reset your password for your RK Printers account.";

    let resetContent = "";
    if (otp) {
      resetContent += `
        <div class="otp-box">
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: #71717a; margin-bottom: 8px;">Password Reset OTP</div>
          <div class="otp-code">${otp}</div>
          <div style="font-size: 12px; color: #e11d48; margin-top: 8px;">⏱ Valid for 15 minutes</div>
        </div>
      `;
    }

    if (resetLink) {
      resetContent += `
        <div style="text-align: center; margin: 25px 0;">
          <a href="${resetLink}" class="btn">Reset My Password</a>
          <p style="font-size: 12px; color: #71717a; word-break: break-all;">Or copy and paste this link in your browser:<br/><a href="${resetLink}" style="color: #e11d48;">${resetLink}</a></p>
        </div>
      `;
    }

    const content = `
      <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0;">Hello ${name},</h2>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        You requested to reset your password for your <strong>RK Printers</strong> account.
      </p>
      ${resetContent}
      <p style="font-size: 13px; color: #a1a1aa; line-height: 1.5; margin-top: 20px;">
        If you did not make this request, you can safely ignore this email. Your current password will remain unchanged.
      </p>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to,
      subject: "Password Reset Request - RK Printers",
      html,
    });
  }

  /**
   * Send Welcome Email to newly registered customer
   */
  async sendWelcomeEmail({ to, name = "Customer" }) {
    const title = "Welcome to RK Printers!";
    const previewText = "Welcome to RK Printers — Your Complete Printing & Branding Partner.";

    const content = `
      <h2 style="font-size: 22px; font-weight: 700; color: #09090b; margin-top: 0;">Welcome, ${name}! 🎉</h2>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        Thank you for joining <strong>RK Printers</strong>! Your account is now active.
      </p>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        With your RK Printers account, you can:
      </p>
      <ul style="font-size: 14px; color: #52525b; line-height: 1.8;">
        <li>Request custom quotations for corporate, packaging & branding needs</li>
        <li>Track your print orders and shipments in real-time</li>
        <li>Manage digital proofs and design approvals</li>
        <li>Access exclusive business pricing and seasonal offers</li>
      </ul>
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://rkprinter.in/portal" class="btn">Go to Customer Portal</a>
      </div>
      <p style="font-size: 14px; color: #71717a;">
        Need assistance with your upcoming print project? Our experts are just a call away at <strong>7426919797</strong>.
      </p>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to,
      subject: "Welcome to RK Printers!",
      html,
    });
  }

  /**
   * Send Quotation Confirmation to Customer
   */
  async sendLeadConfirmationCustomer({ to, name = "Customer", leadId, serviceNeeded = "Custom Printing", quantity = "-" }) {
    const title = "Quotation Request Received - RK Printers";
    const previewText = `We received your quotation request (#${leadId || "NEW"}).`;

    const content = `
      <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0;">Thank you, ${name}!</h2>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        We have received your quotation inquiry. Our print estimation team is reviewing your specifications and will provide an itemized quote within 2–4 business hours.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Reference ID:</td>
          <td class="val">${leadId || "Pending"}</td>
        </tr>
        <tr>
          <td class="label">Requirement:</td>
          <td class="val">${serviceNeeded}</td>
        </tr>
        <tr>
          <td class="label">Quantity:</td>
          <td class="val">${quantity}</td>
        </tr>
        <tr>
          <td class="label">Status:</td>
          <td class="val" style="color: #2563eb;">Under Review</td>
        </tr>
      </table>
      <p style="font-size: 14px; color: #52525b; line-height: 1.6;">
        For urgent print requirements, feel free to contact our support desk directly at <strong>+91 7426919797</strong> or reply directly to this email.
      </p>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to,
      subject: `Quotation Request Received [${leadId || "RK Printers"}]`,
      html,
    });
  }

  /**
   * Send Instant Alert to RK Printers Admin/Team when a customer submits a lead/quote
   */
  async sendLeadAlertAdmin({ leadId, name, phone, email, businessName, requirements, totalEstimate }) {
    const adminEmail = process.env.SMTP_USER || "noreply@rkprinter.in";
    const title = "🔔 New Quote Inquiry Received";
    const previewText = `New inquiry from ${name} (${phone || email}) - ${requirements || "Custom Print"}`;

    const content = `
      <h2 style="font-size: 18px; font-weight: 700; color: #e11d48; margin-top: 0;">New Customer Lead / Quote Request</h2>
      <p style="font-size: 14px; color: #52525b;">A new quotation inquiry was just submitted on the RK Printers website:</p>
      <table class="info-table">
        <tr>
          <td class="label">Lead ID:</td>
          <td class="val">${leadId || "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Customer Name:</td>
          <td class="val">${name || "Unknown"}</td>
        </tr>
        <tr>
          <td class="label">Phone:</td>
          <td class="val"><a href="tel:${phone}" style="color: #e11d48;">${phone || "N/A"}</a></td>
        </tr>
        <tr>
          <td class="label">Email:</td>
          <td class="val">${email ? `<a href="mailto:${email}">${email}</a>` : "N/A"}</td>
        </tr>
        <tr>
          <td class="label">Business:</td>
          <td class="val">${businessName || "Individual / Not specified"}</td>
        </tr>
        <tr>
          <td class="label">Requirements:</td>
          <td class="val">${requirements || "Not specified"}</td>
        </tr>
        ${totalEstimate ? `<tr><td class="label">Estimated Budget:</td><td class="val">₹${totalEstimate}</td></tr>` : ""}
      </table>
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://admin.rkprinter.in/leads" class="btn">View in Admin Panel</a>
      </div>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to: adminEmail,
      subject: `[Lead Alert] New Quote Request from ${name} (${phone || email})`,
      html,
    });
  }

  /**
   * Send Order Status Update Email
   */
  async sendOrderStatusNotification({ to, name = "Customer", orderNumber, status, notes, totalAmount }) {
    const title = `Order Status: ${status} - RK Printers`;
    const previewText = `Your order #${orderNumber} is now ${status}.`;

    const content = `
      <h2 style="font-size: 20px; font-weight: 700; color: #09090b; margin-top: 0;">Order Status Update</h2>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        Hello ${name}, your order <strong>#${orderNumber}</strong> has been updated.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">Order Number:</td>
          <td class="val">#${orderNumber}</td>
        </tr>
        <tr>
          <td class="label">Current Status:</td>
          <td class="val" style="color: #e11d48; text-transform: uppercase;">${status}</td>
        </tr>
        ${totalAmount ? `<tr><td class="label">Total Amount:</td><td class="val">₹${totalAmount}</td></tr>` : ""}
        ${notes ? `<tr><td class="label">Notes:</td><td class="val">${notes}</td></tr>` : ""}
      </table>
      <div style="text-align: center; margin: 25px 0;">
        <a href="https://rkprinter.in/track-order?orderId=${orderNumber}" class="btn">Track Order Online</a>
      </div>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to,
      subject: `[RK Printers] Order #${orderNumber} Status: ${status}`,
      html,
    });
  }

  /**
   * Direct test verification email
   */
  async sendTestEmail(recipient) {
    const title = "SMTP Configuration Test - RK Printers";
    const previewText = "This is a test email confirming your RK Printers SMTP configuration works.";

    const content = `
      <h2 style="font-size: 20px; font-weight: 700; color: #16a34a; margin-top: 0;">✅ SMTP Integration Working!</h2>
      <p style="font-size: 15px; color: #52525b; line-height: 1.6;">
        This email verifies that your <strong>RK Printers SMTP Server</strong> is correctly configured and operational.
      </p>
      <table class="info-table">
        <tr>
          <td class="label">SMTP Host:</td>
          <td class="val">${process.env.SMTP_HOST || "rkprinter.in"}</td>
        </tr>
        <tr>
          <td class="label">Port / Secure:</td>
          <td class="val">${process.env.SMTP_PORT || "465"} (SSL/TLS)</td>
        </tr>
        <tr>
          <td class="label">Sender:</td>
          <td class="val">${defaultSender}</td>
        </tr>
        <tr>
          <td class="label">Timestamp:</td>
          <td class="val">${new Date().toISOString()}</td>
        </tr>
      </table>
    `;

    const html = wrapHtmlTemplate({ title, content, previewText });
    return await this.sendMail({
      to: recipient,
      subject: "✅ RK Printers SMTP Configuration Test",
      html,
    });
  }
}

export default new EmailService();

