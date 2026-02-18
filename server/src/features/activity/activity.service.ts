import { ActivityLog, ActivityEventType } from './activity.model';

function getIsraelDate(date: Date = new Date()): string {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

function getIsraelTime(date: Date = new Date()): string {
  return date.toLocaleTimeString('he-IL', {
    timeZone: 'Asia/Jerusalem',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const activityService = {
  async log(
    userId: string,
    username: string,
    eventType: ActivityEventType,
    eventData: Record<string, any> = {}
  ): Promise<void> {
    try {
      const now = new Date();
      await ActivityLog.create({
        userId,
        username,
        eventType,
        eventData,
        dateIsrael: getIsraelDate(now),
        timestamp: now,
      });
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  },

  async getReport(date: string) {
    const logs = await ActivityLog.find({ dateIsrael: date })
      .sort({ timestamp: 1 })
      .lean();

    // Group by event type
    const logins: any[] = [];
    const logouts: any[] = [];
    const collections: any[] = [];
    const inventorySold: any[] = [];
    const orders: any[] = [];
    const customerViews: any[] = [];
    const itemViews: any[] = [];
    const visitSummaries: any[] = [];

    for (const log of logs) {
      const time = getIsraelTime(new Date(log.timestamp));

      switch (log.eventType) {
        case 'login':
          logins.push({ time, ...log.eventData });
          break;
        case 'logout':
          logouts.push({ time, ...log.eventData });
          break;
        case 'collection_mark':
          collections.push({ time, ...log.eventData });
          break;
        case 'inventory_sold':
          inventorySold.push({ time, ...log.eventData });
          break;
        case 'order_create':
          orders.push({ time, ...log.eventData });
          break;
        case 'customer_view':
          customerViews.push({ time, ...log.eventData });
          break;
        case 'item_view':
          itemViews.push({ time, ...log.eventData });
          break;
        case 'customer_visit_summary':
          visitSummaries.push({ time, ...log.eventData });
          break;
      }
    }

    // Build sessions from login/logout pairs
    const sessions: { loginTime: string; logoutTime: string | null; duration: string | null }[] = [];
    const loginTimes = logs.filter(l => l.eventType === 'login').map(l => l.timestamp);
    const logoutTimes = logs.filter(l => l.eventType === 'logout').map(l => l.timestamp);

    for (let i = 0; i < loginTimes.length; i++) {
      const loginT = new Date(loginTimes[i]);
      const logoutT = logoutTimes[i] ? new Date(logoutTimes[i]) : null;

      let duration: string | null = null;
      if (logoutT) {
        const diffMs = logoutT.getTime() - loginT.getTime();
        const hours = Math.floor(diffMs / 3600000);
        const minutes = Math.floor((diffMs % 3600000) / 60000);
        duration = `${hours}:${String(minutes).padStart(2, '0')}`;
      }

      sessions.push({
        loginTime: getIsraelTime(loginT),
        logoutTime: logoutT ? getIsraelTime(logoutT) : null,
        duration,
      });
    }

    return {
      date,
      sessions,
      collections,
      inventorySold,
      orders,
      customerViews,
      itemViews,
      visitSummaries,
    };
  },
};
