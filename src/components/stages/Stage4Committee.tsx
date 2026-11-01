import React, { useState } from 'react';
import {
  CareerRecord,
  WishSelection,
  SuddenEvent
} from '../../types/game';
import { runSimulation } from '../../utils/simulationEngine';
import { SUDDEN_EVENTS } from '../../data/events';
import {
  Scale,
  Sparkles,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ToggleLeft,
  ToggleRight,
  Zap,
  TrendingUp,
  AlertOctagon,
  Percent
} from 'lucide-react';
import { sound } from '../../utils/sound';

interface Stage4Props {
  careers: CareerRecord[];
  wishes: WishSelection;
  setWishes: (w: WishSelection) => void;
  activeEvent: SuddenEvent;
  setActiveEvent: (e: SuddenEvent) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenAssumptionsModal: () => void;
}

export const Stage4Committee: React.FC<Stage4Props> = ({
  careers,
  wishes,
  setWishes,
  activeEvent,
  setActiveEvent,
  onNext,
  onPrev,
  onOpenAssumptionsModal
}) => {
  const [isSimulating, setIsSimulating] = useState(false);

  // 1. 관계 변수 반영 상태(현재) 시뮬레이션 실행
  const simCurrent = runSimulation(careers, wishes, activeEvent, 10000);

  // 2. 관계 변수 제외(OFF) 상태 비교 시뮬레이션
  const wishesWithoutRelation = { ...wishes, applyBossRelation: false };
  const simPureMerit = runSimulation(careers, wishesWithoutRelation, activeEvent, 10000);

  const prob = simCurrent.probabilities;
  const probPure = simPureMerit.probabilities;

  // 토글 핸들러
  const handleToggleRelation = () => {
    sound.playBlip();
    setWishes({ ...wishes, applyBossRelation: !wishes.applyBossRelation });
  };

  // 돌발 이벤트 랜덤 추첨
  const handleDrawEvent = () => {
    sound.playClick();
    const filtered = SUDDEN_EVENTS.filter(e => e.id !== activeEvent.id);
    const randomEvent = filtered[Math.floor(Math.random() * filtered.length)];
    setActiveEvent(randomEvent);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 헤더 */}
      <div className="voxel-card p-4 border-indigo-500/40 bg-slate-900/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-pixel text-lg text-indigo-300 font-bold flex items-center gap-2">
            <Scale className="w-5 h-5 text-indigo-400" />
            <span>STAGE 4. 인사위원회 몬테카를로 시뮬레이션</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1 font-medium">
            “인사 농사는 내가 짓지만, 발령은 편집국장이 낸다.” 인사 농사에서 모은 정보와 행동이 인사판에 반영되었습니다.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            onOpenAssumptionsModal();
          }}
          className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs py-1.5 px-3 rounded flex items-center gap-1 font-pixel"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>모형 가정 보기</span>
        </button>
      </div>

      {/* 인사 돌발 이벤트 배너 */}
      <div className={`voxel-card p-4 border transition-all ${
        activeEvent.type === 'scenario'
          ? 'border-amber-400/60 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900'
          : 'border-slate-700 bg-slate-900/80'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${activeEvent.type === 'scenario' ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
            <span className="font-pixel text-xs text-slate-300">편집국 인사 돌발 이벤트</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
              activeEvent.type === 'scenario' ? 'bg-amber-900 text-amber-200' : 'bg-slate-800 text-slate-400'
            }`}>
              {activeEvent.type === 'scenario' ? '시나리오 변수 변동' : '일반 분위기'}
            </span>
          </div>

          <button
            onClick={handleDrawEvent}
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-pixel"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>다른 이벤트 뽑기</span>
          </button>
        </div>

        <div className="space-y-1">
          <div className="font-pixel text-base text-slate-100 font-bold">{activeEvent.title}</div>
          <p className="text-xs text-slate-300">{activeEvent.description}</p>
          <div className="text-xs text-amber-300 font-medium pt-1">
            ▶ 반영 효과: {activeEvent.effectDescription}
          </div>
        </div>
      </div>

      {/* 부서장 관계 반영 토글 스위치 */}
      <div className="voxel-card p-4 border-blue-500/40 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-2">
            <span>부서장 관계 및 사적 친분 변수 반영</span>
            <span className={`text-[11px] px-2 py-0.5 rounded font-pixel ${
              wishes.applyBossRelation ? 'bg-blue-900 text-blue-300' : 'bg-slate-800 text-slate-400'
            }`}>
              {wishes.applyBossRelation ? 'ON (현실 풍자 모형)' : 'OFF (순수 경력·TO 모형)'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            스위치를 켜면 영입 의사·사적 친분 변수가 가중치에 포함되며, 끄면 경력·근속·TO만으로 계산됩니다.
          </p>
        </div>

        <button
          onClick={handleToggleRelation}
          className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-blue-500/50 text-blue-300 py-2 px-4 rounded-lg flex items-center gap-2 text-xs font-pixel"
        >
          {wishes.applyBossRelation ? (
            <>
              <ToggleRight className="w-5 h-5 text-blue-400" />
              <span>관계 변수 끄기</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-slate-400" />
              <span>관계 변수 켜기</span>
            </>
          )}
        </button>
      </div>

      {/* 확률 시뮬레이션 결과 게이지 카드 */}
      <div className="voxel-card p-5 space-y-4 border-indigo-500/30">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-indigo-400" />
            <h3 className="font-pixel text-base text-slate-100 font-bold">
              10,000회 시뮬레이션 예상 발령 확률
            </h3>
          </div>
          <div className="text-xs font-pixel text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-600/50">
            희망 부서 합산 성공률: {prob.totalWish}%
          </div>
        </div>

        <div className="space-y-3">
          {/* 1지망 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="font-pixel text-blue-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
                1지망: {wishes.first.deptName}
                {wishes.first.expectedTO === '0명' && (
                  <span className="text-rose-400 text-[10px] bg-rose-950 px-1 rounded border border-rose-800">
                    확정 TO 0명 (0% 고정)
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 font-pixel">
                {wishes.applyBossRelation && (
                  <span className="text-[11px] text-slate-500 line-through">
                    {probPure.firstWish}%
                  </span>
                )}
                <span className="text-blue-400 font-bold text-sm">{prob.firstWish}%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-500"
                style={{ width: `${Math.min(100, prob.firstWish)}%` }}
              />
            </div>
          </div>

          {/* 2지망 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="font-pixel text-slate-200 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-700 text-white flex items-center justify-center text-[10px]">2</span>
                2지망: {wishes.second.deptName}
                {wishes.second.expectedTO === '0명' && (
                  <span className="text-rose-400 text-[10px] bg-rose-950 px-1 rounded border border-rose-800">
                    확정 TO 0명 (0% 고정)
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 font-pixel">
                {wishes.applyBossRelation && (
                  <span className="text-[11px] text-slate-500 line-through">
                    {probPure.secondWish}%
                  </span>
                )}
                <span className="text-slate-200 font-bold text-sm">{prob.secondWish}%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-slate-400 transition-all duration-500"
                style={{ width: `${Math.min(100, prob.secondWish)}%` }}
              />
            </div>
          </div>

          {/* 3지망 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="font-pixel text-slate-300 flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-slate-700 text-white flex items-center justify-center text-[10px]">3</span>
                3지망: {wishes.third.deptName}
                {wishes.third.expectedTO === '0명' && (
                  <span className="text-rose-400 text-[10px] bg-rose-950 px-1 rounded border border-rose-800">
                    확정 TO 0명 (0% 고정)
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2 font-pixel">
                {wishes.applyBossRelation && (
                  <span className="text-[11px] text-slate-500 line-through">
                    {probPure.thirdWish}%
                  </span>
                )}
                <span className="text-slate-300 font-bold text-sm">{prob.thirdWish}%</span>
              </div>
            </div>
            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-indigo-500 transition-all duration-500"
                style={{ width: `${Math.min(100, prob.thirdWish)}%` }}
              />
            </div>
          </div>

          {/* 기피 부서 (위험도) */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-medium">
              <span className="font-pixel text-rose-300 flex items-center gap-1.5">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                기피 부서 유입 위험: {wishes.avoidDept}
              </span>
              <span className="text-rose-400 font-bold text-sm font-pixel">{prob.avoidDept}%</span>
            </div>
            <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-rose-500 transition-all duration-500"
                style={{ width: `${Math.min(100, prob.avoidDept)}%` }}
              />
            </div>
          </div>

          {/* 현 부서 잔류 & 기타 부서 */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div className="text-slate-400">현 부서 잔류 확률:</div>
              <div className="font-pixel text-amber-300 font-bold text-sm mt-0.5">{prob.stayCurrent}%</div>
            </div>
            <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div className="text-slate-400">기타 부서 임의 배치:</div>
              <div className="font-pixel text-slate-300 font-bold text-sm mt-0.5">{prob.otherDept}%</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 text-right pt-1">
            * 모든 항목의 합계는 수학적으로 정확히 100.0%로 정규화되었습니다.
          </div>
        </div>
      </div>

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
          <span>이전</span>
        </button>

        <button
          onClick={() => {
            sound.playClick();
            onNext();
          }}
          className="voxel-btn bg-gradient-to-r from-red-600 to-indigo-600 hover:from-red-500 hover:to-indigo-500 text-white flex-1 py-3 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2 shadow-lg"
        >
          <span>운명의 인사발령 발표장으로 입장</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
