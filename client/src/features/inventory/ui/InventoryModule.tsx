import { useState, useEffect, useRef } from 'react';
import { inventoryApi } from '../api';
import type {
  InventoryDataResponse,
  InventoryDuplicate,
  UploadMode,
  DuplicateAction,
} from '../api';
import { InventoryModuleView } from './InventoryModuleView';

interface InventoryModuleProps {
  user: {
    name?: string;
    username?: string;
    role?: string;
  };
  onBack: () => void;
  onLogout: () => void;
  canUpload: boolean;
}

export function InventoryModule({ onBack, onLogout, canUpload }: InventoryModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<InventoryDataResponse | null>(null);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
  const [duplicates, setDuplicates] = useState<InventoryDuplicate[] | null>(null);
  const [duplicateActions, setDuplicateActions] = useState<Record<string, DuplicateAction>>({});
  const [showRecentSold, setShowRecentSold] = useState(false);
  const [soldInputs, setSoldInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await inventoryApi.getInventoryData();
      setData(result);
    } catch {
      setError('שגיאה בטעינת נתוני מלאי');
    } finally {
      setLoading(false);
    }
  };

  // File upload handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      setError('יש להעלות קובץ Excel בלבד (.xlsx או .xls)');
      return;
    }
    setFile(selectedFile);
    setError(null);
    setUploadResult(null);
    setDuplicates(null);
    setDuplicateActions({});
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const modeToUse = uploadMode || 'replace';

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await inventoryApi.uploadFile(file, {
        mode: modeToUse,
        duplicateActions: modeToUse === 'append' && duplicates ? duplicateActions : undefined,
      });

      if (result.code === 'DUPLICATES' && result.duplicates) {
        const defaults: Record<string, DuplicateAction> = {};
        result.duplicates.forEach((duplicate) => {
          defaults[duplicate.itemCode] = 'skip';
        });
        setDuplicates(result.duplicates);
        setDuplicateActions(defaults);
        return;
      }

      if (result.success) {
        setUploadResult(result);
        setFile(null);
        setUploadMode(null);
        setDuplicates(null);
        setDuplicateActions({});
        await fetchInventoryData();
      } else {
        setError(result.message || 'שגיאה בהעלאת הקובץ');
      }
    } catch {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setUploading(false);
    }
  };

  const handleResolveDuplicates = async () => {
    if (!file || !duplicates) return;
    await handleUpload();
  };

  const handleDuplicateActionChange = (itemCode: string, action: DuplicateAction) => {
    setDuplicateActions((prev) => ({ ...prev, [itemCode]: action }));
  };

  const clearDuplicates = () => {
    setDuplicates(null);
    setDuplicateActions({});
  };

  const handleMarkSold = async (itemCode: string) => {
    const rawValue = soldInputs[itemCode];
    const soldQuantity = Number(rawValue);
    if (!soldQuantity || soldQuantity <= 0) {
      setError('יש להזין כמות תקינה שנמכרה');
      return;
    }

    try {
      const result = await inventoryApi.markSold(itemCode, soldQuantity);
      if (!result.success) {
        setError(result.message || 'שגיאה בעדכון מכירה');
        return;
      }
      setSoldInputs((prev) => ({ ...prev, [itemCode]: '' }));
      await fetchInventoryData();
    } catch {
      setError('שגיאה בהתחברות לשרת');
    }
  };

  const handleSoldInputChange = (itemCode: string, value: string) => {
    setSoldInputs((prev) => ({ ...prev, [itemCode]: value }));
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectUploadMode = (mode: UploadMode | null) => {
    setUploadMode(mode);
    setUploadResult(null);
    setError(null);
    if (mode === null) {
      setFile(null);
      setDuplicates(null);
      setDuplicateActions({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <InventoryModuleView
      loading={loading}
      error={error}
      data={data}
      canUpload={canUpload}
      uploadMode={uploadMode}
      file={file}
      uploading={uploading}
      uploadResult={uploadResult}
      dragActive={dragActive}
      fileInputRef={fileInputRef}
      duplicates={duplicates}
      duplicateActions={duplicateActions}
      showRecentSold={showRecentSold}
      onBack={onBack}
      onLogout={onLogout}
      onDrag={handleDrag}
      onDrop={handleDrop}
      onFileSelect={handleFileSelect}
      onUpload={handleUpload}
      onSelectUploadMode={handleSelectUploadMode}
      onClearFile={clearFile}
      onResolveDuplicates={handleResolveDuplicates}
      onDuplicateActionChange={handleDuplicateActionChange}
      onCancelDuplicates={clearDuplicates}
      onToggleRecentSold={() => setShowRecentSold((prev) => !prev)}
      onMarkSold={handleMarkSold}
      soldInputs={soldInputs}
      onSoldInputChange={handleSoldInputChange}
    />
  );
}
