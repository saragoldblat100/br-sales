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
        <td style="padding: 8px; border: 1px solid #ddd;">${line.itemCode}</td>
        <td style="padding: 8px; border: 1px solid #ddd;">${line.description}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${line.cartons}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${line.quantity}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatPrice(line.pricePerUnit, line.currency)}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${formatPrice(line.totalPrice, line.currency)}</td>
      </tr>
    `
    )
    .join('');

  const totalsHTML = [];
  if (order.totalAmountILS > 0) {
    totalsHTML.push(`<p><strong>סה"כ בשקלים:</strong> ${formatPrice(order.totalAmountILS, 'ILS')}</p>`);
  }
  if (order.totalAmountUSD > 0) {
    totalsHTML.push(`<p><strong>סה"כ בדולרים:</strong> ${formatPrice(order.totalAmountUSD, 'USD')}</p>`);
  }

  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="he">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; direction: rtl; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th { background-color: #f8b0ab; color: white; padding: 10px; text-align: center; }
        td { padding: 8px; border: 1px solid #ddd; }
        .header { background-color: #f5f5f5; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .footer { background-color: #f5f5f5; padding: 10px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="color: #d32f2f;">הזמנה חדשה - Bravo</h1>
        <p>מספר הזמנה: <strong>${order.orderNumber}</strong></p>
      </div>

      <div class="content">
        <h2>פרטי לקוח</h2>
        <p><strong>שם לקוח:</strong> ${order.customerName}</p>

        <h2>פריטים</h2>
        <table>
          <thead>
            <tr>
              <th>מק"ט</th>
              <th>שם פריט</th>
              <th>קרטונים</th>
              <th>כמות יחידות</th>
              <th>מחיר ליחידה</th>
              <th>סה"כ</th>
            </tr>
          </thead>
          <tbody>
            ${linesHTML}
          </tbody>
        </table>

        <h2>סיכום</h2>
        <p><strong>סה"כ CBM:</strong> ${order.totalCBM.toFixed(3)}</p>
        ${totalsHTML.join('')}

        ${order.notes ? `<h2>הערות</h2><p>${order.notes}</p>` : ''}
      </div>

      <div class="footer">
        <p>הזמנה זו נוצרה אוטומטית ממערכת Bravo Sales</p>
        <p>${new Date().toLocaleString('he-IL')}</p>
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
        `${line.itemCode} | ${line.description} | ${line.cartons} קרטונים | ${line.quantity} יח' | ${formatPrice(line.pricePerUnit, line.currency)} ליחידה | סה"כ: ${formatPrice(line.totalPrice, line.currency)}`
    )
    .join('\n');

  let totals = '';
  if (order.totalAmountILS > 0) {
    totals += `סה"כ בשקלים: ${formatPrice(order.totalAmountILS, 'ILS')}\n`;
  }
  if (order.totalAmountUSD > 0) {
    totals += `סה"כ בדולרים: ${formatPrice(order.totalAmountUSD, 'USD')}\n`;
  }

  return `
הזמנה חדשה - Bravo
==================

מספר הזמנה: ${order.orderNumber}

פרטי לקוח
---------
שם לקוח: ${order.customerName}

פריטים
------
${lines}

סיכום
-----
${totals}
${order.notes ? `הערות: ${order.notes}` : ''}

---
הזמנה זו נוצרה אוטומטית ממערכת Bravo Sales
${new Date().toLocaleString('he-IL')}
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
