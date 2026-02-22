/**
 * Script to audit items against master list
 * Usage: npx ts-node scripts/items-audit.ts [--quiet]
 *
 * Generates a report of all items in the Excel file:
 * - Whether they exist in the system
 * - Missing required fields:
 *   1. supplierPrice
 *   2. margin percentage (from category)
 *   3. category
 *   4. boxCBM
 *   5. qtyPerCarton
 *
 * Performance optimizations:
 * - Batch load all items once
 * - Batch load all margin rules once
 * - Cache margin rules by categoryId
 * - Use .lean() to reduce overhead
 */

import path from 'path';
import * as XLSX from 'xlsx';
import { connectDB, disconnectDB } from '../src/config/db';
import { Item } from '../src/features/items/item.model';
import { MarginRule } from '../src/features/items/marginRule.model';

const EXCEL_FILE = path.resolve(
  __dirname,
  '../Excel File/הכנסת נתונים לאפליקציה/פריטים.xlsx'
);

const QUIET_MODE = process.argv.includes('--quiet');

interface ItemAudit {
  itemCode: string;
  hebrewDesc: string;
  englishDesc: string;
  exists: boolean;
  missing: string[];
  currentValues?: {
    supplierPrice?: number;
    category?: string;
    categoryId?: string;
    boxCBM?: number;
    qtyPerCarton?: number;
    marginPercentage?: number;
  };
}

