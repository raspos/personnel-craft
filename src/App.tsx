import React, { useState } from 'react';
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

export const App: React.FC = () => {
  // 1. 상태 선언
  const [stage, setStage] = useState<Stage>(1);
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
  };

  const setWishes = (w: WishSelection) => {
    setWishesState(w);
    saveWishes(w);
  };

  const setFarmingState = (s: FarmingState) => {
    setFarmingStateInternal(s);
    saveFarmingState(s);
  };

  // 밭갈기(인사 농사)만 독립적으로 초기화하는 헬퍼
  const handleResetFarming = () => {
    const fresh = resetFarmingStorage();
    setFarmingStateInternal(fresh);
  };

  // 3. 스테이지 변경 시 캐릭터 기본 액션 세팅
  const handleStageChange = (newStage: Stage) => {
    setStage(newStage);
    if (newStage === 1) setAction('idle');
    else if (newStage === 2) setAction('walk');
    else if (newStage === 3) setAction('idle');
    else if (newStage === 3.5) {
      setAction('idle');
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

  // 5. 시뮬레이션 계산 (현재 부서는 profile.currentDept를 최우선으로 일치)
  const currentDept = profile.currentDept || (careers.length > 0 ? careers[careers.length - 1].deptName : '');
  const simulation = runSimulation(careers, wishes, activeEvent, 10000);
  const analysis = analyzeCareer(careers);

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
          {/* 좌측(데스크톱) / 상단(모바일): 3D 복셀 월드 캔버스 */}
          <div className="lg:col-span-5 xl:col-span-5 sticky top-20 z-10">
            <div className="h-[360px] sm:h-[440px] lg:h-[580px] w-full">
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
      <footer className="w-full bg-slate-950 border-t border-slate-900 py-4 text-center text-xs text-slate-500 font-pixel">
        <p>인사 크래프트 (PERSONNEL CRAFT) — 데이터저널리즘 가상 시뮬레이션 프로젝트</p>
        <p className="text-[10px] text-slate-600 mt-1">
          * “인사 농사는 내가 짓지만, 발령은 편집국장이 낸다.” 본 게임의 모든 확률 모형은 가상의 알고리즘입니다.
        </p>
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
