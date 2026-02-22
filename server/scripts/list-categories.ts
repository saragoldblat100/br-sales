/**
 * Script to list all categories in the system
 * Usage: npx ts-node scripts/list-categories.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/features/items/category.model';

async function main() {
  console.log('='.repeat(100));
  console.log('קטגוריות במערכת / Categories in System');
  console.log('='.repeat(100));
  console.log('');

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    const categories = await Category.find({}).select('_id name nameEn nameHe order isActive').lean();

    if (categories.length === 0) {
      console.log('❌ אין קטגוריות במערכת');
      await disconnectDB();
      process.exit(0);
    }

    console.log('📋 רשימת קטגוריות:');
    console.log('');

    categories.forEach((cat, idx) => {
      const status = cat.isActive ? '✅' : '❌';
      console.log(`${idx + 1}. ${status} ${cat.nameHe || cat.name || '-'}`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   שם אנגלית: ${cat.nameEn || '-'}`);
      console.log(`   שם בסיסי: ${cat.name || '-'}`);
      console.log(`   סדר: ${cat.order || '-'}`);
      console.log('');
    });

    console.log('='.repeat(100));
    console.log(`סה"כ: ${categories.length} קטגוריות`);
    console.log('='.repeat(100));
  } catch (err) {
    console.error('Error:', err);
  }

  await disconnectDB();
}

main();
