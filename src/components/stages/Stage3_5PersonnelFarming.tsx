import React, { useState, useMemo, useEffect } from 'react';
import {
  CharacterProfile,
  CareerRecord,
  WishSelection,
  FarmingState,
  FarmingActionType,
  SimulationProbabilities
} from '../../types/game';
import { executeFarmingAction } from '../../utils/farmingEngine';
import { runSimulation, getConsecutiveTenureMonths } from '../../utils/simulationEngine';
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

import { CharacterAction } from '../3d/VoxelCharacter';
import { useLanguage } from '../../i18n/LanguageContext';

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
  onActionChange: (action: CharacterAction) => void;
  onSpeechBubble?: (speech: { text: string; speaker?: string }) => void;
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
  onActionChange,
  onSpeechBubble
}) => {
  const { language, t } = useLanguage();
  const isEn = language === 'en';

  const currentDeptName = profile.currentDept || (careers.length > 0 ? careers[careers.length - 1].deptName : '사회부');
  const isSecondHalf = profile.currentHalf === '하반기';

  const formatBossIntent = (intent: string) => {
    if (!isEn) return intent;
    const map: Record<string, string> = {
      '적극적으로 보내주려 한다': 'Supports Release',
      '이동을 허용할 가능성이 높다': 'Likely to Allow',
      '잘 모르겠다': 'Unclear / Neutral',
      '잔류를 원하는 분위기다': 'Wants You to Stay',
      '반드시 남기려고 한다': 'Defends Retention'
    };
    return map[intent] || intent;
  };

  // 현재 농사 상태가 실시간 반영된 시뮬레이션 확률
  const currentSim = useMemo(() => {
    return runSimulation(careers, wishes, null, 5000, farmingState, currentDeptName);
  }, [careers, wishes, farmingState, currentDeptName]);

  // 인사 농사 전 기준 확률 기록 (행동 0회일 때는 초기 확률과 현재 확률이 100% 일치하도록 보장)
  useEffect(() => {
    if (!farmingState.initialProbabilities || farmingState.remainingPoints === 8) {
      setFarmingState({
        ...farmingState,
        initialProbabilities: currentSim.probabilities
      });
    }
  }, [wishes, careers, currentDeptName]);

  // 행동을 한 번도 안 한 상태(8P 잔여)에서는 전/후 확률이 완벽히 동일하게 일치
  const probBefore = farmingState.remainingPoints === 8
    ? currentSim.probabilities
    : (farmingState.initialProbabilities || currentSim.probabilities);
  const probNow = currentSim.probabilities;

  // 대화 팝업 알림 상태
  const [activeDialogue, setActiveDialogue] = useState<{
    speaker: string;
    text: string;
    note?: string;
  } | null>(null);

  // 부서장/동료 면담 시 타겟 부서 선택
  const [selectedTargetWish, setSelectedTargetWish] = useState<1 | 2 | 3>(1);
  // 복잡한 세부 첩보 지표 아코디언 토글 (기본 접힘으로 시각적 인지 부하 대폭 절감)
  const [showDetailedIntel, setShowDetailedIntel] = useState(false);

  // 현재 타겟이 현 부서 잔류 희망인지 판별
  const isTargetingStay = selectedTargetWish === 1 && wishes.first.deptName === currentDeptName;

  // 선택된 접촉 대상이 '없음'인 경우 1지망으로 자동 복귀
  useEffect(() => {
    const curDept = selectedTargetWish === 1
      ? wishes.first.deptName
      : selectedTargetWish === 2
      ? wishes.second.deptName
      : wishes.third.deptName;
    if (curDept === '없음' || curDept === '선택 안 함') {
      setSelectedTargetWish(1);
    }
  }, [wishes, selectedTargetWish]);

  // 행동 실행 핸들러 (선택한 행동에 따라 3D 캐릭터 실시간 모션 연동)
  const handleAction = (actionType: FarmingActionType) => {
    if (farmingState.remainingPoints <= 0) return;
    sound.playClick();

    // 행동별 맞춤형 3D 복셀 캐릭터 애니메이션 트리거
    if (actionType === 'write_article') {
      onActionChange('stay_desk'); // 묵묵히 책상에서 기사 집필
    } else if (actionType === 'meet_boss' || actionType === 'meet_cur_boss') {
      onActionChange('walk'); // 부서장실로 걸어가는 모션
    } else if (actionType === 'spread_rumor') {
      onActionChange('nervous'); // 주변 눈치 보며 소문 흘리기
    } else if (actionType === 'meet_peer' || actionType === 'explore_board') {
      onActionChange('walk'); // 휴게실/카페테리아 탐색
    } else {
      onActionChange('idle');
    }

    const currentDeptMonths = getConsecutiveTenureMonths(careers, currentDeptName);
    const result = executeFarmingAction(
      farmingState,
      wishes,
      actionType,
      selectedTargetWish,
      profile.currentHalf,
      currentDeptName,
      currentDeptMonths,
      isEn
    );

    setFarmingState(result.nextState);
    setWishes(result.updatedWishes);

    if (result.popupDialogue) {
      setActiveDialogue(result.popupDialogue);
      if (onSpeechBubble) {
        onSpeechBubble({
          text: result.popupDialogue.text,
          speaker: result.popupDialogue.speaker
        });
      }
    }

    setTimeout(() => {
      onActionChange('idle');
    }, 1200);
  };

  const getSproutEmoji = (stage: number) => {
    if (stage === 0) return isEn ? '🟫 (Bare Ground)' : '🟫 (흙밭)';
    if (stage === 1) return isEn ? '🌱 (Sprout)' : '🌱 (새싹)';
    if (stage === 2) return isEn ? '🌿 (Stem)' : '🌿 (줄기)';
    return isEn ? '🌳 (Lush Harvest)' : '🌳 (무성한 싹)';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 🌕 추석 이후 인사 격언 인트로 배너 */}
      <div className="pixel-card p-5 border-amber-500/70 bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{isSecondHalf ? '🌕' : '🌸'}</span>
          <span className="font-pixel text-xs text-amber-400 font-bold tracking-wider">
            {isSecondHalf
              ? (isEn ? 'STAGE 3.5 — Autumn Reshuffle Politicking Underway!' : 'STAGE 3.5 — 추석 이후 인사 농사 시작!')
              : (isEn ? 'STAGE 3.5 — Spring Pre-Reshuffle Season!' : 'STAGE 3.5 — 상반기 인사 준비 돌입!')}
          </span>
        </div>

        <h2 className="font-pixel text-xl sm:text-2xl text-slate-100 font-bold mb-2">
          {isSecondHalf
            ? (isEn ? '“Autumn reshuffle begins the moment the harvest moon rises.”' : '“하반기 인사는 추석 이후부터 시작된다.”')
            : (isEn ? '“You water the desk relationships, but the Managing Editor signs the order.”' : '“인사 농사는 내가 짓지만, 발령은 편집국장이 낸다.”')}
        </h2>

        <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
          {isSecondHalf
            ? (isEn
                ? 'Tension ripples through the newsroom corridors after the holiday. The board is moving. Who will you approach and what levers will you pull to claim your beat?'
                : '추석 연휴가 끝나고 편집국 복도에 묘한 긴장감이 흐릅니다. 이제 인사판이 본격적으로 움직이기 시작합니다. 당신은 원하는 부서에 가기 위해 누구를 만나고 어떤 수를 두시겠습니까?')
            : (isEn
                ? 'Whisper campaigns and covert meetings ignite across every desk. Cultivate your standing and defend your career before the Committee convenes.'
                : '정기인사를 앞두고 편집국 곳곳에서 물밑 접촉과 눈치싸움이 시작되었습니다. 인사위원회가 열리기 전까지 최선의 인사 농사를 지어보세요.')}
        </p>
      </div>

      {/* 인사 농사 턴 및 행동 포인트 상태 HUD */}
      <div className="pixel-card p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 pixel-slot flex items-center justify-center font-pixel text-xl text-amber-300">
            {farmingState.currentTurn}{isEn ? 'W' : '턴'}
          </div>
          <div>
            <div className="font-pixel text-sm text-slate-100 font-bold">
              {isEn
                ? `${isSecondHalf ? 'Post-Chuseok' : 'Reshuffle'} Week ${farmingState.currentTurn}`
                : (isSecondHalf ? `추석 이후 ${farmingState.currentTurn}주 차` : `인사 준비 ${farmingState.currentTurn}주 차`)}
            </div>
            <div className="text-xs text-slate-400">
              {isEn
                ? <><strong className="text-amber-400">{5 - farmingState.currentTurn} turns</strong> left until Committee</>
                : <>인사위원회까지 <strong className="text-amber-400">{5 - farmingState.currentTurn}턴</strong> 남음</>}
            </div>
          </div>
        </div>

        {/* 남은 행동 포인트 보석(Gem) HUD */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 font-pixel">{isEn ? 'Action Points (AP)' : '남은 행동력 (AP)'}</div>
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
                  title={isEn ? `AP #${i + 1} ${isActive ? 'Available' : 'Spent'}` : `행동 포인트 #${i + 1} ${isActive ? '사용 가능' : '사용 완료'}`}
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
              if (confirm(isEn ? 'Reset all politicking progress (AP, sprout stages, metrics) and start fresh?' : '현재 진행된 인사 농사(행동력, 새싹, 수치 변화)를 모두 초기화하고 처음부터 다시 시작하시겠습니까?')) {
                sound.playClick();
                onResetFarming();
              }
            }}
            title={isEn ? 'Reset all politicking progress to turn 1, 8 AP.' : '인사 농사(밭갈기)를 초기 상태(1턴, 8AP, 새싹 0단계)로 리셋합니다.'}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-500 text-xs font-pixel text-slate-300 hover:text-rose-200 flex items-center gap-1.5 transition-all shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span>{isEn ? 'Reset' : '밭갈기 리셋'}</span>
          </button>

          <button
            onClick={() => {
              sound.playBlip();
              onNext();
            }}
            className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 border border-blue-400 text-xs font-pixel text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>{isEn ? 'To Committee' : '인사위로 이동'}</span>
          </button>
        </div>
      </div>

      {/* 행동력 소진 알림 바 */}
      {farmingState.remainingPoints <= 0 && (
        <div className="p-3.5 bg-amber-950/70 border-2 border-amber-500/70 rounded-xl text-xs text-amber-200 flex flex-wrap items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span>
              <strong>{isEn ? 'All Action Points spent! Your groundwork is complete.' : '모든 행동 포인트를 소진하여 이번 인사 농사가 마무리되었습니다.'}</strong><br className="sm:hidden" />
              {isEn ? ' Proceed to the Committee to see results, or reset to try a different strategy.' : ' 결과를 지켜보려면 인사위원회로 넘어가거나, 밭을 다시 갈고 싶다면 초기화할 수 있습니다.'}
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
            <span>{isEn ? 'Restart Season' : '밭 처음부터 다시 갈기'}</span>
          </button>
        </div>
      )}

      {/* 3대 핵심 인사 농사 게임 HUD (시각적 과부하 해소 & 게임 감성 집중) */}
      <div className="pixel-card p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-slate-950 pb-2">
          <div className="font-pixel text-sm text-amber-300 font-bold flex items-center gap-2">
            <Sprout className="w-4 h-4 text-emerald-400" />
            <span>{isEn ? 'Core Politicking HUD' : '핵심 인사 농사 HUD'}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-pixel">
            {isEn ? '* 3 Core Metrics Focused' : '* 3대 핵심 지표 집중 모드'}
          </div>
        </div>

        {/* 3대 핵심 지표: [1. 희망 부서 영입 온난도 밭] + [2. 현 부서 잔류 압력] */}
        <div className="space-y-3">
          {/* ① 희망 부서 3곳의 영입 온난도 & 밭 재배 현황 (선택형 탭 카드) */}
          <div>
            <div className="flex items-center justify-between text-xs font-pixel mb-2">
              <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                {isEn ? '🌾 [Metric 1] Target Beat Warmth & Field Growth (Touch to Target):' : '🌾 [지표 1] 희망 부서 영입 온난도 & 밭 성장 (터치하여 접촉 대상 선택):'}
              </span>
              <span className="text-[11px] text-slate-400">
                {isEn ? 'Targeting: ' : '선택된 타겟: '}<strong className="text-amber-400">{selectedTargetWish}{isEn ? ' Wish' : '지망'}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                {
                  num: 1,
                  name: wishes.first.deptName,
                  stage: farmingState.metrics.sproutStage.first,
                  to: wishes.first.expectedTO,
                  bi: typeof farmingState.metrics.bossInterest === 'number' ? farmingState.metrics.bossInterest : farmingState.metrics.bossInterest.first
                },
                {
                  num: 2,
                  name: wishes.second.deptName,
                  stage: farmingState.metrics.sproutStage.second,
                  to: wishes.second.expectedTO,
                  bi: typeof farmingState.metrics.bossInterest === 'number' ? farmingState.metrics.bossInterest : farmingState.metrics.bossInterest.second
                },
                {
                  num: 3,
                  name: wishes.third.deptName,
                  stage: farmingState.metrics.sproutStage.third,
                  to: wishes.third.expectedTO,
                  bi: typeof farmingState.metrics.bossInterest === 'number' ? farmingState.metrics.bossInterest : farmingState.metrics.bossInterest.third
                }
              ].map((item) => {
                const isNone = item.name === '없음' || item.name === '선택 안 함';
                const isSelected = selectedTargetWish === item.num;

                return (
                  <button
                    key={item.num}
                    type="button"
                    disabled={isNone}
                    onClick={() => {
                      if (!isNone) {
                        sound.playClick();
                        setSelectedTargetWish(item.num as 1 | 2 | 3);
                      }
                    }}
                    className={`p-3 rounded-lg border-2 text-left transition-all relative ${
                      isNone
                        ? 'opacity-40 bg-slate-950/60 border-slate-800 cursor-not-allowed'
                        : isSelected
                        ? 'bg-amber-950/40 border-amber-400 shadow-[2px_2px_0_#000] ring-1 ring-amber-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`font-pixel text-xs font-bold ${isSelected ? 'text-amber-300' : 'text-slate-300'}`}>
                        {item.num}{isEn ? ' Wish ' : '지망 '}{item.name === currentDeptName && item.num === 1 ? (isEn ? `${item.name} (Stay)` : `${item.name} (잔류)`) : item.name}
                      </span>
                      <span className="text-base">
                        {item.stage === 0 ? '🟫' : item.stage === 1 ? '🌱' : item.stage === 2 ? '🌿' : '🌾'}
                      </span>
                    </div>

                    {!isNone ? (
                      <div className="space-y-1.5 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>{isEn ? 'Warmth' : '호감 온난도'}</span>
                          <span className="font-pixel text-amber-300 font-bold">{item.bi}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                            style={{ width: `${item.bi}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-slate-500 flex justify-between pt-0.5">
                          <span>{isEn ? `Field: ${item.stage === 0 ? 'Seed' : item.stage === 1 ? 'Sprout' : item.stage === 2 ? 'Stem' : 'Crop'}` : `밭: ${item.stage === 0 ? '씨앗' : item.stage === 1 ? '새싹' : item.stage === 2 ? '성장' : '결실'}`}</span>
                          <span>{item.name === currentDeptName && item.num === 1 ? (isEn ? 'Stay Wish' : '잔류 지망') : `TO: ${item.to}`}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic py-2">{isEn ? 'No Wish Selected' : '지망 부서 없음'}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ② 현재 부서 잔류 압력 게이지 */}
          <div className="bg-slate-950 p-3 rounded-lg border-2 border-slate-900">
            <div className="flex items-center justify-between text-xs mb-1.5 font-pixel">
              <span className="text-rose-300 font-bold flex items-center gap-1.5">
                🛡️ {isEn ? '[Metric 2] Current Desk Retention Defense/Pressure:' : '[지표 2] 현재 부서 잔류 압력:'}
              </span>
              <span className="font-bold text-rose-400">
                {farmingState.metrics.stayPressure}%
                <span className="text-[10px] text-slate-400 font-normal ml-1">
                  ({farmingState.metrics.stayPressure > 60 
                    ? (isEn ? 'High Retention' : '잔류 위험') 
                    : farmingState.metrics.stayPressure > 35 
                    ? (isEn ? 'Moderate' : '보통') 
                    : (isEn ? 'Easy Exit' : '이동 원활')})
                </span>
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full transition-all duration-300 ${
                  farmingState.metrics.stayPressure > 60 ? 'bg-rose-500' : farmingState.metrics.stayPressure > 35 ? 'bg-amber-400' : 'bg-emerald-400'
                }`}
                style={{ width: `${farmingState.metrics.stayPressure}%` }}
              />
            </div>
          </div>
        </div>

        {/* 📊 세부 첩보 지표 아코디언 토글 (인지 부하 다이어트) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowDetailedIntel(!showDetailedIntel);
            }}
            className="w-full py-1.5 px-3 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-pixel text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 transition-colors"
          >
            <span>{showDetailedIntel 
              ? (isEn ? '▲ Collapse Newsroom Deep Intel Metrics' : '▲ 편집국 세부 첩보 지표 접기') 
              : (isEn ? '▼ [Details] Expand 6 Newsroom Deep Intel Metrics (Scoops, Awareness, Rumors)' : '▼ [상세 정보] 편집국 6대 세부 첩보 지표 열기 (기사성과·인지도·소문·신뢰도)')}</span>
          </button>

          {showDetailedIntel && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3 text-xs animate-fade-in">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">{isEn ? 'Scoop Score (Merit)' : '기사 성과 (묵묵한 실적)'}</div>
                <div className="font-pixel text-emerald-400 font-bold text-sm">{farmingState.metrics.articleScore} P</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">{isEn ? 'Desk Awareness' : '부서 내 인지도'}</div>
                <div className="font-pixel text-blue-400 font-bold text-sm">
                  {typeof farmingState.metrics.deptAwareness === 'number'
                    ? farmingState.metrics.deptAwareness
                    : (selectedTargetWish === 1 ? farmingState.metrics.deptAwareness.first : selectedTargetWish === 2 ? farmingState.metrics.deptAwareness.second : farmingState.metrics.deptAwareness.third)}%
                </div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">{isEn ? 'Newsroom Rumor Spread' : '편집국 소문 확산도'}</div>
                <div className="font-pixel text-purple-400 font-bold text-sm">{farmingState.metrics.rumorSpread}%</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">{isEn ? 'Intel Trust (TO Verified)' : '정보 신뢰도 (TO 파악)'}</div>
                <div className="font-pixel text-cyan-400 font-bold text-sm">{farmingState.metrics.infoConfidence}%</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">{isEn ? 'Current Desk Tenure' : '현재 부서 근속'}</div>
                <div className="font-pixel text-slate-200 font-bold text-sm">{getConsecutiveTenureMonths(careers, currentDeptName)}{isEn ? ' mo' : '개월'}</div>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <div className="text-slate-400 text-[11px] mb-1">{isEn ? 'Current Boss Stance' : '부서장 의사'}</div>
                <div className="font-pixel text-amber-300 font-bold text-sm truncate">{formatBossIntent(wishes.currentBossIntent)}</div>
              </div>
            </div>
          )}
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
                  “{activeDialogue.text.replace(/^[“”"']+|[“”"']+$/g, '')}”
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

      {/* 7가지 인사 농사 행동 선택 패널 (마인크래프트 게임 스타일 핫바) */}
      <div className="pixel-card p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-slate-950 pb-2">
          <h3 className="font-pixel text-sm sm:text-base text-amber-300 font-bold flex items-center gap-2">
            <span>🎮</span> {isEn ? `Choose Politicking Action (${farmingState.remainingPoints} AP Left)` : `이번 주 인사 행동 선택 (1 AP 소모)`}
          </h3>

          {/* 대상 희망 부서 선택 (A, B 행동용) */}
          <div className="flex items-center gap-1.5 text-xs font-pixel">
            <span className="text-slate-400">{isEn ? 'Target:' : '접촉 대상:'}</span>
            {[1, 2, 3].map((num) => {
              const deptName = num === 1 ? wishes.first.deptName : num === 2 ? wishes.second.deptName : wishes.third.deptName;
              const isNone = deptName === '없음' || deptName === '선택 안 함';
              return (
                <button
                  key={num}
                  disabled={isNone}
                  onClick={() => setSelectedTargetWish(num as 1 | 2 | 3)}
                  className={`px-2 py-0.5 rounded text-xs font-pixel transition-all border ${
                    isNone
                      ? 'bg-slate-950 text-slate-600 line-through cursor-not-allowed border-slate-900'
                      : selectedTargetWish === num
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-300 shadow-[1px_1px_0_#000]'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800'
                  }`}
                >
                  {num}{isEn ? ' Wish' : '지망'} ({isNone ? (isEn ? 'None' : '없음') : deptName})
                </button>
              );
            })}
          </div>
        </div>

        {/* 행동 버튼 그리드 (마인크래프트 슬롯 스타일) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* 행동 A: 희망 부서장 만나기 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('meet_boss')}
            className="pixel-btn-mc p-3 text-left transition-all disabled:opacity-40 rounded"
          >
            <div className="flex items-center gap-2 font-pixel text-sky-300 font-bold text-xs mb-1">
              <Users className="w-4 h-4 text-sky-400" />
              <span>
                {selectedTargetWish === 1 && wishes.first.deptName === currentDeptName
                  ? (isEn ? 'A. Meeting with Current Chief (Defend Desk)' : 'A. 현 직속 부서장 면담 (잔류 굳히기)')
                  : (isEn ? `A. 1-on-1 with Target Chief (${selectedTargetWish} Wish)` : `A. 희망 부서장 면담 (${selectedTargetWish}지망 부장)`)}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {selectedTargetWish === 1 && wishes.first.deptName === currentDeptName
                ? (isEn ? 'Visit the Chief office to formally commit to finishing major ongoing series.' : '부장실을 찾아가 현재 취재를 계속 마무리하겠다는 잔류 의사를 확실히 밝힙니다.')
                : (isEn ? 'Visit Chief office to pitch fit and gauge recruitment interest. (Avatar walks)' : '부장실을 찾아가 영입 의사를 묻고 관심을 이끌어냅니다. (캐릭터가 직접 이동)')}
            </p>
          </button>

          {/* 행동 B: 동료 만나기 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('meet_peer')}
            className="pixel-btn-mc p-3 text-left transition-all disabled:opacity-40 rounded"
          >
            <div className="flex items-center gap-2 font-pixel text-amber-300 font-bold text-xs mb-1">
              <Coffee className="w-4 h-4 text-amber-400" />
              <span>
                {isTargetingStay
                  ? (isEn ? 'B. Rally Desk Peers & Buy Coffee' : 'B. 현 부서 후배·동료들과 결속 다지기')
                  : (isEn ? `B. Coffee with Target Beat Reporter (${selectedTargetWish} Wish)` : `B. 희망 부서 동료와 티타임 (${selectedTargetWish}지망)`)}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isTargetingStay
                ? (isEn ? 'Rally peer support so consensus agrees: "The desk collapses without them."' : '동료들과 티타임을 가지며 "선배 빠지면 팀 무너진다"는 사내 여론을 조성합니다.')
                : (isEn ? 'Scout internal atmosphere, veteran move rumours, and preferred candidate profiles.' : '내부 분위기, 장기근무자의 이동 의향, 부서장의 선호 인재상 소문을 파악합니다.')}
            </p>
          </button>

          {/* 행동 C: 소문 흘리기 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('spread_rumor')}
            className="pixel-btn-mc p-3 text-left transition-all disabled:opacity-40 rounded"
          >
            <div className="flex items-center gap-2 font-pixel text-purple-300 font-bold text-xs mb-1">
              <MessageSquareShare className="w-4 h-4 text-purple-400" />
              <span>
                {isTargetingStay
                  ? (isEn ? 'C. Stake Claim: "I Am NOT Leaving This Desk"' : 'C. "나 딴 데 안 간다" 잔류 소문 못 박기')
                  : (isEn ? 'C. Leak Reshuffle Transfer Rumour' : 'C. 편집국에 인사 이동 소문 흘리기')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isTargetingStay
                ? (isEn ? 'Broadcast commitment across newsroom to kill off unwanted forced transfers.' : '"나 이번에 출입처 절대 안 바꾼다"고 소문을 퍼뜨려 타 부서의 강제 차출을 차단합니다.')
                : (isEn ? '"I want to move this cycle." Alerts target desks, but current boss may hear!' : '"나 이번에 움직이고 싶어." 희망 부서에 알려지지만 현재 부서장이 눈치챌 수도 있습니다!')}
            </p>
          </button>

          {/* 행동 D: 휴게실 탐색 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('explore_board')}
            className="pixel-btn-mc p-3 text-left transition-all disabled:opacity-40 rounded"
          >
            <div className="flex items-center gap-2 font-pixel text-cyan-300 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>
                {isTargetingStay
                  ? (isEn ? 'D. Lounge Espionage (Scout Poachers/Rivals)' : 'D. 휴게실 정세 탐색 (부서 노리는 침입자 파악)')
                  : (isEn ? 'D. Lounge Espionage & Domino Dynamics' : 'D. 휴게실 인사판 & 도미노 정세 탐색')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isTargetingStay
                ? (isEn ? 'Mingle with senior editors to scout rivals eyeing your current beat.' : '선배들과 담소를 나누며 우리 부서로 밀고 들어오려는 외부 경쟁자나 낙하산 기류를 탐색합니다.')
                : (isEn ? 'Chat with senior correspondents to decipher domino reshuffle patterns.' : '선배 기자들과 담소를 나누며 이번 인사의 폭과 연쇄 도미노 기류를 엿봅니다.')}
            </p>
          </button>

          {/* 행동 E: 부서장 담판 / 기획안 제출 */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('meet_cur_boss')}
            className="pixel-btn-mc p-3 text-left transition-all disabled:opacity-40 rounded"
          >
            <div className="flex items-center gap-2 font-pixel text-amber-300 font-bold text-xs mb-1">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <span>
                {isTargetingStay
                  ? (isEn ? 'E. Submit Long-Term Project Pitch (Anchoring)' : 'E. 중장기 심층 기획안 제출 (부서 잔류 알박기)')
                  : (isEn ? 'E. Frank Talk with Current Chief (Ask for Path)' : 'E. 현재 부서장과 솔직한 면담 (길 터달라 설득)')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isTargetingStay
                ? (isEn ? 'Submit year-long major project pitch to desk to lock in mandatory retention.' : '내년까지 이어지는 대형 심층 기획안을 데스크에 공식 제출하여 잔류할 수밖에 없는 명분을 굳힙니다.')
                : (isEn ? '"Chief, I wish to broaden my horizon." Probabilistically tests boss intent.' : '"부장님, 이번엔 다른 분야를 경험해보고 싶습니다." 부서장의 본심을 확률적으로 확인합니다.')}
            </p>
          </button>

          {/* 행동 F: 묵묵히 기사 쓰기 (실력 승부) */}
          <button
            disabled={farmingState.remainingPoints <= 0}
            onClick={() => handleAction('write_article')}
            className="pixel-btn-mc p-3 text-left transition-all disabled:opacity-40 rounded border-emerald-600"
          >
            <div className="flex items-center gap-2 font-pixel text-emerald-300 font-bold text-xs mb-1">
              <FileEdit className="w-4 h-4 text-emerald-400" />
              <span>
                {isTargetingStay
                  ? (isEn ? 'F. Publish Exclusive Scoop on Beat (Irreplaceable)' : 'F. 현 출입처 단독 특종 보도 (대체 불가 입증)')
                  : (isEn ? 'F. Write Major Scoop Series (Pure Merit)' : 'F. 인사 농사 대신 특종 기사 집필 (실력파)')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isTargetingStay
                ? (isEn ? 'Drop a bombshell scoop proving "no one else can cover this beat."' : '현재 맡은 출입처에서 대형 단독 특종을 터뜨려 "이 자리는 김 기자가 아니면 안 된다"는 것을 증명합니다.')
                : (isEn ? 'Score pure journalistic impact. Scoop points surge and target desk notices.' : '사내 정치 대신 실력으로 승부합니다. 기사 성과 대폭 상승 및 1지망 데스크 호평 획득.')}
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
            <span>
              {isTargetingStay
                ? (isEn ? 'G. "Unmoved by Reshuffle Winds" (Guard desk and file quietly)' : 'G. "인사 풍파에 흔들리지 않는다" (출입처 굳건히 지키며 마감 대기)')
                : (isEn ? 'G. "I Do Not Dwell on Reshuffles" (Meet regular deadlines calmly)' : 'G. "나는 인사에 연연하지 않는다" (평소처럼 묵묵히 마감 대기)')}
            </span>
          </button>
        </div>
      </div>

      {/* 인사 농사 전 / 후 확률 변화 비교 카드 */}
      <div className="pixel-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            <h4 className="font-pixel text-sm text-slate-100 font-bold">
              {isEn ? 'Estimated Odds Comparison (Before vs After Politicking)' : '인사 농사 전 / 후 예상 확률 비교'}
            </h4>
          </div>
          <span className="text-[11px] text-slate-400 font-pixel">{isEn ? 'Real-time identical simulation model' : '동일 모형 기반 실시간 반영'}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* 1지망 */}
          <div className="pixel-slot p-2.5">
            <div className="text-slate-400 text-[11px] font-pixel">{isEn ? '1st Wish' : '1지망'} {wishes.first.deptName}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px] font-pixel">{probBefore.firstWish}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-cyan-400 font-bold text-sm">{probNow.firstWish}%</span>
            </div>
          </div>

          {/* 2지망 */}
          <div className="pixel-slot p-2.5">
            <div className="text-slate-400 text-[11px] font-pixel">{isEn ? '2nd Wish' : '2지망'} {wishes.second.deptName}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px] font-pixel">{probBefore.secondWish}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-slate-200 font-bold text-sm">{probNow.secondWish}%</span>
            </div>
          </div>

          {/* 희망 부서 합산 */}
          <div className="pixel-slot p-2.5">
            <div className="text-slate-400 text-[11px] font-pixel">{isEn ? 'Total Wish Combined' : '희망부서 합산'}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px] font-pixel">{probBefore.totalWish}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-emerald-400 font-bold text-sm">{probNow.totalWish}%</span>
            </div>
          </div>

          {/* 잔류 확률 */}
          <div className="pixel-slot p-2.5">
            <div className="text-slate-400 text-[11px] font-pixel">{isEn ? 'Stay Current Desk' : '현 부서 잔류'}</div>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-slate-500 line-through text-[11px] font-pixel">{probBefore.stayCurrent}%</span>
              <span className="text-slate-400">➔</span>
              <span className="font-pixel text-amber-400 font-bold text-sm">{probNow.stayCurrent}%</span>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 pt-1 font-pixel">
          {isEn ? '* Probabilities recalculate dynamically as boss intent and sentiment evolve from your actions.' : '* 행동 결과에 따라 부서장 영입 의사 및 현재 부서장의 이동 의향 상태가 갱신되어 확률이 재계산됩니다.'}
        </div>
      </div>

      {/* 나의 인사 농사 일지 */}
      {farmingState.logs.length > 0 && (
        <div className="pixel-card p-4 space-y-2">
          <div className="font-pixel text-xs text-slate-400 flex items-center gap-1.5 border-b-2 border-slate-800 pb-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEn ? 'Politicking Field Log (Recent Activities)' : '나의 인사 농사 일지 (최근 활동 내역)'}</span>
          </div>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {farmingState.logs.map((lg, idx) => (
              <div key={idx} className="pixel-slot p-2.5 text-xs">
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
          className="pixel-btn-mc text-slate-300 py-3 px-5 text-sm font-pixel flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{isEn ? 'Back to Wishes' : '희망 부서로 돌아가기'}</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onNext();
          }}
          className="pixel-btn-mc pixel-btn-mc-primary flex-1 py-3 px-6 text-base font-bold flex items-center justify-center gap-2"
        >
          <span>{isEn ? 'Conclude Politicking & Enter Committee' : '인사 농사 마치고 인사위원회로 입장'}</span>
          <ArrowRight className="w-5 h-5 text-amber-300" />
        </button>
      </div>
    </div>
  );
};
