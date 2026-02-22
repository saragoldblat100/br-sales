import { connectDB, disconnectDB } from '../src/config/db';
import { Category } from '../src/features/items/category.model';

(async () => {
  await connectDB();
  const cats = await Category.find({}).select('_id name nameEn nameHe order').sort({ order: 1 });
  console.log('\nקטגוריות במערכת:\n');
  cats.forEach((cat, idx) => {
    console.log(`${idx + 1}. ${cat.nameHe || cat.nameEn || cat.name}`);
  });
  await disconnectDB();
})();
