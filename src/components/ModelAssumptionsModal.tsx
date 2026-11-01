import React from 'react';
import { X, BookOpen, ShieldCheck, AlertCircle, Cpu } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ModelAssumptionsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="voxel-card bg-slate-900 border-indigo-500/60 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h2 className="font-pixel text-lg text-slate-100 font-bold">
              인사 시뮬레이션 모형 가정 및 계산 원칙
            </h2>
          </div>
          <button
            onClick={() => {
              sound.playBlip();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          {/* 원칙 1: 확정 TO 0명 */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-pixel text-slate-200 font-bold flex items-center gap-1.5 text-sm text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>1. 확정 TO 0명 부서의 배치 확률은 원칙적 0%</span>
            </div>
            <p>
              부서장과 사적 친분이 아무리 두텁거나 영입 의사가 적극적이라도, 부서에 확정된 결원(TO)이 0명인 경우 해당 부서로의 배치 확률은 0%로 엄격히 고정됩니다.
            </p>
            <p className="text-[11px] text-amber-300/90 pt-1 border-t border-slate-850">
              * 단, '1지망 부서 긴급 결원 발생' 돌발 이벤트가 발동한 경우에 한해, 예외적으로 단독 공석이 신설되어 0% 제약이 해제되고 진입 확률이 발생합니다.
            </p>
          </div>

          {/* 원칙 2: TO 불확실성 가정 및 장기근무자 */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-pixel text-slate-200 font-bold flex items-center gap-1.5 text-sm text-amber-300">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>2. 장기근무자와 TO의 독립적 산정</span>
            </div>
            <p>
              해당 부서에 2년 이상 장기근무자가 존재한다고 해서 자동으로 추가 TO가 발생하는 것으로 간주하지 않습니다. 확정 TO가 사전에 입력된 경우 장기근무자 수를 중복 가산하지 않으며, 'TO 모름' 상태에서만 순환 유동성 기대치로 제한적으로 참조합니다.
            </p>
          </div>

          {/* 원칙 3: 관계 변수와 현실 풍자 */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-pixel text-slate-200 font-bold flex items-center gap-1.5 text-sm text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>3. 사적 관계 변수는 '현실 풍자' 게임 요소</span>
            </div>
            <p>
              출신 학교, 사적 친분, 술자리 인연 등은 언론사의 공식적이고 정당한 인사 기준이 아닙니다. 본 게임은 조직 내 보이지 않는 비공식적 관계 역학을 풍자적으로 조명하기 위한 시뮬레이션이며, 사용자는 '관계 변수 ON/OFF' 스위치를 통해 순수 경력 중심 모형과 비교할 수 있습니다.
            </p>
          </div>

          {/* 원칙 4: 몬테카를로 1만회와 합계 100% */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-pixel text-slate-200 font-bold flex items-center gap-1.5 text-sm text-indigo-300">
              <span>📊 4. 몬테카를로 10,000회 시뮬레이션 및 정규화</span>
            </div>
            <p>
              1만 회의 무작위 표본 추출을 통해 가중치 분포를 수렴시키며, 기피 부서 유입 위험과 현 부서 잔류 확률을 독립 분리하여 합계가 정확히 100.0%가 되도록 정규화합니다. 단, 난수 시뮬레이션 횟수가 많다고 해서 실제 언론사 인사의 현실적 예측 정확도가 높아지는 것은 아님을 밝힙니다.
            </p>
          </div>

          {/* 원칙 5: 경쟁자 모델 */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="font-pixel text-slate-200 font-bold flex items-center gap-1.5 text-sm text-cyan-300">
              <span>👥 5. TO 대비 지원 경쟁자 수 연동 모델</span>
            </div>
            <p>
              TO가 1명이라도 단독 지원자인 경우 무혈입성 우대 가중치(1.25배)를 받으며, 반대로 지원 경쟁자가 3~5명 이상 몰리는 격전지인 경우 실질 진입 확률이 0.40~0.65배로 급격히 감소하도록 수학적 경쟁률을 정밀 반영합니다.
            </p>
          </div>
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 py-2 px-5 rounded text-xs font-pixel"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
