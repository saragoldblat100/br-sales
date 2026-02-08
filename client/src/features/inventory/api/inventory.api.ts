import { api } from '@/shared/lib/api';

export interface InventoryItem {
  itemCode: string;
  itemDescription: string;
  quantity: number;
  color: string;
  pricePerCarton: number;
  soldQuantity: number;
  soldAt?: string | null;
}

export interface InventoryDataResponse {
  success: boolean;
  items: InventoryItem[];
  totalItems: number;
  uploadedAt?: string;
  uploadedBy?: string;
  message?: string;
}

export interface InventoryDuplicate {
  itemCode: string;
  itemDescription?: string;
  existingQuantity: number;
  newQuantity: number;
}

export type UploadMode = 'replace' | 'append';
export type DuplicateAction = 'add' | 'skip';

export interface InventoryUploadResponse {
  success: boolean;
  message: string;
  totalItems?: number;
  code?: 'DUPLICATES';
  duplicates?: InventoryDuplicate[];
}

export const inventoryApi = {
  /**
   * Get inventory data
   */
  async getInventoryData(): Promise<InventoryDataResponse> {
    const response = await api.get('/inventory');
    return response.data;
  },

  /**
   * Upload inventory Excel file
   */
  async uploadFile(
    file: File,
    options?: { mode?: UploadMode; duplicateActions?: Record<string, DuplicateAction> }
  ): Promise<InventoryUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mode', options?.mode || 'replace');
    if (options?.duplicateActions) {
      formData.append('duplicateActions', JSON.stringify(options.duplicateActions));
    }

    try {
      const response = await api.post('/inventory/upload', formData);
      return response.data;
    } catch (error: any) {
      const responseData = error?.response?.data;
      if (responseData) {
        return responseData as InventoryUploadResponse;
      }
      throw error;
    }
  },

  /**
   * Mark sold quantity for item
   */
  async markSold(itemCode: string, soldQuantity: number): Promise<{ success: boolean; message?: string }> {
    const response = await api.patch('/inventory/sold', { itemCode, soldQuantity });
    return response.data;
  },
};
