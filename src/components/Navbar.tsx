import React, { useState } from 'react';
import { Stage } from '../types/game';
import { Volume2, VolumeX, RotateCcw, Newspaper } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  currentStage: Stage;
  setStage: (s: Stage) => void;
  onReset: () => void;
}

export const Navbar: React.FC<Props> = ({ currentStage, setStage, onReset }) => {
  const [isMuted, setIsMuted] = useState(!sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
    if (sound.enabled) {
      sound.playClick();
    }
  };

  const stages: { stage: Stage; label: string }[] = [
    { stage: 1, label: '캐릭터 생성' },
    { stage: 2, label: '나의 커리어' },
    { stage: 3, label: '희망 부서' },
    { stage: 3.5, label: '인사 농사' },
    { stage: 4, label: '인사위원회' },
    { stage: 5, label: '운명의 발령' }
  ];

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* 로고 & 타이틀 */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-blue-600 border border-blue-400 flex items-center justify-center text-white shadow-md">
            <Newspaper className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-pixel text-base sm:text-lg text-white font-extrabold tracking-tight">
                인사 크래프트
              </h1>
              <span className="text-[10px] font-pixel text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800">
                PERSONNEL CRAFT
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              편집국 생존기 — 이번엔 제발 원하는 부서로!
            </p>
          </div>
        </div>

        {/* 5단계 스테이지 탭 네비게이션 */}
        <nav className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
          {stages.map((st) => {
            const isActive = currentStage === st.stage;
            const isPassed = currentStage > st.stage;
            return (
              <button
                key={st.stage}
                onClick={() => {
                  sound.playBlip();
                  setStage(st.stage);
                }}
                className={`px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : isPassed
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-[10px] opacity-75">{st.stage}.</span>
                <span>{st.label}</span>
              </button>
            );
          })}
        </nav>

        {/* 유틸리티 버튼들 */}
        <div className="flex items-center gap-2">
          {/* 사운드 토글 */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? '소리 켜기' : '소리 끄기'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          {/* 초기화 */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            title="데이터 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
