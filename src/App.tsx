import React, { useState, useMemo, lazy, Suspense } from 'react';
import {
  Stage,
  CharacterProfile,
  CareerRecord,
  WishSelection,
  SuddenEvent,
  FinalAppointmentResult,
  FarmingState
} from './types/game';
import {
  loadStage,
  saveStage,
  loadProfile,
  saveProfile,
  loadCareers,
  saveCareers,
  loadWishes,
  saveWishes,
  loadFarmingState,
  saveFarmingState,
  createFreshFarmingState,
  resetFarmingStorage,
  resetAllData,
  DEFAULT_PROFILE,
  DEFAULT_CAREERS,
  DEFAULT_WISHES,
  DEFAULT_FARMING_STATE
} from './utils/storage';
import { SUDDEN_EVENTS } from './data/events';
import { getDepartmentByName } from './data/departments';
import { runSimulation } from './utils/simulationEngine';
import { analyzeCareer } from './utils/careerAnalysis';
import { CharacterAction } from './components/3d/VoxelCharacter';
import { Navbar } from './components/Navbar';
import { Stage1CharacterCreate } from './components/stages/Stage1CharacterCreate';
import { Stage2CareerInput } from './components/stages/Stage2CareerInput';
import { Stage3WishSelect } from './components/stages/Stage3WishSelect';
import { Stage3_5PersonnelFarming } from './components/stages/Stage3_5PersonnelFarming';
import { Stage4Committee } from './components/stages/Stage4Committee';
import { Stage5Result } from './components/stages/Stage5Result';
import { CareerSkillsModal } from './components/CareerSkillsModal';
import { ModelAssumptionsModal } from './components/ModelAssumptionsModal';
import { ShareCardModal } from './components/ShareCardModal';
import { TenYearSimulationModal } from './components/TenYearSimulationModal';
import { CommunityBoardModal } from './components/CommunityBoardModal';
import { VisitorCounter } from './components/VisitorCounter';
import { useLanguage } from './i18n/LanguageContext';

// Three.js 및 3D 뷰어 비동기 동적 분리 (Code Splitting)
const VoxelWorldCanvas = lazy(() =>
  import('./components/3d/VoxelWorldCanvas').then(m => ({ default: m.VoxelWorldCanvas }))
);

