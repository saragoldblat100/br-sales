/**
 * Script to generate audit report as Excel file with multiple sheets
 * Usage: npx ts-node scripts/generate-audit-excel.ts
 *
 * Creates an organized Excel file with:
 * - Sheet 1: Missing items (לא קיימים)
 * - Sheet 2: Incomplete items (חסרים נתונים)
 * - Sheet 3: Complete items (הכל בסדר)
 * - Sheet 4: Summary statistics
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

const OUTPUT_FILE = path.resolve(
  __dirname,
  '../Excel File/הכנסת נתונים לאפליקציה/דוח-ביקורת-פריטים.xlsx'
);

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
  console.log('🚀 Generating audit Excel report...\n');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  // Read Excel
  console.log('📖 Reading items from Excel...');
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

  // Extract all itemCodes from Excel
  console.log('📥 Loading items from database...');
  const itemCodesToCheck: string[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const itemCode = String(row[0] ?? '').trim();
    if (itemCode) itemCodesToCheck.push(itemCode);
  }

  // Batch load all items
  const allItems = await Item.find({ itemCode: { $in: itemCodesToCheck } }).lean();
  const itemMap = new Map(allItems.map((item) => [item.itemCode, item]));

  console.log(`✅ Loaded ${allItems.length} items`);

  // Batch load margin rules
  console.log('📥 Loading margin rules...');
  const allMargins = await MarginRule.find({ isActive: true }).lean();

  // Cache margins by categoryId
  const marginMap = new Map<string, any>();
  allMargins.forEach((margin) => {
    const catId = margin.categoryId.toString();
    const existing = marginMap.get(catId);
    if (!existing || new Date(margin.validFrom) > new Date(existing.validFrom)) {
      marginMap.set(catId, margin);
    }
  });

  console.log(`✅ Loaded ${marginMap.size} margin rules\n`);

  // Audit all items
  console.log('🔍 Auditing items...');
  const audits: ItemAudit[] = [];

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

      const catIdStr = item.categoryId?.toString();
      const margin = catIdStr ? marginMap.get(catIdStr) : null;

      if (item.categoryId && !margin) {
        audit.missing.push('אחוז רווח (לקטגוריה)');
      }

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
  }

  // Categorize audits
  const notExist = audits.filter((a) => !a.exists);
  const incomplete = audits.filter((a) => a.exists && a.missing.length > 0);
  const complete = audits.filter((a) => a.exists && a.missing.length === 0);

  console.log(`✅ Audit complete: ${notExist.length} missing, ${incomplete.length} incomplete, ${complete.length} complete\n`);

  // Create workbook
  console.log('📝 Creating Excel file...');
  const wb = XLSX.utils.book_new();

  // Sheet 1: Missing items
  const missingData = [
    ['מקט פריט', 'תיאור עברית', 'תיאור אנגלית'],
    ...notExist.map((a) => [a.itemCode, a.hebrewDesc, a.englishDesc]),
  ];
  const wsNotExist = XLSX.utils.aoa_to_sheet(missingData);
  XLSX.utils.book_append_sheet(wb, wsNotExist, 'לא קיימים');

  // Sheet 2: Incomplete items
  const incompleteData = [
    [
      'מקט פריט',
      'תיאור עברית',
      'תיאור אנגלית',
      'מחיר ספק',
      'קטגוריה',
      'אחוז רווח',
      'CBM',
      'יחידות בקרטון',
      'חסרים',
    ],
    ...incomplete.map((a) => [
      a.itemCode,
      a.hebrewDesc,
      a.englishDesc,
      a.currentValues?.supplierPrice || '-',
      a.currentValues?.category || '-',
      a.currentValues?.marginPercentage || '-',
      a.currentValues?.boxCBM || '-',
      a.currentValues?.qtyPerCarton || '-',
      a.missing.join(' | '),
    ]),
  ];
  const wsIncomplete = XLSX.utils.aoa_to_sheet(incompleteData);
  XLSX.utils.book_append_sheet(wb, wsIncomplete, 'חסרים נתונים');

  // Sheet 3: Complete items
  const completeData = [
    [
      'מקט פריט',
      'תיאור עברית',
      'תיאור אנגלית',
      'מחיר ספק (USD)',
      'קטגוריה',
      'אחוז רווח (%)',
      'CBM',
      'יחידות בקרטון',
    ],
    ...complete.map((a) => [
      a.itemCode,
      a.hebrewDesc,
      a.englishDesc,
      a.currentValues?.supplierPrice || '',
      a.currentValues?.category || '',
      a.currentValues?.marginPercentage || '',
      a.currentValues?.boxCBM || '',
      a.currentValues?.qtyPerCarton || '',
    ]),
  ];
  const wsComplete = XLSX.utils.aoa_to_sheet(completeData);
  XLSX.utils.book_append_sheet(wb, wsComplete, 'הכל בסדר');

  // Sheet 4: Summary statistics
  const summaryData = [
    ['סטטיסטיקה', 'כמות'],
    ['סה"כ פריטים בקובץ', audits.length],
    ['✅ קיימים במערכת', audits.filter((a) => a.exists).length],
    ['❌ לא קיימים', notExist.length],
    ['⚠️ חסרים נתונים', incomplete.length],
    ['✅ הכל בסדר', complete.length],
    ['', ''],
    ['בעיות נפוצות', 'מספר פריטים'],
  ];

  // Count missing types
  const missingCount = new Map<string, number>();
  incomplete.forEach((a) => {
    a.missing.forEach((m) => {
      missingCount.set(m, (missingCount.get(m) || 0) + 1);
    });
  });

  missingCount.forEach((count, issue) => {
    summaryData.push([issue, count]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'סיכום');

  // Save file
  XLSX.writeFile(wb, OUTPUT_FILE);
  console.log(`✅ Excel file saved: ${OUTPUT_FILE}\n`);

  // Print summary
  console.log('='.repeat(80));
  console.log('סיכום הדוח / Report Summary');
  console.log('='.repeat(80));
  console.log(`
📊 סטטיסטיקה:
   • סה"כ פריטים בקובץ:    ${audits.length}
   • ✅ קיימים במערכת:      ${audits.filter((a) => a.exists).length}
   • ❌ לא קיימים:          ${notExist.length}
   • ⚠️  חסרים נתונים:      ${incomplete.length}
   • ✅ הכל בסדר:           ${complete.length}

📝 בעיות נפוצות:
`);
  missingCount.forEach((count, issue) => {
    console.log(`   • ${issue}: ${count} פריטים`);
  });

  console.log(`\n📥 קובץ אקסל נשמר ב:\n   ${OUTPUT_FILE}\n`);
  console.log('='.repeat(80));

  await disconnectDB();
}

main();
