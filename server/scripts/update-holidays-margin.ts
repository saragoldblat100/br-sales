/**
 * Script to update margin for Holidays & Events category to 30%
 * Usage: npx ts-node scripts/update-holidays-margin.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/features/items/category.model';
import { MarginRule } from '../src/features/items/marginRule.model';

async function main() {
  console.log('='.repeat(80));
  console.log('עדכון אחוז רווח לקטגוריית חגים / Update Holidays & Events Margin to 30%');
  console.log('='.repeat(80));
  console.log('');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    // Find "Holidays & Events" category
    const holidayCategory = await Category.findOne({
      $or: [
        { name: 'Holidays & Events' },
        { nameEn: 'Holidays & Events' },
      ],
    });

    if (!holidayCategory) {
      console.log('❌ לא נמצאה קטגוריית "Holidays & Events" במערכת');
      await disconnectDB();
      process.exit(0);
    }

    const categoryName = holidayCategory.nameHe || holidayCategory.nameEn || holidayCategory.name;
    console.log(`📌 נמצאה קטגוריית ${categoryName}:\n`);
    console.log(`     ID: ${holidayCategory._id}`);

    // Find existing margin rule
    const existingMargin = await MarginRule.findOne({
      categoryId: holidayCategory._id,
      isActive: true,
    }).sort({ validFrom: -1 });

    if (existingMargin) {
      console.log(`     אחוז רווח קיים: ${existingMargin.marginPercentage}%`);

      if (existingMargin.marginPercentage !== 30) {
        // Update existing margin
        existingMargin.marginPercentage = 30;
        existingMargin.validFrom = new Date();
        await existingMargin.save();
        console.log(`     ✅ עודכן ל: 30%\n`);
      } else {
        console.log(`     ✓ כבר מוגדר ל: 30%\n`);
      }
    } else {
      // Create new margin rule
      console.log(`     אחוז רווח קיים: לא נמצא`);

      const newMargin = new MarginRule({
        categoryId: holidayCategory._id,
        categoryName,
        marginPercentage: 30,
        validFrom: new Date(),
        isActive: true,
      });

      await newMargin.save();
      console.log(`     ✅ נוצר חדש: 30%\n`);
    }

    console.log('='.repeat(80));
    console.log('✅ עדכון הושלם בהצלחה!');
    console.log('='.repeat(80));
  } catch (err) {
    console.error('❌ Error:', err);
    await disconnectDB();
    process.exit(1);
  }

  await disconnectDB();
}

main();
