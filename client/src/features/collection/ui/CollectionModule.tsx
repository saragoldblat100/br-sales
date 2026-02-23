import { useState, useEffect, useRef, useMemo } from 'react';
import { collectionApi } from '../api';
import type { CollectionCase, CollectionDataResponse, CollectionStatsResponse, CollectionUploadMode } from '../api';
import { CollectionModuleView } from './CollectionModuleView';

interface CollectionModuleProps {
  user: {
    name?: string;
    username?: string;
    role?: string;
  };
  onBack: () => void;
  onLogout: () => void;
  canUpload: boolean;
}

export function CollectionModule({ user, onBack, onLogout, canUpload }: CollectionModuleProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CollectionDataResponse | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [expandedCases, setExpandedCases] = useState<Record<string, boolean>>({});
  const [markingCase, setMarkingCase] = useState<string | null>(null);
  const [collectionModal, setCollectionModal] = useState<{
    isOpen: boolean;
    caseItem: CollectionCase | null;
    customerName: string;
  }>({ isOpen: false, caseItem: null, customerName: '' });

  // Upload mode state
  const [uploadMode, setUploadMode] = useState<CollectionUploadMode | null>(null);

  // Filter state
  const [showRecentCollected, setShowRecentCollected] = useState(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [recentCollectedData, setRecentCollectedData] = useState<CollectionStatsResponse | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Unmark collection state
  const [unmarkModal, setUnmarkModal] = useState<{
    isOpen: boolean;
    caseNumber: string;
    customerName: string;
  }>({ isOpen: false, caseNumber: '', customerName: '' });
  const [unmarking, setUnmarking] = useState(false);

  useEffect(() => {
    fetchCollectionData();
  }, []);

  const fetchCollectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await collectionApi.getCollectionData();
      setData(result);
    } catch {
      setError('שגיאה בטעינת נתונים');
    } finally {
      setLoading(false);
    }
  };

  // Sort customers by urgency (daysLeft ascending, then by totalWithVAT descending)
  const sortedCustomers = useMemo(() => {
    if (!data?.customers) return [];

    return [...data.customers].sort((a, b) => {
      const aDays = a.urgency?.daysLeft ?? 999;
      const bDays = b.urgency?.daysLeft ?? 999;

      // Sort by daysLeft (ascending - more urgent first)
      if (aDays !== bDays) {
        return aDays - bDays;
      }

      // If same daysLeft, sort by totalWithVAT (descending - higher amount first)
      return b.totalWithVAT - a.totalWithVAT;
    });
  }, [data?.customers]);

  const openCollectionModal = (caseItem: CollectionCase, customerName: string) => {
    setCollectionModal({ isOpen: true, caseItem, customerName });
  };

  const closeCollectionModal = () => {
    setCollectionModal({ isOpen: false, caseItem: null, customerName: '' });
  };

  const markCaseAsCollected = async (collectedAmount: number) => {
    const { caseItem, customerName } = collectionModal;
    if (!caseItem || !customerName) return;

    setMarkingCase(caseItem.caseNumber);
    try {
      const result = await collectionApi.markCollected(
        caseItem.caseNumber,
        customerName,
        collectedAmount,
        user?.name || user?.username || ''
      );

      if (result.success) {
        closeCollectionModal();
        await fetchCollectionData();

        if (selectedCustomer) {
          const updatedCustomer = data?.customers?.find((c) => c.customerName === selectedCustomer);
          if (!updatedCustomer || updatedCustomer.cases.length <= 1) {
            setSelectedCustomer(null);
          }
        }
      } else {
        alert(result.message || 'שגיאה בסימון הגבייה');
      }
    } catch {
      alert('שגיאה בהתחברות לשרת');
    } finally {
      setMarkingCase(null);
    }
  };

  const toggleCase = (caseNumber: string) => {
    setExpandedCases((prev) => ({
      ...prev,
      [caseNumber]: !prev[caseNumber],
    }));
  };

  const handleUnmarkCollection = (caseNumber: string, customerName: string) => {
    setUnmarkModal({ isOpen: true, caseNumber, customerName });
  };

  const confirmUnmarkCollection = async () => {
    const { caseNumber, customerName } = unmarkModal;
    if (!caseNumber || !customerName) return;

    setUnmarking(true);
    try {
      const result = await collectionApi.unmarkCollected(caseNumber, customerName);

      if (result.success) {
        setUnmarkModal({ isOpen: false, caseNumber: '', customerName: '' });
        // Refresh the collection data
        await fetchCollectionData();

        // Refresh stats if showing recent collected
        if (showRecentCollected) {
          await fetchStats();
        }

        alert('הגבייה בוטלה בהצלחה');
      } else {
        alert(result.message || 'שגיאה בביטול הגבייה');
      }
    } catch {
      alert('שגיאה בהתחברות לשרת');
    } finally {
      setUnmarking(false);
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
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !uploadMode) return;

    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const result = await collectionApi.uploadFile(file, uploadMode);
      if (result.success) {
        setUploadResult(result);
        setFile(null);
        setUploadMode(null);
        await fetchCollectionData();
      } else {
        setError(result.message || 'שגיאה בהעלאת הקובץ');
      }
    } catch {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSelectUploadMode = (mode: CollectionUploadMode | null) => {
    setUploadMode(mode);
    setUploadResult(null);
    setError(null);
    if (mode === null) {
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const stats = await collectionApi.getStats();
      setRecentCollectedData(stats);
    } catch {
      setError('שגיאה בטעינת נתוני גבייה אחרונים');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleToggleRecentCollected = () => {
    const newValue = !showRecentCollected;
    setShowRecentCollected(newValue);
    setSelectedCustomer(null);
    if (newValue) {
      // When enabling, set default date to 30 days ago and fetch stats
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
      fetchStats();
    } else {
      setDateFrom('');
      setRecentCollectedData(null);
    }
  };

  const handleDateFromChange = (date: string) => {
    setDateFrom(date);
  };

  return (
    <CollectionModuleView
      loading={loading}
      error={error}
      data={data}
      customers={sortedCustomers}
      selectedCustomer={selectedCustomer}
      expandedCases={expandedCases}
      userRole={user?.role}
      canUpload={canUpload}
      uploadMode={uploadMode}
      file={file}
      uploading={uploading}
      uploadResult={uploadResult}
      dragActive={dragActive}
      fileInputRef={fileInputRef}
      collectionModal={collectionModal}
      markingCase={markingCase}
      showRecentCollected={showRecentCollected}
      dateFrom={dateFrom}
      recentCollectedData={recentCollectedData}
      loadingStats={loadingStats}
      onBack={onBack}
      onLogout={onLogout}
      onSelectCustomer={setSelectedCustomer}
      onToggleCase={toggleCase}
      onOpenCollectionModal={openCollectionModal}
      onCloseCollectionModal={closeCollectionModal}
      onConfirmCollection={markCaseAsCollected}
      onDrag={handleDrag}
      onDrop={handleDrop}
      onFileSelect={handleFileSelect}
      onUpload={handleUpload}
      onSelectUploadMode={handleSelectUploadMode}
      onClearFile={clearFile}
      onToggleRecentCollected={handleToggleRecentCollected}
      onDateFromChange={handleDateFromChange}
      onUnmarkCollection={handleUnmarkCollection}
      unmarkModal={unmarkModal}
      onCancelUnmark={() => setUnmarkModal({ isOpen: false, caseNumber: '', customerName: '' })}
      onConfirmUnmark={confirmUnmarkCollection}
      unmarking={unmarking}
    />
  );
}
