/**
 * Script to bulk update items from Excel file
 * Usage: npx ts-node scripts/bulk-update-items.ts
 *
 * Updates items with:
 * - CBM
 * - qtyPerCarton (כמות בקרטון)
 * - supplierPrice (only if not 0 in Excel, or if item doesn't have one)
 * - nameHe (תיאור עברית)
 * - englishDescription (תיאור אנגלית)
 * - categoryId (based on category name)
 */

import path from 'path';
import * as XLSX from 'xlsx';
import { connectDB, disconnectDB } from '../src/config/db';
import { Item } from '../src/features/items/item.model';
import { Category } from '../src/features/items/category.model';

const EXCEL_FILE = path.resolve(
  __dirname,
  '../Excel File/הכנסת נתונים לאפליקציה/עדכון פריטים לתחשיב מחיר.xlsx'
);

async function main() {
  console.log('='.repeat(100));
  console.log('עדכון מיני-בתי של פריטים / Bulk Update Items');
  console.log('='.repeat(100));
  console.log(`קובץ: ${EXCEL_FILE}\n`);

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  // Read Excel
  console.log('📖 קורא קובץ Excel...');
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
    console.log('⚠️ הקובץ ריק או חסרה שורת header');
    await disconnectDB();
    process.exit(0);
  }

  // Load all categories for mapping
  console.log('📥 טוען קטגוריות...');
  const allCategories = await Category.find({}).lean();
  const categoryMap = new Map();
  allCategories.forEach((cat) => {
    if (cat.nameHe) categoryMap.set(cat.nameHe.trim().toLowerCase(), cat._id);
    if (cat.name) categoryMap.set(cat.name.trim().toLowerCase(), cat._id);
  });

  console.log(`✅ נטען ${allCategories.length} קטגוריות\n`);

  // Extract all item codes from Excel for batch loading
  const itemCodesToCheck = new Set<string>();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const itemCode = String(row[0] ?? '').trim();
    if (itemCode) {
      itemCodesToCheck.add(itemCode);
    }
  }

  // Batch load all items upfront
  console.log(`📥 טוען ${itemCodesToCheck.size} פריטים מהמערכת...`);
  const allItems = await Item.find({ itemCode: { $in: Array.from(itemCodesToCheck) } }).lean();
  const itemMap = new Map(allItems.map((item) => [item.itemCode, item]));
  console.log(`✅ נטען ${itemMap.size} פריטים קיימים\n`);

  let updated = 0;
  let created = 0;
  let skipped = 0;
  const errors: string[] = [];
  const operations: any[] = [];

  // Process rows
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const itemCode = String(row[0] ?? '').trim();
    const hebrewDesc = String(row[1] ?? '').trim();
    const englishDesc = String(row[2] ?? '').trim();
    const cbm = Number(row[3]);
    const categoryName = String(row[4] ?? '').trim();
    const qtyPerCarton = Number(row[5]);
    const supplierPriceRaw = row[7];
    const supplierPrice = Number(supplierPriceRaw);
    const currency = String(row[8] ?? '').trim();

    if (!itemCode) continue;

    try {
      // Build update object
      const updateData: any = {};

      // Always update these if they have values
      if (hebrewDesc) updateData.nameHe = hebrewDesc;
      if (englishDesc) updateData.englishDescription = englishDesc;
      if (!isNaN(cbm) && cbm > 0) updateData.boxCBM = cbm;
      if (!isNaN(qtyPerCarton) && qtyPerCarton > 0) updateData.qtyPerCarton = qtyPerCarton;

      // Handle supplier price - only update if:
      // 1. Excel has a non-zero price, OR
      // 2. Item doesn't have a supplier price yet
      if (supplierPriceRaw !== undefined && supplierPriceRaw !== null && supplierPriceRaw !== '') {
        if (!isNaN(supplierPrice) && supplierPrice > 0) {
          updateData.supplierPrice = supplierPrice;
        }
      }

      // Handle currency
      if (currency) {
        const normCurrency = currency.toUpperCase();
        if (normCurrency === 'ILS' || normCurrency === '₪' || normCurrency === 'שקל') {
          updateData.supplierCurrency = 'ILS';
        } else {
          updateData.supplierCurrency = 'USD';
        }
      }

      // Handle category
      if (categoryName) {
        const categoryId = categoryMap.get(categoryName.toLowerCase());
        if (categoryId) {
          updateData.categoryId = categoryId;
          updateData.category = categoryName;
        }
      }

      // Check if item exists (from map)
      const existingItem = itemMap.get(itemCode);

      if (existingItem) {
        // For supplier price: only update if Excel has a non-zero value OR item doesn't have one
        if (updateData.supplierPrice !== undefined) {
          if (supplierPrice === 0 && existingItem.supplierPrice && existingItem.supplierPrice > 0) {
            // Excel has 0, item has value - don't override
            delete updateData.supplierPrice;
          }
        } else if (supplierPriceRaw !== undefined && supplierPriceRaw !== null && supplierPriceRaw !== '') {
          // If Excel has a price but it's 0, and item has a price - keep item's price
          if (supplierPrice === 0 && existingItem.supplierPrice && existingItem.supplierPrice > 0) {
            // Don't update
          }
        }

        // Only update fields that have values
        if (Object.keys(updateData).length > 0) {
          operations.push({
            updateOne: {
              filter: { itemCode },
              update: { $set: updateData }
            }
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        // Create new item
        if (!hebrewDesc || !englishDesc) {
          errors.push(`שורה ${i + 1} (${itemCode}): לא יכול ליצור פריט ללא תיאור בעברית ובאנגלית`);
          skipped++;
          continue;
        }

        updateData.itemCode = itemCode;
        updateData.isActive = true;

        operations.push({
          insertOne: {
            document: updateData
          }
        });
        created++;
      }
    } catch (err: any) {
      errors.push(`שורה ${i + 1} (${itemCode}): ${err.message}`);
      skipped++;
    }
  }

  // Execute all operations in a single bulkWrite
  if (operations.length > 0) {
    console.log(`🚀 מבצע ${operations.length} פעולות במערכת...`);
    try {
      await Item.bulkWrite(operations);
      console.log(`✅ בוצעו בהצלחה\n`);
    } catch (err: any) {
      console.error(`❌ שגיאה בעדכון: ${err.message}\n`);
      errors.push(`שגיאה כללית בעדכון: ${err.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(100));
  console.log('סיכום / Summary');
  console.log('='.repeat(100));
  console.log(`✅ עודכנו:       ${updated}`);
  console.log(`🆕 נוצרו חדשים: ${created}`);
  console.log(`⏭️ דולגו/שגיאות: ${skipped}`);

  if (errors.length > 0) {
    console.log('\nשגיאות:');
    errors.forEach((e) => console.log(`  - ${e}`));
  }

  console.log('='.repeat(100));

  await disconnectDB();
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
