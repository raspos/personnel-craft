import React from 'react';
import { CareerAnalysisResult } from '../types/game';
import { X, Award, Compass, ShieldAlert, Sparkles, Hexagon } from 'lucide-react';
import { SkillRadarChart } from './SkillRadarChart';
import { sound } from '../utils/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysis: CareerAnalysisResult;
}

export const CareerSkillsModal: React.FC<Props> = ({ isOpen, onClose, analysis }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="voxel-card bg-slate-900 border-blue-500/60 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h2 className="font-pixel text-lg text-slate-100 font-bold">
              기자 전문성 스킬트리 & 커리어패스
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

        {/* 기자 유형 & 세부 전문성 */}
        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs text-slate-400">분석된 기자 유형:</span>
            <span className="font-pixel text-amber-300 font-bold text-base">{analysis.reporterType}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.description}
          </p>
        </div>

        {/* RPG 스타일 다각형 레이더 그래프 & 스킬트리 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-1.5">
              <Hexagon className="w-4 h-4 text-cyan-400" />
              <span>기자 역량 다각형 레이더 그래프 (스킬트리)</span>
            </h3>
            <span className="text-[11px] text-cyan-400 font-pixel">9대 핵심 취재 영역</span>
          </div>

          {/* 중앙 다각형 레이더 차트 */}
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex justify-center shadow-inner overflow-hidden">
            <SkillRadarChart skills={analysis.skillTree} size={300} showLabels={true} />
          </div>

          {/* 세부 게이지 목록 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(analysis.skillTree).map(([skill, val]) => (
              <div key={skill} className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 font-medium">{skill}</span>
                  <span className="font-pixel text-amber-400 font-bold">{val} P</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 bg-slate-950/60 rounded border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
            <span>
              * 위 점수 및 다각형 레이더 차트는 근무 부서 및 취재 분야에 따른 가상의 상대적 경험 축적치이며, 기자의 실제 업무 역량이나 특종 능력을 평가한 점수가 아닙니다.
            </span>
          </div>
        </div>

        {/* 추천 커리어패스 3경로 (A / B / C) */}
        <div className="space-y-3">
          <h3 className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>경력 기반 추천 커리어패스 3가지</span>
          </h3>

          <div className="space-y-3">
            {analysis.careerPaths.map((path) => (
              <div
                key={path.type}
                className="bg-slate-950/90 p-4 rounded-lg border border-slate-800 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-pixel font-bold bg-blue-900 text-blue-300">
                      경로 {path.type}
                    </span>
                    <span className="font-pixel text-sm text-slate-100 font-bold">{path.title}</span>
                  </div>
                </div>

                {/* 블록 단계 맵 */}
                <div className="flex items-center gap-1.5 my-2.5 overflow-x-auto py-1">
                  {path.steps.map((st, i) => (
                    <React.Fragment key={i}>
                      <span className="bg-slate-800 text-amber-300 border border-slate-700 px-2.5 py-1 rounded text-xs font-pixel whitespace-nowrap">
                        {st}
                      </span>
                      {i < path.steps.length - 1 && (
                        <span className="text-slate-500 text-xs">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {path.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 닫기 버튼 */}
        <div className="pt-2 text-right">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="voxel-btn voxel-btn-primary py-2 px-5 rounded text-xs font-pixel"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
