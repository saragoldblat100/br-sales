/**
 * Script to update margin for delivery categories to 15%
 * Usage: npx ts-node scripts/update-delivery-margins.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/features/items/category.model';
import { MarginRule } from '../src/features/items/marginRule.model';

async function main() {
  console.log('='.repeat(80));
  console.log('עדכון אחוז רווח לקטגוריות הגשה / Update Delivery Category Margins to 15%');
  console.log('='.repeat(80));
  console.log('');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    // Find "Serving Items" category
    const deliveryCategories = await Category.find({
      $or: [
        { nameEn: 'Serving Items' },
        { nameHe: 'Serving Items' },
        { name: 'Serving Items' },
      ],
    });

    if (deliveryCategories.length === 0) {
      console.log('❌ לא נמצאה קטגוריית "Serving Items" במערכת');
      await disconnectDB();
      process.exit(0);
    }

    console.log(`📌 נמצאה קטגוריית Serving Items:\n`);

    let updated = 0;
    let created = 0;

    for (const category of deliveryCategories) {
      const categoryName = category.nameHe || category.nameEn || category.name;
      console.log(`  📋 ${categoryName}`);
      console.log(`     ID: ${category._id}`);

      // Find existing margin rule
      const existingMargin = await MarginRule.findOne({
        categoryId: category._id,
        isActive: true,
      }).sort({ validFrom: -1 });

      if (existingMargin) {
        console.log(`     אחוז רווח קיים: ${existingMargin.marginPercentage}%`);

        if (existingMargin.marginPercentage !== 15) {
          // Update existing margin
          existingMargin.marginPercentage = 15;
          existingMargin.validFrom = new Date();
          await existingMargin.save();
          console.log(`     ✅ עודכן ל: 15%\n`);
          updated++;
        } else {
          console.log(`     ✓ כבר מוגדר ל: 15%\n`);
        }
      } else {
        // Create new margin rule
        console.log(`     אחוז רווח קיים: לא נמצא`);

        const newMargin = new MarginRule({
          categoryId: category._id,
          categoryName,
          marginPercentage: 15,
          validFrom: new Date(),
          isActive: true,
        });

        await newMargin.save();
        console.log(`     ✅ נוצר חדש: 15%\n`);
        created++;
      }
    }

    console.log('='.repeat(80));
    console.log('סיכום / Summary');
    console.log('='.repeat(80));
    console.log(`✅ עודכנו:       ${updated}`);
    console.log(`🆕 נוצרו חדשים: ${created}`);
    console.log(`📊 סה"כ:        ${deliveryCategories.length}`);
    console.log('='.repeat(80));
  } catch (err) {
    console.error('❌ Error:', err);
    await disconnectDB();
    process.exit(1);
  }

  await disconnectDB();
}

main();
