import React, { useState } from 'react';
import { CareerRecord, SubFieldExperience } from '../../types/game';
import { DEFAULT_DEPARTMENTS, getDepartmentByName } from '../../data/departments';
import { analyzeCareer } from '../../utils/careerAnalysis';
import {
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Compass,
  Layers,
  GripVertical,
  Hexagon,
  ArrowUpDown
} from 'lucide-react';
import { SkillRadarChart } from '../SkillRadarChart';
import { sound } from '../../utils/sound';

interface Stage2Props {
  careers: CareerRecord[];
  setCareers: (c: CareerRecord[]) => void;
  onNext: () => void;
  onPrev: () => void;
  onOpenSkillsModal: () => void;
}

export const Stage2CareerInput: React.FC<Stage2Props> = ({
  careers,
  setCareers,
  onNext,
  onPrev,
  onOpenSkillsModal
}) => {
  const [selectedDeptToAdd, setSelectedDeptToAdd] = useState('사회부');
  const [customDeptName, setCustomDeptName] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);

  // 드래그 앤 드롭(스와프) 상태
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const analysis = analyzeCareer(careers);

  // 부서 추가
  const handleAddCareer = () => {
    sound.playClick();
    const deptName = isCustomDept && customDeptName.trim() ? customDeptName.trim() : selectedDeptToAdd;
    const defaultDef = getDepartmentByName(deptName);
    const initialSubField = defaultDef && defaultDef.subFields.length > 0 ? defaultDef.subFields[0] : '일반 취재';

    const newRecord: CareerRecord = {
      id: 'career_' + Date.now(),
      deptName,
      periodMonths: 24, // 기본 2년
      subFields: [{ name: initialSubField, months: 24 }]
    };
    setCareers([...careers, newRecord]);
    if (isCustomDept) setCustomDeptName('');
  };

  // 부서 삭제
  const handleRemoveCareer = (id: string) => {
    sound.playBlip();
    setCareers(careers.filter(c => c.id !== id));
  };

  // [신규] 드래그 앤 드롭 스와프(순서 재배치) 핸들러
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox 호환용 dummy 데이터
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) {
      setDragOverIdx(idx);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggedIdx !== null && draggedIdx !== targetIdx) {
      sound.playClick();
      const updated = [...careers];
      const [draggedItem] = updated.splice(draggedIdx, 1);
      updated.splice(targetIdx, 0, draggedItem);
      setCareers(updated);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  // 근무 기간 변경 (6개월 단위)
  const handlePeriodChange = (id: string, newMonths: number) => {
    sound.playBlip();
    if (newMonths < 6) return;
    setCareers(
      careers.map(c => {
        if (c.id !== id) return c;
        const updatedSubFields = c.subFields.map(sf => ({
          ...sf,
          months: Math.max(6, Math.floor(newMonths / Math.max(1, c.subFields.length)))
        }));
        return {
          ...c,
          periodMonths: newMonths,
          subFields: updatedSubFields
        };
      })
    );
  };

  // 세부 취재 분야 단순 클릭 토글 (세부 기간 배분 없이 항목만 클릭)
  const handleToggleSubField = (careerId: string, fieldName: string) => {
    sound.playBlip();
    setCareers(
      careers.map(c => {
        if (c.id !== careerId) return c;
        const exists = c.subFields.some(sf => sf.name === fieldName);
        let updated: SubFieldExperience[];

        if (exists) {
          if (c.subFields.length === 1) return c; // 최소 1개 유지
          updated = c.subFields.filter(sf => sf.name !== fieldName);
        } else {
          updated = [...c.subFields, { name: fieldName, months: c.periodMonths }];
        }

        const perFieldMonths = Math.max(6, Math.floor(c.periodMonths / Math.max(1, updated.length)));
        const finalSubFields = updated.map(sf => ({
          ...sf,
          months: perFieldMonths
        }));

        return { ...c, subFields: finalSubFields };
      })
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 상단 안내 */}
      <div className="voxel-card p-4 border-amber-500/40 bg-slate-900/90 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="font-pixel text-lg text-amber-300 font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <span>STAGE 2. 나의 기자 커리어 블록</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
            <span>블록 좌측 핸들을 마우스나 터치로 끌어다 놓으면 순서가 바로 <strong>스와프(교체)</strong>됩니다.</span>
          </p>
        </div>
        <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-pixel text-slate-300 flex-shrink-0">
          총 경력: <span className="text-amber-400 font-bold text-sm">{analysis.totalYearsText}</span>
        </div>
      </div>

      {/* 부서 추가 바 */}
      <div className="voxel-card p-4 bg-slate-900/80">
        <div className="flex flex-wrap items-center gap-2">
          {!isCustomDept ? (
            <select
              value={selectedDeptToAdd}
              onChange={(e) => {
                if (e.target.value === '__custom__') {
                  setIsCustomDept(true);
                } else {
                  setSelectedDeptToAdd(e.target.value);
                }
              }}
              className="voxel-input text-xs py-2 font-medium"
            >
              {DEFAULT_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name} ({d.category})
                </option>
              ))}
              <option value="__custom__">직접 입력...</option>
            </select>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customDeptName}
                onChange={(e) => setCustomDeptName(e.target.value)}
                placeholder="부서명 직접 입력 (예: 탐사기획팀)"
                className="voxel-input text-xs py-2"
              />
              <button
                type="button"
                onClick={() => setIsCustomDept(false)}
                className="text-xs text-slate-400 hover:text-white underline font-pixel"
              >
                목록 선택으로 복귀
              </button>
            </div>
          )}

          <button
            onClick={handleAddCareer}
            className="voxel-btn voxel-btn-emerald text-xs py-2 px-3.5 rounded flex items-center gap-1 font-pixel"
          >
            <Plus className="w-4 h-4" />
            <span>근무 부서 블록 추가</span>
          </button>
        </div>
      </div>

      {/* 근무 부서 타임라인 리스트 (드래그 앤 드롭 스와프) */}
      <div className="space-y-3">
        {careers.length === 0 ? (
          <div className="voxel-card p-8 text-center text-slate-400 font-pixel space-y-3 bg-slate-900/60 border-2 border-dashed border-slate-700">
            <div className="text-4xl animate-bounce">🧱</div>
            <p className="text-base text-slate-200 font-bold">등록된 기자 커리어 블록이 없습니다.</p>
            <p className="text-xs text-slate-400 font-sans max-w-md mx-auto leading-relaxed">
              위의 <strong>[근무 부서 블록 추가]</strong> 버튼을 눌러 과거 출입했던 부서와 현재 소속 부서 블록을 순서대로 쌓아보세요!
            </p>
          </div>
        ) : (
          careers.map((career, idx) => {
            const deptDef = getDepartmentByName(career.deptName);
            const availableSubFields = deptDef ? deptDef.subFields : ['일반 취재', '기획', '현장'];
            const isDragging = draggedIdx === idx;
            const isDragOver = dragOverIdx === idx && draggedIdx !== idx;

            return (
              <div
                key={career.id}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`voxel-card p-4 border-l-4 transition-all select-none ${
                  isDragging
                    ? 'opacity-40 scale-[0.98] border-dashed border-sky-400 ring-2 ring-sky-500/50 shadow-2xl'
                    : isDragOver
                    ? 'border-t-4 border-t-amber-400 translate-y-1'
                    : 'hover:shadow-lg'
                }`}
                style={{ borderLeftColor: deptDef ? deptDef.color : '#3b82f6' }}
              >
                {/* 부서 헤더 & 스와프 그립 핸들 */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    {/* 드래그 앤 드롭 스와프 핸들 */}
                    <div
                      className="cursor-grab active:cursor-grabbing p-1.5 rounded-lg bg-slate-800/90 border border-slate-700 hover:border-sky-400 text-slate-400 hover:text-sky-300 transition-colors flex items-center gap-0.5"
                      title="이 핸들을 끌어서 다른 블록 위치로 스와프(교체)하세요."
                    >
                      <GripVertical className="w-4 h-4" />
                      <span className="text-[10px] font-pixel text-slate-500 hidden sm:inline">스와프</span>
                    </div>

                    <span className="w-6 h-6 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-pixel text-slate-300">
                      {idx + 1}
                    </span>
                    <span className="font-pixel text-base text-slate-100 font-bold">{career.deptName}</span>
                    {idx === careers.length - 1 && (
                      <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded font-pixel">
                        최근 부서
                      </span>
                    )}
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      {career.periodMonths / 12}년 ({career.periodMonths}개월)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* 근무 기간 조절 버튼 */}
                    <div className="flex items-center bg-slate-800 rounded border border-slate-700 text-xs">
                      <button
                        onClick={() => handlePeriodChange(career.id, -6)}
                        className="px-2.5 py-1 hover:bg-slate-700 text-slate-300 font-bold"
                        title="6개월 감소"
                      >
                        -
                      </button>
                      <span className="px-2 font-pixel text-amber-300">{career.periodMonths / 12}년</span>
                      <button
                        onClick={() => handlePeriodChange(career.id, 6)}
                        className="px-2.5 py-1 hover:bg-slate-700 text-slate-300 font-bold"
                        title="6개월 증가"
                      >
                        +
                      </button>
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={() => handleRemoveCareer(career.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded"
                      title="부서 삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 세부 취재 분야 태그 (단순 클릭 토글형) */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span className="font-pixel">취재 출입처·전문 분야 (클릭하여 켜기/끄기):</span>
                    <span className="text-[11px] text-slate-500 font-sans">
                      * 기간은 전체 근무 기간에 균등 배분됩니다.
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSubFields.map(field => {
                      const isSelected = career.subFields.some(sf => sf.name === field);
                      return (
                        <button
                          key={field}
                          type="button"
                          onClick={() => handleToggleSubField(career.id, field)}
                          className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/35 border-blue-400 text-blue-200 font-bold shadow-sm'
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-blue-400' : 'bg-slate-600'}`} />
                          <span>{field}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 실시간 전문성 분석 요약 카드 (다각형 레이더 차트 포함) */}
      <div className="voxel-card p-5 border-blue-500/40 bg-gradient-to-br from-slate-900 via-slate-850 to-blue-950/60 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Hexagon className="w-5 h-5 text-cyan-400" />
            <h3 className="font-pixel text-base text-slate-100 font-bold">기자 역량 다각형 레이더 & 전문성 분석</h3>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onOpenSkillsModal();
            }}
            className="voxel-btn bg-blue-700/80 hover:bg-blue-600 text-blue-100 border border-blue-400 text-xs py-1.5 px-3 rounded flex items-center gap-1 font-pixel"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>스킬트리 & 커리어패스 상세</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* 좌측: 텍스트 분석 */}
          <div className="md:col-span-7 space-y-2 text-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-xs text-slate-400">기자 유형:</span>
              <span className="font-pixel text-amber-300 font-bold text-base">{analysis.reporterType}</span>
            </div>
            <div className="text-xs font-pixel text-sky-300">
              {analysis.detailedSpecialty}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800">
              {analysis.description}
            </p>
            <div className="text-[11px] text-slate-400 italic">
              * 본 다각형 그래프와 평가는 부서 및 취재 분야에 기반한 가상 상대적 축적도입니다.
            </div>
          </div>

          {/* 우측: 다각형 레이더 그래프 */}
          <div className="md:col-span-5 flex justify-center bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <SkillRadarChart skills={analysis.skillTree} size={220} showLabels={true} />
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
            if (careers.length === 0) {
              alert('최소 1개 이상의 근무 부서 커리어 블록을 추가해 주세요.');
              return;
            }
            sound.playClick();
            onNext();
          }}
          className="voxel-btn voxel-btn-primary flex-1 py-3 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2"
        >
          <span>희망 부서 선택 및 부서장 접촉</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
