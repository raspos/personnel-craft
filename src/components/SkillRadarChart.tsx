import React, { useMemo } from 'react';

interface SkillRadarChartProps {
  skills: Record<string, number>; // { '정치·정책': 85, '경제·금융': 60, ... }
  size?: number;
  showLabels?: boolean;
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({
  skills,
  size = 320,
  showLabels = true
}) => {
  const entries = useMemo(() => Object.entries(skills), [skills]);
  const count = entries.length;
  if (count < 3) return null;

  const center = size / 2;
  const radius = size * 0.36; // 라벨 공간 확보

  // 최고 스탯 및 평균 점수 계산 (등급 산출)
  const { maxStatName, avgScore, tier } = useMemo(() => {
    let max = -1;
    let maxName = '';
    let sum = 0;
    entries.forEach(([name, val]) => {
      sum += val;
      if (val > max) {
        max = val;
        maxName = name;
      }
    });
    const avg = entries.length ? Math.round(sum / entries.length) : 0;
    let t = 'B';
    if (avg >= 75) t = 'S';
    else if (avg >= 55) t = 'A';
    else if (avg >= 35) t = 'B';
    else t = 'C';
    return { maxStatName: maxName, avgScore: avg, tier: t };
  }, [entries]);

  // 각 축의 각도 계산 (12시 방향부터 시계방향)
  const angleStep = (Math.PI * 2) / count;

  // 동심 다각형 가이드라인 단계 (20%, 40%, 60%, 80%, 100%)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const getCoordinates = (index: number, ratio: number) => {
    const angle = index * angleStep - Math.PI / 2; // 12시 방향 시작
    const x = center + radius * ratio * Math.cos(angle);
    const y = center + radius * ratio * Math.sin(angle);
    return { x, y, angle };
  };

  // 사용자 데이터 폴리곤 꼭짓점 계산
  const dataPoints = entries.map(([_, val], idx) => {
    const ratio = Math.max(0.12, Math.min(1.0, val / 100));
    return getCoordinates(idx, ratio);
  });

  const polygonPointsString = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <div className="flex flex-col items-center justify-center select-none relative">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        <defs>
          {/* 폴리곤 채우기 네온 그라데이션 */}
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#2563eb" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#1e3a8a" stopOpacity="0.10" />
          </radialGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. 배경 레벨별 다각형 동심 그리드 */}
        {levels.map((lvl, lIdx) => {
          const gridPoints = Array.from({ length: count }, (_, idx) => {
            const { x, y } = getCoordinates(idx, lvl);
            return `${x},${y}`;
          }).join(' ');

          return (
            <polygon
              key={lIdx}
              points={gridPoints}
              fill={lIdx === levels.length - 1 ? '#090e1a' : 'none'}
              stroke={lIdx === levels.length - 1 ? '#475569' : '#1e293b'}
              strokeWidth={lIdx === levels.length - 1 ? '1.5' : '1'}
              strokeDasharray={lIdx === levels.length - 1 ? 'none' : '3 3'}
              opacity="0.9"
            />
          );
        })}

        {/* 2. 중심에서 뻗어 나가는 축 선 (Axis Lines) */}
        {Array.from({ length: count }, (_, idx) => {
          const { x, y } = getCoordinates(idx, 1.0);
          const isHighlight = entries[idx][0] === maxStatName;
          return (
            <line
              key={idx}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke={isHighlight ? '#38bdf8' : '#334155'}
              strokeWidth={isHighlight ? '1.5' : '1'}
              strokeDasharray={isHighlight ? 'none' : '2 2'}
              opacity={isHighlight ? '0.85' : '0.5'}
            />
          );
        })}

        {/* 3. 사용자 스탯 다각형 영역 (채우기 및 테두리) */}
        <polygon
          points={polygonPointsString}
          fill="url(#radarGlow)"
          stroke="#38bdf8"
          strokeWidth="2.5"
          filter="url(#neonGlow)"
          className="transition-all duration-500 ease-out"
        />

        {/* 중앙 나침반 코어 원 및 등급 뱃지 */}
        <circle
          cx={center}
          cy={center}
          r="14"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
          className="shadow-lg"
        />
        <text
          x={center}
          y={center + 1}
          textAnchor="middle"
          dominantBaseline="central"
          className="font-pixel text-[11px] font-black fill-amber-300"
        >
          {tier}
        </text>

        {/* 4. 꼭짓점 포인트 닷 */}
        {dataPoints.map((pt, idx) => {
          const isMax = entries[idx][0] === maxStatName;
          return (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={isMax ? '5.5' : '4'}
                fill={isMax ? '#f59e0b' : '#38bdf8'}
                stroke="#0f172a"
                strokeWidth="1.5"
                className="transition-all duration-500 hover:scale-125"
              />
              {isMax && (
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="9"
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1"
                  opacity="0.6"
                  className="animate-ping"
                />
              )}
            </g>
          );
        })}

        {/* 5. 축 라벨 및 점수 텍스트 */}
        {showLabels &&
          entries.map(([name, score], idx) => {
            const { x, y, angle } = getCoordinates(idx, 1.25);
            const isMax = name === maxStatName;
            const cos = Math.cos(angle);
            const anchor = Math.abs(cos) < 0.25 ? 'middle' : cos > 0 ? 'start' : 'end';

            return (
              <g key={name} transform={`translate(${x}, ${y})`}>
                <text
                  textAnchor={anchor}
                  dominantBaseline="central"
                  className={`font-pixel text-[11px] font-bold ${
                    isMax ? 'fill-amber-300' : 'fill-slate-300'
                  }`}
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}
                >
                  {name}
                </text>
                <text
                  textAnchor={anchor}
                  dominantBaseline="central"
                  y={13}
                  className={`font-pixel text-[10px] ${
                    isMax ? 'fill-amber-400 font-bold' : 'fill-sky-400 font-medium'
                  }`}
                >
                  {Math.round(score)}pt
                </text>
              </g>
            );
          })}
      </svg>

      <div className="flex items-center gap-3 mt-1 px-3 py-1 bg-slate-900/80 border border-slate-700/60 rounded-full text-xs text-slate-300">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          주력 전문성: <strong className="text-amber-300">{maxStatName}</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-400">종합 등급: <strong className="text-sky-300 font-pixel">{tier} CLASS</strong></span>
      </div>
    </div>
  );
};
