import React from 'react';
import { CharacterProfile, CharacterAppearance, CareerRecord } from '../../types/game';
import { Sparkles, User, Calendar, Glasses, Award, ArrowRight, Building2 } from 'lucide-react';
import { DEFAULT_DEPARTMENTS, getDepartmentByName } from '../../data/departments';
import { sound } from '../../utils/sound';

interface Stage1Props {
  profile: CharacterProfile;
  setProfile: (p: CharacterProfile) => void;
  careers: CareerRecord[];
  setCareers: (c: CareerRecord[]) => void;
  onNext: () => void;
}

export const Stage1CharacterCreate: React.FC<Stage1Props> = ({
  profile,
  setProfile,
  careers,
  setCareers,
  onNext
}) => {
  const currentYear = new Date().getFullYear();

  // 다음 단계 이동 시 유효성 검사 및 현재 소속 부서 커리어 반영
  const handleProceed = () => {
    if (!profile.nickname.trim()) {
      alert('기자 닉네임(성함)을 입력해 주세요.');
      return;
    }
    if (!profile.currentDept) {
      alert('현재 소속 부서를 선택해 주세요.');
      return;
    }

    sound.playClick();
    const currentDept = profile.currentDept;
    const defaultDef = getDepartmentByName(currentDept);
    const initialSubField = defaultDef && defaultDef.subFields.length > 0 ? defaultDef.subFields[0] : '일반 취재';

    let updatedCareers = [...careers];
    if (updatedCareers.length === 0) {
      updatedCareers = [{
        id: 'c_' + Date.now(),
        deptName: currentDept,
        periodMonths: 24,
        subFields: [{ name: initialSubField, months: 24 }]
      }];
    } else {
      const lastCareer = updatedCareers[updatedCareers.length - 1];
      if (lastCareer.deptName !== currentDept) {
        // 기존 목록에 해당 부서가 이미 있다면 맨 뒤(현재)로 이동
        const existingIdx = updatedCareers.findIndex(c => c.deptName === currentDept);
        if (existingIdx !== -1) {
          const item = updatedCareers.splice(existingIdx, 1)[0];
          updatedCareers.push(item);
        } else {
          // 마지막 부서명을 현재 부서로 동기화
          lastCareer.deptName = currentDept;
          lastCareer.subFields = [{ name: initialSubField, months: lastCareer.periodMonths }];
        }
      }
    }
    setCareers(updatedCareers);
    onNext();
  };

  // 현재 부서 드롭다운 변경 시 즉시 profile 및 careers 동기화
  const handleDeptChange = (newDept: string) => {
    sound.playBlip();
    setProfile({ ...profile, currentDept: newDept });

    if (!newDept) return;

    const defaultDef = getDepartmentByName(newDept);
    const initialSubField = defaultDef && defaultDef.subFields.length > 0 ? defaultDef.subFields[0] : '일반 취재';

    let updatedCareers = [...careers];
    if (updatedCareers.length === 0) {
      updatedCareers = [{
        id: 'c_' + Date.now(),
        deptName: newDept,
        periodMonths: 24,
        subFields: [{ name: initialSubField, months: 24 }]
      }];
    } else {
      const lastCareer = updatedCareers[updatedCareers.length - 1];
      const existingIdx = updatedCareers.findIndex(c => c.deptName === newDept);
      if (existingIdx !== -1 && existingIdx !== updatedCareers.length - 1) {
        const item = updatedCareers.splice(existingIdx, 1)[0];
        updatedCareers.push(item);
      } else {
        lastCareer.deptName = newDept;
        lastCareer.subFields = [{ name: initialSubField, months: lastCareer.periodMonths }];
      }
    }
    setCareers(updatedCareers);
  };

  // 프리셋 3종
  const applyPreset = (presetName: string) => {
    sound.playBlip();
    let newApp: CharacterAppearance = { ...profile.appearance };

    if (presetName === 'rookie') {
      // 열정 신입형
      newApp = {
        hairStyle: 'neat',
        hairColor: '#0f172a',
        skinTone: '#fed7aa',
        shirtColor: '#2563eb', // 파란 셔츠
        pantsColor: '#1e293b',
        glasses: false,
        pressCardColor: '#3b82f6',
        expression: 'happy'
      };
      setProfile({
        ...profile,
        nickname: profile.nickname || '한열정',
        hireYear: currentYear - 1,
        appearance: newApp
      });
    } else if (presetName === 'veteran') {
      // 야근 베테랑형
      newApp = {
        hairStyle: 'messy',
        hairColor: '#475569', // 살짝 희끗희끗한 애쉬
        skinTone: '#fde047',
        shirtColor: '#475569',
        pantsColor: '#0f172a',
        glasses: true,
        pressCardColor: '#ef4444',
        expression: 'exhausted'
      };
      setProfile({
        ...profile,
        nickname: profile.nickname || '최마감',
        hireYear: currentYear - 8,
        appearance: newApp
      });
    } else {
      // 특종 탐사형
      newApp = {
        hairStyle: 'parted',
        hairColor: '#1e293b',
        skinTone: '#fed7aa',
        shirtColor: '#059669', // 짙은 녹색 점퍼 느낌
        pantsColor: '#334155',
        glasses: true,
        pressCardColor: '#f59e0b',
        expression: 'normal'
      };
      setProfile({
        ...profile,
        nickname: profile.nickname || '박특종',
        hireYear: currentYear - 4,
        appearance: newApp
      });
    }
  };

  const updateApp = (patch: Partial<CharacterAppearance>) => {
    sound.playBlip();
    setProfile({
      ...profile,
      appearance: {
        ...profile.appearance,
        ...patch
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 인트로 스토리 배너 */}
      <div className="voxel-card p-5 border-blue-500/50 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950">
        <h2 className="font-pixel text-xl sm:text-2xl text-blue-400 font-bold mb-2 flex items-center gap-2">
          <span>📰</span> "편집국에 오신 것을 환영합니다."
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          당신은 수많은 인사발령을 견뎌온 대한민국 기자입니다.<br />
          출입처의 밤샘 마감과 데스크의 불호령을 넘어, 이번 정기인사에서는 과연 원하던 부서로 갈 수 있을까요?
        </p>
      </div>

      {/* 프리셋 버튼 */}
      <div className="voxel-card p-4">
        <div className="text-xs font-pixel text-slate-400 mb-2.5 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>캐릭터 프리셋 선택 (원클릭)</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => applyPreset('rookie')}
            className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-blue-500/40 text-blue-300 py-2 px-3 rounded text-xs text-center"
          >
            🔥 열정 신입형
          </button>
          <button
            onClick={() => applyPreset('veteran')}
            className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 py-2 px-3 rounded text-xs text-center"
          >
            ☕ 야근 베테랑형
          </button>
          <button
            onClick={() => applyPreset('investigative')}
            className="voxel-btn bg-slate-800 hover:bg-slate-700 border border-emerald-500/40 text-emerald-300 py-2 px-3 rounded text-xs text-center"
          >
            🕵️ 특종 탐사형
          </button>
        </div>
      </div>

      {/* 기본 정보 입력 */}
      <div className="voxel-card p-5 space-y-4">
        <h3 className="font-pixel text-base text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          <span>기자 신상 정보</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">기자 닉네임</label>
            <input
              type="text"
              value={profile.nickname}
              onChange={(e) => setProfile({ ...profile, nickname: e.target.value })}
              placeholder="예: 김기자"
              className="voxel-input w-full text-sm font-medium"
              maxLength={12}
            />
          </div>

          {/* [신규] 현재 소속 부서 선택 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>현재 소속 부서</span>
            </label>
            <select
              value={profile.currentDept || ''}
              onChange={(e) => handleDeptChange(e.target.value)}
              className="voxel-input w-full text-sm font-bold text-amber-300"
            >
              <option value="">-- 소속 부서 선택 --</option>
              {DEFAULT_DEPARTMENTS.map(d => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>입사 연도</span>
            </label>
            <select
              value={profile.hireYear}
              onChange={(e) => setProfile({ ...profile, hireYear: Number(e.target.value) })}
              className="voxel-input w-full text-sm"
            >
              {Array.from({ length: 25 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>
                  {y}년 입사 ({currentYear - y}년차)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">이번 인사 시점</label>
            <div className="grid grid-cols-2 gap-2">
              {(['상반기', '하반기'] as const).map((half) => (
                <button
                  key={half}
                  type="button"
                  onClick={() => {
                    sound.playBlip();
                    setProfile({ ...profile, currentHalf: half });
                  }}
                  className={`py-2 text-xs rounded font-pixel transition-all ${
                    profile.currentHalf === half
                      ? 'bg-blue-600 text-white font-bold border border-blue-400 shadow-md'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {half}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 외형 커스터마이징 */}
      <div className="voxel-card p-5 space-y-4">
        <h3 className="font-pixel text-base text-slate-200 border-b border-slate-700 pb-2 flex items-center gap-2">
          <span>🎨</span>
          <span>3D 블록 외형 커스터마이징</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* 머리 스타일 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">머리 모양</label>
            <select
              value={profile.appearance.hairStyle}
              onChange={(e) => updateApp({ hairStyle: e.target.value as any })}
              className="voxel-input w-full text-xs"
            >
              <option value="neat">단정한 스타일</option>
              <option value="short">숏컷 / 깔끔형</option>
              <option value="parted">가르마 스타일</option>
              <option value="messy">마감 철야 헝클어짐</option>
            </select>
          </div>

          {/* 머리 색상 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">머리 색상</label>
            <div className="flex gap-2 items-center">
              {['#0f172a', '#451a03', '#475569', '#b45309'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateApp({ hairColor: c })}
                  className={`w-7 h-7 rounded border-2 transition-transform ${
                    profile.appearance.hairColor === c ? 'border-blue-400 scale-110 shadow' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 상의 색상 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1">옷(셔츠) 색상</label>
            <div className="flex gap-2 items-center">
              {['#2563eb', '#dc2626', '#16a34a', '#475569', '#0f172a'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateApp({ shirtColor: c })}
                  className={`w-7 h-7 rounded border-2 transition-transform ${
                    profile.appearance.shirtColor === c ? 'border-white scale-110 shadow' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* 기자증 줄 색상 */}
          <div>
            <label className="block text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-blue-400" />
              <span>기자증 색상</span>
            </label>
            <div className="flex gap-2 items-center">
              {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map((c) => (
                <button
                  key={c}
                  onClick={() => updateApp({ pressCardColor: c })}
                  className={`w-7 h-7 rounded border-2 transition-transform ${
                    profile.appearance.pressCardColor === c ? 'border-white scale-110 shadow' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 안경 착용 토글 */}
        <div className="flex items-center gap-3 pt-2">
          <label className="text-xs text-slate-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={profile.appearance.glasses}
              onChange={(e) => updateApp({ glasses: e.target.checked })}
              className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0 w-4 h-4"
            />
            <Glasses className="w-4 h-4 text-slate-400" />
            <span>기자 안경 착용</span>
          </label>
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      <button
        onClick={handleProceed}
        className="voxel-btn voxel-btn-primary w-full py-3.5 px-6 rounded-lg text-base font-bold flex items-center justify-center gap-2 mt-2"
      >
        <span>편집국 입장 (나의 커리어 구성)</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
