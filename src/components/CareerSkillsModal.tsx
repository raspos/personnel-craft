import React from 'react';
import { CareerAnalysisResult } from '../types/game';
import { X, Award, Compass, ShieldAlert, Sparkles, Hexagon, Zap } from 'lucide-react';
import { SkillRadarChart } from './SkillRadarChart';
import { sound } from '../utils/sound';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  analysis: CareerAnalysisResult;
}

export const CareerSkillsModal: React.FC<Props> = ({ isOpen, onClose, analysis }) => {
  const { language } = useLanguage();
  const isEn = language === 'en';

  const translateSkill = (name: string): string => {
    if (!isEn) return name;
    const map: Record<string, string> = {
      '정치·정책': 'Politics',
      '경제·금융': 'Economy',
      '기업·산업': 'Industry',
      '외교·국제': 'Diplomacy',
      '현장취재': 'Field Beat',
      '탐사·기획': 'Investigative',
      '데이터 분석': 'Data Analysis',
      '기술·디지털': 'Tech & Digital',
      '콘텐츠·편집': 'Editing'
    };
    return map[name] || name;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="pixel-card bg-slate-950 border-4 border-cyan-500/80 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6">
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-400" />
            <h2 className="font-pixel text-lg text-slate-100 font-bold">
              {isEn ? 'Journalist Expertise Skill Tree & Career Paths' : '기자 전문성 스킬트리 & 커리어패스'}
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
            <span className="text-xs text-slate-400">{isEn ? 'Archetype:' : '분석된 기자 유형:'}</span>
            <span className="font-pixel text-amber-300 font-bold text-base">{analysis.reporterType}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {analysis.description}
          </p>
        </div>

        {/* [신규] 부서 간 연계 시너지 카드 */}
        {analysis.careerSynergy && (
          <div className="bg-gradient-to-r from-blue-950/70 to-indigo-950/70 p-4 rounded-lg border border-cyan-500/40 space-y-1.5 shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-pixel font-bold bg-cyan-900/80 text-cyan-300 border border-cyan-500/50 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  <span>{isEn ? 'Inter-Desk Synergy' : '부서 간 연계 시너지'}</span>
                </span>
                <span className="font-pixel text-sm text-cyan-200 font-bold">
                  {analysis.careerSynergy.title}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-pixel">
                {analysis.careerSynergy.combination}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
              {analysis.careerSynergy.description}
            </p>
          </div>
        )}

        {/* RPG 스타일 다각형 레이더 그래프 & 스킬트리 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-1.5">
              <Hexagon className="w-4 h-4 text-cyan-400" />
              <span>{isEn ? 'Competency Radar Graph (Skill Tree)' : '기자 역량 다각형 레이더 그래프 (스킬트리)'}</span>
            </h3>
            <span className="text-[11px] text-cyan-400 font-pixel">{isEn ? '9 Core Beat Areas (Recent Tenure Weighted)' : '9대 핵심 취재 영역 (최신 경력 가중치 반영)'}</span>
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
                  <span className="text-slate-300 font-medium">{translateSkill(skill)}</span>
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
              {isEn
                ? '* Competency values represent relative experience accumulation with higher weights (up to 1.55x) on recent beats, rather than evaluation of actual journalistic writing prowess.'
                : '* 역량 수치는 최근 근무 부서에 더 높은 가중치(최대 1.55배)가 반영된 상대적 경험 축적치이며, 기자의 실제 기사 작성 능력을 평가한 점수가 아닙니다.'}
            </span>
          </div>
        </div>

        {/* 추천 커리어패스 3경로 (A / B / C) */}
        <div className="space-y-3">
          <h3 className="font-pixel text-sm text-slate-200 font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>{isEn ? '3 Recommended Career Paths' : '경력 기반 추천 커리어패스 3가지'}</span>
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
                      {isEn ? `Path ${path.type}` : `경로 ${path.type}`}
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
            className="pixel-btn-mc pixel-btn-mc-primary py-2 px-5 text-xs font-pixel"
          >
            {isEn ? 'Confirm & Close' : '확인 및 닫기'}
          </button>
        </div>
      </div>
    </div>
  );
};
