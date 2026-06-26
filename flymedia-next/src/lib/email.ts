import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

interface SimulatedEmailParams {
  storeName: string;
  customer: {
    name: string;
    phone: string;
    email: string | null;
  };
  order: {
    orderNumber: string;
    orderType: string;
    subtotal: number;
    taxAmount: number;
    totalAmount: number;
    deliveryAddress?: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      variantName?: string | null;
      addons?: Array<{ name: string; price: number }>;
    }>;
  };
  payment: {
    method: string;
    amount: number;
    status: string;
    reference: string;
  };
  adminEmail: string;
}

export async function sendEmailReceipt(params: SimulatedEmailParams) {
  const { storeName, customer, order, payment, adminEmail } = params;
  const customerEmail = customer.email || 'no-email@customer.com';
  const timestamp = new Date().toLocaleString();

  // 1. Format text receipt
  const formattedItemsText = order.items
    .map((item) => {
      let addonText = '';
      if (item.addons && item.addons.length > 0) {
        addonText = `\n    + Add-ons: ${item.addons.map((a) => `${a.name} (+$${a.price.toFixed(2)})`).join(', ')}`;
      }
      const variantText = item.variantName ? ` [Variant: ${item.variantName}]` : '';
      return `- ${item.quantity}x ${item.name}${variantText} @ $${item.price.toFixed(2)} each = $${(item.quantity * item.price).toFixed(2)}${addonText}`;
    })
    .join('\n');

  const textBody = `
========================================================================
NEW TRANSACTION RECEIPT - ${timestamp}
========================================================================
Store: ${storeName}
Order Number: ${order.orderNumber}
Order Type: ${order.orderType.toUpperCase()}
Timestamp: ${timestamp}

-------------------------- CUSTOMER DETAILS ----------------------------
Name: ${customer.name}
Phone: ${customer.phone}
Email: ${customer.email || 'Not Provided (Guest)'}
${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}\n` : ''}

-------------------------- ORDER SUMMARY -------------------------------
${formattedItemsText}

Subtotal: $${Number(order.subtotal).toFixed(2)}
Tax: $${Number(order.taxAmount).toFixed(2)}
Total Amount: $${Number(order.totalAmount).toFixed(2)}

------------------------- PAYMENT INFORMATION --------------------------
Method: ${payment.method.toUpperCase()}
Amount Paid: $${Number(payment.amount).toFixed(2)}
Transaction Reference: ${payment.reference}
Payment Status: ${payment.status.toUpperCase()}

