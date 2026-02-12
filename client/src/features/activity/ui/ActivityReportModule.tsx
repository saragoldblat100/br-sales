import { useState, useEffect } from 'react';
import { activityApi, type ActivityReport } from '../api/activity.api';
import { ActivityReportView } from './ActivityReportView';

interface ActivityReportModuleProps {
  onBack: () => void;
}

function getYesterdayIsrael(): string {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
}

export function ActivityReportModule({ onBack }: ActivityReportModuleProps) {
  const [date, setDate] = useState(getYesterdayIsrael);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ActivityReport | null>(null);

  const fetchReport = async (d: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await activityApi.getReport(d);
      setReport(data);
    } catch {
      setError('שגיאה בטעינת הדוח');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(date);
  }, [date]);

  return (
    <ActivityReportView
      date={date}
      loading={loading}
      error={error}
      report={report}
      onDateChange={setDate}
      onBack={onBack}
    />
  );
}
