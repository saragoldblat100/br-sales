import { CurrencyRate, ICurrencyRate } from './currency.model';
import { createLogger } from '@/shared/utils';

const logger = createLogger('CurrencyService');

/**
 * שליפת שער הדולר מבנק ישראל
 */
async function fetchUSDRateFromBankOfIsrael(): Promise<number | null> {
  try {
    // API החדש של בנק ישראל
    const url = 'https://boi.org.il/PublicApi/GetExchangeRates';

    logger.info('שולף שער דולר מבנק ישראל...');

    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      logger.error('שגיאה בשליפת שער מבנק ישראל:', response.status);
      return null;
    }

    const data = await response.json() as {
      exchangeRates?: Array<{ key: string; currentExchangeRate: string }>;
    };

    // חילוץ שער דולר מה-JSON
    const usdData = data.exchangeRates?.find((rate) => rate.key === 'USD');

    if (usdData && usdData.currentExchangeRate) {
      const usdRate = parseFloat(usdData.currentExchangeRate);
      logger.info(`שער דולר מבנק ישראל: ${usdRate}`);
      return usdRate;
    }

    logger.error('לא נמצא שער דולר בתשובה מבנק ישראל');
    return null;
  } catch (error) {
    logger.error('שגיאה בשליפת שער דולר:', error);
    return null;
  }
}

/**
 * בדיקה אם יש שער דולר להיום
 */
export async function getTodayRate(): Promise<ICurrencyRate | null> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rate = await CurrencyRate.findOne({
    date: { $gte: today },
    isActive: true,
  }).sort({ date: -1 });

  return rate;
}

/**
 * עדכון או יצירת שער דולר להיום
 */
export async function updateTodayRate(marginPercentage = 5): Promise<ICurrencyRate | null> {
  try {
    // בדוק אם כבר יש שער להיום
    let todayRate = await getTodayRate();

    if (todayRate) {
      logger.info(`כבר קיים שער דולר להיום: ${todayRate.usdRateWithMargin}`);
      return todayRate;
    }

    // אין שער להיום - נסה לשלוף מבנק ישראל
    logger.info('אין שער דולר להיום, שולף מבנק ישראל...');

    const usdRate = await fetchUSDRateFromBankOfIsrael();

    if (!usdRate) {
      logger.warn('לא ניתן לשלוף שער מבנק ישראל');
      return null;
    }

    // צור שער חדש
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const usdRateWithMargin = usdRate * (1 + marginPercentage / 100);

    todayRate = await CurrencyRate.create({
      date: today,
      usdRate: usdRate,
      usdRateWithMargin: usdRateWithMargin,
      marginPercentage: marginPercentage,
      source: 'bank',
      isActive: true,
    });

    logger.info(`נוצר שער דולר חדש להיום: ${todayRate.usdRateWithMargin}`);

    return todayRate;
  } catch (error) {
    logger.error('שגיאה בעדכון שער דולר:', error);
    return null;
  }
}

/**
 * שליפת שער הדולר הנוכחי (עם מרווח)
 */
export async function getCurrentRate(): Promise<ICurrencyRate | null> {
  let rate = await getTodayRate();

  // אם אין שער להיום, נסה לעדכן
  if (!rate) {
    rate = await updateTodayRate();
  }

  // אם עדיין אין שער, החזר את השער האחרון
  if (!rate) {
    rate = await CurrencyRate.findOne({ isActive: true }).sort({ date: -1 });
  }

  return rate;
}

/**
 * יצירת שער ידני
 */
export async function createManualRate(
  usdRate: number,
  marginPercentage = 5
): Promise<ICurrencyRate> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // מחק שער קיים להיום אם יש
  await CurrencyRate.deleteMany({ date: { $gte: today } });

  const usdRateWithMargin = usdRate * (1 + marginPercentage / 100);

  const rate = await CurrencyRate.create({
    date: today,
    usdRate: usdRate,
    usdRateWithMargin: usdRateWithMargin,
    marginPercentage: marginPercentage,
    source: 'manual',
    isActive: true,
  });

  logger.info(`נוצר שער דולר ידני: ${rate.usdRateWithMargin}`);

  return rate;
}
