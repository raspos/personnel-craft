import React, { useEffect, useState } from 'react';
import { Eye, Users } from 'lucide-react';

interface VisitorStats {
  today: number;
  total: number;
}

export const VisitorCounter: React.FC = () => {
  const [stats, setStats] = useState<VisitorStats>({ today: 1, total: 1 });

  useEffect(() => {
    // 키 이름을 v2로 변경하여 이전에 저장되었던 임의 테스트 숫자(123 등)를 완전히 리셋
    const todayKey = 'pcraft_visit_date_v2';
    const todayCountKey = 'pcraft_today_count_v2';
    const totalCountKey = 'pcraft_total_count_v2';
    const sessionKey = 'pcraft_counted_session_v2';

    // 기존 v1 키 잔재 청소
    try {
      localStorage.removeItem('pcraft_visit_date');
      localStorage.removeItem('pcraft_today_count');
      localStorage.removeItem('pcraft_total_count');
      localStorage.removeItem('pcraft_counted_session');
    } catch {}

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const storedDate = localStorage.getItem(todayKey);
    let todayCount = parseInt(localStorage.getItem(todayCountKey) || '0', 10);
    let totalCount = parseInt(localStorage.getItem(totalCountKey) || '0', 10);

    const isNewSession = !sessionStorage.getItem(sessionKey);

    if (storedDate !== dateStr) {
      // 날짜가 바뀌면 오늘 카운트는 1로 시작
      todayCount = 1;
      localStorage.setItem(todayKey, dateStr);
    } else if (isNewSession) {
      todayCount += 1;
    }

    if (isNewSession) {
      totalCount += 1;
      sessionStorage.setItem(sessionKey, 'true');
    }

    // 최소 1 보장
    todayCount = Math.max(1, todayCount);
    totalCount = Math.max(1, totalCount);

    localStorage.setItem(todayCountKey, String(todayCount));
    localStorage.setItem(totalCountKey, String(totalCount));

    setStats({ today: todayCount, total: totalCount });
  }, []);

  return (
    <div 
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-pixel shadow-inner select-none"
      title="기자님이 이 브라우저에서 진행한 가상 정기인사 시뮬레이션 플레이 기록입니다."
    >
      <div className="flex items-center gap-1.5 text-slate-400">
        <Eye className="w-3.5 h-3.5 text-blue-400" />
        <span>오늘 플레이</span>
        <span className="font-bold text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {stats.today.toLocaleString()}회
        </span>
      </div>

      <span className="text-slate-700">|</span>

      <div className="flex items-center gap-1.5 text-slate-400">
        <Users className="w-3.5 h-3.5 text-emerald-400" />
        <span>누적 도전</span>
        <span className="font-bold text-emerald-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
          {stats.total.toLocaleString()}회
        </span>
      </div>
    </div>
  );
};
