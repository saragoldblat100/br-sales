/**
 * Script to import items from Excel file into MongoDB
 * Usage: npx ts-node scripts/import-items.ts
 *
 * Excel columns expected:
 *   A - itemCode
 *   B - englishDescription
 *   C - nameHe
 *   D - qtyPerCarton
 *   E - category
 *   F - isActive
 */

import path from 'path';
import * as XLSX from 'xlsx';
import { connectDB, disconnectDB } from '../src/config/db';
import { Item } from '../src/features/items/item.model';

const EXCEL_FILE = path.resolve(
  __dirname,
  '../Excel File/הכנסת נתונים לאפליקציה/הכנסת פריטים חדשים.xlsx'
);

// Clean header string - remove leading "A-", "3-", etc.
function cleanHeader(header: unknown): string {
  const str = String(header ?? '').trim();
  const match = str.match(/^[A-Za-z0-9]+-(.+)$/);
  return match ? match[1].trim() : str;
}

// Parse isActive from various formats
function parseIsActive(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (typeof value === 'boolean') return value;
  const s = String(value).trim().toLowerCase();
  return s === 'false' || s === '0' || s === 'לא' || s === 'no' ? false : true;
}

async function main() {
  console.log('='.repeat(60));
  console.log('ייבוא פריטים מ-Excel / Import Items from Excel');
  console.log('='.repeat(60));
  console.log(`קובץ: ${EXCEL_FILE}\n`);

  // Connect to DB
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

  // Process data rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    // Build item object from row
    const raw: Record<string, unknown> = {};
    headers.forEach((h, idx) => {
      if (h) raw[h] = row[idx];
    });

    const itemCode = String(raw['itemCode'] ?? '').trim();
    const englishDescription = String(raw['englishDescription'] ?? '').trim();

    // Skip empty rows
    if (!itemCode && !englishDescription) continue;

    // Validate required fields
    if (!itemCode) {
      errors.push(`שורה ${i + 1}: חסר itemCode`);
      skipped++;
      continue;
    }
    if (!englishDescription) {
      errors.push(`שורה ${i + 1} (${itemCode}): חסר englishDescription`);
      skipped++;
      continue;
    }

    const qtyPerCarton = Number(raw['qtyPerCarton']) || 1;

    const itemData = {
      itemCode,
      englishDescription,
      nameHe: String(raw['nameHe'] ?? '').trim(),
      qtyPerCarton,
      category: String(raw['category'] ?? '').trim(),
      isActive: parseIsActive(raw['isActive']),
    };

    try {
      const result = await Item.findOneAndUpdate(
        { itemCode },
        { $set: itemData },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Check if this was an insert or update
      if (result.createdAt.getTime() === result.updatedAt.getTime()) {
        created++;
        console.log(`  ✅ נוצר: ${itemCode} - ${englishDescription}`);
      } else {
        updated++;
        console.log(`  🔄 עודכן: ${itemCode} - ${englishDescription}`);
      }
    } catch (err: any) {
      errors.push(`שורה ${i + 1} (${itemCode}): ${err.message}`);
      skipped++;
      console.log(`  ❌ שגיאה: ${itemCode} - ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('סיכום / Summary');
  console.log('='.repeat(60));
  console.log(`✅ נוצרו חדשים:  ${created}`);
  console.log(`🔄 עודכנו:       ${updated}`);
  console.log(`⏭️  דולגו/שגיאות: ${skipped}`);
  if (errors.length > 0) {
    console.log('\nשגיאות:');
    errors.forEach((e) => console.log(`  - ${e}`));
  }
  console.log('='.repeat(60));

  await disconnectDB();
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
