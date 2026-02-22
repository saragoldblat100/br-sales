/**
 * Script to update freight rate in MongoDB
 * Usage: npx ts-node scripts/update-freight-rate.ts
 */

import { connectDB, disconnectDB } from '../src/config/db';
import { FreightRate } from '../src/features/items/freightRate.model';

const FREIGHT_COST = 5800;
const PORT_OF_ORIGIN = 'Shenzhen Yantian';

async function main() {
  console.log('='.repeat(60));
  console.log('עדכון מחיר הובלה / Update Freight Rate');
  console.log('='.repeat(60));
  console.log(`מחיר חדש: ${FREIGHT_COST}`);
  console.log(`נמל: ${PORT_OF_ORIGIN}\n`);

  const connected = await connectDB();
  if (!connected) {
    console.error('❌ Failed to connect to MongoDB');
    process.exit(1);
  }

  try {
    // Update all active freight rates
    const containerSizes = [33, 57, 68];

    for (const size of containerSizes) {
      const result = await FreightRate.findOneAndUpdate(
        {
          portOfOrigin: PORT_OF_ORIGIN,
          containerSizeCBM: size,
          isActive: true,
        },
        {
          $set: {
            freightCost: FREIGHT_COST,
            validFrom: new Date(),
          },
        },
        { upsert: true, new: true }
      );

      if (result) {
        console.log(`✅ עודכן CBM ${size}: ${FREIGHT_COST} ₪`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ הובלות עודכנו בהצלחה');
    console.log('='.repeat(60));
  } catch (err) {
    console.error('❌ Error updating freight rates:', err);
    await disconnectDB();
    process.exit(1);
  }

  await disconnectDB();
}

main();
