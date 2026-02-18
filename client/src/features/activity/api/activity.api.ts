import { api } from '@/shared/lib/api';

export interface ActivitySession {
  loginTime: string;
  logoutTime: string | null;
  duration: string | null;
}

export interface ActivityCollection {
  time: string;
  caseNumber: string;
  customerName: string;
  collectedAmount: number;
}

export interface ActivityInventorySold {
  time: string;
  itemCode: string;
  soldQuantity: number;
}

export interface ActivityOrder {
  time: string;
  orderNumber: string;
  customerName: string;
  totalAmountILS: number;
  totalAmountUSD: number;
}

export interface ActivityCustomerView {
  time: string;
  customerName: string;
}

export interface ActivityItemView {
  time: string;
  itemCode: string;
  itemDescription: string;
}

export interface ActivityVisitSummary {
  time: string;
  customerName: string;
  customerCode: string;
  summary: string;
  skipped?: boolean;
}

export interface ActivityReport {
  date: string;
  sessions: ActivitySession[];
  collections: ActivityCollection[];
  inventorySold: ActivityInventorySold[];
  orders: ActivityOrder[];
  customerViews: ActivityCustomerView[];
  itemViews: ActivityItemView[];
  visitSummaries: ActivityVisitSummary[];
}

export const activityApi = {
  async getReport(date: string): Promise<ActivityReport> {
    const response = await api.get(`/activity/report?date=${date}`);
    return response.data.data;
  },

  async logView(eventType: 'customer_view' | 'item_view', eventData: Record<string, any>): Promise<void> {
    try {
      await api.post('/activity/log-view', { eventType, eventData });
    } catch {
      // Silently fail - don't block user flow for logging
    }
  },

  async logVisitSummary(payload: {
    customerName: string;
    customerCode: string;
    summary: string;
    skipped?: boolean;
  }): Promise<void> {
    try {
      await api.post('/activity/log-view', {
        eventType: 'customer_visit_summary',
        eventData: payload,
      });
    } catch {
      // Silently fail - don't block user flow for logging
    }
  },
};