export const App: React.FC = () => {
  // 1. 상태 선언 (새로고침 시 진행 단계까지 복원)
  const [stage, setStage] = useState<Stage>(loadStage());
  const [profile, setProfileState] = useState<CharacterProfile>(loadProfile());
  const [careers, setCareersState] = useState<CareerRecord[]>(loadCareers());
  const [wishes, setWishesState] = useState<WishSelection>(loadWishes());
  const [farmingState, setFarmingStateInternal] = useState<FarmingState>(loadFarmingState());
  const [activeEvent, setActiveEvent] = useState<SuddenEvent>(SUDDEN_EVENTS[0]);
  const [action, setAction] = useState<CharacterAction>('idle');
  const [activeSpeech, setActiveSpeech] = useState<{ text: string; speaker?: string } | undefined>(undefined);
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  // 모달 상태
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isAssumptionsModalOpen, setIsAssumptionsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTenYearModalOpen, setIsTenYearModalOpen] = useState(false);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [shareResult, setShareResult] = useState<FinalAppointmentResult | null>(null);
  const [boardResultContext, setBoardResultContext] = useState<FinalAppointmentResult | null>(null);

  // 2. 동기화 및 저장
  const setProfile = (p: CharacterProfile) => {
    setProfileState(p);
    saveProfile(p);
  };

  const setCareers = (c: CareerRecord[]) => {
    setCareersState(c);
    saveCareers(c);
    // 현재 부서 단일 공급원 동기화: 경력이 있으면 마지막 부서를 profile.currentDept와 일치시킴
    if (c.length > 0) {
      const lastDept = c[c.length - 1].deptName;
      if (profile.currentDept !== lastDept) {
        const updated = { ...profile, currentDept: lastDept };
        setProfileState(updated);
        saveProfile(updated);
      }
    }
  };

  const setWishes = (w: WishSelection) => {
    setWishesState(w);
    saveWishes(w);
  };

  const setFarmingState = (s: FarmingState) => {
    setFarmingStateInternal(s);
    saveFarmingState(s);
  };

  // 밭갈기(인사 농사)만 독립적으로 초기화하는 헬퍼 (농사 시작 전 희망 부서 설정까지 완전 복원)
  const handleResetFarming = () => {
    if (farmingState.backupWishes) {
      setWishesState(farmingState.backupWishes);
      saveWishes(farmingState.backupWishes);
    }
    const fresh = resetFarmingStorage();
    // 현재 wishes를 백업으로 보존
    fresh.backupWishes = JSON.parse(JSON.stringify(farmingState.backupWishes || wishes));
    setFarmingStateInternal(fresh);
    saveFarmingState(fresh);
  };

  // 3. 스테이지 변경 시 캐릭터 기본 액션 세팅 및 단계 저장
  const handleStageChange = (newStage: Stage) => {
    setStage(newStage);
    saveStage(newStage);
    if (newStage === 1) setAction('idle');
    else if (newStage === 2) setAction('walk');
    else if (newStage === 3) setAction('idle');
    else if (newStage === 3.5) {
      setAction('idle');
      // 인사 농사 진입 시점의 wishes를 백업 (리셋 시 완벽 복원용)
      if (!farmingState.backupWishes) {
        const withBackup: FarmingState = {
          ...farmingState,
          backupWishes: JSON.parse(JSON.stringify(wishes))
        };
        setFarmingStateInternal(withBackup);
        saveFarmingState(withBackup);
      }
      // 만약 이전 게임에서 행동력을 이미 다 썼거나 4턴을 마친 상태라면 자동으로 새 밭으로 리셋
      if (farmingState.remainingPoints <= 0 || farmingState.currentTurn > 4) {
        handleResetFarming();
      }
    }
    else if (newStage === 4) setAction('idle');
    else if (newStage === 5) setAction('nervous');
  };

  // 4. 데이터 초기화
  const handleReset = () => {
    if (confirm(isEn ? 'Are you sure you want to reset all character info, career blocks, department wishes, and reshuffle politicking data?' : '모든 캐릭터 신상정보와 커리어 블록, 희망 부서, 인사 농사 데이터를 완전히 초기화하시겠습니까?')) {
      resetAllData();
      setProfileState(DEFAULT_PROFILE);
      setCareersState([]);
      setWishesState(DEFAULT_WISHES);
      setFarmingStateInternal(createFreshFarmingState());
      setStage(1);
      setAction('idle');
    }
  };

  // 5. 시뮬레이션 계산 (결정론적 PRNG 및 캐싱으로 렌더링 시 깜빡임 차단, 인사 농사 실시간 반영)
  const currentDept = profile.currentDept || (careers.length > 0 ? careers[careers.length - 1].deptName : '사회부');
  const simulation = useMemo(() => {
    return runSimulation(careers, wishes, activeEvent, 10000, farmingState, currentDept);
  }, [careers, wishes, activeEvent, farmingState, currentDept]);
  const analysis = useMemo(() => analyzeCareer(careers, isEn), [careers, isEn]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 상단 네비게이션 */}
      <Navbar
        currentStage={stage}
        setStage={handleStageChange}
        onReset={handleReset}
        onOpenBoard={() => setIsBoardModalOpen(true)}
      />

      {/* 메인 게임 영역 (3D 뷰어가 주인공인 레이아웃: 데스크톱 65% : 35%) */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
          {/* 좌측(데스크톱: 65% 고정 메인 뷰어) / 상단(모바일: 320px 뷰어) */}
          <div className="lg:col-span-7 xl:col-span-7 relative lg:sticky lg:top-24 z-10 w-full">
            <div className="h-[300px] sm:h-[420px] lg:h-[640px] xl:h-[700px] w-full">
              <Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 rounded-2xl border-4 border-slate-800 text-slate-300 font-pixel gap-3 shadow-[4px_4px_0_#000]">
                    <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-bold text-amber-300">{t('loading3D')}</span>
                  </div>
                }
              >
                <VoxelWorldCanvas
                  stage={stage}
                  profile={profile}
                  careers={careers}
                  wishes={wishes}
                  action={action}
                  farmingSprouts={farmingState.metrics.sproutStage}
                  activeSpeech={activeSpeech}
                />
              </Suspense>
            </div>

            {/* 3D 뷰어 하단 상태 브리핑 칩 (신상정보가 모두 입력되었을 때만 표시) */}
            {stage > 1 && profile.nickname && profile.currentDept ? (
              <div className="mt-3 bg-slate-900/95 p-3 rounded-xl border-2 border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 shadow-[2px_2px_0_#000] animate-fade-in font-pixel">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-slate-100 font-bold">
                    {profile.nickname} ({isEn ? `Class of ${profile.hireYear} · ${analysis.totalMonths} months` : `${profile.hireYear}년 입사 · ${analysis.totalYearsText}`})
                  </span>
                </div>
                <div className="text-amber-300 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                  {isEn ? `Current Beat: ${getDepartmentByName(currentDept)?.nameEn || currentDept}` : `현재 소속: ${currentDept}`}
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-slate-900/70 p-2.5 rounded-xl border border-slate-800 text-[11px] text-center text-slate-400 font-pixel">
                {isEn ? 'Configuring journalist persona & beat...' : '기자 캐릭터 및 소속 부서 설정 중...'}
              </div>
            )}
          </div>

          {/* 우측(데스크톱: 35% 게임 컨트롤/HUD 패널) / 하단(모바일) */}
          <div className="lg:col-span-5 xl:col-span-5">
            {stage === 1 && (
              <Stage1CharacterCreate
                profile={profile}
                setProfile={setProfile}
                careers={careers}
                setCareers={setCareers}
                onNext={() => handleStageChange(2)}
              />
            )}

            {stage === 2 && (
              <Stage2CareerInput
                careers={careers}
                setCareers={setCareers}
                onNext={() => handleStageChange(3)}
                onPrev={() => handleStageChange(1)}
                onOpenSkillsModal={() => setIsSkillsModalOpen(true)}
              />
            )}

            {stage === 3 && (
              <Stage3WishSelect
                wishes={wishes}
                setWishes={setWishes}
                currentDeptName={currentDept}
                onNext={() => handleStageChange(3.5)}
                onPrev={() => handleStageChange(2)}
              />
            )}

            {stage === 3.5 && (
              <Stage3_5PersonnelFarming
                profile={profile}
                careers={careers}
                wishes={wishes}
                setWishes={setWishes}
                farmingState={farmingState}
                setFarmingState={setFarmingState}
                onResetFarming={handleResetFarming}
                onNext={() => handleStageChange(4)}
                onPrev={() => handleStageChange(3)}
                onActionChange={setAction}
                onSpeechBubble={setActiveSpeech}
              />
            )}

            {stage === 4 && (
              <Stage4Committee
                careers={careers}
                wishes={wishes}
                setWishes={setWishes}
                activeEvent={activeEvent}
                setActiveEvent={setActiveEvent}
                onNext={() => handleStageChange(5)}
                onPrev={() => handleStageChange(3.5)}
                onOpenAssumptionsModal={() => setIsAssumptionsModalOpen(true)}
                farmingState={farmingState}
                currentDept={currentDept}
              />
            )}

            {stage === 5 && (
              <Stage5Result
                profile={profile}
                careers={careers}
                wishes={wishes}
                probabilities={simulation.probabilities}
                farmingState={farmingState}
                onRestart={() => {
                  resetAllData();
                  setProfileState(DEFAULT_PROFILE);
                  setCareersState([]);
                  setWishesState(DEFAULT_WISHES);
                  setFarmingStateInternal(createFreshFarmingState());
                  setStage(1);
                  setAction('idle');
                }}
                onOpenShareModal={(res) => {
                  setShareResult(res);
                  setIsShareModalOpen(true);
                }}
                onOpenTenYearModal={() => setIsTenYearModalOpen(true)}
                onOpenBoardModal={(res) => {
                  setBoardResultContext(res);
                  setIsBoardModalOpen(true);
                }}
                onActionChange={setAction}
              />
            )}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-400 font-pixel space-y-3">
        {/* 실제 전체 접속자 수 공용 카운터 */}
        <div className="flex justify-center pb-1">
          <VisitorCounter />
        </div>

        <div>
          <p className="font-bold text-slate-200 text-xs sm:text-sm leading-relaxed break-keep">
            {isEn ? (
              <>
                <span className="block sm:inline">PERSONNEL CRAFT</span>
                <span className="hidden sm:inline"> — </span>
                <span className="block sm:inline text-slate-400 font-medium">Newsroom Reshuffle Survival Simulator</span>
              </>
            ) : (
              <>
                <span className="block sm:inline">
                  인사 크래프트 <span className="text-slate-400 font-normal text-[11px] sm:text-xs">(PERSONNEL CRAFT)</span>
                </span>
                <span className="hidden sm:inline"> — </span>
                <span className="block sm:inline text-sky-400 font-medium">편집국 생존기</span>
              </>
            )}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug break-keep max-w-md mx-auto">
            {isEn ? 'Data Journalism Virtual Reshuffle Simulation Interactive Project' : '데이터저널리즘 가상 시뮬레이션 인터랙티브 프로젝트'}
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-[11px] text-slate-500 break-keep">
          <div>
            © <a
              href="https://raspos.github.io/databrew"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline font-bold transition-colors"
            >
              databrew
            </a>. All rights reserved.
          </div>
          <span className="hidden sm:inline text-slate-700">|</span>
          <p className="text-slate-400 italic break-keep">
            {isEn ? '“You sow the reshuffle seeds, but the Editor-in-Chief harvests the orders.”' : '“인사 농사는 내가 짓지만, 발령은 편집국장이 낸다.”'}
          </p>
        </div>
      </footer>

      {/* 팝업 모달들 */}
      <CareerSkillsModal
        isOpen={isSkillsModalOpen}
        onClose={() => setIsSkillsModalOpen(false)}
        analysis={analysis}
      />

      <ModelAssumptionsModal
        isOpen={isAssumptionsModalOpen}
        onClose={() => setIsAssumptionsModalOpen(false)}
      />

      {shareResult && (
        <ShareCardModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          result={shareResult}
          profile={profile}
          careers={careers}
          wishes={wishes}
        />
      )}

      <TenYearSimulationModal
        isOpen={isTenYearModalOpen}
        onClose={() => setIsTenYearModalOpen(false)}
        careers={careers}
        wishes={wishes}
        hireYear={profile.hireYear}
      />

      <CommunityBoardModal
        isOpen={isBoardModalOpen}
        onClose={() => setIsBoardModalOpen(false)}
        initialResult={boardResultContext}
        profile={profile}
      />
    </div>
  );
};
export default App;
