import React, { useEffect, useState } from 'react';
import { Eye, Users, TrendingUp } from 'lucide-react';

interface VisitorStats {
  today: number;
  total: number;
}

export const VisitorCounter: React.FC = () => {
  const [stats, setStats] = useState<VisitorStats>({ today: 1, total: 1 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const todayKey = 'pcraft_visit_date';
    const todayCountKey = 'pcraft_today_count';
    const totalCountKey = 'pcraft_total_count';
    const sessionKey = 'pcraft_counted_session';

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    // 1. 로컬 기반 실시간 계산
    const storedDate = localStorage.getItem(todayKey);
    let todayCount = parseInt(localStorage.getItem(todayCountKey) || '1', 10);
    let totalCount = parseInt(localStorage.getItem(totalCountKey) || '142', 10); // 기본 베이스 시드

    const isNewSession = !sessionStorage.getItem(sessionKey);

    if (storedDate !== dateStr) {
      // 새 날짜 시작
      todayCount = 1;
      localStorage.setItem(todayKey, dateStr);
    } else if (isNewSession) {
      todayCount += 1;
    }

    if (isNewSession) {
      totalCount += 1;
      sessionStorage.setItem(sessionKey, 'true');
    }

    localStorage.setItem(todayCountKey, String(todayCount));
    localStorage.setItem(totalCountKey, String(totalCount));

    setStats({ today: todayCount, total: totalCount });

    // 2. 외부 공용 무료 카운터 API(api.counterapi.dev) 시도 (선택적 실시간 전역 동기화)
    const fetchGlobalCounter = async () => {
      try {
        const res = await fetch('https://api.counterapi.dev/v1/raspos-personnel-craft/hits/up');
        if (res.ok) {
          const data = await res.json();
          if (data && data.count) {
            setStats(prev => ({
              ...prev,
              total: Math.max(prev.total, data.count)
            }));
          }
        }
      } catch (err) {
        // 네트워크 차단 또는 오프라인 시 로컬 카운트로 완벽 유지
      } finally {
        setLoaded(true);
      }
    };

    fetchGlobalCounter();
  }, []);

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-pixel shadow-inner select-none">
      <div className="flex items-center gap-1.5 text-slate-400">
        <Eye className="w-3.5 h-3.5 text-blue-400" />
        <span>TODAY</span>
        <span className="font-bold text-amber-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          {stats.today.toLocaleString()}
        </span>
      </div>

      <span className="text-slate-700">|</span>

      <div className="flex items-center gap-1.5 text-slate-400">
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span>TOTAL</span>
        <span className="font-bold text-emerald-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
          {stats.total.toLocaleString()}
        </span>
      </div>
    </div>
  );
};
