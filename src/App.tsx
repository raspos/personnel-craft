import React, { useState, useMemo } from 'react';
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
import { runSimulation } from './utils/simulationEngine';
import { analyzeCareer } from './utils/careerAnalysis';
import { CharacterAction } from './components/3d/VoxelCharacter';
import { VoxelWorldCanvas } from './components/3d/VoxelWorldCanvas';
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
import { VisitorCounter } from './components/VisitorCounter';

export const App: React.FC = () => {
  // 1. 상태 선언 (새로고침 시 진행 단계까지 복원)
  const [stage, setStage] = useState<Stage>(loadStage());
  const [profile, setProfileState] = useState<CharacterProfile>(loadProfile());
  const [careers, setCareersState] = useState<CareerRecord[]>(loadCareers());
  const [wishes, setWishesState] = useState<WishSelection>(loadWishes());
  const [farmingState, setFarmingStateInternal] = useState<FarmingState>(loadFarmingState());
  const [activeEvent, setActiveEvent] = useState<SuddenEvent>(SUDDEN_EVENTS[0]);
  const [action, setAction] = useState<CharacterAction>('idle');

  // 모달 상태
  const [isSkillsModalOpen, setIsSkillsModalOpen] = useState(false);
  const [isAssumptionsModalOpen, setIsAssumptionsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isTenYearModalOpen, setIsTenYearModalOpen] = useState(false);
  const [shareResult, setShareResult] = useState<FinalAppointmentResult | null>(null);

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
    if (confirm('모든 캐릭터 신상정보와 커리어 블록, 희망 부서, 인사 농사 데이터를 완전히 초기화하시겠습니까?')) {
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
  const analysis = useMemo(() => analyzeCareer(careers), [careers]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* 상단 네비게이션 */}
      <Navbar
        currentStage={stage}
        setStage={handleStageChange}
        onReset={handleReset}
      />

      {/* 메인 게임 영역 (3D 뷰어 + 스테이지 컨트롤) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* 좌측(데스크톱: 고정) / 상단(모바일: 스크롤 시 함께 위로 훌쩍 올라감) */}
          <div className="lg:col-span-5 xl:col-span-5 relative lg:sticky lg:top-24 z-10 w-full">
            <div className="h-[250px] sm:h-[340px] lg:h-[580px] w-full">
              <VoxelWorldCanvas
                stage={stage}
                profile={profile}
                careers={careers}
                wishes={wishes}
                action={action}
                farmingSprouts={farmingState.metrics.sproutStage}
              />
            </div>

            {/* 3D 뷰어 하단 상태 브리핑 칩 (신상정보가 모두 입력되었을 때만 표시) */}
            {stage > 1 && profile.nickname && profile.currentDept ? (
              <div className="mt-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs flex items-center justify-between animate-fade-in">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                  <span className="font-pixel text-slate-200">
                    {profile.nickname} ({profile.hireYear}년 입사 · {analysis.totalYearsText})
                  </span>
                </div>
                <div className="font-pixel text-amber-300">
                  현재 부서: {currentDept}
                </div>
              </div>
            ) : (
              <div className="mt-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/50 text-[11px] text-center text-slate-500 font-pixel">
                기자 캐릭터 및 소속 부서 설정 중...
              </div>
            )}
          </div>

          {/* 우측(데스크톱) / 하단(모바일): 스테이지별 상호작용 패널 */}
          <div className="lg:col-span-7 xl:col-span-7">
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
                onActionChange={setAction}
              />
            )}
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-6 px-4 text-center text-xs text-slate-400 font-pixel space-y-3">
        {/* 방문자 수 카운터 (TODAY / TOTAL) */}
        <div className="flex justify-center">
          <VisitorCounter />
        </div>

        <div>
          <p className="font-bold text-slate-300">인사 크래프트 (PERSONNEL CRAFT) — 편집국 생존기</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            데이터저널리즘 가상 시뮬레이션 인터랙티브 프로젝트
          </p>
        </div>

        <div className="pt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <span>
            © <a
              href="https://raspos.github.io/databrew"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 underline font-bold transition-colors"
            >
              databrew
            </a>. All rights reserved.
          </span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-500 italic">
            “인사 농사는 내가 짓지만, 발령은 편집국장이 낸다.”
          </span>
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
    </div>
  );
};
export default App;
