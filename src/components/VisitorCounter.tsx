import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const STORAGE_TODAY_DATE = 'pcraft_run_date_v3';
const STORAGE_TODAY_RUNS = 'pcraft_today_runs_v3';
const STORAGE_TOTAL_RUNS = 'pcraft_total_runs_v3';

// 실제 인사발령 완주(STAGE 5 결과 개봉) 시 호출하는 함수
export function recordCompletedRun(): number {
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
    return totalRuns;
  } catch (e) {
    console.error('Failed to record completed run', e);
    return 1;
  }
}

export function getPersonalRuns(): { today: number; total: number } {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const storedDate = localStorage.getItem(STORAGE_TODAY_DATE);

    const todayRuns = storedDate === dateStr ? parseInt(localStorage.getItem(STORAGE_TODAY_RUNS) || '0', 10) : 0;
    const totalRuns = parseInt(localStorage.getItem(STORAGE_TOTAL_RUNS) || '0', 10);

    return { today: todayRuns, total: totalRuns };
  } catch {
    return { today: 0, total: 0 };
  }
}

// 5단계 결과 화면에 들어가는 정직한 나의 시뮬레이션 완주 배지
export const PersonalRunBadge: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';
  const [stats, setStats] = useState<{ today: number; total: number }>(getPersonalRuns());

  useEffect(() => {
    setStats(getPersonalRuns());
    const handleUpdate = () => setStats(getPersonalRuns());
    window.addEventListener('pcraft_run_completed', handleUpdate);
    return () => window.removeEventListener('pcraft_run_completed', handleUpdate);
  }, []);

  if (stats.total === 0) return null;

  return (
    <div 
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-pixel shadow-sm select-none"
      title={isEn ? "Total number of completed reshuffle simulations in this browser." : "기자님이 이 브라우저에서 인사발령 결과까지 완주한 총 시뮬레이션 횟수입니다."}
    >
      <Award className="w-3.5 h-3.5 text-amber-400" />
      <span className="text-slate-400">{isEn ? 'My Simulation Record:' : '나의 시뮬레이션 도전 기록:'}</span>
      <span className="font-bold text-amber-300">
        {isEn ? `Run #${stats.total} Completed` : `제${stats.total}회차 완주`}
      </span>
      {stats.today > 1 && (
        <span className="text-[10px] text-slate-500 font-normal">
          {isEn ? `(#${stats.today} today)` : `(오늘 ${stats.today}번째)`}
        </span>
      )}
    </div>
  );
};

// 기존 하위 호환성 유지용 (App 푸터에서 사용하지 않더라도 export 유지)
export const VisitorCounter = PersonalRunBadge;
