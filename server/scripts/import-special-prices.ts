/**
 * Script to import special prices from Excel file into MongoDB
 * Usage: npx ts-node scripts/import-special-prices.ts
 *
 * Excel columns expected:
 *   A - customerCode
 *   B - itemCode
 *   C - PRICE
 *   D - currency  (USD or ILS)
 */

import path from 'path';
import * as XLSX from 'xlsx';
import { connectDB, disconnectDB } from '../src/config/db';
import { SpecialPrice } from '../src/features/items/specialPrice.model';

const EXCEL_FILE = path.resolve(
  __dirname,
  '../Excel File/הכנסת נתונים לאפליקציה/הכנסת מחירים מיוחדים ללקוח .xlsx'
);

// Clean header - remove leading "A-", "B-", "C-" etc.
function cleanHeader(header: unknown): string {
  const str = String(header ?? '').trim();
  const match = str.match(/^[A-Za-z0-9]+-\s*(.+)$/);
  return match ? match[1].trim() : str;
}

// Normalize currency to USD or ILS
function parseCurrency(value: unknown): 'USD' | 'ILS' {
  const s = String(value ?? '').trim().toUpperCase();
  return s === 'ILS' || s === '₪' || s === 'שקל' ? 'ILS' : 'USD';
}

async function main() {
  console.log('='.repeat(60));
  console.log('ייבוא מחירים מיוחדים / Import Special Prices');
  console.log('='.repeat(60));
  console.log(`קובץ: ${EXCEL_FILE}\n`);

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  // Read Excel
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.readFile(EXCEL_FILE);
  } catch (err) {
    console.error(`❌ Cannot read Excel file: ${err}`);
    await disconnectDB();
    process.exit(1);
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (rows.length < 2) {
    console.log('⚠️  הקובץ ריק או חסרה שורת header');
    await disconnectDB();
    process.exit(0);
  }

  // Parse headers from first row
  const rawHeaders = rows[0] as unknown[];
  const headers = rawHeaders.map(cleanHeader);
  console.log(`עמודות: ${headers.join(', ')}\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    // Build object from row
    const raw: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) raw[h] = row[idx];
    });

    const customerCode = String(raw['customerCode'] ?? '').trim();
    const itemCode     = String(raw['itemCode']     ?? '').trim();
    const priceRaw     = raw['PRICE'] ?? raw['price'] ?? raw['specialPrice'] ?? raw['מחיר לאחר הנחה'] ?? raw['מחיר'];
    const price        = Number(priceRaw);

    // Skip empty rows
    if (!customerCode && !itemCode) continue;

    // Validate
    if (!customerCode) {
      errors.push(`שורה ${i + 1}: חסר customerCode`);
      skipped++;
      continue;
    }
    if (!itemCode) {
      errors.push(`שורה ${i + 1} (${customerCode}): חסר itemCode`);
      skipped++;
      continue;
    }
    if (!priceRaw || isNaN(price) || price < 0) {
      errors.push(`שורה ${i + 1} (${customerCode} / ${itemCode}): מחיר לא תקין "${priceRaw}"`);
      skipped++;
      continue;
    }

    const currency = parseCurrency(raw['currency']);

    const data = {
      customerCode,
      itemCode,
      specialPrice: price,
      currency,
    };

    try {
      const existing = await SpecialPrice.findOne({ customerCode, itemCode });

      await SpecialPrice.findOneAndUpdate(
        { customerCode, itemCode },
        { $set: data },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (existing) {
        updated++;
        console.log(`  🔄 עודכן:  ${customerCode} / ${itemCode}  →  ${price} ${currency}`);
      } else {
        created++;
        console.log(`  ✅ נוצר:   ${customerCode} / ${itemCode}  →  ${price} ${currency}`);
      }
    } catch (err: any) {
      errors.push(`שורה ${i + 1} (${customerCode} / ${itemCode}): ${err.message}`);
      skipped++;
      console.log(`  ❌ שגיאה:  ${customerCode} / ${itemCode} - ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('סיכום / Summary');
  console.log('='.repeat(60));
  console.log(`✅ נוצרו חדשים:   ${created}`);
  console.log(`🔄 עודכנו:        ${updated}`);
  console.log(`⏭️  דולגו/שגיאות:  ${skipped}`);
  if (errors.length > 0) {
    console.log('\nשגיאות:');
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log('='.repeat(60));

  await disconnectDB();
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