========================================================================
`;

  // 2. Format HTML receipt
  const formattedItemsHtml = order.items
    .map((item) => {
      let addonsHtml = '';
      if (item.addons && item.addons.length > 0) {
        addonsHtml = `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">+ Add-ons: ${item.addons.map(a => `${a.name} (+$${a.price.toFixed(2)})`).join(', ')}</div>`;
      }
      const variantText = item.variantName ? ` <span style="color: #06b6d4; font-size: 11px;">(${item.variantName})</span>` : '';
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px 0; color: #1e293b;">
            <div style="font-weight: bold;">${item.name}${variantText}</div>
            ${addonsHtml}
          </td>
          <td style="padding: 12px 0; text-align: center; color: #475569;">${item.quantity}</td>
          <td style="padding: 12px 0; text-align: right; color: #1e293b; font-weight: bold;">$${(item.quantity * item.price).toFixed(2)}</td>
        </tr>
      `;
    })
    .join('');

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
        <h2 style="color: #0062ff; margin: 0; font-weight: 900;">${storeName}</h2>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Transaction Receipt</p>
      </div>

      <div style="margin-top: 20px; padding: 16px; background-color: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Customer Details</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Name:</strong> ${customer.name}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Phone:</strong> ${customer.phone}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Email:</strong> ${customer.email || 'Not Provided (Guest)'}</p>
        ${order.deliveryAddress ? `<p style="margin: 4px 0; font-size: 13px; color: #b45309;"><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>` : ''}
      </div>

      <div style="margin-top: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Order Details</h3>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="margin: 4px 0; font-size: 13px;"><strong>Order Type:</strong> ${order.orderType.toUpperCase()}</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 12px;">
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b;">
              <th style="padding-bottom: 8px;">Item</th>
              <th style="padding-bottom: 8px; text-align: center;">Qty</th>
              <th style="padding-bottom: 8px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${formattedItemsHtml}
          </tbody>
        </table>
      </div>

      <div style="margin-top: 20px; border-top: 2px solid #e2e8f0; padding-top: 12px; font-size: 13px;">
        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span style="color: #64748b;">Subtotal</span>
          <span style="font-weight: bold;">$${Number(order.subtotal).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 4px 0;">
          <span style="color: #64748b;">Tax</span>
          <span style="font-weight: bold;">$${Number(order.taxAmount).toFixed(2)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 8px 0 0 0; font-size: 16px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <strong style="color: #0062ff;">Grand Total</strong>
          <strong style="color: #0062ff;">$${Number(order.totalAmount).toFixed(2)}</strong>
        </div>
      </div>

      <div style="margin-top: 20px; padding: 16px; background-color: #f1f5f9; border-radius: 12px; font-size: 13px; color: #475569;">
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Payment Details</h3>
        <p style="margin: 4px 0;"><strong>Method:</strong> ${payment.method.toUpperCase()}</p>
        <p style="margin: 4px 0;"><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">${payment.status.toUpperCase()}</span></p>
        <p style="margin: 4px 0;"><strong>Transaction Ref:</strong> ${payment.reference}</p>
      </div>

      <div style="margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        <p>This is an automated receipt generated by F-Ordering POS platform.</p>
      </div>
    </div>
  `;

  // 3. Setup Nodemailer Transporter
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"F-Ordering Receipt" <${smtpUser || 'receipts@fordering.com'}>`;

    let transporter: nodemailer.Transporter;

    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      console.log(`[EMAIL DISPATCH] Configured SMTP transporter for ${smtpHost}`);
    } else {
      // Fallback: Create test Ethereal account
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log(`[EMAIL DISPATCH] No SMTP credentials. Configured mock Ethereal SMTP transporter.`);
    }

    // 4. Send Email to Customer (if valid email provided)
    const emailsToSend = [];
    
    if (customer.email) {
      emailsToSend.push(
        transporter.sendMail({
          from: smtpFrom,
          to: customer.email,
          subject: `Your ${storeName} Order Confirmation - ${order.orderNumber}`,
          text: textBody,
          html: htmlBody,
        })
      );
    }

    // 5. Send Email to Admin
    emailsToSend.push(
      transporter.sendMail({
        from: smtpFrom,
        to: adminEmail,
        subject: `[New Order] Receipt Invoice ${order.orderNumber} - ${storeName}`,
        text: textBody,
        html: htmlBody,
      })
    );

    const results = await Promise.all(emailsToSend);

    // If using mock Ethereal SMTP, print the test message URLs to view them!
    let etherealUrl = '';
    if (!smtpHost && results.length > 0) {
      etherealUrl = nodemailer.getTestMessageUrl(results[0]) || '';
      console.log(`[EMAIL PREVIEW] Ethereal preview URL: ${etherealUrl}`);
    }

    // 6. Write logs to local file simulated_emails.log
    const logFilePath = path.join(process.cwd(), 'simulated_emails.log');
    const logsContent = `
========================================================================
NEW TRANSACTION RECEIPT - ${timestamp}
========================================================================
Store: ${storeName}
Order Number: ${order.orderNumber}
Order Type: ${order.orderType.toUpperCase()}
Timestamp: ${timestamp}

-------------------------- CUSTOMER DETAILS ----------------------------
Name: ${customer.name}
Phone: ${customer.phone}
Email: ${customer.email || 'Not Provided (Guest)'}
${order.deliveryAddress ? `Delivery Address: ${order.deliveryAddress}\n` : ''}

-------------------------- ORDER SUMMARY -------------------------------
${formattedItemsText}

Subtotal: $${Number(order.subtotal).toFixed(2)}
Tax: $${Number(order.taxAmount).toFixed(2)}
Total Amount: $${Number(order.totalAmount).toFixed(2)}

------------------------- PAYMENT INFORMATION --------------------------
Method: ${payment.method.toUpperCase()}
Amount Paid: $${Number(payment.amount).toFixed(2)}
Transaction Reference: ${payment.reference}
Payment Status: ${payment.status.toUpperCase()}

