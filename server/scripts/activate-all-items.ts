/**
 * Script to activate all inactive items
 * Usage: npx ts-node scripts/activate-all-items.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { Item } from '../src/features/items/item.model';

async function main() {
  console.log('='.repeat(80));
  console.log('הפעלת כל הפריטים / Activate All Items');
  console.log('='.repeat(80));
  console.log('');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  // Count inactive before
  const inactiveBefore = await Item.countDocuments({ isActive: false });
  console.log(`📊 פריטים לא פעילים לפני: ${inactiveBefore}\n`);

  if (inactiveBefore === 0) {
    console.log('✅ אין פריטים לא פעילים!');
    await disconnectDB();
    process.exit(0);
  }

  // Activate all
  console.log('🚀 מפעיל את כל הפריטים...');
  const result = await Item.updateMany(
    { isActive: false },
    { $set: { isActive: true } }
  );

  console.log(`✅ עודכנו: ${result.modifiedCount} פריטים`);

  // Count inactive after
  const inactiveAfter = await Item.countDocuments({ isActive: false });
  console.log(`📊 פריטים לא פעילים אחרי: ${inactiveAfter}`);

  console.log('\n='.repeat(80));
  console.log('✅ הפעלה הושלמה בהצלחה!');
  console.log('='.repeat(80));

  await disconnectDB();
}

main();
