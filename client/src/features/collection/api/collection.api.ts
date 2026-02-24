import { api } from '@/shared/lib/api';

export interface CollectionItem {
  itemCode: string;
  itemDescription: string;
  quantity: number;
  currency: string;
  pricePerUnit: number;
  rowTotal: number;
  totalWithVAT: number;
}

export interface CollectionCase {
  caseNumber: string;
  orderNumber: string;
  deliveryNoteNumber: string;
  expectedArrivalDate: string | null;
  expectedArrivalDateFormatted?: string;
  items: CollectionItem[];
  caseTotal: number;
  caseTotalWithVAT: number;
  partialRecord?: {
    collectedAmount: number;
    notes: string;
  } | null;
}

export interface CollectionCustomer {
  customerName: string;
  cases: CollectionCase[];
  totalCases: number;
  totalItems: number;
  totalAmount: number;
  totalWithVAT: number;
  earliestDate: string | null;
  urgency: {
    level: string;
    color: string;
    daysLeft: number | null;
  };
}

export interface CollectionDataResponse {
  success: boolean;
  customers: CollectionCustomer[];
  totalCustomers: number;
  totalAmount: number;
  totalWithVAT: number;
  totalCollected: number;
  totalCollectedCases: number;
  message?: string;
}

export interface CollectionStatsResponse {
  success: boolean;
  totalCollected: number;
  totalCases: number;
  records: Array<{
    caseNumber: string;
    customerName: string;
    collectedAmount: number;
    collectedAt: string;
    collectedBy: string;
    notes?: string;
    isPartial?: boolean;
  }>;
  byDate: Record<string, { count: number; amount: number }>;
}

export type CollectionUploadMode = 'replace' | 'append';

export interface CollectionUploadResponse {
  success: boolean;
  message: string;
  totalRows?: number;
  addedCount?: number;
  skippedCount?: number;
}

export const collectionApi = {
  /**
   * Get all collection data
   */
  async getCollectionData(): Promise<CollectionDataResponse> {
    const response = await api.get('/collection');
    return response.data;
  },

  /**
   * Upload collection Excel file
   */
  async uploadFile(
    file: File,
    mode: CollectionUploadMode = 'replace'
  ): Promise<CollectionUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', mode);

    const response = await api.post('/collection/upload', formData);
    return response.data;
  },

  /**
   * Mark a case as collected
   */
  async markCollected(
    caseNumber: string,
    customerName: string,
    collectedAmount: number,
    collectedBy: string,
    note?: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/collection/mark-collected', {
      caseNumber,
      customerName,
      collectedAmount,
      collectedBy,
      note,
    });
    return response.data;
  },

  /**
   * Unmark a case (remove from collected)
   */
  async unmarkCollected(
    caseNumber: string,
    customerName: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/collection/unmark-collected', {
      caseNumber,
      customerName,
    });
    return response.data;
  },

  /**
   * Delete a collected case permanently
   */
  async deleteCollected(
    caseNumber: string,
    customerName: string
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/collection/delete-collected', {
      caseNumber,
      customerName,
    });
    return response.data;
  },

  /**
   * Get collection statistics
   */
  async getStats(): Promise<CollectionStatsResponse> {
    const response = await api.get('/collection/stats');
    return response.data;
  },
};