async function main() {
  if (!QUIET_MODE) {
    console.log('='.repeat(80));
    console.log('דוח ביקורת פריטים / Items Audit Report');
    console.log('='.repeat(80));
    console.log(`קובץ: ${EXCEL_FILE}\n`);
  }

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

  if (!QUIET_MODE) console.log('📥 Loading items from database...');

  // Step 1: Extract all itemCodes from Excel
  const itemCodesToCheck: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const itemCode = String(row[0] ?? '').trim();
    if (itemCode) itemCodesToCheck.push(itemCode);
  }

  // Step 2: Batch load all items at once
  const allItems = await Item.find({ itemCode: { $in: itemCodesToCheck } }).lean();
  const itemMap = new Map(allItems.map((item) => [item.itemCode, item]));

  if (!QUIET_MODE) console.log(`✅ Loaded ${allItems.length} items`);

  // Step 3: Batch load all margin rules and cache by categoryId
  if (!QUIET_MODE) console.log('📥 Loading margin rules...');
  const allMargins = await MarginRule.find({ isActive: true }).lean();

  // Group margins by categoryId, keep only the latest (validFrom)
  const marginMap = new Map<string, any>();
  allMargins.forEach((margin) => {
    const catId = margin.categoryId.toString();
    const existing = marginMap.get(catId);
    if (!existing || new Date(margin.validFrom) > new Date(existing.validFrom)) {
      marginMap.set(catId, margin);
    }
  });

  if (!QUIET_MODE) console.log(`✅ Loaded ${marginMap.size} margin rules`);

  const audits: ItemAudit[] = [];

  // Step 4: Process all rows - now with cached data (no DB queries!)
  if (!QUIET_MODE) console.log('🔍 Auditing items...\n');

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];

    const itemCode = String(row[0] ?? '').trim();
    const hebrewDesc = String(row[1] ?? '').trim();
    const englishDesc = String(row[2] ?? '').trim();

    if (!itemCode) continue;

    const item = itemMap.get(itemCode);

    const audit: ItemAudit = {
      itemCode,
      hebrewDesc,
      englishDesc,
      exists: !!item,
      missing: [],
    };

    if (!item) {
      audit.missing.push('פריט לא קיים במערכת');
    } else {
      // Check required fields
      if (!item.supplierPrice || item.supplierPrice === 0) {
        audit.missing.push('מחיר ספק');
      }

      if (!item.categoryId) {
        audit.missing.push('קטגוריה');
      }

      if (!item.boxCBM || item.boxCBM === 0) {
        audit.missing.push('CBM לקרטון');
      }

      if (!item.qtyPerCarton || item.qtyPerCarton === 0) {
        audit.missing.push('יחידות בקרטון');
      }

      // Get margin from cache
      const catIdStr = item.categoryId?.toString();
      const margin = catIdStr ? marginMap.get(catIdStr) : null;

      if (item.categoryId && !margin) {
        audit.missing.push('אחוז רווח (לקטגוריה)');
      }

      // Store current values
      audit.currentValues = {
        supplierPrice: item.supplierPrice,
        category: item.category,
        categoryId: catIdStr,
        boxCBM: item.boxCBM,
        qtyPerCarton: item.qtyPerCarton,
        marginPercentage: margin?.marginPercentage,
      };
    }

    audits.push(audit);

    if (!QUIET_MODE && i % 50 === 0) {
      console.log(`  Processed ${i} items...`);
    }
  }

  // Generate report
  console.log('');
  const existing = audits.filter((a) => a.exists);
  const missing = audits.filter((a) => !a.exists);
  const incomplete = audits.filter((a) => a.exists && a.missing.length > 0);

  console.log(`📊 סטטיסטיקה:`);
  console.log(`   סה"כ פריטים בקובץ:        ${audits.length}`);
  console.log(`   ✅ קיימים במערכת:        ${existing.length}`);
  console.log(`   ❌ לא קיימים:             ${missing.length}`);
  console.log(`   ⚠️  חסרים נתונים:         ${incomplete.length}`);
  console.log('');

  // Print detailed report
  console.log('='.repeat(80));
  console.log('דוח מפורט / Detailed Report');
  console.log('='.repeat(80));

  audits.forEach((audit, idx) => {
    const status = audit.exists ? (audit.missing.length === 0 ? '✅' : '⚠️ ') : '❌';
    console.log(`\n${idx + 1}. ${status} ${audit.itemCode}`);
    console.log(`   עברית: ${audit.hebrewDesc}`);
    console.log(`   אנגלית: ${audit.englishDesc}`);

    if (!audit.exists) {
      console.log(`   ❌ לא קיים במערכת`);
    } else if (audit.missing.length === 0) {
      console.log(`   ✅ כל הנתונים מלאים`);
      if (audit.currentValues) {
        console.log(`      • מחיר ספק: ${audit.currentValues.supplierPrice} USD`);
        console.log(`      • קטגוריה: ${audit.currentValues.category}`);
        console.log(`      • אחוז רווח: ${audit.currentValues.marginPercentage}%`);
        console.log(`      • CBM: ${audit.currentValues.boxCBM}`);
        console.log(`      • יחידות בקרטון: ${audit.currentValues.qtyPerCarton}`);
      }
    } else {
      console.log(`   ⚠️  חסרים נתונים:`);
      audit.missing.forEach((m) => console.log(`      • ${m}`));
      if (audit.currentValues) {
        console.log(`   נתונים קיימים:`);
        if (audit.currentValues.supplierPrice)
          console.log(`      • מחיר ספק: ${audit.currentValues.supplierPrice} USD`);
        if (audit.currentValues.category)
          console.log(`      • קטגוריה: ${audit.currentValues.category}`);
        if (audit.currentValues.marginPercentage)
          console.log(`      • אחוז רווח: ${audit.currentValues.marginPercentage}%`);
        if (audit.currentValues.boxCBM)
          console.log(`      • CBM: ${audit.currentValues.boxCBM}`);
        if (audit.currentValues.qtyPerCarton)
          console.log(`      • יחידות בקרטון: ${audit.currentValues.qtyPerCarton}`);
      }
    }
  });

  // Summary tables
  console.log('\n' + '='.repeat(80));
  console.log('סיכום / Summary');
  console.log('='.repeat(80));

  if (missing.length > 0) {
    console.log('\n❌ פריטים לא קיימים במערכת:');
    missing.forEach((m) => console.log(`   • ${m.itemCode} - ${m.hebrewDesc}`));
  }

  if (incomplete.length > 0) {
    console.log('\n⚠️  פריטים עם נתונים חסרים:');
    incomplete.forEach((m) => {
      console.log(`   • ${m.itemCode} - חסר: ${m.missing.join(', ')}`);
    });
  }

  if (existing.length === audits.length && incomplete.length === 0) {
    console.log('\n✅ כל הפריטים קיימים עם כל הנתונים המלאים!');
  }

  console.log('\n' + '='.repeat(80));

  // Generate CSV export option
  const csvFile = path.join(path.dirname(EXCEL_FILE), 'items-audit-report.csv');
  const csv = generateCSV(audits);
  const fs = await import('fs');
  fs.writeFileSync(csvFile, csv);
  console.log(`\n📄 ייצוא CSV: ${csvFile}`);

  await disconnectDB();
}

function generateCSV(audits: ItemAudit[]): string {
  const headers = [
    'מקט פריט',
    'תיאור עברית',
    'תיאור אנגלית',
    'קיים?',
    'מחיר ספק',
    'קטגוריה',
    'אחוז רווח',
    'CBM',
    'יחידות בקרטון',
    'חסרים',
  ];

  const rows = audits.map((a) => [
    a.itemCode,
    a.hebrewDesc,
    a.englishDesc,
    a.exists ? 'כן' : 'לא',
    a.currentValues?.supplierPrice || '-',
    a.currentValues?.category || '-',
    a.currentValues?.marginPercentage || '-',
    a.currentValues?.boxCBM || '-',
    a.currentValues?.qtyPerCarton || '-',
    a.missing.length === 0 ? 'הכל בסדר' : a.missing.join('; '),
  ]);

  return [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

main();
