import React, { useState } from 'react';
import { CareerRecord, WishSelection } from '../types/game';
import { runSimulation, drawFinalAppointment } from '../utils/simulationEngine';
import { DEFAULT_DEPARTMENTS } from '../data/departments';
import { X, Play, Clock, Award, Shield, Sparkles } from 'lucide-react';
import { sound } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  careers: CareerRecord[];
  wishes: WishSelection;
  hireYear: number;
}

interface TenYearStep {
  index: number;
  year: number;
  half: '상반기' | '하반기';
  dept: string;
  resultType: string;
}

export const TenYearSimulationModal: React.FC<Props> = ({
  isOpen,
  onClose,
  careers,
  wishes,
  hireYear
}) => {
  const [history, setHistory] = useState<TenYearStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [finalTitle, setFinalTitle] = useState<string>('');

  if (!isOpen) return null;

  const runTenYears = () => {
    sound.playClick();
    setIsRunning(true);
    const steps: TenYearStep[] = [];

    let currentDept = careers.length > 0 ? careers[careers.length - 1].deptName : '사회부';
    let simCareers: CareerRecord[] = JSON.parse(JSON.stringify(careers));
    let simWishes: WishSelection = JSON.parse(JSON.stringify(wishes));
    const baseYear = hireYear + Math.floor(careers.reduce((s, c) => s + c.periodMonths, 0) / 12);

    for (let i = 1; i <= 20; i++) {
      const year = baseYear + Math.floor((i - 1) / 2);
      const half = i % 2 === 1 ? '상반기' : '하반기';

      // 1지망 부서에 이미 안착한 경우, 차기 희망 부서로 동적 리밸런싱 (현 소속 부서를 또 지망하지 않음)
      if (simWishes.first.deptName === currentDept || simWishes.first.deptName === '없음') {
        const used = new Set([
          currentDept,
          simWishes.second.deptName,
          simWishes.third.deptName,
          simWishes.avoidDept,
          '없음',
          '선택 안 함'
        ]);
        const nextCand = DEFAULT_DEPARTMENTS.find(d => !used.has(d.name))?.name || '기획취재부';
        const nextFirstDept = (simWishes.second.deptName && simWishes.second.deptName !== '없음')
          ? simWishes.second.deptName
          : nextCand;

        simWishes = {
          ...simWishes,
          first: {
            ...simWishes.first,
            deptName: nextFirstDept,
            expectedTO: '1명',
            bossRelation: '인사만 하는 사이',
            relationTemp: '보통',
            recruitIntent: '특별한 의사 표현 없음'
          },
          second: {
            ...simWishes.second,
            deptName: (simWishes.third.deptName && simWishes.third.deptName !== '없음') ? simWishes.third.deptName : '없음'
          },
          third: {
            ...simWishes.third,
            deptName: '없음'
          }
        };
      }

      // 시뮬레이션 실행 (해석해 닫힌 해 기반)
      const simRes = runSimulation(simCareers, simWishes, null, 1000, undefined, currentDept);
      const outcome = drawFinalAppointment(simRes.probabilities, simWishes, currentDept);

      steps.push({
        index: i,
        year,
        half,
        dept: outcome.assignedDept,
        resultType: outcome.resultType
      });

      const isSameDept = outcome.assignedDept === currentDept;
      currentDept = outcome.assignedDept;

      if (isSameDept && simCareers.length > 0) {
        // 동일 부서 잔류 시 해당 부서 근속을 6개월 연장 (근속 누적으로 다음 턴 이동 압력 자연스럽게 상승)
        simCareers[simCareers.length - 1].periodMonths += 6;
      } else {
        // 새 부서로 이동 시 신규 6개월 블록 추가
        simCareers.push({
          id: `ten_${i}`,
          deptName: outcome.assignedDept,
          periodMonths: 6,
          subFields: [{ name: '취재', months: 6 }]
        });
      }
    }

    // 최종 타이틀 도출
    const deptFreq: Record<string, number> = {};
    steps.forEach(s => {
      deptFreq[s.dept] = (deptFreq[s.dept] || 0) + 1;
    });
    const sortedDepts = Object.entries(deptFreq).sort((a, b) => b[1] - a[1]);
    const maxDept = sortedDepts[0];

    let title = '편집국 만능 순환의 달인';
    if (maxDept && maxDept[1] >= 8) {
      title = `${maxDept[0]}의 영원한 수호자`;
    } else if (sortedDepts.length >= 6) {
      title = '바람과 함께 사라지는 편집국 방랑자';
    } else if (steps.filter(s => s.resultType === 'first').length >= 8) {
      title = '운과 실력을 겸비한 엘리트 데스크';
    }

    setHistory(steps);
    setFinalTitle(title);
    setIsRunning(false);
    sound.playSuccessFanfare();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-card bg-slate-950 border-4 border-indigo-500/80 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-400" />
            <h2 className="font-pixel text-lg text-slate-100 font-bold">
              10년 기자 인생 모드 (총 20회 연속 정기인사)
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

        <p className="text-xs text-slate-300 leading-relaxed">
          향후 10년 동안 매년 상·하반기 총 20번의 정기인사를 순차적으로 돌려 당신의 10년 장기 커리어 궤적을 예측합니다.
        </p>

        {history.length === 0 ? (
          <div className="bg-slate-950 p-8 rounded-xl border border-slate-800 text-center space-y-4">
            <div className="text-4xl">⏳</div>
            <div className="font-pixel text-sm text-slate-200">
              준비가 되셨다면 10년 타임머신을 가동하세요!
            </div>
            <button
              onClick={runTenYears}
              disabled={isRunning}
              className="pixel-btn-mc pixel-btn-mc-primary text-white py-3 px-6 text-xs font-pixel flex items-center gap-2 mx-auto"
            >
              <Play className="w-4 h-4" />
              <span>10년 (20회) 시뮬레이션 가동</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 최종 타이틀 */}
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 p-4 rounded-xl border border-indigo-400/60 text-center">
              <span className="text-[11px] text-indigo-300 font-pixel">10년 커리어 최종 저널리스트 칭호</span>
              <div className="font-pixel text-xl text-amber-300 font-bold my-1 flex items-center justify-center gap-2">
                <Award className="w-5 h-5 text-amber-400" />
                <span>{finalTitle}</span>
              </div>
            </div>

            {/* 20회 타임라인 테이블 */}
            <div className="max-h-60 overflow-y-auto bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 text-xs">
              {history.map((step) => (
                <div
                  key={step.index}
                  className="flex items-center justify-between p-2 rounded bg-slate-900/80 border border-slate-800 hover:border-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 text-center font-pixel text-slate-500 text-[10px]">#{step.index}</span>
                    <span className="text-slate-400">{step.year}년 {step.half}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-pixel text-slate-100 font-bold">{step.dept}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-pixel ${
                      step.resultType === 'first'
                        ? 'bg-blue-900 text-blue-200'
                        : step.resultType === 'avoid'
                        ? 'bg-red-900 text-red-200'
                        : step.resultType === 'stay'
                        ? 'bg-amber-950 text-amber-300'
                        : 'bg-slate-800 text-slate-300'
                    }`}>
                      {step.resultType === 'first' ? '1지망' : step.resultType === 'avoid' ? '기피부서' : step.resultType === 'stay' ? '잔류' : '이동'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={runTenYears}
                className="pixel-btn-mc text-slate-200 py-2.5 px-4 text-xs font-pixel flex items-center justify-center gap-1.5 flex-1"
              >
                <span>다시 시뮬레이션</span>
              </button>
              <button
                onClick={() => {
                  sound.playBlip();
                  onClose();
                }}
                className="pixel-btn-mc pixel-btn-mc-primary py-2.5 px-5 text-xs font-pixel"
              >
                닫기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
