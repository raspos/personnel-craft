import React, { useEffect, useState } from 'react';
import { Award, Eye, Users } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const STORAGE_TODAY_DATE = 'pcraft_run_date_v3';
const STORAGE_TODAY_RUNS = 'pcraft_today_runs_v3';
const STORAGE_TOTAL_RUNS = 'pcraft_total_runs_v3';

// 실제 인사발령 완주(STAGE 5 결과 개봉) 시 호출하는 함수 (개인 로컬 도전 기록)
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

// 5단계 결과 화면(호외 신문 상단)에 들어가는 정직한 나의 시뮬레이션 완주 배지
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

interface PublicVisitorStats {
  today: number;
  total: number;
}

// 푸터에 들어가는 실제 전체 사이트 접속자 수(공용 카운터) 컴포넌트
export const VisitorCounter: React.FC = () => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  // 즉시 렌더링용 로컬 캐시 읽기
  const [stats, setStats] = useState<PublicVisitorStats>(() => {
    try {
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const savedDate = localStorage.getItem('pcraft_pub_date_v4');
      const savedToday = parseInt(localStorage.getItem('pcraft_pub_today_v4') || '1', 10);
      const savedTotal = parseInt(localStorage.getItem('pcraft_pub_total_v4') || '1', 10);
      return {
        today: savedDate === dateStr ? Math.max(1, savedToday) : 1,
        total: Math.max(1, savedTotal)
      };
    } catch {
      return { today: 1, total: 1 };
    }
  });

  useEffect(() => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const sessionKey = 'pcraft_pub_session_counted_v4';
    const isNewSession = !sessionStorage.getItem(sessionKey);

    const totalKey = 'raspos_personnel_craft_total_v2';
    const todayKey = `raspos_personnel_craft_d_${dateStr}`;

    const updateGlobalVisitorCount = async () => {
      try {
        const action = isNewSession ? 'hit' : 'get';

        const [totalRes, todayRes] = await Promise.allSettled([
          fetch(`https://countapi.mileshilliard.com/api/v1/${action}/${totalKey}`).then(r => r.json()),
          fetch(`https://countapi.mileshilliard.com/api/v1/${action}/${todayKey}`).then(r => r.json())
        ]);

        let currentTotal = stats.total;
        let currentToday = stats.today;

        if (totalRes.status === 'fulfilled' && totalRes.value && typeof totalRes.value.value === 'number') {
          currentTotal = totalRes.value.value;
        } else if (isNewSession) {
          currentTotal += 1;
        }

        if (todayRes.status === 'fulfilled' && todayRes.value && typeof todayRes.value.value === 'number') {
          currentToday = todayRes.value.value;
        } else if (isNewSession) {
          currentToday += 1;
        }

        // 로컬 스토리지에 캐시하여 오프라인/새로고침 시 깜빡임 방지
        try {
          localStorage.setItem('pcraft_pub_date_v4', dateStr);
          localStorage.setItem('pcraft_pub_today_v4', String(currentToday));
          localStorage.setItem('pcraft_pub_total_v4', String(currentTotal));
          if (isNewSession) {
            sessionStorage.setItem(sessionKey, '1');
          }
        } catch {}

        setStats({ today: currentToday, total: currentTotal });
      } catch (err) {
        console.warn('Visitor counter API fallback to cache', err);
      }
    };

    updateGlobalVisitorCount();
  }, []);

  return (
    <div
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-pixel shadow-inner select-none"
      title={isEn ? "Actual total visitors across all devices (Global public counter)" : "실제 전체 사이트 접속자 수 (글로벌 공용 카운터)"}
    >
      <div className="flex items-center gap-1.5 text-slate-400">
        <Eye className="w-3.5 h-3.5 text-sky-400" />
        <span className="text-[11px] font-bold text-slate-300">{isEn ? 'TODAY' : '오늘 방문'}</span>
        <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
          {stats.today.toLocaleString()}
        </span>
      </div>

      <span className="text-slate-700">|</span>

      <div className="flex items-center gap-1.5 text-slate-400">
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-[11px] font-bold text-slate-300">{isEn ? 'TOTAL' : '누적 방문'}</span>
        <span className="font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-xs">
          {stats.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
