import React, { useState } from 'react';
import { Stage } from '../types/game';
import { Volume2, VolumeX, RotateCcw, Newspaper, Globe, MessageSquareText } from 'lucide-react';
import { sound } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  currentStage: Stage;
  setStage: (s: Stage) => void;
  onReset: () => void;
  onOpenBoard?: () => void;
}

export const Navbar: React.FC<Props> = ({ currentStage, setStage, onReset, onOpenBoard }) => {
  const [isMuted, setIsMuted] = useState(!sound.enabled);
  const { language, toggleLanguage, t } = useLanguage();

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setIsMuted(!sound.enabled);
    if (sound.enabled) {
      sound.playClick();
    }
  };

  const stages: { stage: Stage; labelKey: 'stage1Nav' | 'stage2Nav' | 'stage3Nav' | 'stage35Nav' | 'stage4Nav' | 'stage5Nav' }[] = [
    { stage: 1, labelKey: 'stage1Nav' },
    { stage: 2, labelKey: 'stage2Nav' },
    { stage: 3, labelKey: 'stage3Nav' },
    { stage: 3.5, labelKey: 'stage35Nav' },
    { stage: 4, labelKey: 'stage4Nav' },
    { stage: 5, labelKey: 'stage5Nav' }
  ];

  return (
    <header className="w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-md relative lg:sticky lg:top-0 z-40 px-3 sm:px-4 py-2 sm:py-3">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
        {/* 모바일: 상단 1행 (로고+타이틀 좌측 / 유틸리티 우측) | 데스크톱: 좌측 로고+타이틀 */}
        <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-blue-600 border border-blue-400 flex items-center justify-center text-white shadow-md flex-shrink-0">
              <Newspaper className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-pixel text-sm sm:text-base lg:text-lg text-white font-extrabold tracking-tight whitespace-nowrap">
                  {t('appTitle')}
                </h1>
                <span className="text-[9px] sm:text-[10px] font-pixel text-blue-400 bg-blue-950/80 px-1.5 py-0.5 rounded border border-blue-800 whitespace-nowrap">
                  {t('appBadge')}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {t('appSubTitle')}
              </p>
            </div>
          </div>

          {/* 모바일 전용 빠른 유틸리티 바 (대나무숲 + 언어 + 음소거 + 리셋) */}
          <div className="flex sm:hidden items-center gap-1">
            {onOpenBoard && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenBoard();
                }}
                className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-600/70 text-[11px] font-pixel text-emerald-300 flex items-center gap-1"
                title={language === 'en' ? "Newsroom Anonymous Lounge" : "편집국 익명 대나무숲 게시판"}
              >
                <MessageSquareText className="w-3 h-3 text-emerald-400" />
                <span className="font-bold">{language === 'en' ? 'Lounge' : '대나무숲'}</span>
              </button>
            )}

            <button
              onClick={() => {
                sound.playClick();
                toggleLanguage();
              }}
              className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-[11px] font-pixel text-amber-300 flex items-center gap-1"
              title="Switch Language"
            >
              <Globe className="w-3 h-3 text-amber-400" />
              <span className="font-bold">{language === 'ko' ? 'EN' : 'KO'}</span>
            </button>

            <button
              onClick={toggleSound}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
              title={isMuted ? t('soundOn') : t('soundOff')}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-blue-400" />}
            </button>

            <button
              onClick={onReset}
              className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400"
              title={t('resetTooltip')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 5단계 스테이지 탭 네비게이션 */}
        <nav className="w-full sm:w-auto flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
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
                className={`px-2 sm:px-2.5 py-1 rounded text-[11px] sm:text-xs font-pixel whitespace-nowrap transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md'
                    : isPassed
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span className="text-[9px] sm:text-[10px] opacity-75">{st.stage}.</span>
                <span>{t(st.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* 데스크톱 전용 유틸리티 버튼들 */}
        <div className="hidden sm:flex items-center gap-2">
          {/* 편집국 익명 대나무숲 게시판 버튼 */}
          {onOpenBoard && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenBoard();
              }}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/70 hover:border-emerald-400 text-xs font-pixel text-emerald-300 flex items-center gap-1.5 transition-all shadow-sm"
              title={language === 'en' ? "Newsroom Anonymous Lounge" : "편집국 익명 대나무숲 게시판"}
            >
              <MessageSquareText className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold">{language === 'en' ? 'Lounge' : '대나무숲'}</span>
            </button>
          )}

          {/* 다국어 언어 전환 [KO | EN] 픽셀 토글 스위치 */}
          <button
            onClick={() => {
              sound.playClick();
              toggleLanguage();
            }}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-amber-400 text-xs font-pixel text-amber-300 flex items-center gap-1.5 transition-all shadow-sm"
            title="Switch Language (한국어 / English)"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold">{language === 'ko' ? 'EN' : '한국어'}</span>
          </button>

          {/* 사운드 토글 */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            title={isMuted ? t('soundOn') : t('soundOff')}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
          </button>

          {/* 초기화 */}
          <button
            onClick={onReset}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-red-400 transition-colors"
            title={t('resetTooltip')}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
