/**
 * Script to create missing items with supplier prices
 * Usage: npx ts-node scripts/create-missing-items.ts
 *
 * Creates items based on supplier price Excel file
 * Items that don't exist will be created with basic info
 */

import path from 'path';
import * as XLSX from 'xlsx';
import { connectDB, disconnectDB } from '../src/config/db';
import { Item } from '../src/features/items/item.model';

const EXCEL_FILE = path.resolve(
  __dirname,
  '../Excel File/הכנסת נתונים לאפליקציה/הכנסת מחירי ספק לפריטים חדשים.xlsx'
);

async function main() {
  console.log('='.repeat(60));
  console.log('יצירת פריטים חסרים / Create Missing Items');
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

  console.log(`עמודות: itemCode | supplierPrice\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Process data rows (skip header row 0)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const itemCode = String(row[0] ?? '').trim();
    const priceRaw = row[1];
    const price = Number(priceRaw);

    // Skip empty rows
    if (!itemCode) continue;

    // Validate
    if (!itemCode) {
      errors.push(`שורה ${i + 1}: חסר itemCode`);
      skipped++;
      continue;
    }

    if (!priceRaw || isNaN(price) || price < 0) {
      errors.push(`שורה ${i + 1} (${itemCode}): מחיר לא תקין "${priceRaw}"`);
      skipped++;
      continue;
    }

    try {
      // Try to find and update existing item
      const existing = await Item.findOne({ itemCode });

      if (existing) {
        // Update existing
        existing.supplierPrice = price;
        await existing.save();
        updated++;
        console.log(`  🔄 עודכן קיים: ${itemCode}  →  ${price} USD`);
      } else {
        // Create new item with minimal info
        const newItem = new Item({
          itemCode,
          englishDescription: itemCode, // Use itemCode as fallback description
          qtyPerCarton: 1,
          supplierPrice: price,
          isActive: true,
        });
        await newItem.save();
        created++;
        console.log(`  ✅ נוצר חדש:   ${itemCode}  →  ${price} USD`);
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
  console.log(`🔄 עודכנו קיימים: ${updated}`);
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
