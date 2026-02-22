/**
 * Script to update margin rule for a specific category
 * Usage: npx ts-node scripts/update-margin-rule.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/features/items/category.model';
import { MarginRule } from '../src/features/items/marginRule.model';

async function main() {
  console.log('='.repeat(80));
  console.log('עדכון אחוז רווח / Update Margin Rule');
  console.log('='.repeat(80));
  console.log('');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    // Find the "קשים" (Straws) category
    const category = await Category.findOne({
      $or: [{ nameHe: 'קשים' }, { name: 'קשים' }, { nameEn: 'Straws' }]
    }).lean();

    if (!category) {
      console.error('❌ קטגוריית "קשים" לא נמצאת');
      await disconnectDB();
      process.exit(1);
    }

    console.log(`📌 קטגוריה שנמצאה: ${category.nameHe} (${category.nameEn})`);
    console.log(`   ID: ${category._id}`);
    console.log('');

    // Find existing margin rule for this category
    const existingMargin = await MarginRule.findOne({
      categoryId: category._id,
      isActive: true,
    }).sort({ validFrom: -1 });

    if (existingMargin) {
      console.log(`📊 אחוז רווח קיים: ${existingMargin.marginPercentage}%`);
      console.log(`   תאריך: ${existingMargin.validFrom}`);
      console.log('');

      // Update existing margin
      existingMargin.marginPercentage = 25;
      existingMargin.validFrom = new Date();
      await existingMargin.save();

      console.log(`✅ עודכן לאחוז רווח: 25%`);
      console.log(`   תאריך חדש: ${existingMargin.validFrom}`);
    } else {
      // Create new margin rule
      console.log('📊 אחוז רווח קיים: לא נמצא');
      console.log('');

      const newMargin = new MarginRule({
        categoryId: category._id,
        categoryName: category.nameHe,
        marginPercentage: 25,
        validFrom: new Date(),
        isActive: true,
      });

      await newMargin.save();
      console.log('✅ נוצר אחוז רווח חדש: 25%');
    }

    console.log('');
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
