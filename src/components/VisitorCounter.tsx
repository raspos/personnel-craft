import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';

const STORAGE_TODAY_DATE = 'pcraft_run_date_v3';
const STORAGE_TODAY_RUNS = 'pcraft_today_runs_v3';
const STORAGE_TOTAL_RUNS = 'pcraft_total_runs_v3';

// 실제 인사발령 완주(STAGE 5 결과 개봉) 시 호출하는 함수
export function recordCompletedRun(): void {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const storedDate = localStorage.getItem(STORAGE_TODAY_DATE);

    let todayRuns = parseInt(localStorage.getItem(STORAGE_TODAY_RUNS) || '0', 10);
    let totalRuns = parseInt(localStorage.getItem(STORAGE_TOTAL_RUNS) || '0', 10);

    if (storedDate !== dateStr) {
      todayRuns = 1;
      localStorage.setItem(STORAGE_TODAY_DATE, dateStr);
    } else {
      todayRuns += 1;
    }

    totalRuns += 1;

    localStorage.setItem(STORAGE_TODAY_RUNS, String(todayRuns));
    localStorage.setItem(STORAGE_TOTAL_RUNS, String(totalRuns));

    // 이벤트 디스패치로 화면 동기화
    window.dispatchEvent(new Event('pcraft_run_completed'));
  } catch (e) {
    console.error('Failed to record completed run', e);
  }
}

export const VisitorCounter: React.FC = () => {
  const [stats, setStats] = useState<{ today: number; total: number }>({ today: 0, total: 0 });

  const loadStats = () => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const storedDate = localStorage.getItem(STORAGE_TODAY_DATE);

      const todayRuns = storedDate === dateStr ? parseInt(localStorage.getItem(STORAGE_TODAY_RUNS) || '0', 10) : 0;
      const totalRuns = parseInt(localStorage.getItem(STORAGE_TOTAL_RUNS) || '0', 10);

      setStats({ today: todayRuns, total: totalRuns });
    } catch {
      setStats({ today: 0, total: 0 });
    }
  };

  useEffect(() => {
    loadStats();
    const handleUpdate = () => loadStats();
    window.addEventListener('pcraft_run_completed', handleUpdate);
    return () => window.removeEventListener('pcraft_run_completed', handleUpdate);
  }, []);

  return (
    <div 
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-pixel shadow-inner select-none"
      title="기자님이 5단계 최종 인사발령 결과까지 완주한 실제 시뮬레이션 기록입니다."
    >
      <div className="flex items-center gap-1.5 text-slate-400">
        <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
        <span>오늘 완주</span>
        <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {stats.today}회
        </span>
      </div>

      <span className="text-slate-700">|</span>

      <div className="flex items-center gap-1.5 text-slate-400">
        <Award className="w-3.5 h-3.5 text-emerald-400" />
        <span>누적 완주</span>
        <span className="font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {stats.total}회
        </span>
      </div>
    </div>
  );
};
