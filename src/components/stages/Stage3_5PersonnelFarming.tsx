import React, { useState } from 'react';
import {
  CharacterProfile,
  CareerRecord,
  WishSelection,
  FarmingState,
  FarmingActionType,
  SimulationProbabilities
} from '../../types/game';
import { executeFarmingAction } from '../../utils/farmingEngine';
import { runSimulation } from '../../utils/simulationEngine';
import { sound } from '../../utils/sound';
import {
  Sprout,
  Users,
  MessageSquareShare,
  Coffee,
  UserCheck,
  FileEdit,
  Smile,
  ArrowRight,
  ArrowLeft,
  FastForward,
  TrendingUp,
  Clock,
  Sparkles,
  Info,
  CheckCircle2,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';

interface Stage3_5Props {
  profile: CharacterProfile;
  careers: CareerRecord[];
  wishes: WishSelection;
  setWishes: (w: WishSelection) => void;
  farmingState: FarmingState;
  setFarmingState: (s: FarmingState) => void;
  onResetFarming: () => void;
  onNext: () => void;
  onPrev: () => void;
  onActionChange: (action: 'idle' | 'walk' | 'nervous') => void;
}

export const Stage3_5PersonnelFarming: React.FC<Stage3_5Props> = ({
  profile,
  careers,
  wishes,
  setWishes,
  farmingState,
  setFarmingState,
  onResetFarming,
  onNext,
  onPrev,
  onActionChange
}) => {
  const currentDeptName = careers.length > 0 ? careers[careers.length - 1].deptName : '사회부';
  const isSecondHalf = profile.currentHalf === '하반기';

  // 인사 농사 전 기준 확률 기록 (최초 1회 저장)
  if (!farmingState.initialProbabilities) {
    const initialSim = runSimulation(careers, wishes, null, 5000);
    farmingState.initialProbabilities = initialSim.probabilities;
  }

  // 현재 농사 상태가 반영된 실시간 시뮬레이션 확률
  const currentSim = runSimulation(careers, wishes, null, 5000);
  const probBefore = farmingState.initialProbabilities || currentSim.probabilities;
  const probNow = currentSim.probabilities;

  // 대화 팝업 알림 상태
  const [activeDialogue, setActiveDialogue] = useState<{
    speaker: string;
    text: string;
    note?: string;
  } | null>(null);

  // 부서장/동료 면담 시 타겟 부서 선택
  const [selectedTargetWish, setSelectedTargetWish] = useState<1 | 2 | 3>(1);

  // 행동 실행 핸들러
  const handleAction = (actionType: FarmingActionType) => {
    if (farmingState.remainingPoints <= 0) return;
    sound.playClick();
    onActionChange('walk');

    const result = executeFarmingAction(
      farmingState,
      wishes,
      actionType,
      selectedTargetWish,
      profile.currentHalf,
      currentDeptName
    );

    setFarmingState(result.nextState);
    setWishes(result.updatedWishes);

    if (result.popupDialogue) {
      setActiveDialogue(result.popupDialogue);
    }

    setTimeout(() => {
      onActionChange('idle');
    }, 600);
  };

  const getSproutEmoji = (stage: number) => {
    if (stage === 0) return '🟫 (흙밭)';
    if (stage === 1) return '🌱 (새싹)';
    if (stage === 2) return '🌿 (줄기)';
    return '🌳 (무성한 싹)';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 🌕 추석 이후 인사 격언 인트로 배너 */}
      <div className="voxel-card p-5 border-amber-500/50 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 shadow-xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{isSecondHalf ? '🌕' : '🌸'}</span>
          <span className="font-pixel text-xs text-amber-400 font-bold tracking-wider">
            {isSecondHalf ? 'STAGE 3.5 — 추석 이후 인사 농사 시작!' : 'STAGE 3.5 — 상반기 인사 준비 돌입!'}
          </span>
        </div>

        <h2 className="font-pixel text-xl sm:text-2xl text-slate-100 font-bold mb-2">
          {isSecondHalf ? '“하반기 인사는 추석 이후부터 시작된다.”' : '“인사 농사는 내가 짓지만, 발령은 편집국장이 낸다.”'}
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          {isSecondHalf
            ? '추석 연휴가 끝나고 편집국 복도에 묘한 긴장감이 흐릅니다. 이제 인사판이 본격적으로 움직이기 시작합니다. 당신은 원하는 부서에 가기 위해 누구를 만나고 어떤 수를 두시겠습니까?'
            : '정기인사를 앞두고 편집국 곳곳에서 물밑 접촉과 눈치싸움이 시작되었습니다. 인사위원회가 열리기 전까지 최선의 인사 농사를 지어보세요.'}
        </p>
      </div>

      {/* 인사 농사 턴 및 행동 포인트 상태 HUD */}
      <div className="voxel-card p-4 border-blue-500/40 bg-slate-900/90 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center font-pixel text-xl text-amber-300">
            {farmingState.currentTurn}턴
          </div>
          <div>
            <div className="font-pixel text-sm text-slate-100 font-bold">
              {isSecondHalf ? `추석 이후 ${farmingState.currentTurn}주 차` : `인사 준비 ${farmingState.currentTurn}주 차`}
            </div>
            <div className="text-xs text-slate-400">
              인사위원회까지 <strong className="text-amber-400">{5 - farmingState.currentTurn}턴</strong> 남음
            </div>
          </div>
        </div>

        {/* 남은 행동 포인트 보석(Gem) HUD */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-pixel">남은 행동력 (AP)</div>
            <div className="font-pixel text-xl text-amber-300 font-black tracking-tight">
              {farmingState.remainingPoints} <span className="text-xs text-slate-400">/ 8 AP</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-950/80 rounded-xl border border-slate-800 shadow-inner">
            {Array.from({ length: 8 }, (_, i) => {
              const isActive = i < farmingState.remainingPoints;
              return (
                <div
                  key={i}
                  title={`행동 포인트 #${i + 1} ${isActive ? '사용 가능' : '사용 완료'}`}
                  className={`voxel-gem ${isActive ? 'active' : 'spent'}`}
                />
              );
            })}
          </div>
        </div>

        {/* 버튼 액션 그룹 (밭갈기 리셋 & 인사위 건너뛰기) */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (confirm('현재 진행된 인사 농사(행동력, 새싹, 수치 변화)를 모두 초기화하고 처음부터 다시 시작하시겠습니까?')) {
                sound.playClick();
                onResetFarming();
              }
            }}
            title="인사 농사(밭갈기)를 초기 상태(1턴, 8AP, 새싹 0단계)로 리셋합니다."
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500 text-xs font-pixel text-slate-300 hover:text-rose-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>밭갈기 리셋</span>
          </button>

          <button
            onClick={() => {
              sound.playBlip();
              onNext();
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 border border-blue-400 text-xs font-pixel text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>인사위로 이동</span>
          </button>
        </div>
      </div>

      {/* 행동력 소진 알림 바 */}
      {farmingState.remainingPoints <= 0 && (
        <div className="p-3.5 bg-amber-950/70 border-2 border-amber-500/70 rounded-xl text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span>
              <strong>모든 행동 포인트를 소진하여 이번 인사 농사가 마무리되었습니다.</strong><br className="sm:hidden" />
              결과를 지켜보려면 인사위원회로 넘어가거나, 밭을 다시 갈고 싶다면 초기화할 수 있습니다.
            </span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onResetFarming();
            }}
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 font-pixel text-white text-xs font-bold shadow flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>밭 처음부터 다시 갈기</span>
          </button>
        </div>
      )}

      {/* 5대 인사 농사 현황 지표 & 블록 밭 새싹 */}
      <div className="voxel-card p-5 border-slate-700 bg-slate-900/90 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>나의 인사 농사 현황 지표 (HUD)</span>
          </div>
          <span className="text-[11px] text-slate-500 font-pixel">* 편집국 가상 상태</span>
        </div>

        {/* 5대 지표 게이지 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {/* ① 희망 부서장 관심도 */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">① 희망 부서장 관심도</span>
              <span className="font-pixel text-amber-400 font-bold">{farmingState.metrics.bossInterest}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 transition-all duration-300" style={{ width: `${farmingState.metrics.bossInterest}%` }} />
            </div>
          </div>

          {/* ② 희망 부서 내 인지도 */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">② 희망 부서 내 인지도</span>
              <span className="font-pixel text-blue-400 font-bold">{farmingState.metrics.deptAwareness}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 transition-all duration-300" style={{ width: `${farmingState.metrics.deptAwareness}%` }} />
            </div>
          </div>

          {/* ③ 소문 확산도 */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">③ 소문 확산도</span>
              <span className="font-pixel text-purple-400 font-bold">{farmingState.metrics.rumorSpread}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-purple-400 transition-all duration-300" style={{ width: `${farmingState.metrics.rumorSpread}%` }} />
            </div>
          </div>

          {/* ④ 현재 부서 잔류 압력 */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">④ 현 부서 잔류 압력</span>
              <span className="font-pixel text-rose-400 font-bold">{farmingState.metrics.stayPressure}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-rose-400 transition-all duration-300" style={{ width: `${farmingState.metrics.stayPressure}%` }} />
            </div>
          </div>

          {/* ⑤ 인사 정보 신뢰도 */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">⑤ 정보 신뢰도 (TO 파악)</span>
              <span className="font-pixel text-cyan-400 font-bold">{farmingState.metrics.infoConfidence}%</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${farmingState.metrics.infoConfidence}%` }} />
            </div>
          </div>

          {/* 기사 작성 성과 점수 */}
          <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
            <div className="flex justify-between mb-1">
              <span className="text-slate-400">⑥ 기사 성과 (묵묵한 실적)</span>
              <span className="font-pixel text-emerald-400 font-bold">{farmingState.metrics.articleScore} P</span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 transition-all duration-300" style={{ width: `${farmingState.metrics.articleScore}%` }} />
            </div>
          </div>
        </div>

        {/* 희망 부서 3곳의 미니 블록 밭 상태 */}
        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div className="text-slate-300 mb-2.5 flex items-center justify-between font-pixel">
            <span className="flex items-center gap-1.5 text-emerald-300">
              <Sprout className="w-4 h-4 text-emerald-400" />
              희망 부서 3곳의 복셀 밭 재배 현황:
            </span>
            <span className="text-[11px] text-slate-500 font-sans">“밭을 정성스레 갈아도 수확은 편집국장의 몫입니다.”</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { num: 1, name: wishes.first.deptName, stage: farmingState.metrics.sproutStage.first, to: wishes.first.expectedTO },
              { num: 2, name: wishes.second.deptName, stage: farmingState.metrics.sproutStage.second, to: wishes.second.expectedTO },
              { num: 3, name: wishes.third.deptName, stage: farmingState.metrics.sproutStage.third, to: wishes.third.expectedTO }
            ].map((f) => (
              <div
                key={f.num}
                className="bg-gradient-to-b from-slate-900 to-slate-950 p-3 rounded-lg border-2 border-slate-800 hover:border-emerald-500/50 transition-all text-center flex flex-col items-center justify-between shadow-md"
              >
                <div className="w-full flex justify-between items-center text-[10px] text-slate-400 font-pixel mb-1">
                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300 font-bold">{f.num}지망</span>
                  <span>TO: {f.to}</span>
                </div>
                <div className="font-pixel text-slate-100 font-bold text-sm my-1">{f.name} 밭</div>
                <div className="my-1.5 px-3 py-1 bg-slate-950 rounded-full border border-slate-800 text-xs font-pixel text-emerald-300 flex items-center gap-1">
                  <span>{getSproutEmoji(f.stage)}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${(f.stage / 3) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 대화 팝업 알림 (NPC 레트로 말풍선 모달 스타일) */}
      {activeDialogue && (
        <div className="pixel-bubble p-4 border-2 border-sky-400 bg-slate-900 text-white shadow-2xl animate-fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-b from-sky-600 to-blue-800 border-2 border-sky-300 flex items-center justify-center text-2xl flex-shrink-0 shadow-md">
                👤
              </div>
              <div>
                <div className="font-pixel text-xs text-sky-300 flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-bold text-sm text-white">[{activeDialogue.speaker}]</span>
                  {activeDialogue.note && (
                    <span className="text-[10px] bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-700">
                      {activeDialogue.note}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-100 font-medium leading-relaxed italic bg-slate-950/60 p-2.5 rounded border border-slate-800">
                  “{activeDialogue.text}”
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveDialogue(null)}
              className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-pixel text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 7가지 인사 농사 행동 선택 패널 */}
      <div className="voxel-card p-5 border-blue-500/30 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <h3 className="font-pixel text-base text-slate-100 font-bold flex items-center gap-2">
            <span>🎯</span> 이번 주에 취할 인사 행동 선택 (1P 소모)
          </h3>

          {/* 대상 희망 부서 선택 (A, B 행동용) */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">접촉 대상:</span>
            {[1, 2, 3].map((num) => {
              const deptName = num === 1 ? wishes.first.deptName : num === 2 ? wishes.second.deptName : wishes.third.deptName;
              return (
                <button
                  key={num}
                  onClick={() => setSelectedTargetWish(num as 1 | 2 | 3)}
                  className={`px-2 py-0.5 rounded text-xs font-pixel transition-all ${
                    selectedTargetWish === num
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {num}지망 ({deptName})
                </button>
              );
            })}
          </div>
        </div>

        {/* 행동 버튼 그리드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* 행동 A: 희망 부서장 만나기 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('meet_boss')}
            className="voxel-btn bg-slate-800 hover:bg-slate-750 border border-blue-500/40 p-3 rounded-lg text-left transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-2 font-pixel text-blue-300 font-bold text-xs mb-1">
              <Users className="w-4 h-4 text-blue-400" />
              <span>A. 희망 부서장 면담 ({selectedTargetWish}지망 부장)</span>
            </div>
            <p className="text-[11px] text-slate-300">
              부장실을 찾아가 이동 의사를 전달하고 관심을 이끌어냅니다. (너무 잦으면 부담)
            </p>
          </button>

          {/* 행동 B: 희망 부서 동료 만나기 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('meet_peer')}
            className="voxel-btn bg-slate-800 hover:bg-slate-750 border border-slate-700 p-3 rounded-lg text-left transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-2 font-pixel text-slate-200 font-bold text-xs mb-1">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>B. 희망 부서 동료와 티타임</span>
            </div>
            <p className="text-[11px] text-slate-300">
              내부 분위기, 장기근무자의 이동 의향, 부서장의 선호 인재상 소문을 캡처합니다.
            </p>
          </button>

          {/* 행동 C: 팀 안에 소문 내기 (인사 소문 흘리기) */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('spread_rumor')}
            className="voxel-btn bg-slate-800 hover:bg-slate-750 border border-purple-500/40 p-3 rounded-lg text-left transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-2 font-pixel text-purple-300 font-bold text-xs mb-1">
              <MessageSquareShare className="w-4 h-4 text-purple-400" />
              <span>C. 편집국에 인사 소문 흘리기</span>
            </div>
            <p className="text-[11px] text-slate-300">
              "나 이번에 움직이고 싶어." 희망 부서에 알려지지만 현재 부서장이 눈치챌 수도 있습니다!
            </p>
          </button>

          {/* 행동 D: 휴게실 인사판 탐색 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('explore_board')}
            className="voxel-btn bg-slate-800 hover:bg-slate-750 border border-slate-700 p-3 rounded-lg text-left transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-2 font-pixel text-cyan-300 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>D. 휴게실 인사판 & 정세 탐색</span>
            </div>
            <p className="text-[11px] text-slate-300">
              선배 기자들과 담소를 나누며 이번 인사의 폭과 연쇄 도미노 기류를 엿봅니다.
            </p>
          </button>

          {/* 행동 E: 현재 부서장과 솔직한 면담 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('meet_cur_boss')}
            className="voxel-btn bg-slate-800 hover:bg-slate-750 border border-amber-500/40 p-3 rounded-lg text-left transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-2 font-pixel text-amber-300 font-bold text-xs mb-1">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>E. 현재 부서장과 솔직한 면담</span>
            </div>
            <p className="text-[11px] text-slate-300">
              "부장님, 이번엔 다른 분야를 경험해보고 싶습니다." 방출 의사를 직접 확인합니다.
            </p>
          </button>

          {/* 행동 F: 묵묵히 기사 쓰기 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('write_article')}
            className="voxel-btn bg-slate-800 hover:bg-slate-750 border border-emerald-500/40 p-3 rounded-lg text-left transition-all disabled:opacity-40"
          >
            <div className="flex items-center gap-2 font-pixel text-emerald-300 font-bold text-xs mb-1">
              <FileEdit className="w-4 h-4 text-emerald-400" />
              <span>F. 인사 농사 대신 특종 기사 집필</span>
            </div>
            <p className="text-[11px] text-slate-300">
              사내 정치 대신 실력으로 승부합니다. 기사 성과 점수 상승 및 데스크 호평 획득.
            </p>
          </button>
        </div>

        {/* 행동 G: 아무것도 하지 않기 */}
        <div className="pt-1">
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('do_nothing')}
            className="w-full py-2.5 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:bg-slate-900 text-xs font-pixel text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2"
          >
            <Smile className="w-4 h-4 text-slate-500" />
            <span>G. "나는 인사에 연연하지 않는다" (평소처럼 묵묵히 마감 대기)</span>
          </button>
        </div>
      </div>

      {/* 인사 농사 전 / 후 확률 변화 비교 카드 */}
      <div className="voxel-card p-5 border-indigo-500/40 bg-slate-900/90 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <h4 className="font-pixel text-sm text-slate-100 font-bold">
              인사 농사 전 / 후 예상 확률 비교
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-pixel">동일 모형 기반 실시간 반영</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* 1지망 */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">1지망 {wishes.first.deptName}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px]">{probBefore.firstWish}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-blue-400 font-bold text-sm">{probNow.firstWish}%</span>
            </div>
          </div>

          {/* 2지망 */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">2지망 {wishes.second.deptName}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px]">{probBefore.secondWish}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-slate-200 font-bold text-sm">{probNow.secondWish}%</span>
            </div>
          </div>

          {/* 희망 부서 합산 */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">희망부서 합산</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px]">{probBefore.totalWish}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-emerald-400 font-bold text-sm">{probNow.totalWish}%</span>
            </div>
          </div>

          {/* 잔류 확률 */}
          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
            <div className="text-slate-400 text-[11px]">현 부서 잔류</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px]">{probBefore.stayCurrent}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-amber-400 font-bold text-sm">{probNow.stayCurrent}%</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-1">
          * 행동 결과에 따라 부서장 영입 의사 및 현재 부서장의 이동 의향 상태가 갱신되어 확률이 재계산됩니다.
        </div>
      </div>

      {/* 나의 인사 농사 일지 */}
      {farmingState.logs.length > 0 && (
        <div className="voxel-card p-4 border-slate-800 bg-slate-950/80 space-y-2">
          <div className="font-pixel text-xs text-slate-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>나의 인사 농사 일지 (최근 활동 내역)</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {farmingState.logs.map((lg, idx) => (
              <div key={idx} className="bg-slate-900/90 p-2.5 rounded border border-slate-800 text-xs">
                <div className="flex items-center justify-between text-[11px] text-amber-400 mb-0.5 font-pixel">
                  <span>{lg.weekName} · {lg.actionTitle}</span>
                  <span className="text-slate-400">{lg.impactText}</span>
                </div>
                <div className="text-slate-200">{lg.outcomeText}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 하단 이동 버튼 */}
      <div className="flex gap-3">
        <button
          onClick={() => {
            sound.playBlip();
            onPrev();
          }}
          className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-3 px-5 rounded-lg text-sm font-pixel flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>희망 부서로 돌아가기</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onNext();
          }}
          className="voxel-btn voxel-btn-primary flex-1 py-3 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2"
        >
          <span>인사 농사 마치고 인사위원회로 입장</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