========================================================================
SIMULATED DISPATCH DETAIL:
- Sent to Customer Email: ${customerEmail}
- Sent to Restaurant Admin Email: ${adminEmail}
${etherealUrl ? `- Ethereal Preview URL: ${etherealUrl}` : ''}
========================================================================
\n\n`;

    fs.appendFileSync(logFilePath, logsContent, 'utf8');
    console.log(`[EMAIL DISPATCH] Email receipts successfully processed for ${order.orderNumber}.`);
    return true;

  } catch (error) {
    console.error('[EMAIL DISPATCH] Failed to send email receipts using Nodemailer:', error);
    const logFilePath = path.join(process.cwd(), 'simulated_emails.log');
    fs.appendFileSync(logFilePath, textBody + `\nDISPATCH FAILURE ERROR: ${error}\n\n`, 'utf8');
    return false;
  }
}

// ─── Order Status Change Email ─────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  pending:   { label: 'Pending',   emoji: '⏳', color: '#f59e0b' },
  accepted:  { label: 'Accepted',  emoji: '✅', color: '#10b981' },
  preparing: { label: 'Preparing', emoji: '🍳', color: '#3b82f6' },
  ready:     { label: 'Ready',     emoji: '🛎', color: '#8b5cf6' },
  completed: { label: 'Completed', emoji: '🎉', color: '#059669' },
  cancelled: { label: 'Cancelled', emoji: '❌', color: '#ef4444' },
  on_hold:   { label: 'On Hold',   emoji: '⏸', color: '#64748b' },
};

export async function sendOrderStatusEmail(params: {
  storeName: string;
  adminEmail: string;
  customer: { name: string; phone: string; email: string | null };
  order: { orderNumber: string; total: number; orderType: string };
  newStatus: string;
  oldStatus: string;
}) {
  const { storeName, adminEmail, customer, order, newStatus, oldStatus } = params;
  const timestamp = new Date().toLocaleString();
  const statusInfo = STATUS_LABELS[newStatus] || { label: newStatus, emoji: '📋', color: '#64748b' };

  const htmlBody = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; color: #1e293b;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0;">
        <h2 style="color: #0062ff; margin: 0; font-weight: 900;">${storeName}</h2>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">Order Status Update</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 48px; margin-bottom: 12px;">${statusInfo.emoji}</div>
        <h1 style="margin: 0; font-size: 22px; color: ${statusInfo.color};">${statusInfo.label.toUpperCase()}</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: 6px;">Your order status has been updated</p>
      </div>

      <div style="background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
        <h3 style="margin: 0 0 12px 0; font-size: 13px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em;">Order Summary</h3>
        <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #64748b;">Order Number</td><td style="text-align: right; font-weight: bold; color: #1e293b;">${order.orderNumber}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Order Type</td><td style="text-align: right; font-weight: bold; color: #1e293b;">${order.orderType.replace('_', ' ').toUpperCase()}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Total Amount</td><td style="text-align: right; font-weight: bold; color: #0062ff;">$${order.total.toFixed(2)}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">Previous Status</td><td style="text-align: right; color: #94a3b8;">${(STATUS_LABELS[oldStatus]?.label || oldStatus).toUpperCase()}</td></tr>
          <tr><td style="padding: 6px 0; color: #64748b;">New Status</td><td style="text-align: right; font-weight: bold; color: ${statusInfo.color}; padding: 2px 8px;">${statusInfo.label.toUpperCase()}</td></tr>
        </table>
      </div>

      <div style="background: #f1f5f9; border-radius: 12px; padding: 16px; font-size: 13px;">
        <h3 style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b;">Customer</h3>
        <p style="margin: 2px 0;"><strong>Name:</strong> ${customer.name}</p>
        <p style="margin: 2px 0;"><strong>Phone:</strong> ${customer.phone}</p>
      </div>

      <div style="margin-top: 24px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 12px;">
        <p>Updated at ${timestamp} &middot; Automated notification by F-Ordering POS</p>
      </div>
    </div>
  `;

  const textBody = `
Order Status Update - ${storeName}
Order: ${order.orderNumber}
Status changed: ${oldStatus.toUpperCase()} -> ${newStatus.toUpperCase()}
Total: $${order.total.toFixed(2)}
Customer: ${customer.name} (${customer.phone})
Time: ${timestamp}
`;

  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || `"F-Ordering" <${smtpUser || 'notify@fordering.com'}>`;

    let transporter: nodemailer.Transporter;
    if (smtpHost && smtpUser && smtpPass) {
      transporter = nodemailer.createTransport({
        host: smtpHost, port: smtpPort, secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host, port: testAccount.smtp.port, secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const sends: Promise<any>[] = [];

    // Notify customer if they have an email
    if (customer.email) {
      sends.push(transporter.sendMail({
        from: smtpFrom,
        to: customer.email,
        subject: `${statusInfo.emoji} Your order ${order.orderNumber} is now ${statusInfo.label} — ${storeName}`,
        text: textBody,
        html: htmlBody,
      }));
    }

    // Always notify admin
    sends.push(transporter.sendMail({
      from: smtpFrom,
      to: adminEmail,
      subject: `[Status Update] ${order.orderNumber}: ${oldStatus.toUpperCase()} -> ${newStatus.toUpperCase()} — ${storeName}`,
      text: textBody,
      html: htmlBody,
    }));

    const results = await Promise.all(sends);

    // Log to file
    const logFilePath = path.join(process.cwd(), 'simulated_emails.log');
    const previewUrl = !smtpHost && results.length > 0 ? nodemailer.getTestMessageUrl(results[0]) : '';
    fs.appendFileSync(logFilePath, `
[STATUS UPDATE] ${order.orderNumber}: ${oldStatus} -> ${newStatus} at ${timestamp}
  Customer: ${customer.name} (${customer.email || 'no email'})
  Admin notified: ${adminEmail}
  ${previewUrl ? `Preview: ${previewUrl}` : ''}

`, 'utf8');

    console.log(`[EMAIL STATUS] Sent status update for ${order.orderNumber}: ${oldStatus} -> ${newStatus}`);
    return true;
  } catch (err) {
    console.error('[EMAIL STATUS] Failed to send status update email:', err);
    return false;
  }
}
