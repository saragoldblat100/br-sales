import nodemailer from 'nodemailer';
import { env } from '@/config/env';
import { logger } from '@/shared/utils';
import type { IOrder } from './order.model';

// Create transporter - works without limits
const createTransporter = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    logger.warn('SMTP not configured - emails will be logged only');
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
};

const transporter = createTransporter();

/**
 * Format price with currency symbol
 */
const formatPrice = (amount: number, currency: 'ILS' | 'USD'): string => {
  const symbol = currency === 'ILS' ? '₪' : '$';
  return `${symbol}${amount.toLocaleString('he-IL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Generate HTML email content for order
 */
const generateOrderEmailHTML = (order: IOrder): string => {
  const linesHTML = order.lines
    .map(
      (line) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${line.itemCode}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${line.description}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${line.cartons}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${line.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${formatPrice(line.pricePerUnit, line.currency)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-weight: bold;">${formatPrice(line.totalPrice, line.currency)}</td>
      </tr>
    `
    )
    .join('');

  const totalsHTML = [];
  if (order.totalAmountILS > 0) {
    totalsHTML.push(`<div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 2px solid #3b82f6;"><span>סה"כ בשקלים:</span><span style="font-weight: bold; color: #3b82f6;">${formatPrice(order.totalAmountILS, 'ILS')}</span></div>`);
  }
  if (order.totalAmountUSD > 0) {
    totalsHTML.push(`<div style="display: flex; justify-content: space-between; padding: 8px 0;"><span>סה"כ בדולרים:</span><span style="font-weight: bold; color: #3b82f6;">${formatPrice(order.totalAmountUSD, 'USD')}</span></div>`);
  }

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          direction: rtl;
          background-color: #f9fafb;
          color: #374151;
          line-height: 1.6;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
          padding: 30px 20px;
          text-align: center;
          color: white;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .header p {
          font-size: 14px;
          opacity: 0.95;
        }
        .order-number {
          background-color: rgba(255, 255, 255, 0.2);
          padding: 10px 15px;
          border-radius: 4px;
          margin-top: 10px;
          display: inline-block;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 2px solid #f0f0f0;
        }
        .customer-info {
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 6px;
          border-right: 4px solid #3b82f6;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .info-row:last-child {
          margin-bottom: 0;
        }
        .info-label {
          font-weight: 600;
          color: #1f2937;
        }
        .info-value {
          color: #6b7280;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th {
          background-color: #f3f4f6;
          color: #1f2937;
          padding: 12px;
          text-align: right;
          font-weight: 700;
          font-size: 13px;
          border-bottom: 2px solid #3b82f6;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 13px;
        }
        tr:last-child td {
          border-bottom: none;
        }
        .summary-section {
          background-color: #f9fafb;
          padding: 20px;
          border-radius: 6px;
          border-left: 4px solid #3b82f6;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
          font-size: 14px;
        }
        .summary-row:last-child {
          margin-bottom: 0;
        }
        .summary-label {
          font-weight: 600;
          color: #1f2937;
        }
        .summary-value {
          font-weight: 600;
          color: #3b82f6;
        }
        .notes-section {
          background-color: #fef3c7;
          padding: 15px;
          border-radius: 6px;
          border-right: 4px solid #f59e0b;
          margin-top: 20px;
        }
        .notes-section h3 {
          font-size: 13px;
          font-weight: 700;
          color: #92400e;
          margin-bottom: 8px;
        }
        .notes-section p {
          font-size: 13px;
          color: #78350f;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .footer {
          background-color: #1f2937;
          color: white;
          padding: 20px;
          text-align: center;
          font-size: 12px;
        }
        .footer p {
          margin-bottom: 5px;
        }
        .footer p:last-child {
          margin-bottom: 0;
          opacity: 0.8;
        }
        .bravo-logo {
          font-weight: 700;
          color: #3b82f6;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🛒 הזמנה חדשה</h1>
          <div class="order-number">מספר הזמנה: ${order.orderNumber}</div>
        </div>

        <div class="content">
          {/* Customer Information */}
          <div class="section">
            <h2>👤 פרטי לקוח</h2>
            <div class="customer-info">
              <div class="info-row">
                <span class="info-label">שם לקוח:</span>
                <span class="info-value">${order.customerName}</span>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div class="section">
            <h2>📦 פריטים הזמונים</h2>
            <table>
              <thead>
                <tr>
                  <th>מק"ט</th>
                  <th>שם פריט</th>
                  <th>קרטונים</th>
                  <th>יחידות</th>
                  <th>מחיר יחידה</th>
                  <th>סה"כ</th>
                </tr>
              </thead>
              <tbody>
                ${linesHTML}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div class="section">
            <h2>💰 סיכום הזמנה</h2>
            <div class="summary-section">
              <div class="summary-row">
                <span class="summary-label">סה"כ CBM:</span>
                <span>${order.totalCBM.toFixed(3)}</span>
              </div>
              ${totalsHTML.join('')}
            </div>
          </div>

          ${order.notes ? `
          <div class="section">
            <div class="notes-section">
              <h3>📝 הערות</h3>
              <p>${order.notes}</p>
            </div>
          </div>
          ` : ''}
        </div>

        <div class="footer">
          <p>הזמנה זו נוצרה אוטומטית ממערכת <span class="bravo-logo">Bravo</span> Sales</p>
          <p>${new Date().toLocaleString('he-IL')}</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Generate plain text email content
 */
const generateOrderEmailText = (order: IOrder): string => {
  const lines = order.lines
    .map(
      (line) =>
        `${line.itemCode.padEnd(15)} | ${line.description.padEnd(30)} | ${String(line.cartons).padStart(3)} | ${String(line.quantity).padStart(5)} | ${formatPrice(line.pricePerUnit, line.currency).padStart(10)} | ${formatPrice(line.totalPrice, line.currency).padStart(10)}`
    )
    .join('\n');

  let totals = '';
  if (order.totalAmountILS > 0) {
    totals += `סה"כ בשקלים: ${formatPrice(order.totalAmountILS, 'ILS')}\n`;
  }
  if (order.totalAmountUSD > 0) {
    totals += `סה"כ בדולרים: ${formatPrice(order.totalAmountUSD, 'USD')}\n`;
  }

  const separator = '════════════════════════════════════════════════════════════════════════════════';

  return `
${separator}
🛒 הזמנה חדשה - Bravo Sales
${separator}

📋 פרטי הזמנה
─────────────────────────────────────────────────────────────────────────────────
מספר הזמנה: ${order.orderNumber}
תאריך: ${new Date().toLocaleString('he-IL')}

👤 פרטי לקוח
─────────────────────────────────────────────────────────────────────────────────
שם לקוח: ${order.customerName}

📦 פריטים הזמונים
─────────────────────────────────────────────────────────────────────────────────
מק"ט         | שם פריט                      | קרט | יחידות | מחיר יח | סה"כ
─────────────────────────────────────────────────────────────────────────────────
${lines}

💰 סיכום הזמנה
─────────────────────────────────────────────────────────────────────────────────
סה"כ CBM: ${order.totalCBM.toFixed(3)}
${totals}
${order.notes ? `
📝 הערות
─────────────────────────────────────────────────────────────────────────────────
${order.notes}
` : ''}
${separator}
הזמנה זו נוצרה אוטומטית ממערכת Bravo Sales
${new Date().toLocaleString('he-IL')}
${separator}
  `.trim();
};

/**
 * Send order notification email
 */
export const sendOrderEmail = async (order: IOrder): Promise<boolean> => {
  const toEmail = env.ORDER_EMAIL_TO;

  if (!toEmail) {
    logger.warn('ORDER_EMAIL_TO not configured - skipping email');
    return false;
  }

  const subject = `הזמנה חדשה ${order.orderNumber} - ${order.customerName}`;
  const html = generateOrderEmailHTML(order);
  const text = generateOrderEmailText(order);

  if (!transporter) {
    // Log email content when SMTP not configured
    logger.info('=== EMAIL WOULD BE SENT ===');
    logger.info(`To: ${toEmail}`);
    logger.info(`Subject: ${subject}`);
    logger.info(`Content:\n${text}`);
    logger.info('=== END EMAIL ===');
    return true;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM || env.SMTP_USER,
      to: toEmail,
      subject,
      text,
      html,
    });

    logger.info(`Order email sent successfully for order ${order.orderNumber}`);
    return true;
  } catch (error) {
    logger.error('Failed to send order email:', error);
    return false;
  }
};
