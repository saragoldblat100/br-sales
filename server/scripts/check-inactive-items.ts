/**
 * Script to check inactive items
 * Usage: npx ts-node scripts/check-inactive-items.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { Item } from '../src/features/items/item.model';

async function main() {
  console.log('='.repeat(80));
  console.log('בדיקת פריטים לא פעילים / Check Inactive Items');
  console.log('='.repeat(80));
  console.log('');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  // Count inactive items
  const inactiveCount = await Item.countDocuments({ isActive: false });
  console.log(`📊 סה"כ פריטים לא פעילים: ${inactiveCount}\n`);

  if (inactiveCount === 0) {
    console.log('✅ אין פריטים לא פעילים!');
    await disconnectDB();
    process.exit(0);
  }

  // Get inactive items
  const inactiveItems = await Item.find({ isActive: false })
    .select('itemCode englishDescription nameHe supplierPrice boxCBM qtyPerCarton')
    .lean();

  console.log('📋 רשימת פריטים לא פעילים:');
  console.log('='.repeat(80));

  inactiveItems.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.itemCode}`);
    console.log(`   שם עברית: ${item.nameHe || '-'}`);
    console.log(`   תיאור: ${item.englishDescription}`);
    console.log(`   מחיר ספק: ${item.supplierPrice || '-'} USD`);
    console.log(`   CBM: ${item.boxCBM || '-'}`);
    console.log(`   יחידות בקרטון: ${item.qtyPerCarton || '-'}`);
    console.log('');
  });

  console.log('='.repeat(80));
  console.log(`✅ סה"כ: ${inactiveItems.length} פריטים לא פעילים`);
  console.log('='.repeat(80));

  await disconnectDB();
}

main();
